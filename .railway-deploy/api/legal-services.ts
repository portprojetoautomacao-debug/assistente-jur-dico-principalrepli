import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth, sendAuthError } from "./lib/auth.js";
import { consultarDJENForLawyer } from "./lib/djen-client.js";
import { withErrorHandler } from "./lib/error-handler.js";
import { rateLimitMiddleware } from "./lib/rate-limit.js";
import { SafeLogger } from "./lib/safe-logger.js";

const logger = new SafeLogger("LegalServices");

/**
 * Get reason for non-business day
 */
function getHolidayReason(date: Date, tribunalCode?: string): string {
  if (isWeekend(date)) return "Final de semana";
  if (isFeriado(date, tribunalCode)) return "Feriado";
  return "Recesso forense";
}

// --- DEADLINE CALCULATION LOGIC ---

// Feriados nacionais fixos
const feriadosNacionais2025 = new Set([
  "2025-01-01", // Ano Novo
  "2025-04-18", // Sexta-feira Santa
  "2025-04-21", // Tiradentes
  "2025-05-01", // Dia do Trabalho
  "2025-06-19", // Corpus Christi
  "2025-09-07", // Independência
  "2025-10-12", // Nossa Senhora Aparecida
  "2025-11-02", // Finados
  "2025-11-15", // Proclamação da República
  "2025-11-20", // Consciência Negra
  "2025-12-25", // Natal
]);

const feriadosDF2025 = new Set([
  "2025-04-21", // Fundação de Brasília
  "2025-11-30", // Dia do Evangélico
]);

// Recesso forense (CNJ Resolução 298/2019)
const recessoForense2025 = {
  start: "2025-12-20",
  end: "2026-01-06",
};

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Domingo ou Sábado
}

function isFeriado(date: Date, tribunalCode?: string): boolean {
  const dateStr = date.toISOString().split("T")[0];

  // Feriados nacionais
  if (feriadosNacionais2025.has(dateStr)) {
    return true;
  }

  // Feriados específicos por tribunal
  if (tribunalCode?.includes("DF") || tribunalCode?.includes("TJDFT")) {
    if (feriadosDF2025.has(dateStr)) {
      return true;
    }
  }

  return false;
}

function isRecessoForense(date: Date): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return dateStr >= recessoForense2025.start && dateStr <= recessoForense2025.end;
}

function isDiaUtil(date: Date, tribunalCode?: string): boolean {
  if (isWeekend(date)) return false;
  if (isFeriado(date, tribunalCode)) return false;
  if (isRecessoForense(date)) return false;
  return true;
}

function calcularPrazo(
  startDate: Date,
  businessDays: number,
  tribunalCode?: string
): {
  deadline: string;
  businessDays: number;
  calendarDays: number;
  reasoning: string[];
  holidays: string[];
  alerts: Array<{ type: string; days: number; message: string }>;
} {
  const reasoning: string[] = [];
  const holidays: string[] = [];
  const currentDate = new Date(startDate);
  let daysAdded = 0;
  let calendarDays = 0;

  reasoning.push(
    `Data inicial: ${currentDate.toLocaleDateString("pt-BR")}`,
    `Dias úteis a contar: ${businessDays}`
  );

  while (daysAdded < businessDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    calendarDays++;

    if (isDiaUtil(currentDate, tribunalCode)) {
      daysAdded++;
    } else {
      const reason = getHolidayReason(currentDate, tribunalCode);

      holidays.push(`${currentDate.toLocaleDateString("pt-BR")} - ${reason}`);
      reasoning.push(`Dia ${currentDate.toLocaleDateString("pt-BR")} desconsiderado (${reason})`);
    }
  }

  reasoning.push(
    `Total de dias corridos: ${calendarDays}`,
    `Vencimento: ${currentDate.toLocaleDateString("pt-BR")}`
  );

  return {
    deadline: currentDate.toISOString(),
    businessDays,
    calendarDays,
    reasoning,
    holidays,
    alerts: [
      {
        type: "warning",
        days: 3,
        message: "Prazo se aproximando - verificar providências",
      },
      {
        type: "critical",
        days: 1,
        message: "URGENTE: Último dia para protocolo",
      },
    ],
  };
}

// --- DJEN CHECK LOGIC ---

interface DJENCheckRequest {
  tribunais?: string[];
  oab?: string;
  ufOab?: string;
  lawyerName?: string;
}

interface DJENResult {
  tribunal: string;
  publicacoes: Array<{
    id: string;
    data: string;
    processo?: string;
    tipo: string;
    conteudo: string;
    advogado?: string;
    link?: string;
  }>;
  erro?: string;
}

async function handleDJENCheck(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      tribunais = ["TJMG", "TRT3", "TST", "STJ"],
      oab = "184404",
      ufOab = "MG",
      lawyerName = "Thiago Bodevan Veiga",
    } = req.body as DJENCheckRequest;

    console.log(
      `[DJEN Check] Consultando DJEN para ${lawyerName} (OAB ${oab}/${ufOab}) em ${tribunais.length} tribunais`
    );

    // Usar API real do DJEN (Comunica PJe)
    const { resultados, erros, rateLimitWarning } = await consultarDJENForLawyer(
      tribunais,
      lawyerName,
      `${oab}/${ufOab}`,
      undefined, // dataInicio (padrão: hoje)
      undefined, // dataFim (padrão: dataInicio)
      "D" // Diário Eletrônico
    );

    console.log(`[DJEN Check] Encontradas ${resultados.length} comunicações`);

    // Transformar resultados para formato esperado
    const resultadosFormatados: DJENResult[] = [];
    const tribunaisMap = new Map<string, DJENResult>();

    // Agrupar por tribunal
    for (const comunicacao of resultados) {
      if (!tribunaisMap.has(comunicacao.tribunal)) {
        tribunaisMap.set(comunicacao.tribunal, {
          tribunal: comunicacao.tribunal,
          publicacoes: [],
        });
      }

      const tribunalResult = tribunaisMap.get(comunicacao.tribunal)!;
      tribunalResult.publicacoes.push({
        id: comunicacao.id ? String(comunicacao.id) : crypto.randomUUID(),
        data: comunicacao.data,
        processo: comunicacao.numeroProcesso,
        tipo: comunicacao.tipo,
        conteudo: comunicacao.teor || "Ver documento completo",
        advogado:
          comunicacao.advogados
            ?.map((a) => {
              if (typeof a === "string") return a;
              return a.nome || JSON.stringify(a);
            })
            .join(", ") || "",
        link: comunicacao.link,
      });
    }

    // Converter mapa para array
    resultadosFormatados.push(...Array.from(tribunaisMap.values()));

    // Adicionar tribunais sem publicações
    for (const tribunal of tribunais) {
      if (!tribunaisMap.has(tribunal)) {
        resultadosFormatados.push({
          tribunal,
          publicacoes: [],
        });
      }
    }

    // Adicionar erros
    const errosFormatados = erros.map((e) => ({
      tribunal: e.tribunal,
      erro: e.erro,
    }));

    const publicacoesEncontradas = resultados.length;

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      tribunaisConsultados: tribunais.length,
      publicacoesEncontradas,
      resultados: resultadosFormatados,
      erros: errosFormatados.length > 0 ? errosFormatados : undefined,
      rateLimitWarning,
      apiUsed: "Comunica PJe (API Oficial CNJ)",
      endpoint: "https://comunicaapi.pje.jus.br/api/v1/comunicacao",
      lawyer: {
        name: lawyerName,
        oab: `${oab}/${ufOab}`,
      },
    });
  } catch (error) {
    console.error("[DJEN Check API] Error:", error);

    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function handleDeadlineCalculation(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      startDate,
      businessDays = 15,
      tribunalCode,
    } = req.body as {
      startDate: string;
      businessDays?: number;
      tribunalCode?: string;
    };

    if (!startDate) {
      return res.status(400).json({
        error: "Missing required field: startDate",
      });
    }

    const start = new Date(startDate);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        error: "Invalid startDate format",
      });
    }

    const result = calcularPrazo(start, businessDays, tribunalCode);

    return res.status(200).json({
      ok: true,
      ...result,
      metadata: {
        tribunalCode: tribunalCode || "Nacional",
        calculatedAt: new Date().toISOString(),
        recessoForense: isRecessoForense(new Date(result.deadline))
          ? "Vencimento durante recesso forense"
          : null,
      },
    });
  } catch (error) {
    console.error("[Deadline Calculate API] Error:", error);

    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// --- MAIN HANDLER ---

export default withErrorHandler(async (req: VercelRequest, res: VercelResponse) => {
  // Apply authentication
  const authResult = await requireAuth(req, res);
  if (!authResult.authenticated) {
    sendAuthError(res, authResult);
    return;
  }

  // Apply rate limiting
  const clientIP =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    "unknown";

  const rateLimitResult = await rateLimitMiddleware(clientIP);
  if (!rateLimitResult.allowed) {
    res.setHeader("Retry-After", Math.ceil((Date.now() + 60000) / 1000).toString());
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.status(429).json({
      error: rateLimitResult.error || "Rate limit exceeded",
    });
    return;
  }

  // Set rate limit headers
  Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  logger.info("Legal services request", {
    method: req.method,
    service: req.query.service,
    userId: authResult.userId,
    ip: clientIP,
  });

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const service = req.query.service as string;

  if (service === "djen") {
    handleDJENCheck(req, res);
    return;
  }

  if (service === "deadline") {
    handleDeadlineCalculation(req, res);
    return;
  }

  res.status(400).json({
    error: "Invalid service specified. Use ?service=djen or ?service=deadline",
  });
});

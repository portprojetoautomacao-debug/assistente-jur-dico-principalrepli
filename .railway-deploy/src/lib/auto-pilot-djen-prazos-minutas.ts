// auto-pilot-djen-prazos-minutas.ts
// Integra DJEN → Agente de Gestão de Prazos → Agente de Minutas (Gemini + Docs + Calendar)
// Modo: Auto-Pilot Jurídico para intimações DJEN

import {
  createDeadlineFromAnalysis,
  type IntimationAnalysisResult,
} from "@/lib/deadline-calendar-integration";
import type { DJENFilteredResult } from "@/lib/djen-api";
import {
  criarMonitorDJEN,
  type DJENMonitorAgent,
  type DJENMonitorConfig,
  type DJENMonitorTask,
} from "@/lib/djen-monitor-agent";
import { callGemini } from "@/lib/gemini-service";
import {
  criarMinutaComAgenteIA,
  type MinutaAgentDeadline,
  type MinutaAgentParams,
  type MinutaAgentResult,
} from "@/lib/minuta-agent";
import type { Appointment } from "@/types";

/**
 * Configuração do Auto-Pilot DJEN + Prazos + Minutas
 */
export interface AutoPilotConfig {
  /**
   * Configuração base do monitor DJEN (tribunais, advogados, intervalo, etc.)
   * IMPORTANTE: notificarCallback/logCallback serão sobrescritos pelo Auto-Pilot.
   */
  djen: Omit<DJENMonitorConfig, "notificarCallback" | "logCallback">;

  /**
   * Gerente de Prazos (app local) — acesso ao estado do calendário interno
   * (por exemplo, useState / Zustand / store global).
   */
  getAppointments: () => Appointment[];
  setAppointments: (updater: (current: Appointment[]) => Appointment[]) => void;

  /**
   * Se true, cria automaticamente prazos no Gerente de Prazos + Google Calendar.
   * default: true
   */
  autoCreateDeadlines?: boolean;

  /**
   * Se true, cria automaticamente minutas via Agente de Minutas (Gemini + Docs + Calendar).
   * default: true
   */
  autoCreateMinutas?: boolean;

  /**
   * Sincronizar prazos com Google Calendar.
   * default: true
   */
  syncToGoogleCalendar?: boolean;

  /**
   * Tipo padrão de minuta que o agente irá criar a partir de intimações.
   * Ex.: "Manifestação Simples", "Petição de Cumprimento de Prazo", etc.
   * default: "Manifestação Simples"
   */
  defaultMinutaTipo?: string;

  /**
   * Callback opcional para logar eventos do Auto-Pilot (UI, console, etc.)
   */
  logCallback?: (message: string, level: "info" | "warn" | "error") => void;
}

/**
 * Status estendido do Auto-Pilot
 */
export interface AutoPilotStatus {
  monitor: DJENMonitorTask;
  totalIntimacoesProcessadas: number;
  totalPrazosCriados: number;
  totalMinutasCriadas: number;
  lastRun?: string;
}

/**
 * Orquestrador principal do Auto-Pilot DJEN + Prazos + Minutas
 */
export class AutoPilotDjenPrazosMinutas {
  private config: Required<AutoPilotConfig>;
  private readonly monitor: DJENMonitorAgent;
  private readonly stats = {
    totalIntimacoesProcessadas: 0,
    totalPrazosCriados: 0,
    totalMinutasCriadas: 0,
    lastRun: undefined as string | undefined,
  };

  constructor(config: AutoPilotConfig) {
    this.config = {
      autoCreateDeadlines: true,
      autoCreateMinutas: true,
      syncToGoogleCalendar: true,
      defaultMinutaTipo: "Manifestação Simples",
      logCallback: config.logCallback ?? ((msg, level) => console[level](`[AutoPilot] ${msg}`)),
      ...config,
    };

    // Cria o monitor DJEN com callbacks conectados ao Auto-Pilot
    this.monitor = criarMonitorDJEN({
      ...this.config.djen,
      notificarCallback: (publicacoes) => {
        this.handleNewPublications(publicacoes).catch(console.error);
      },
      logCallback: (msg, level) => this.log(msg, level),
    });
  }

  private log(message: string, level: "info" | "warn" | "error" = "info") {
    if (this.config.logCallback) {
      this.config.logCallback(`[AutoPilot] ${message}`, level);
    } else {
      // fallback simples
      console[level](`[AutoPilot] ${message}`);
    }
  }

  /**
   * Analisa uma publicação DJEN com Gemini e retorna IntimationAnalysisResult
   * (Agente de Gestão de Prazos via IA)
   */
  private async analyzeIntimationWithGemini(
    pub: DJENFilteredResult
  ): Promise<IntimationAnalysisResult | null> {
    const prompt = `Você é um assistente jurídico especializado em prazos processuais e análise de intimações do DJEN (Diário de Justiça Eletrônico Nacional).

Analise a publicação abaixo e devolva APENAS um JSON válido com o seguinte formato:

{
  "summary": "Resumo objetivo da intimação",
  "deadline": {
    "days": 15,
    "type": "úteis ou corridos",
    "endDate": "AAAA-MM-DD",
    "description": "Descrição resumida do prazo (ex: prazo para contestar, prazo para embargos, etc.)"
  },
  "priority": "baixa | média | alta | crítica",
  "nextSteps": [
    "Passo 1",
    "Passo 2"
  ],
  "suggestedAction": "Ação recomendada ao advogado",
  "processNumber": "Número CNJ, se identificado",
  "court": "Tribunal / órgão julgador, se identificado",
  "documentType": "Tipo do ato: sentença, despacho, decisão, intimação, etc."
}

REGRAS:
- Se não houver prazo claramente identificado, use "deadline": null
- "priority":
  - "crítica": risco imediato de perda de prazo ou sentença muito desfavorável
  - "alta": prazo relevante ou ato decisório importante
  - "média": despacho ordinatório, movimentação normal
  - "baixa": publicações sem exigência imediata
- Use SEMPRE datas no formato "AAAA-MM-DD".
- Não escreva comentários fora do JSON.

METADADOS:
Tribunal: ${pub.tribunal}
Data: ${pub.data}
Tipo: ${pub.tipo}
Número do processo (quando houver): ${pub.numeroProcesso || "não informado"}
Órgão julgador: ${pub.orgao || "não informado"}
Match: ${pub.matchType}

TEXTO DA PUBLICAÇÃO:
${pub.teor}`;

    const response = await callGemini(prompt, {
      temperature: 0.2,
      maxOutputTokens: 1024,
      model: "gemini-2.5-pro",
    });

    if (response.error || !response.text) {
      this.log(
        `Gemini falhou ao analisar intimação (${pub.tribunal} - ${pub.tipo}): ${
          response.error || "texto vazio"
        }`,
        "warn"
      );
      return null;
    }

    try {
      const startIdx = response.text.indexOf("{");
      const endIdx = response.text.lastIndexOf("}");
      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        this.log("Resposta Gemini sem JSON reconhecível (intimação)", "warn");
        return null;
      }

      const jsonStr = response.text.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);

      // Normaliza campos mínimos
      const result: IntimationAnalysisResult = {
        summary: parsed.summary || pub.teor.slice(0, 500),
        priority:
          parsed.priority === "crítica" ||
          parsed.priority === "alta" ||
          parsed.priority === "média" ||
          parsed.priority === "baixa"
            ? parsed.priority
            : "média",
        deadline: parsed.deadline || undefined,
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
        suggestedAction: parsed.suggestedAction || undefined,
        processNumber: parsed.processNumber || pub.numeroProcesso,
        court: parsed.court || pub.tribunal,
        documentType: parsed.documentType || pub.tipo,
      };

      return result;
    } catch (err) {
      this.log(
        `Falha ao parsear JSON do Gemini (intimação): ${
          err instanceof Error ? err.message : String(err)
        }`,
        "error"
      );
      return null;
    }
  }

  /**
   * Cria prazo no Gerente de Prazos + Google Calendar a partir da análise
   */
  private async createDeadlineFromAnalysisResult(
    analysis: IntimationAnalysisResult,
    title: string
  ): Promise<void> {
    if (!this.config.autoCreateDeadlines) return;
    if (!analysis.deadline?.endDate) return;

    const currentAppointments = this.config.getAppointments();

    const result = await createDeadlineFromAnalysis(
      analysis,
      title,
      currentAppointments,
      this.config.setAppointments,
      this.config.syncToGoogleCalendar
    );

    if (!result.success) {
      this.log(
        `Falha ao criar prazo para "${title}": ${result.error || "motivo desconhecido"}`,
        "warn"
      );
      return;
    }

    this.stats.totalPrazosCriados += 1;
    this.log(
      `Prazo criado com sucesso para "${title}" ` +
        `(localId=${result.localAppointmentId}, googleId=${result.googleEventId || "—"})`,
      "info"
    );
  }

  /**
   * Cria minuta automática para a publicação, usando o Agente de Minutas
   */
  private async createMinutaFromPublication(
    pub: DJENFilteredResult,
    analysis: IntimationAnalysisResult | null
  ): Promise<void> {
    if (!this.config.autoCreateMinutas) return;

    const tipoMinuta = this.config.defaultMinutaTipo || "Manifestação Simples";

    const detalhesCaso = `
Publicação DJEN analisada automaticamente.

Metadados:
- Tribunal: ${pub.tribunal}
- Data da disponibilização: ${pub.data}
- Tipo de comunicação: ${pub.tipo}
- Número do processo: ${analysis?.processNumber || pub.numeroProcesso || "não identificado"}
- Órgão julgador: ${analysis?.court || pub.orgao || "não identificado"}
- Match: ${pub.matchType}

Resumo da intimação (IA):
${analysis?.summary || "[sem resumo estruturado — usar teor bruto]"}

Texto integral da publicação:
${pub.teor}
`.trim();

    const prazoIA: MinutaAgentDeadline | null =
      analysis?.deadline?.endDate && analysis.deadline.days
        ? {
            endDate: analysis.deadline.endDate,
            days: analysis.deadline.days,
            type: analysis.deadline.type,
            priority: analysis.priority,
            description: analysis.deadline.description,
          }
        : null;

    const params: MinutaAgentParams = {
      tipoMinuta,
      detalhesCaso,
      titulo: `Manifestação - ${pub.tribunal} - ${pub.tipo}`,
      numeroProcesso: analysis?.processNumber || pub.numeroProcesso,
      tribunal: analysis?.court || pub.tribunal,
      prazo: prazoIA,
      sync: {
        docs: true,
        calendar: true,
      },
    };

    const result: MinutaAgentResult = await criarMinutaComAgenteIA(params);

    if (!result.success) {
      this.log(
        `Falha ao gerar minuta automática para ${pub.tribunal} - ${pub.tipo}: ${
          result.errors.join(" | ") || "motivo desconhecido"
        }`,
        "warn"
      );
      return;
    }

    this.stats.totalMinutasCriadas += 1;
    this.log(
      `Minuta criada com sucesso (Docs: ${
        result.docsUrl || "—"
      }, CalendarEvent: ${result.calendarEventId || "—"})`,
      "info"
    );
  }

  /**
   * Callback chamado pelo DJENMonitorAgent quando encontra novas publicações
   */
  private async handleNewPublications(publicacoes: DJENFilteredResult[]): Promise<void> {
    if (!publicacoes || publicacoes.length === 0) {
      this.log("Execução DJEN sem publicações relevantes", "info");
      return;
    }

    this.log(`Processando ${publicacoes.length} publicação(ões) do DJEN...`, "info");

    for (const pub of publicacoes) {
      try {
        this.stats.totalIntimacoesProcessadas += 1;
        const title = `${pub.tribunal} - ${pub.tipo} - ${pub.numeroProcesso || "sem número"}`;

        // 1) Análise da intimação (IA)
        const analysis = await this.analyzeIntimationWithGemini(pub);

        // 2) Criação de prazo (Gerente de Prazos + Calendar)
        if (analysis?.deadline?.endDate) {
          await this.createDeadlineFromAnalysisResult(analysis, title);
        }

        // 3) Criação de minuta automática (Minuta Agent + Docs + Calendar)
        await this.createMinutaFromPublication(pub, analysis);

        this.stats.lastRun = new Date().toISOString();
      } catch (err) {
        this.log(
          `Erro ao processar publicação (${pub.tribunal} - ${pub.tipo}): ${
            err instanceof Error ? err.message : String(err)
          }`,
          "error"
        );
      }
    }
  }

  // ========= API pública do Auto-Pilot =========

  public iniciar(): void {
    this.log("Iniciando Auto-Pilot DJEN + Prazos + Minutas...", "info");
    this.monitor.iniciar();
  }

  public pausar(): void {
    this.log("Pausando Auto-Pilot...", "info");
    this.monitor.pausar();
  }

  public retomar(): void {
    this.log("Retomando Auto-Pilot...", "info");
    this.monitor.retomar();
  }

  public parar(): void {
    this.log("Parando Auto-Pilot...", "info");
    this.monitor.parar();
  }

  public executarAgora(): void {
    this.log("Execução manual do Auto-Pilot disparada...", "info");
    this.monitor.executarAgora();
  }

  public getStatus(): AutoPilotStatus {
    return {
      monitor: this.monitor.getStatus(),
      totalIntimacoesProcessadas: this.stats.totalIntimacoesProcessadas,
      totalPrazosCriados: this.stats.totalPrazosCriados,
      totalMinutasCriadas: this.stats.totalMinutasCriadas,
      lastRun: this.stats.lastRun,
    };
  }

  public limparHistorico(): void {
    this.monitor.limparHistorico();
    this.stats.totalIntimacoesProcessadas = 0;
    this.stats.totalPrazosCriados = 0;
    this.stats.totalMinutasCriadas = 0;
    this.stats.lastRun = undefined;
    this.log("Histórico do Auto-Pilot reiniciado", "info");
  }

  public atualizarConfig(novaConfig: Partial<AutoPilotConfig>): void {
    const estavaRodando = this.monitor.getStatus().status === "running";

    if (estavaRodando) {
      this.pausar();
    }

    this.config = {
      ...this.config,
      ...novaConfig,
    };

    // Atualiza o monitor DJEN com as novas configs (callbacks continuam deste Auto-Pilot)
    this.monitor.atualizarConfig({
      ...this.config.djen,
      notificarCallback: (publicacoes) => {
        this.handleNewPublications(publicacoes).catch(console.error);
      },
      logCallback: (msg, level) => this.log(msg, level),
    });

    this.log("Configuração do Auto-Pilot atualizada", "info");

    if (estavaRodando) {
      this.retomar();
    }
  }
}

/**
 * Factory helper para criar o Auto-Pilot já pronto
 */
export function criarAutoPilotDjenPrazosMinutas(
  config: AutoPilotConfig
): AutoPilotDjenPrazosMinutas {
  return new AutoPilotDjenPrazosMinutas(config);
}

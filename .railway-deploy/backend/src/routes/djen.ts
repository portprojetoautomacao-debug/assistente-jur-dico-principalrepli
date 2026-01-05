import { Router } from "express";
import { executarManualmente } from "../services/djen-scheduler.js";

const router = Router();

/**
 * GET /api/djen/publicacoes
 * Proxy para buscar publicações do DJEN (evita CORS no frontend)
 */
router.get("/publicacoes", async (req, res) => {
  try {
    const { numeroOab, ufOab, dataInicio, dataFim } = req.query;

    if (!numeroOab || !ufOab) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros numeroOab e ufOab são obrigatórios",
      });
    }

    const hoje = new Date().toISOString().split("T")[0];
    const dataInicioParam = (dataInicio as string) || hoje;
    const dataFimParam = (dataFim as string) || hoje;

    const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?meio=D&numeroOab=${numeroOab}&ufOab=${ufOab}&dataDisponibilizacaoInicio=${dataInicioParam}&dataDisponibilizacaoFim=${dataFimParam}`;

    console.log(`[DJEN Proxy] Buscando: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PJe-Assistente/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`API DJEN retornou ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      publicacoes: data,
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    console.error(`[DJEN Proxy] Erro:`, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/djen/trigger-manual
 * Executa o processamento DJEN manualmente (útil para testes)
 */
router.post("/trigger-manual", async (req, res) => {
  try {
    console.log(`\n🔧 [API] Trigger manual DJEN requisitado`);

    const resultado = await executarManualmente();

    res.json({
      sucesso: true,
      mensagem: "Processamento DJEN executado",
      dados: resultado,
    });
  } catch (error) {
    console.error(`❌ [API] Erro no trigger manual:`, error);
    res.status(500).json({
      sucesso: false,
      erro: (error as Error).message,
    });
  }
});

/**
 * GET /api/djen/status
 * Retorna o status do scheduler
 */
router.get("/status", (req, res) => {
  res.json({
    status: "ativo",
    timezone: process.env.TZ || "America/Sao_Paulo",
    horarios: ["01:00", "09:00"],
    advogadoPadrao: {
      nome: process.env.DJEN_ADVOGADO_NOME || "Thiago Bodevan Veiga",
      oab: `${process.env.DJEN_OAB_NUMERO || "184404"}/${process.env.DJEN_OAB_UF || "MG"}`,
    },
    emailNotificacao: process.env.EMAIL_NOTIFICACAO_ENABLED === "true",
  });
});

export default router;

import { Request, Response, Router } from "express";

const router = Router();

// Circuit breaker mock data
const circuitBreakers = [
  { name: "gemini-api", status: "closed", failures: 0, threshold: 5 },
  { name: "djen-api", status: "closed", failures: 0, threshold: 3 },
  { name: "qdrant-vector-db", status: "closed", failures: 0, threshold: 5 },
  { name: "anthropic-api", status: "closed", failures: 0, threshold: 5 },
];

// Agent registry - 15 agents
const agentsList = [
  { id: "harvey", name: "Harvey Specter", type: "langgraph-custom", status: "active" },
  { id: "justine", name: "Mrs. Justine", type: "langgraph-custom", status: "active" },
  { id: "monitor-djen", name: "Monitor DJEN", type: "langgraph-djen", status: "active" },
  {
    id: "analise-documental",
    name: "Análise Documental",
    type: "langgraph-custom",
    status: "active",
  },
  { id: "analise-risco", name: "Análise de Risco", type: "langgraph-custom", status: "active" },
  { id: "compliance", name: "Compliance", type: "langgraph-custom", status: "active" },
  {
    id: "comunicacao-clientes",
    name: "Comunicação Clientes",
    type: "langgraph-custom",
    status: "active",
  },
  {
    id: "estrategia-processual",
    name: "Estratégia Processual",
    type: "langgraph-custom",
    status: "active",
  },
  { id: "financeiro", name: "Financeiro", type: "langgraph-custom", status: "active" },
  { id: "gestao-prazos", name: "Gestão de Prazos", type: "langgraph-custom", status: "active" },
  {
    id: "organizacao-arquivos",
    name: "Organização de Arquivos",
    type: "langgraph-custom",
    status: "active",
  },
  {
    id: "pesquisa-juris",
    name: "Pesquisa Jurisprudência",
    type: "langgraph-custom",
    status: "active",
  },
  {
    id: "redacao-peticoes",
    name: "Redação de Petições",
    type: "langgraph-custom",
    status: "active",
  },
  {
    id: "revisao-contratual",
    name: "Revisão Contratual",
    type: "langgraph-custom",
    status: "active",
  },
  {
    id: "traducao-juridica",
    name: "Tradução Jurídica",
    type: "langgraph-custom",
    status: "active",
  },
];

// Task metrics
const taskMetrics = {
  completed: 0,
  queued: 0,
  failed: 0,
  avgDuration: 0,
};

// Hybrid execution stats
const hybridStats = {
  totalExecutions: 0,
  langGraphExecutions: 0,
  aitkExecutions: 0,
  successRate: 100,
};

// Services status
const servicesStatus = {
  database: "healthy",
  vectorStore: "healthy",
  aiServices: "healthy",
  scheduler: "healthy",
};

/**
 * GET /api/observability
 * Query param: action (health | agents | metrics | hybrid-stats | circuit-breakers | full)
 */
router.get("/", (req: Request, res: Response) => {
  const action = req.query.action as string;

  try {
    switch (action) {
      case "health":
        return res.json({
          ok: true,
          status: "healthy",
          timestamp: new Date().toISOString(),
          services: servicesStatus,
        });

      case "agents":
        return res.json({
          ok: true,
          total: agentsList.length,
          agents: agentsList,
        });

      case "circuit-breakers":
        return res.json({
          ok: true,
          breakers: circuitBreakers,
        });

      case "metrics":
        return res.json({
          ok: true,
          metrics: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          },
          tasks: taskMetrics,
        });

      case "hybrid-stats":
        return res.json({
          ok: true,
          stats: hybridStats,
        });

      case "full":
        return res.json({
          ok: true,
          status: "healthy",
          timestamp: new Date().toISOString(),
          agents: {
            total: agentsList.length,
            list: agentsList,
          },
          tasks: taskMetrics,
          hybrid: hybridStats,
          circuitBreakers: circuitBreakers,
          services: servicesStatus,
          metrics: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          },
        });

      default:
        // No action specified - list available actions
        return res.json({
          ok: true,
          availableActions: [
            "health",
            "agents",
            "circuit-breakers",
            "metrics",
            "hybrid-stats",
            "full",
          ],
          usage: "GET /api/observability?action=<action>",
        });
    }
  } catch (error) {
    console.error("[Observability] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;

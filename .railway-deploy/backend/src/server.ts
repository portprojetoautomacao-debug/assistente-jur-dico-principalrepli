// ⚠️ IMPORTANTE: Datadog tracer carregado via -r flag (NODE_OPTIONS) ou import
// Em produção (Railway/Vercel): via -r ./backend/dist/backend/src/datadog.js
// Em dev: via import abaixo
import "./datadog.js";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { inicializarTabelaExpedientes } from "./db/expedientes.js";
import agentsRouter from "./routes/agents.js";
import aiCommandsRouter from "./routes/ai-commands.js";
import djenRouter from "./routes/djen.js";
import editorRouter from "./routes/editor.js";
import expedientesRouter from "./routes/expedientes.js";
import kvRouter from "./routes/kv.js";
import lawyersRouter from "./routes/lawyers.js";
import llmStreamRouter from "./routes/llm-stream.js";
import llmRouter from "./routes/llm.js";
import minutasRouter from "./routes/minutas.js";
import observabilityRouter from "./routes/observability.js";
import ragRouter from "./routes/rag.js";
import sparkRouter from "./routes/spark.js";
import { iniciarSchedulerDJEN } from "./services/djen-scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend Error interface to include status
interface ErrorWithStatus extends Error {
  status?: number;
}

function logInfo(message: string) {
  process.stdout.write(`${message}\n`);
}

function logError(message: string) {
  process.stderr.write(`${message}\n`);
}

// Load environment variables
const envPath = path.resolve(__dirname, "../../.env.local");
logInfo(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });
dotenv.config(); // Fallback to default .env if needed

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

// Security headers
// CSP é tratado no frontend (Vite/Vercel). Mantemos CSP desligado aqui para não quebrar assets.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Middleware - Allow all origins for Replit proxy
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting - Proteção contra abuso de API
// Configurável via variáveis de ambiente para testes
const isTestEnv = process.env.NODE_ENV === "test";
const isDevEnv = process.env.NODE_ENV === "development";
const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== "false";

const apiMaxRequests = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || (isTestEnv ? "1000" : "100")
);
const aiMaxRequests = parseInt(
  process.env.AI_RATE_LIMIT_MAX_REQUESTS || (isTestEnv ? "500" : isDevEnv ? "100" : "30")
);

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 min default
  max: apiMaxRequests,
  skip: () => !rateLimitEnabled || isTestEnv, // Skip em testes
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting mais restritivo para endpoints de IA
const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || "900000"), // 15 min
  max: aiMaxRequests,
  skip: () => !rateLimitEnabled || isTestEnv, // Skip em testes
  message: { error: "Too many AI requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

logInfo(`[Rate Limiting] Enabled: ${rateLimitEnabled}`);
// @ts-expect-error - Rate limiter instance tem propriedade max mas tipo não reflete
logInfo(`[Rate Limiting] API Max: ${apiLimiter.max ?? apiMaxRequests} req/window`);
// @ts-expect-error - Rate limiter instance tem propriedade max mas tipo não reflete
logInfo(`[Rate Limiting] AI Max: ${aiLimiter.max ?? aiMaxRequests} req/window`);

// Aplicar rate limiting geral em todas as rotas de API (se habilitado)
if (rateLimitEnabled && !isTestEnv) {
  app.use("/api/", apiLimiter);
}

// Request logging
app.use((req, _res, next) => {
  logInfo(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/spark", sparkRouter);
app.use("/api/kv", kvRouter);
// Rate limiting específico para endpoints de IA (se habilitado)
if (rateLimitEnabled && !isTestEnv) {
  app.use("/api/llm", aiLimiter, llmRouter);
  app.use("/api/agents", aiLimiter, agentsRouter);
  app.use("/api/ai", aiLimiter, aiCommandsRouter);
  app.use("/api/llm-stream", aiLimiter, llmStreamRouter);
  app.use("/api/rag", aiLimiter, ragRouter);
} else {
  app.use("/api/llm", llmRouter);
  app.use("/api/agents", agentsRouter);
  app.use("/api/ai", aiCommandsRouter);
  app.use("/api/llm-stream", llmStreamRouter);
  app.use("/api/rag", ragRouter);
}
// Rotas sem rate limiting adicional
app.use("/api/minutas", minutasRouter);
app.use("/api/djen", djenRouter);
app.use("/api/editor", editorRouter);
app.use("/api/expedientes", expedientesRouter);
app.use("/api/lawyers", lawyersRouter);
app.use("/api/observability", observabilityRouter);

// Serve static files in production
const isProduction = process.env.NODE_ENV === "production";
// In production, compiled server runs from backend/dist/backend/src/server.js
// So we need to go up 4 levels to reach the root dist/ folder
const distPath = path.resolve(__dirname, "../../../../dist");

if (isProduction) {
  logInfo(`📂 Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// 404 handler for API routes
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({ error: "Not Found" });
  } else if (!isProduction) {
    res.status(404).json({ error: "Not Found" });
  }
});

// Error handling
app.use(
  (
    err: ErrorWithStatus,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logError(`Error: ${err.message}`);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
);

// Start server - bind to 0.0.0.0 for network accessibility
app.listen(Number(PORT), "0.0.0.0", async () => {
  logInfo(`🚀 Backend server running on port ${PORT}`);
  logInfo(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  logInfo(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  logInfo(`✅ Health check: http://localhost:${PORT}/health`);

  // Inicializar tabela de expedientes
  try {
    await inicializarTabelaExpedientes();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logError(`❌ Erro ao inicializar banco de dados: ${msg}`);
  }

  // Iniciar scheduler DJEN (apenas em produção ou se explicitamente habilitado)
  if (process.env.DJEN_SCHEDULER_ENABLED === "true") {
    iniciarSchedulerDJEN();
  } else {
    logInfo(`ℹ️ DJEN Scheduler desabilitado (defina DJEN_SCHEDULER_ENABLED=true para ativar)`);
  }
});

export default app;

// ============================================
// 🐕 DATADOG APM - Inicialização (Railway)
// ============================================
// Este arquivo DEVE ser importado ANTES de qualquer outro código
// Para garantir instrumentação automática de todas as bibliotecas

import tracer from "dd-trace";

// Inicializar tracer apenas em produção/staging
if (process.env.NODE_ENV === "production" || process.env.DD_TRACE_ENABLED === "true") {
  tracer.init({
    // Serviço (nome do seu app no Datadog)
    service: process.env.DD_SERVICE || "assistente-juridico-api",

    // Ambiente (dev, staging, production)
    env: process.env.DD_ENV || process.env.NODE_ENV || "production",

    // Versão (para rastrear releases)
    version: process.env.DD_VERSION || process.env.npm_package_version || "1.0.0",

    // Endpoint do Datadog Agent (não necessário no Railway com agentless)
    // Railway usa: https://http-intake.logs.datadoghq.com
    // Mas dd-trace gerencia isso automaticamente via DD_SITE

    // Log level (error, warn, info, debug)
    logInjection: true, // Injeta trace_id/span_id nos logs

    // Profiling (coleta de CPU/memória)
    profiling: process.env.DD_PROFILING_ENABLED === "true",

    // Runtime metrics (métricas de Node.js)
    runtimeMetrics: true,

    // Plugin configs
    plugins: true, // Habilita auto-instrumentação

    // Tags globais
    tags: {
      "app.name": "assistente-juridico-pje",
      "app.component": "backend-api",
      "deployment.platform": "railway",
    },
  });

  console.log("[Datadog APM] Tracer initialized");
  console.log(`[Datadog APM] Service: ${process.env.DD_SERVICE || "assistente-juridico-api"}`);
  console.log(`[Datadog APM] Environment: ${process.env.DD_ENV || process.env.NODE_ENV}`);
  console.log(`[Datadog APM] Site: ${process.env.DD_SITE || "datadoghq.com"}`);
} else {
  console.log("[Datadog APM] Disabled (not in production)");
}

export default tracer;

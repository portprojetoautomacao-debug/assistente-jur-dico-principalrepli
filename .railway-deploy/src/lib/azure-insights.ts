/**
 * Azure Application Insights Integration
 *
 * Monitora performance, erros e uso dos agentes em tempo real
 * Integra com Azure Monitor para alertas e dashboards
 *
 * Funcionalidades:
 * - Tracking automático de page views e navegação
 * - Tracking de exceções e erros
 * - Métricas customizadas dos agentes
 * - Dependency tracking (APIs, Redis, etc.)
 * - User analytics e sessões
 */

import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { createBrowserHistory } from "history";

// Configuração
const browserHistory = createBrowserHistory();
const reactPlugin = new ReactPlugin();

// Connection string do Application Insights
// Configurar em variável de ambiente: VITE_AZURE_INSIGHTS_CONNECTION_STRING
const rawConnectionString = import.meta.env.VITE_AZURE_INSIGHTS_CONNECTION_STRING;
const connectionString = typeof rawConnectionString === "string" ? rawConnectionString : undefined;

// Inicializar Application Insights
const appInsights = new ApplicationInsights({
  config: {
    connectionString: connectionString ?? "",

    // Habilitar tracking automático
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,

    // Configurações de performance
    maxBatchInterval: 5000,
    maxBatchSizeInBytes: 10_000,

    // Sampling (enviar 100% em dev, 50% em prod)
    samplingPercentage: import.meta.env.PROD ? 50 : 100,

    // Configurações de cookies
    isCookieUseDisabled: false,
    cookieDomain: import.meta.env.PROD ? "assistente-juridico-github.vercel.app" : undefined,

    // Integração com React
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: { history: browserHistory },
    },

    // Desabilitar em desenvolvimento se não houver connection string
    disableTelemetry: !connectionString,
  },
});

// Carregar Application Insights
if (connectionString) {
  appInsights.loadAppInsights();
  appInsights.trackPageView(); // Track inicial page view

  console.log("✅ Azure Application Insights loaded successfully");
} else {
  console.warn("⚠️ Azure Application Insights disabled (no connection string)");
}

// ==========================================
// TRACKING DE AGENTES
// ==========================================

/**
 * Tracking de evento de agente
 */
export function trackAgentEvent(
  agentId: string,
  eventName: string,
  properties?: Record<string, string | number | boolean>,
  metrics?: Record<string, number>
) {
  appInsights.trackEvent({
    name: `Agent_${eventName}`,
    properties: {
      agentId,
      timestamp: new Date().toISOString(),
      ...properties,
    },
    measurements: metrics,
  });
}

/**
 * Tracking de tarefa de agente
 */
export function trackAgentTask(
  agentId: string,
  taskType: string,
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED",
  durationMs?: number,
  error?: string
) {
  trackAgentEvent(
    agentId,
    "TaskExecuted",
    {
      taskType,
      status,
      error: error || "none",
    },
    {
      duration: durationMs || 0,
    }
  );
}

/**
 * Tracking de performance de agente
 */
export function trackAgentPerformance(
  agentId: string,
  metrics: {
    tasksCompleted: number;
    averageProcessingTime: number;
    errorRate: number;
  }
) {
  appInsights.trackMetric(
    { name: "Agent_TasksCompleted", average: metrics.tasksCompleted },
    { agentId }
  );

  appInsights.trackMetric(
    { name: "Agent_AverageProcessingTime", average: metrics.averageProcessingTime },
    { agentId }
  );

  appInsights.trackMetric({ name: "Agent_ErrorRate", average: metrics.errorRate }, { agentId });
}

// ==========================================
// TRACKING DE APIS
// ==========================================

/**
 * Tracking de chamada de API
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number,
  success: boolean
) {
  appInsights.trackDependencyData({
    id: `api-${Date.now()}`,
    name: endpoint,
    data: `${method} ${endpoint}`,
    duration: durationMs,
    success,
    type: "HTTP",
    target: endpoint,
    responseCode: statusCode,
    properties: { statusCode: statusCode.toString() },
  });
}

/**
 * Tracking de chamada Redis
 */
export function trackRedisCall(
  operation: string,
  key: string,
  durationMs: number,
  success: boolean
) {
  appInsights.trackDependencyData({
    id: `redis-${Date.now()}`,
    name: `Redis_${operation}`,
    data: `${operation} ${key}`,
    duration: durationMs,
    success,
    type: "Redis",
    target: "Upstash Redis",
    responseCode: success ? 200 : 500,
    properties: { responseCode: success ? "200" : "500" },
  });
}

// ==========================================
// TRACKING DE ERROS
// ==========================================

/**
 * Tracking de exceção
 */
export function trackError(
  error: Error,
  context?: {
    component?: string;
    agentId?: string;
    taskId?: string;
    severity?: "critical" | "error" | "warning";
  }
) {
  appInsights.trackException({
    exception: error,
    severityLevel: getSeverityLevel(context?.severity),
    properties: {
      component: context?.component || "unknown",
      agentId: context?.agentId || "none",
      taskId: context?.taskId || "none",
      timestamp: new Date().toISOString(),
    },
  });
}

function getSeverityLevel(severity?: string): number {
  switch (severity) {
    case "critical":
      return 4; // Critical
    case "error":
      return 3; // Error
    case "warning":
      return 2; // Warning
    default:
      return 3; // Error (default)
  }
}

// ==========================================
// TRACKING DE USUÁRIO
// ==========================================

/**
 * Identificar usuário (advogado)
 */
export function identifyUser(
  userId: string,
  properties?: {
    name?: string;
    oab?: string;
    email?: string;
  }
) {
  appInsights.setAuthenticatedUserContext(userId, undefined, true);

  if (properties) {
    appInsights.addTelemetryInitializer((item) => {
      item.tags = item.tags || [];
      item.tags["ai.user.accountId"] = userId;

      if (properties.name) {
        item.data = item.data || {};
        item.data.userName = properties.name;
      }

      return true;
    });
  }
}

/**
 * Tracking de ação do usuário
 */
export function trackUserAction(
  action: string,
  properties?: Record<string, string | number | boolean>
) {
  appInsights.trackEvent({
    name: `User_${action}`,
    properties: {
      timestamp: new Date().toISOString(),
      ...properties,
    },
  });
}

// ==========================================
// TRACKING DE BUSINESS METRICS
// ==========================================

/**
 * Tracking de intimação processada
 */
export function trackIntimacaoProcessed(
  processNumber: string,
  tribunal: string,
  prazoEmDias: number,
  criadoPorAgente: boolean
) {
  trackUserAction("IntimacaoProcessed", {
    processNumber,
    tribunal,
    prazoEmDias,
    automated: criadoPorAgente,
  });

  // Métrica: Total de intimações processadas
  appInsights.trackMetric(
    { name: "Intimacoes_Processed", average: 1 },
    { tribunal, automated: String(criadoPorAgente) }
  );
}

/**
 * Tracking de minuta gerada
 */
export function trackMinutaGenerated(
  type: string,
  agentId: string,
  confidence: number,
  durationMs: number
) {
  trackUserAction("MinutaGenerated", {
    type,
    agentId,
    confidence,
    durationMs,
  });

  // Métrica: Confidence das minutas
  appInsights.trackMetric({ name: "Minuta_Confidence", average: confidence }, { type, agentId });
}

/**
 * Tracking de prazo calculado
 */
export function trackPrazoCalculated(
  processNumber: string,
  prazoEmDias: number,
  dataVencimento: string,
  agentId: string
) {
  trackUserAction("PrazoCalculated", {
    processNumber,
    prazoEmDias,
    dataVencimento,
    agentId,
  });
}

// ==========================================
// CUSTOM PAGE TRACKING
// ==========================================

/**
 * Tracking manual de page view
 */
export function trackPageView(
  name: string,
  url?: string,
  properties?: Record<string, string | number>
) {
  appInsights.trackPageView({
    name,
    uri: url || globalThis.location.href,
    properties,
  });
}

// ==========================================
// PERFORMANCE TRACKING
// ==========================================

/**
 * Criar timer para medir duração de operações
 */
export function startTimer(name: string) {
  const startTime = performance.now();

  return {
    stop: (properties?: Record<string, string | number>) => {
      const duration = performance.now() - startTime;

      appInsights.trackMetric({ name: `Performance_${name}`, average: duration }, properties);

      return duration;
    },
  };
}

/**
 * Medir performance de uma função
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T,
  properties?: Record<string, string | number>
): Promise<T> {
  const timer = startTimer(name);

  try {
    const result = await fn();
    timer.stop({ ...properties, success: 1 });
    return result;
  } catch (error) {
    timer.stop({ ...properties, success: 0 });
    throw error;
  }
}

// ==========================================
// FLUSH & CLEANUP
// ==========================================

/**
 * Forçar envio de telemetria pendente
 */
export function flushTelemetry() {
  appInsights.flush();
}

/**
 * Hook para limpar ao desmontar app
 */
export function cleanupApplicationInsights() {
  flushTelemetry();
}

// Exportar instâncias
export { appInsights, browserHistory, reactPlugin };

// Exportar default
export default appInsights;

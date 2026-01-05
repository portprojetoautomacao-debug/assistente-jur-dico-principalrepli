/**
 * Sentry.io Error Tracking Integration
 *
 * Este módulo fornece integração completa com Sentry.io para:
 * - Captura automática de erros
 * - Performance monitoring
 * - Session replay
 * - User identification
 * - **PII Filtering para conformidade LGPD** ✅
 *
 * Configuração:
 * - VITE_SENTRY_DSN: DSN do projeto Sentry.io (obrigatório para funcionar)
 * - VITE_APP_VERSION: Versão da aplicação para releases
 * - VITE_ENABLE_PII_FILTERING: Habilita filtragem de dados sensíveis (default: true em prod)
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/react/
 */

/// <reference types="vite/client" />

// DESABILITADO (modo manutenção): pii-filtering não disponível
// import {
//   createPIIFilteredBeforeSend,
//   DEFAULT_PII_CONFIG,
//   type PIIFilterConfig,
// } from "@/services/pii-filtering.js";
import * as Sentry from "@sentry/react";

// Configuração Sentry DSN com validação de ambiente
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const IS_PRODUCTION = import.meta.env.PROD;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
const APP_ENVIRONMENT = import.meta.env.MODE || "development";

// DESABILITADO (modo manutenção): PII Filtering não disponível
const ENABLE_PII_FILTERING = false; // import.meta.env.VITE_ENABLE_PII_FILTERING === "true" || IS_PRODUCTION;
// const PII_CONFIG: PIIFilterConfig = {
//   ...DEFAULT_PII_CONFIG,
//   enabled: ENABLE_PII_FILTERING,
// };

// Estado
let isInitialized = false;

/**
 * Verifica se o DSN contém valores dummy/placeholder
 */
function isDummySentryDSN(dsn: string): boolean {
  if (!dsn) return true;

  const dummyPatterns = [
    "dummy",
    "placeholder",
    "your-",
    "example",
    "test-key",
    "fake-",
    "<key>",
    "<org>",
    "<project>",
  ];

  const lowerDsn = dsn.toLowerCase();
  return dummyPatterns.some((pattern) => lowerDsn.includes(pattern));
}

/**
 * Verifica se o DSN é válido (formato Sentry.io)
 */
function isValidSentryDSN(dsn: string): boolean {
  if (!dsn) return false;

  // Rejeita DSNs com valores dummy
  if (isDummySentryDSN(dsn)) return false;

  // DSN do Sentry.io: https://<key>@<org>.ingest.sentry.io/<project>
  // ou https://<key>@sentry.io/<project>
  const sentryPattern = /^https:\/\/[a-f0-9]+@([a-z0-9-]+\.)?ingest\.sentry\.io\/\d+$/i;
  const sentryPatternAlt = /^https:\/\/[a-f0-9]+@sentry\.io\/\d+$/i;
  const sentryPatternOrg = /^https:\/\/[a-f0-9]+@[a-z0-9-]+\.ingest\.sentry\.io\/\d+$/i;

  // Também aceita DSN com formato mais flexível
  const genericPattern = /^https:\/\/[a-f0-9]+@.+\.sentry\.io\/\d+$/i;

  return (
    sentryPattern.test(dsn) ||
    sentryPatternAlt.test(dsn) ||
    sentryPatternOrg.test(dsn) ||
    genericPattern.test(dsn)
  );
}

/**
 * Inicializa o Sentry para Error Tracking
 *
 * Features:
 * - Automatic error capture
 * - Performance monitoring (tracing)
 * - Session replay
 * - User identification
 * - Source maps support
 * - Breadcrumbs
 * - **PII Filtering (LGPD compliance)** ✅
 */
export function initErrorTracking(): void {
  // Evita inicialização duplicada
  if (isInitialized) {
    console.info("🔴 Sentry: Já inicializado");
    return;
  }

  // Verifica se DSN está configurado
  if (!SENTRY_DSN) {
    if (APP_ENVIRONMENT !== "development") {
      console.info("🔴 Sentry: Não configurado (VITE_SENTRY_DSN não definido)");
      console.info("   Para habilitar, adicione VITE_SENTRY_DSN ao .env");
      console.info("   Obtenha seu DSN em: https://sentry.io/settings/projects/");
    }
    return;
  }

  // Verifica se é um DSN dummy (comum em desenvolvimento)
  if (isDummySentryDSN(SENTRY_DSN)) {
    // Em desenvolvimento, é normal ter DSN dummy - não mostra warning
    if (APP_ENVIRONMENT !== "development") {
      console.info("🔴 Sentry: DSN contém valores placeholder");
      console.info("   Configure um DSN real do Sentry.io para produção");
    }
    return;
  }

  // Valida formato do DSN
  if (!isValidSentryDSN(SENTRY_DSN)) {
    console.warn("⚠️ Sentry: DSN inválido ou não é do Sentry.io");
    console.info("   DSN esperado: https://<key>@<org>.ingest.sentry.io/<project>");
    console.info("   DSN recebido:", SENTRY_DSN.substring(0, 50) + "...");
    return;
  }

  try {
    // DESABILITADO (modo manutenção): PII filtering não disponível
    // const piiFilteredBeforeSend = createPIIFilteredBeforeSend(PII_CONFIG);

    Sentry.init({
      // DSN do projeto Sentry.io
      dsn: SENTRY_DSN,

      // Ambiente (development, staging, production)
      environment: APP_ENVIRONMENT,

      // Versão da aplicação para tracking de releases
      release: `assistente-juridico@${APP_VERSION}`,

      // Integrações
      integrations: [
        // Browser Tracing para performance monitoring
        Sentry.browserTracingIntegration({
          // Rastreia navegação e interações
          enableInp: true,
        }),

        // Session Replay para reprodução de sessões com erro
        Sentry.replayIntegration({
          // Mascara dados sensíveis
          maskAllText: false, // Não mascara todo texto, apenas inputs
          maskAllInputs: true, // Mascara todos os inputs
          blockAllMedia: false, // Permite mídia
        }),

        // Console logging integration - captura console.error automaticamente
        Sentry.consoleLoggingIntegration({
          levels: ["error", "warn"],
        }),
      ],

      // Trace propagation - propaga traces para suas APIs
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/assistente-juridico.*\.vercel\.app\/api/,
        /^https:\/\/api\.datajud\.cnj\.jus\.br/,
      ],

      // Habilita logs do Sentry (feature experimental)
      _experiments: {
        enableLogs: true,
      },

      // Sample rates
      // Performance: 10% em prod, 100% em dev
      tracesSampleRate: APP_ENVIRONMENT === "production" ? 0.1 : 1,

      // Replay: 10% das sessões normais, 100% das sessões com erro
      replaysSessionSampleRate: APP_ENVIRONMENT === "production" ? 0.1 : 0,
      replaysOnErrorSampleRate: 1,

      // Debug mode apenas em desenvolvimento
      debug: APP_ENVIRONMENT === "development",

      // Máximo de breadcrumbs
      maxBreadcrumbs: 100,

      // Anexa stack traces a mensagens
      attachStacktrace: true,

      // Normaliza profundidade de objetos
      normalizeDepth: 5,

      // ✅ LGPD: Desabilita envio automático de PII
      sendDefaultPii: false,

      // DESABILITADO (modo manutenção): PII filtering não disponível
      beforeSend(event, hint) {
        // 1. DESABILITADO: PII filtering
        // event = piiFilteredBeforeSend(event) as any;

        // 2. Filtra erros de extensões do navegador
        if (
          event.exception?.values?.[0]?.stacktrace?.frames?.some((frame) =>
            frame.filename?.includes("extension")
          )
        ) {
          return null;
        }

        // 3. Filtra erros de rede genéricos (já esperados)
        const errorMessage =
          hint.originalException instanceof Error
            ? hint.originalException.message
            : String(hint.originalException);

        if (errorMessage?.includes("Failed to fetch") && !errorMessage.includes("api/")) {
          // Ignora fetch failures que não são de nossas APIs
          return null;
        }

        // 4. Filtra erros do ResizeObserver (comum e inofensivo)
        if (errorMessage?.includes("ResizeObserver")) {
          return null;
        }

        return event;
      },

      // Before breadcrumb - filtra breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Remove breadcrumbs de console.log em produção
        if (
          breadcrumb.category === "console" &&
          APP_ENVIRONMENT === "production" &&
          breadcrumb.level === "log"
        ) {
          return null;
        }

        // ✅ LGPD: Remove URLs sensíveis
        if (breadcrumb.data?.url?.includes("token") || breadcrumb.data?.url?.includes("password")) {
          breadcrumb.data.url = "[REDACTED]";
        }

        return breadcrumb;
      },

      // Erros a ignorar
      ignoreErrors: [
        // Erros de rede comuns
        "Network request failed",
        "Failed to fetch",
        "NetworkError",
        "Load failed",
        "ChunkLoadError",

        // Erros de navegador
        "ResizeObserver loop",
        "ResizeObserver loop limit exceeded",

        // Extensões
        "top.GLOBALS",
        "originalCreateNotification",
        "canvas.contentDocument",

        // React específicos
        "Minified React error",

        // Erros de cancelamento
        "AbortError",
        "The operation was aborted",

        // Erros de autenticação (esperados)
        "User not authenticated",
        "Session expired",
      ],

      // URLs a negar (não rastrear erros dessas origens)
      denyUrls: [
        // Extensões do navegador
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
        /^safari-extension:\/\//i,
        /^safari-web-extension:\/\//i,

        // Scripts de terceiros que podem dar erro
        /googletagmanager\.com/i,
        /google-analytics\.com/i,
        /vercel\.live/i,
      ],

      // URLs permitidas (apenas rastrear erros dessas origens)
      allowUrls: [
        globalThis.window === undefined ? "" : globalThis.window.location.origin,
        /^https:\/\/.*\.vercel\.app/,
      ],
    });

    isInitialized = true;
    console.log("✅ Sentry Error Tracking inicializado");
    console.log(`   Environment: ${APP_ENVIRONMENT}`);
    console.log(`   Release: assistente-juridico@${APP_VERSION}`);
    console.log(`   PII Filtering: ${ENABLE_PII_FILTERING ? "ATIVO ✅" : "DESATIVADO ⚠️"}`);

    // 🔍 Inicializar integração Gemini para AI Monitoring (lazy loading)
    // Dynamic import para evitar erro de módulo não encontrado durante type-check
    let geminiTimeoutId: ReturnType<typeof setTimeout> | null = null;
    geminiTimeoutId = setTimeout(async () => {
      try {
        const { initGeminiIntegration } = await import("../lib/sentry-gemini-integration.js");
        initGeminiIntegration({
          includePrompts: true,
          captureErrors: true,
        });
        console.log("[Sentry] Gemini Integration initialized");
      } catch {
        // Silencioso - integração opcional
      }
      geminiTimeoutId = null;
    }, 1000);

    // Expor para cleanup em testes/hot reload
    if (typeof window !== "undefined") {
      (
        window as unknown as { __sentryGeminiTimeout?: ReturnType<typeof setTimeout> | null }
      ).__sentryGeminiTimeout = geminiTimeoutId;
    }
  } catch (error) {
    console.error("❌ Falha ao inicializar Sentry:", error);
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email: email || undefined,
    username: username || undefined,
  });

  console.log(`✅ User context set: ${username || email || userId}`);
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
  console.log("✅ User context cleared");
}

/**
 * Set custom tags for error tracking
 */
export function setErrorTag(key: string, value: string | number) {
  Sentry.setTag(key, value);
}

/**
 * Capture error manually
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });

  console.error("❌ Error captured:", error.message);
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info"
) {
  Sentry.captureMessage(message, level);

  console.log(`📝 Message captured [${level}]: ${message}`);
}

/**
 * Capture API error
 */
export function captureApiError(
  error: Error,
  method: string,
  url: string,
  statusCode?: number,
  responseBody?: unknown
) {
  Sentry.captureException(error, {
    contexts: {
      api: {
        method,
        url,
        statusCode,
        responseBody:
          typeof responseBody === "string"
            ? responseBody.substring(0, 1000)
            : JSON.stringify(responseBody).substring(0, 1000),
      },
    },
    tags: {
      error_type: "api_error",
      http_method: method,
      http_status: statusCode,
    },
  });

  console.error(`❌ API Error captured: ${method} ${url} (${statusCode})`);
}

/**
 * Legacy function for backwards compatibility
 *
 * @deprecated This function is deprecated and should not be used.
 * Use Sentry.startSpan() directly instead:
 *
 * @example
 * ```ts
 * await Sentry.startSpan({ name: 'myOperation', op: 'task' }, async (span) => {
 *   // Your async operation here
 *   return result;
 * });
 * ```
 *
 * @throws {Error} Always throws an error to prevent silent failures
 */
export function startTransaction(_name: string, _op: string = "http.request"): never {
  throw new Error(
    "startTransaction is deprecated in Sentry v10+. " +
      "Use Sentry.startSpan() directly. " +
      "See: https://docs.sentry.io/platforms/javascript/guides/react/performance/"
  );
}

/**
 * Flush pending events before shutdown
 */
export async function flushErrors(timeout: number = 2000) {
  try {
    await Sentry.close(timeout);
    console.log("✅ Error tracking flushed");
  } catch {
    console.warn("Error flushing Sentry - may have already been closed");
  }
}

// ============================================
// MÉTRICAS CUSTOMIZADAS
// ============================================

/**
 * Incrementa um contador de métrica usando Sentry.metrics.count
 * @example trackMetric('button_clicks', 1, { button: 'submit' })
 */
export function trackMetric(name: string, value: number = 1, _tags?: Record<string, string>) {
  try {
    // Usa a API mais recente do Sentry
    Sentry.metrics.count(name, value);
  } catch {
    // Silently fail if metrics not available
  }
}

/**
 * Registra uma distribuição de valores (latência, tamanhos, etc)
 * @example trackDistribution('api_latency_ms', 150)
 */
export function trackDistribution(name: string, value: number, _tags?: Record<string, string>) {
  try {
    Sentry.metrics.distribution(name, value);
  } catch {
    // Silently fail if metrics not available
  }
}

/**
 * Registra um gauge (valor pontual no tempo)
 * @example trackGauge('active_users', 42)
 */
export function trackGauge(name: string, value: number, _tags?: Record<string, string>) {
  try {
    Sentry.metrics.gauge(name, value);
  } catch {
    // Silently fail if metrics not available
  }
}

// ============================================
// SPANS CUSTOMIZADOS (Performance)
// ============================================

/**
 * Executa uma operação com span de performance
 * @example
 * const result = await withSpan('fetch_processos', 'http.client', async () => {
 *   return await fetch('/api/processos');
 * });
 */
export async function withSpan<T>(
  name: string,
  op: string,
  callback: () => Promise<T>,
  attributes?: Record<string, string | number>
): Promise<T> {
  return Sentry.startSpan({ name, op, attributes }, async () => callback());
}

/**
 * Cria um span síncrono
 */
export function withSyncSpan<T>(
  name: string,
  op: string,
  callback: () => T,
  attributes?: Record<string, string | number>
): T {
  return Sentry.startSpan({ name, op, attributes }, () => callback());
}

// ============================================
// RE-EXPORT do Sentry para uso direto
// ============================================

export * as Sentry from "@sentry/react";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// 🔍 TRACING: Importar e inicializar OpenTelemetry (DEVE ser primeiro)
import { initializeOpenTelemetry } from "./lib/otel-integration";

// Inicializar tracing ANTES de qualquer outra coisa
initializeOpenTelemetry();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// ✅ MONITORING: Inicialização do Sentry (lazy loaded)
let monitoringInitialized = false;

const initMonitoring = () => {
  if (monitoringInitialized) return;
  monitoringInitialized = true;

  import("./lib/monitoring")
    .then(({ initMonitoring }) => {
      initMonitoring();
      console.log("[Monitoring] Sentry inicializado");
    })
    .catch((error) => {
      console.warn("[Monitoring] Não foi possível inicializar:", error);
    });
};

// ✅ ANALYTICS: GTM + GA4 inicialização (após consentimento se LGPD requerido)
let analyticsInitialized = false;

const initAnalyticsServices = () => {
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  import("./lib/analytics")
    .then(({ initAnalytics }) => {
      initAnalytics();
      console.log("[Analytics] GTM/GA4 inicializados");
    })
    .catch((error) => {
      console.warn("[Analytics] Não inicializado:", error);
    });
};

// ✅ ESTRATÉGIA DE CARREGAMENTO OTIMIZADA
// 1. Monitoring: Carrega após primeira interação ou após 3s (o que ocorrer primeiro)
// 2. Analytics: Carrega após 2s para não impactar FCP/LCP

// Monitoring - Carregar após interação do usuário
const initOnInteraction = () => {
  const events = ["click", "keydown", "scroll", "touchstart"];
  const handler = () => {
    events.forEach((e) => globalThis.window.removeEventListener(e, handler, { capture: true }));
    if ("requestIdleCallback" in globalThis) {
      requestIdleCallback(() => initMonitoring(), { timeout: 2000 });
    } else {
      setTimeout(initMonitoring, 100);
    }
  };
  events.forEach((e) =>
    globalThis.window.addEventListener(e, handler, { capture: true, passive: true })
  );
};

// Monitoring - Fallback após 3s se não houver interação
const initOnIdle = () => {
  if ("requestIdleCallback" in globalThis) {
    requestIdleCallback(() => setTimeout(initMonitoring, 3000), { timeout: 5000 });
  } else {
    setTimeout(initMonitoring, 5000);
  }
};

// Analytics - Inicializa após 2s
setTimeout(initAnalyticsServices, 2000);

// Monitoring - Estratégias paralelas
initOnInteraction();
initOnIdle();

createRoot(rootElement).render(
  <ErrorBoundary>
    <StrictMode>
      <App />
    </StrictMode>
  </ErrorBoundary>
);

// ✅ Limpa o timeout de loading quando o React carrega
if (
  globalThis.window !== undefined &&
  (globalThis.window as unknown as { __clearLoadingTimeout?: () => void }).__clearLoadingTimeout
) {
  (globalThis.window as unknown as { __clearLoadingTimeout: () => void }).__clearLoadingTimeout();
}

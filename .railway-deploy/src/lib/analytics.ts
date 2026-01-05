/**
 * Google Analytics 4 & Google Tag Manager Integration
 *
 * Este módulo fornece integração completa com GA4 e GTM para tracking de eventos,
 * pageviews e métricas customizadas do Assistente Jurídico PJe.
 *
 * Configuração:
 * - VITE_GTM_ID: ID do Google Tag Manager (ex: GTM-XXXXXXX)
 * - VITE_GA_MEASUREMENT_ID: ID do GA4 (ex: G-XXXXXXXXXX)
 */

// Tipos para o dataLayer do GTM
// O dataLayer aceita tanto objetos quanto arrays (para gtag)
type DataLayerItem = Record<string, unknown> | unknown[];

declare global {
  interface Window {
    dataLayer: DataLayerItem[];
    gtag: (...args: unknown[]) => void;
  }
}

// Helpers
function isBrowser(): boolean {
  return globalThis.window !== undefined && globalThis.document !== undefined;
}

// Configuração
const GTM_ID = import.meta.env.VITE_GTM_ID || "";
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

// Estado interno
let isInitialized = false; // GA4 direto
let isGTMLoaded = false; // GTM foi inicializado (dataLayer pronto + script injetado)

/**
 * Inicializa o Google Tag Manager
 * Carrega o script do GTM e configura o dataLayer
 */
export function initGTM(): void {
  if (!isBrowser()) return;

  if (isGTMLoaded || !GTM_ID) {
    // GTM não configurado ou já carregado - silencioso em dev
    return;
  }

  // Inicializa dataLayer se ainda não existir
  globalThis.window.dataLayer = globalThis.window.dataLayer || [];

  // Adiciona evento de inicialização
  globalThis.window.dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js",
  });

  // Marca como "carregado" assim que configuramos dataLayer + script
  // (pode receber eventos mesmo antes do JS remoto terminar de carregar)
  isGTMLoaded = true;

  // Carrega script do GTM
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  // SEGURANÇA (S5725): GTM é dinâmico, não permite SRI hash fixo
  // Mitigação: crossOrigin + HTTPS + referrerPolicy + CSP (script-src 'self' *.googletagmanager.com)
  script.crossOrigin = "anonymous";
  script.referrerPolicy = "strict-origin-when-cross-origin";

  script.onload = () => {
    console.log("✅ GTM carregado:", GTM_ID);
  };

  script.onerror = () => {
    console.warn("⚠️ GTM: Falha ao carregar script");
  };

  document.head.appendChild(script);

  // Adiciona noscript fallback (iframe) no body
  const noscript = document.createElement("noscript");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  noscript.appendChild(iframe);

  // Body pode não existir em alguns momentos muito iniciais
  if (document.body) {
    document.body.insertBefore(noscript, document.body.firstChild);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.body) {
        document.body.insertBefore(noscript, document.body.firstChild);
      }
    });
  }
}

/**
 * Inicializa o Google Analytics 4 (gtag.js)
 * Usado quando não há GTM configurado
 */
export function initGA4(): void {
  if (!isBrowser()) return;

  if (isInitialized || !GA_MEASUREMENT_ID) {
    if (!GA_MEASUREMENT_ID) {
      console.info("📊 GA4: Não configurado (VITE_GA_MEASUREMENT_ID não definido)");
    }
    return;
  }

  // Carrega gtag.js
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  // SEGURANÇA (S5725): Google Analytics gtag.js é dinâmico, não permite SRI hash fixo
  // Mitigação: crossOrigin + HTTPS + referrerPolicy + CSP no Vercel
  script.crossOrigin = "anonymous";
  script.referrerPolicy = "strict-origin-when-cross-origin";
  document.head.appendChild(script);

  // Inicializa gtag
  globalThis.window.dataLayer = globalThis.window.dataLayer || [];

  // Função gtag usando rest parameters
  globalThis.window.gtag = function gtag(...args: unknown[]) {
    globalThis.window.dataLayer.push(args);
  };

  globalThis.window.gtag("js", new Date());
  globalThis.window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false, // Controlamos manualmente
    anonymize_ip: true,
    cookie_flags: "SameSite=None;Secure",
  });

  isInitialized = true;
  console.log("✅ GA4 inicializado:", GA_MEASUREMENT_ID);
}

/**
 * Inicializa todo o sistema de analytics
 * Prioriza GTM se disponível, caso contrário usa GA4 direto
 */
export function initAnalytics(): void {
  if (!isBrowser()) return;

  // Só inicializa em desenvolvimento se forçado (silencioso)
  if (import.meta.env.DEV && !import.meta.env.VITE_FORCE_ANALYTICS) {
    return;
  }

  // Prioriza GTM
  if (GTM_ID) {
    initGTM();
  } else if (GA_MEASUREMENT_ID) {
    initGA4();
  }
  // 🔇 Modo silencioso - não loga em produção quando não configurado
}

/**
 * Envia um evento para o dataLayer (GTM) ou gtag (GA4)
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!isBrowser()) return;

  // Se não tem nenhuma config, não faz nada
  if (!GTM_ID && !GA_MEASUREMENT_ID) return;

  const eventData = {
    event: eventName,
    ...params,
    timestamp: new Date().toISOString(),
  };

  // Envia para dataLayer (funciona com GTM e GA4)
  if (globalThis.window.dataLayer) {
    globalThis.window.dataLayer.push(eventData);
  }

  // Se gtag disponível, envia também
  if (globalThis.window.gtag && GA_MEASUREMENT_ID) {
    globalThis.window.gtag("event", eventName, params);
  }

  if (import.meta.env.DEV) {
    console.log("📊 Event tracked:", eventName, params);
  }
}

/**
 * Rastreia visualização de página
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!isBrowser()) return;

  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: globalThis.window.location.href,
  });
}

/**
 * Rastreia navegação entre seções do app
 */
export function trackNavigation(from: string, to: string): void {
  trackEvent("navigation", {
    from_section: from,
    to_section: to,
  });
}

// ============================================
// Eventos específicos do Assistente Jurídico
// ============================================

/**
 * Rastreia ação de processo
 */
export function trackProcessAction(
  action: "view" | "create" | "update" | "delete" | "move",
  processId?: string,
  processType?: string
): void {
  trackEvent("process_action", {
    action,
    process_id: processId,
    process_type: processType,
  });
}

/**
 * Rastreia interação com agente IA
 */
export function trackAgentInteraction(
  agentId: string,
  action: "activate" | "deactivate" | "task_complete" | "task_failed",
  taskType?: string
): void {
  trackEvent("agent_interaction", {
    agent_id: agentId,
    action,
    task_type: taskType,
  });
}

/**
 * Rastreia uso da calculadora de prazos
 */
export function trackDeadlineCalculation(deadlineType: string, daysCalculated: number): void {
  trackEvent("deadline_calculation", {
    deadline_type: deadlineType,
    days_calculated: daysCalculated,
  });
}

/**
 * Rastreia busca no DJEN/DataJud
 */
export function trackDJENSearch(
  searchType: "oab" | "processo" | "parte",
  resultsCount: number
): void {
  trackEvent("djen_search", {
    search_type: searchType,
    results_count: resultsCount,
  });
}

/**
 * Rastreia criação/edição de minuta
 */
export function trackMinutaAction(
  action: "create" | "edit" | "save" | "export" | "ai_generate",
  minutaType?: string,
  templateUsed?: string
): void {
  trackEvent("minuta_action", {
    action,
    minuta_type: minutaType,
    template_used: templateUsed,
  });
}

/**
 * Rastreia uso do chat com Donna
 */
export function trackChatInteraction(messageType: "user" | "assistant", tokensUsed?: number): void {
  trackEvent("chat_interaction", {
    message_type: messageType,
    tokens_used: tokensUsed,
  });
}

/**
 * Rastreia login/logout
 */
export function trackAuth(action: "login" | "logout" | "login_failed", method?: string): void {
  trackEvent("auth", {
    action,
    method: method || "google",
  });
}

/**
 * Rastreia erros para analytics
 */
export function trackError(errorType: string, errorMessage: string, errorLocation?: string): void {
  trackEvent("error", {
    error_type: errorType,
    error_message: errorMessage.substring(0, 200),
    error_location: errorLocation,
  });
}

/**
 * Define propriedades do usuário para segmentação
 */
export function setUserProperties(properties: {
  user_type?: "free" | "pro" | "enterprise";
  processes_count?: number;
  agents_active?: number;
}): void {
  if (!isBrowser()) return;

  if (globalThis.window.gtag && GA_MEASUREMENT_ID) {
    globalThis.window.gtag("set", "user_properties", properties);
  }

  if (globalThis.window.dataLayer) {
    globalThis.window.dataLayer.push({
      event: "set_user_properties",
      ...properties,
    });
  }
}

/**
 * Opt-out de analytics (para LGPD)
 */
export function optOutAnalytics(): void {
  if (!isBrowser()) return;

  // Desabilita cookies do GA
  if (globalThis.window.gtag) {
    globalThis.window.gtag("consent", "update", {
      analytics_storage: "denied",
    });
  }

  // Remove cookies existentes
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (name.startsWith("_ga") || name.startsWith("_gid")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });

  console.log("✅ Analytics opt-out aplicado");
}

/**
 * Opt-in de analytics (após consentimento LGPD)
 */
export function optInAnalytics(): void {
  if (!isBrowser()) return;

  if (globalThis.window.gtag) {
    globalThis.window.gtag("consent", "update", {
      analytics_storage: "granted",
    });
  }

  // Reinicializa se necessário
  if (!isInitialized && !isGTMLoaded) {
    initAnalytics();
  }

  console.log("✅ Analytics opt-in aplicado");
}

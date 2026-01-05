/**
 * Sentry Feature Flags Integration para TypeScript/JavaScript
 *
 * Baseado na documentação oficial do Sentry para Python:
 * https://docs.sentry.io/platforms/python/feature-flags.md
 *
 * Este módulo fornece uma API genérica para rastrear avaliações de feature flags
 * no Sentry. As avaliações são mantidas em memória e enviadas em eventos de erro
 * e transações.
 */

import * as Sentry from "@sentry/react";

/**
 * Resultado de uma avaliação de feature flag
 */
export type FeatureFlagValue = boolean | string | number;

/**
 * Configuração de um feature flag
 */
export interface FeatureFlag {
  /** Nome único do feature flag */
  name: string;
  /** Valor avaliado do flag */
  value: FeatureFlagValue;
  /** Timestamp da avaliação (opcional) */
  evaluatedAt?: Date;
  /** Contexto adicional (opcional) */
  context?: Record<string, unknown>;
}

/**
 * Armazena avaliações de feature flags no escopo atual do Sentry
 *
 * @example
 * ```typescript
 * import { addFeatureFlag } from '@/lib/sentry-feature-flags';
 *
 * // Registra uma avaliação de flag
 * addFeatureFlag('new-dashboard', true);
 * addFeatureFlag('max-processes', 100);
 *
 * // Quando um erro ocorre, os flags serão incluídos automaticamente
 * Sentry.captureException(new Error("Something went wrong!"));
 * ```
 */
export function addFeatureFlag(
  name: string,
  value: FeatureFlagValue,
  context?: Record<string, unknown>
): void {
  const scope = Sentry.getCurrentScope();

  // Adiciona o flag ao contexto do Sentry
  scope.setContext(`feature_flag.${name}`, {
    value,
    evaluatedAt: new Date().toISOString(),
    ...(context && { context }),
  });

  // Também adiciona como tag para facilitar busca
  scope.setTag(`flag.${name}`, String(value));
}

/**
 * Registra múltiplos feature flags de uma vez
 *
 * @example
 * ```typescript
 * import { addFeatureFlags } from '@/lib/sentry-feature-flags';
 *
 * addFeatureFlags({
 *   'new-dashboard': true,
 *   'max-processes': 100,
 *   'enable-ai-agents': false
 * });
 * ```
 */
export function addFeatureFlags(flags: Record<string, FeatureFlagValue>): void {
  Object.entries(flags).forEach(([name, value]) => {
    addFeatureFlag(name, value);
  });
}

/**
 * Remove um feature flag do escopo atual
 *
 * @example
 * ```typescript
 * import { removeFeatureFlag } from '@/lib/sentry-feature-flags';
 *
 * removeFeatureFlag('temporary-flag');
 * ```
 */
export function removeFeatureFlag(name: string): void {
  const scope = Sentry.getCurrentScope();
  scope.setContext(`feature_flag.${name}`, null);
  scope.setTag(`flag.${name}`, undefined);
}

/**
 * Limpa todos os feature flags do escopo atual
 *
 * @example
 * ```typescript
 * import { clearFeatureFlags } from '@/lib/sentry-feature-flags';
 *
 * clearFeatureFlags();
 * ```
 */
export function clearFeatureFlags(): void {
  const scope = Sentry.getCurrentScope();

  // Não há API direta para limpar todos os contextos, então marcamos como null
  // O Sentry vai ignorar contextos null
  scope.clear();
}

/**
 * Hook React para rastrear feature flags com lifecycle
 *
 * @example
 * ```tsx
 * import { useFeatureFlag } from '@/lib/sentry-feature-flags';
 *
 * function MyComponent() {
 *   const isNewDashboard = useFeatureFlag('new-dashboard', true);
 *
 *   return isNewDashboard ? <NewDashboard /> : <OldDashboard />;
 * }
 * ```
 */
export function useFeatureFlag(name: string, defaultValue: boolean): boolean {
  const [value] = React.useState(() => {
    // Aqui você pode integrar com seu provedor de feature flags
    // Por exemplo: LaunchDarkly, Statsig, Unleash, etc.

    // Por enquanto, retorna o valor padrão
    const flagValue = defaultValue;

    // Registra no Sentry
    addFeatureFlag(name, flagValue);

    return flagValue;
  });

  return value;
}

// Importar React para o hook acima
import React from "react";

/**
 * Wrapper para integração com LaunchDarkly
 *
 * @example
 * ```typescript
 * import { trackLaunchDarklyFlag } from '@/lib/sentry-feature-flags';
 * import { useLDClient } from 'launchdarkly-react-client-sdk';
 *
 * function MyComponent() {
 *   const ldClient = useLDClient();
 *   const flagValue = ldClient?.variation('my-flag', false);
 *
 *   trackLaunchDarklyFlag('my-flag', flagValue);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function trackLaunchDarklyFlag(name: string, value: FeatureFlagValue): void {
  addFeatureFlag(name, value, { provider: "LaunchDarkly" });
}

/**
 * Wrapper para integração com Statsig
 *
 * @example
 * ```typescript
 * import { trackStatsigGate } from '@/lib/sentry-feature-flags';
 * import { useGate } from 'statsig-react';
 *
 * function MyComponent() {
 *   const { value } = useGate('my_gate');
 *
 *   trackStatsigGate('my_gate', value);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function trackStatsigGate(name: string, value: boolean): void {
  addFeatureFlag(name, value, { provider: "Statsig" });
}

/**
 * Wrapper para integração com Unleash
 *
 * @example
 * ```typescript
 * import { trackUnleashFlag } from '@/lib/sentry-feature-flags';
 * import { useFlag } from '@unleash/proxy-client-react';
 *
 * function MyComponent() {
 *   const enabled = useFlag('my-feature');
 *
 *   trackUnleashFlag('my-feature', enabled);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function trackUnleashFlag(name: string, value: boolean): void {
  addFeatureFlag(name, value, { provider: "Unleash" });
}

/**
 * Decorator para rastrear feature flags em funções
 *
 * @example
 * ```typescript
 * import { withFeatureFlag } from '@/lib/sentry-feature-flags';
 *
 * const processWithFlag = withFeatureFlag(
 *   'experimental-processing',
 *   true,
 *   (data: string) => {
 *     // Sua lógica aqui
 *     return processData(data);
 *   }
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withFeatureFlag<T extends (...args: any[]) => any>(
  flagName: string,
  flagValue: FeatureFlagValue,
  fn: T
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    addFeatureFlag(flagName, flagValue);
    return fn(...args);
  }) as T;
}

/**
 * Feature Flags pré-definidos do sistema Assistente Jurídico PJe
 */
export const FEATURE_FLAGS = {
  // Agentes de IA
  AI_AGENTS_ENABLED: "ai-agents-enabled",
  AI_REDACAO_PETICOES: "ai-redacao-peticoes",
  AI_ANALISE_DOCUMENTAL: "ai-analise-documental",

  // Integrações
  DJEN_AUTO_SYNC: "djen-auto-sync",
  DATAJUD_INTEGRATION: "datajud-integration",
  GOOGLE_CALENDAR_SYNC: "google-calendar-sync",

  // Features experimentais
  EXPERIMENTAL_DASHBOARD: "experimental-dashboard",
  EXPERIMENTAL_KANBAN: "experimental-kanban",

  // Performance
  LAZY_LOADING_ENABLED: "lazy-loading-enabled",
  CODE_SPLITTING_ENABLED: "code-splitting-enabled",

  // Limite de processos
  MAX_PROCESSES_LIMIT: "max-processes-limit",
} as const;

export type FeatureFlagName = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

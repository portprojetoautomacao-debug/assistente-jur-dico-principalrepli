/**
 * Sentry Metrics Integration para TypeScript/JavaScript
 *
 * Baseado na documentação oficial do Sentry para Python:
 * https://docs.sentry.io/platforms/python/metrics.md
 *
 * Este módulo fornece APIs para emitir métricas customizadas no Sentry:
 * - Counters: Contadores incrementais
 * - Distributions: Distribuições para agregações (p90, min, max, avg)
 * - Gauges: Gauges para agregações mais eficientes (sem percentis)
 */

import * as Sentry from "@sentry/react";

/**
 * Unidades de medida suportadas
 */
export type MetricUnit =
  | "nanosecond"
  | "microsecond"
  | "millisecond"
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "byte"
  | "kilobyte"
  | "megabyte"
  | "gigabyte"
  | "terabyte"
  | "bit"
  | "kilobit"
  | "megabit"
  | "gigabit"
  | "percent"
  | "none";

/**
 * Tags/atributos para métricas
 */
export type MetricTags = Record<string, string | number | boolean>;

/**
 * Opções para callbacks before_send_metric
 */
export interface MetricHint {
  /** Timestamp quando a métrica foi criada */
  timestamp: number;
  /** ID do trace atual (se houver) */
  traceId?: string;
  /** ID do span atual (se houver) */
  spanId?: string;
}

/**
 * Callback para filtrar/modificar métricas antes de enviar
 */
export type BeforeSendMetricCallback = (
  metric: {
    name: string;
    type: "counter" | "gauge" | "distribution";
    value: number;
    unit?: MetricUnit;
    tags?: MetricTags;
    timestamp: number;
  },
  hint: MetricHint
) => { name: string; type: string; value: number; unit?: MetricUnit; tags?: MetricTags } | null;

let beforeSendMetricCallback: BeforeSendMetricCallback | undefined;

/**
 * Configura callback para filtrar/modificar métricas antes de enviar
 *
 * @example
 * ```typescript
 * import { setBeforeSendMetric } from '@/lib/sentry-metrics';
 *
 * setBeforeSendMetric((metric, hint) => {
 *   // Filtra métricas específicas
 *   if (metric.name === 'removed-metric') {
 *     return null;
 *   }
 *
 *   // Adiciona tags extras
 *   metric.tags = {
 *     ...metric.tags,
 *     extra: 'foo',
 *   };
 *
 *   // Remove tag específica
 *   if (metric.tags?.browser) {
 *     delete metric.tags.browser;
 *   }
 *
 *   return metric;
 * });
 * ```
 */
export function setBeforeSendMetric(callback: BeforeSendMetricCallback | undefined): void {
  beforeSendMetricCallback = callback;
}

/**
 * Emite um contador (counter) no Sentry
 *
 * Contadores são incrementais e usados para contar ocorrências de eventos.
 *
 * @param name - Nome da métrica
 * @param value - Valor a incrementar (default: 1)
 * @param options - Opções da métrica
 *
 * @example
 * ```typescript
 * import { count } from '@/lib/sentry-metrics';
 *
 * // Registra 5 cliques de botão
 * count('button_click', 5, {
 *   tags: {
 *     browser: 'Firefox',
 *     app_version: '1.0.0',
 *   },
 * });
 *
 * // Incrementa em 1 (valor padrão)
 * count('api_request');
 * ```
 */
export function count(
  name: string,
  value: number = 1,
  options?: {
    unit?: MetricUnit;
    tags?: MetricTags;
  }
): void {
  const timestamp = Date.now();
  const scope = Sentry.getCurrentScope();
  const spanContext = Sentry.getActiveSpan()?.spanContext();

  let metric = {
    name,
    type: "counter" as const,
    value,
    unit: options?.unit,
    tags: options?.tags,
    timestamp,
  };

  // Aplica callback before_send_metric
  if (beforeSendMetricCallback) {
    const result = beforeSendMetricCallback(metric, {
      timestamp,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    });

    if (result === null) {
      return; // Métrica foi filtrada
    }

    metric = result as typeof metric;
  }

  // Sentry JS SDK não tem API nativa para métricas ainda (até Jan 2025)
  // Vamos usar breadcrumbs customizados
  Sentry.addBreadcrumb({
    category: "metric.counter",
    message: `${name}: ${value}`,
    level: "info",
    data: {
      metric_name: name,
      metric_type: "counter",
      metric_value: value,
      ...(metric.unit && { metric_unit: metric.unit }),
      ...(metric.tags && { metric_tags: metric.tags }),
    },
    timestamp: timestamp / 1000,
  });

  // Também adiciona como tag para facilitar busca
  scope.setTag(`metric.${name}`, value);
}

/**
 * Emite uma distribuição (distribution) no Sentry
 *
 * Distribuições permitem agregações como p90, min, max, avg.
 * Use para métricas onde percentis são importantes (ex: latências).
 *
 * @param name - Nome da métrica
 * @param value - Valor a registrar
 * @param options - Opções da métrica
 *
 * @example
 * ```typescript
 * import { distribution } from '@/lib/sentry-metrics';
 *
 * // Registra tempo de carregamento de página
 * distribution('page_load', 15.0, {
 *   unit: 'millisecond',
 *   tags: {
 *     page: '/home',
 *   },
 * });
 *
 * // Registra tamanho de resposta API
 * distribution('api_response_size', 1024, {
 *   unit: 'byte',
 *   tags: {
 *     endpoint: '/api/processes',
 *   },
 * });
 * ```
 */
export function distribution(
  name: string,
  value: number,
  options?: {
    unit?: MetricUnit;
    tags?: MetricTags;
  }
): void {
  const timestamp = Date.now();
  const scope = Sentry.getCurrentScope();
  const spanContext = Sentry.getActiveSpan()?.spanContext();

  let metric = {
    name,
    type: "distribution" as const,
    value,
    unit: options?.unit,
    tags: options?.tags,
    timestamp,
  };

  // Aplica callback before_send_metric
  if (beforeSendMetricCallback) {
    const result = beforeSendMetricCallback(metric, {
      timestamp,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    });

    if (result === null) {
      return;
    }

    metric = result as typeof metric;
  }

  Sentry.addBreadcrumb({
    category: "metric.distribution",
    message: `${name}: ${value}`,
    level: "info",
    data: {
      metric_name: name,
      metric_type: "distribution",
      metric_value: value,
      ...(metric.unit && { metric_unit: metric.unit }),
      ...(metric.tags && { metric_tags: metric.tags }),
    },
    timestamp: timestamp / 1000,
  });

  scope.setTag(`metric.${name}`, value);
}

/**
 * Emite um gauge no Sentry
 *
 * Gauges permitem agregações (min, max, avg, sum, count) de forma mais eficiente
 * que distributions, mas não suportam percentis.
 * Use para métricas onde percentis não são necessários.
 *
 * @param name - Nome da métrica
 * @param value - Valor a registrar
 * @param options - Opções da métrica
 *
 * @example
 * ```typescript
 * import { gauge } from '@/lib/sentry-metrics';
 *
 * // Registra uso de memória
 * gauge('memory_usage', 512, {
 *   unit: 'megabyte',
 *   tags: {
 *     instance: 'web-1',
 *   },
 * });
 *
 * // Registra número de processos ativos
 * gauge('active_processes', 42, {
 *   tags: {
 *     status: 'running',
 *   },
 * });
 * ```
 */
export function gauge(
  name: string,
  value: number,
  options?: {
    unit?: MetricUnit;
    tags?: MetricTags;
  }
): void {
  const timestamp = Date.now();
  const scope = Sentry.getCurrentScope();
  const spanContext = Sentry.getActiveSpan()?.spanContext();

  let metric = {
    name,
    type: "gauge" as const,
    value,
    unit: options?.unit,
    tags: options?.tags,
    timestamp,
  };

  // Aplica callback before_send_metric
  if (beforeSendMetricCallback) {
    const result = beforeSendMetricCallback(metric, {
      timestamp,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    });

    if (result === null) {
      return;
    }

    metric = result as typeof metric;
  }

  Sentry.addBreadcrumb({
    category: "metric.gauge",
    message: `${name}: ${value}`,
    level: "info",
    data: {
      metric_name: name,
      metric_type: "gauge",
      metric_value: value,
      ...(metric.unit && { metric_unit: metric.unit }),
      ...(metric.tags && { metric_tags: metric.tags }),
    },
    timestamp: timestamp / 1000,
  });

  scope.setTag(`metric.${name}`, value);
}

/**
 * Mede a duração de uma função e emite como distribution
 *
 * @example
 * ```typescript
 * import { measureDuration } from '@/lib/sentry-metrics';
 *
 * const result = await measureDuration(
 *   'database_query',
 *   async () => {
 *     return await db.query('SELECT * FROM processes');
 *   },
 *   {
 *     tags: { table: 'processes' },
 *   }
 * );
 * ```
 */
export async function measureDuration<T>(
  name: string,
  fn: () => Promise<T>,
  options?: {
    tags?: MetricTags;
  }
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    distribution(name, duration, {
      unit: "millisecond",
      tags: {
        ...options?.tags,
        status: "success",
      },
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    distribution(name, duration, {
      unit: "millisecond",
      tags: {
        ...options?.tags,
        status: "error",
      },
    });

    throw error;
  }
}

/**
 * Hook React para medir tempo de renderização
 *
 * @example
 * ```tsx
 * import { useMeasureRender } from '@/lib/sentry-metrics';
 *
 * function MyComponent() {
 *   useMeasureRender('MyComponent');
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useMeasureRender(componentName: string, tags?: MetricTags): void {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      distribution(`render_time.${componentName}`, duration, {
        unit: "millisecond",
        tags,
      });
    };
  }, [componentName, tags]);
}

import React from "react";

/**
 * Métricas pré-definidas do sistema Assistente Jurídico PJe
 */
export const METRICS = {
  // Contadores
  COUNTERS: {
    /** Cliques em botões */
    BUTTON_CLICK: "button_click",
    /** Requisições à API */
    API_REQUEST: "api_request",
    /** Erros capturados */
    ERROR_CAPTURED: "error_captured",
    /** Processos criados */
    PROCESS_CREATED: "process_created",
    /** Minutas geradas */
    MINUTA_GENERATED: "minuta_generated",
    /** Agentes executados */
    AGENT_EXECUTED: "agent_executed",
  },

  // Distribuições
  DISTRIBUTIONS: {
    /** Tempo de carregamento de página */
    PAGE_LOAD: "page_load",
    /** Tempo de resposta da API */
    API_RESPONSE_TIME: "api_response_time",
    /** Tamanho de resposta da API */
    API_RESPONSE_SIZE: "api_response_size",
    /** Tempo de execução de agente */
    AGENT_EXECUTION_TIME: "agent_execution_time",
    /** Tempo de renderização */
    RENDER_TIME: "render_time",
    /** Tempo de consulta ao banco */
    DATABASE_QUERY_TIME: "database_query_time",
  },

  // Gauges
  GAUGES: {
    /** Uso de memória */
    MEMORY_USAGE: "memory_usage",
    /** Processos ativos */
    ACTIVE_PROCESSES: "active_processes",
    /** Minutas pendentes */
    PENDING_MINUTAS: "pending_minutas",
    /** Tarefas na fila */
    QUEUE_SIZE: "queue_size",
    /** Agentes ativos */
    ACTIVE_AGENTS: "active_agents",
  },
} as const;

export type CounterMetric = (typeof METRICS.COUNTERS)[keyof typeof METRICS.COUNTERS];
export type DistributionMetric = (typeof METRICS.DISTRIBUTIONS)[keyof typeof METRICS.DISTRIBUTIONS];
export type GaugeMetric = (typeof METRICS.GAUGES)[keyof typeof METRICS.GAUGES];

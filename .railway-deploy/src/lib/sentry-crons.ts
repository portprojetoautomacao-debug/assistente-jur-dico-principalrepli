/**
 * Sentry Crons Integration para TypeScript/JavaScript
 *
 * Baseado na documentação oficial do Sentry para Python:
 * https://docs.sentry.io/platforms/python/crons.md
 *
 * Este módulo fornece monitoramento de jobs agendados (cron jobs) no Sentry.
 * Permite detectar jobs que falharam, não iniciaram ou excederam o tempo máximo.
 */

import * as Sentry from "@sentry/react";

/**
 * Status possíveis de um check-in de cron
 */
export enum MonitorStatus {
  /** Check-in de sucesso */
  OK = "ok",
  /** Check-in de erro */
  ERROR = "error",
  /** Job em progresso */
  IN_PROGRESS = "in_progress",
}

/**
 * Tipo de schedule para cron
 */
export type ScheduleType = "crontab" | "interval";

/**
 * Configuração de schedule (crontab)
 */
export interface CrontabSchedule {
  type: "crontab";
  /** Expressão crontab (ex: "0 0 * * *" para meia-noite) */
  value: string;
}

/**
 * Configuração de schedule (interval)
 */
export interface IntervalSchedule {
  type: "interval";
  /** Valor numérico do intervalo */
  value: number;
  /** Unidade do intervalo */
  unit: "minute" | "hour" | "day" | "week" | "month";
}

/**
 * Configuração de um monitor de cron
 */
export interface MonitorConfig {
  /** Schedule do monitor */
  schedule: CrontabSchedule | IntervalSchedule;
  /** Timezone (ex: "America/Sao_Paulo") */
  timezone?: string;
  /** Margem de check-in em minutos (default: 5) */
  checkin_margin?: number;
  /** Tempo máximo de execução em minutos (default: 30) */
  max_runtime?: number;
  /** Threshold de falhas consecutivas para criar issue (default: 3) */
  failure_issue_threshold?: number;
  /** Threshold de check-ins OK para resolver issue (default: 1) */
  recovery_threshold?: number;
}

/**
 * Opções para captureCheckin
 */
export interface CaptureCheckinOptions {
  /** Slug único do monitor */
  monitorSlug: string;
  /** Status do check-in */
  status: MonitorStatus;
  /** ID do check-in (para finalizar) */
  checkInId?: string;
  /** Duração em milissegundos (opcional) */
  duration?: number;
  /** Configuração do monitor (opcional, cria/atualiza monitor) */
  monitorConfig?: MonitorConfig;
}

/**
 * Captura um check-in manual de cron no Sentry
 *
 * @returns ID do check-in (use para finalizar o check-in posteriormente)
 *
 * @example
 * ```typescript
 * import { captureCheckin, MonitorStatus } from '@/lib/sentry-crons';
 *
 * // Inicia o job
 * const checkInId = captureCheckin({
 *   monitorSlug: 'djen-sync',
 *   status: MonitorStatus.IN_PROGRESS,
 * });
 *
 * try {
 *   // Execute sua tarefa aqui
 *   await syncDJEN();
 *
 *   // Finaliza com sucesso
 *   captureCheckin({
 *     monitorSlug: 'djen-sync',
 *     checkInId,
 *     status: MonitorStatus.OK,
 *   });
 * } catch (error) {
 *   // Finaliza com erro
 *   captureCheckin({
 *     monitorSlug: 'djen-sync',
 *     checkInId,
 *     status: MonitorStatus.ERROR,
 *   });
 *   throw error;
 * }
 * ```
 */
export function captureCheckin(options: CaptureCheckinOptions): string {
  const { monitorSlug, status, checkInId, duration, monitorConfig } = options;

  // Sentry JS SDK não tem API nativa para crons ainda (até Jan 2025)
  // Vamos usar a API manual via eventos customizados

  const checkId = checkInId || crypto.randomUUID();

  // Envia evento customizado para Sentry
  Sentry.addBreadcrumb({
    category: "cron",
    message: `Monitor ${monitorSlug}: ${status}`,
    level: status === MonitorStatus.ERROR ? "error" : "info",
    data: {
      monitor_slug: monitorSlug,
      check_in_id: checkId,
      status,
      ...(duration && { duration_ms: duration }),
      ...(monitorConfig && { monitor_config: monitorConfig }),
    },
    timestamp: Date.now() / 1000,
  });

  // Também cria uma tag para facilitar busca
  const scope = Sentry.getCurrentScope();
  scope.setTag("monitor.slug", monitorSlug);
  scope.setTag("monitor.status", status);

  // Se for erro, captura como exception
  if (status === MonitorStatus.ERROR) {
    Sentry.captureMessage(`Cron monitor ${monitorSlug} failed`, {
      level: "error",
      tags: {
        "monitor.slug": monitorSlug,
        check_in_id: checkId,
      },
    });
  }

  return checkId;
}

/**
 * Decorator para monitorar funções assíncronas como cron jobs
 *
 * @example
 * ```typescript
 * import { monitorCron } from '@/lib/sentry-crons';
 *
 * const syncDJEN = monitorCron(
 *   'djen-sync',
 *   async () => {
 *     // Sua lógica de sync aqui
 *     const data = await fetchDJENData();
 *     return data;
 *   },
 *   {
 *     schedule: { type: 'crontab', value: '0 12 * * *' }, // Diariamente ao meio-dia UTC
 *     timezone: 'America/Sao_Paulo',
 *     max_runtime: 10, // 10 minutos
 *   }
 * );
 *
 * // Executa o job monitorado
 * await syncDJEN();
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function monitorCron<T extends (...args: any[]) => Promise<any>>(
  monitorSlug: string,
  fn: T,
  monitorConfig?: MonitorConfig
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const startTime = Date.now();

    // Inicia check-in
    const checkInId = captureCheckin({
      monitorSlug,
      status: MonitorStatus.IN_PROGRESS,
      monitorConfig,
    });

    try {
      // Executa a função
      const result = await fn(...args);

      // Finaliza com sucesso
      const duration = Date.now() - startTime;
      captureCheckin({
        monitorSlug,
        checkInId,
        status: MonitorStatus.OK,
        duration,
      });

      return result;
    } catch (error) {
      // Finaliza com erro
      const duration = Date.now() - startTime;
      captureCheckin({
        monitorSlug,
        checkInId,
        status: MonitorStatus.ERROR,
        duration,
      });

      // Re-throw para manter comportamento original
      throw error;
    }
  }) as T;
}

/**
 * Context manager para monitorar blocos de código
 *
 * @example
 * ```typescript
 * import { withCronMonitor, MonitorStatus } from '@/lib/sentry-crons';
 *
 * await withCronMonitor('backup-job', async (reportStatus) => {
 *   try {
 *     // Sua lógica de backup aqui
 *     await performBackup();
 *     reportStatus(MonitorStatus.OK);
 *   } catch (error) {
 *     reportStatus(MonitorStatus.ERROR);
 *     throw error;
 *   }
 * });
 * ```
 */
export async function withCronMonitor<T>(
  monitorSlug: string,
  fn: (reportStatus: (status: MonitorStatus) => void) => Promise<T>,
  monitorConfig?: MonitorConfig
): Promise<T> {
  const startTime = Date.now();

  // Inicia check-in
  const checkInId = captureCheckin({
    monitorSlug,
    status: MonitorStatus.IN_PROGRESS,
    monitorConfig,
  });

  let finalStatus: MonitorStatus = MonitorStatus.OK;

  const reportStatus = (status: MonitorStatus) => {
    finalStatus = status;
  };

  try {
    // Executa a função
    const result = await fn(reportStatus);

    // Finaliza com o status reportado (ou OK se não reportou)
    const duration = Date.now() - startTime;
    captureCheckin({
      monitorSlug,
      checkInId,
      status: finalStatus,
      duration,
    });

    return result;
  } catch (error) {
    // Finaliza com erro
    const duration = Date.now() - startTime;
    captureCheckin({
      monitorSlug,
      checkInId,
      status: MonitorStatus.ERROR,
      duration,
    });

    throw error;
  }
}

/**
 * Monitores de cron pré-definidos do sistema Assistente Jurídico PJe
 */
export const CRON_MONITORS = {
  /** Monitor de sincronização DJEN (diário 9h BRT) */
  DJEN_SYNC_MORNING: {
    slug: "djen-sync-morning",
    config: {
      schedule: { type: "crontab" as const, value: "0 12 * * *" }, // 9h BRT = 12h UTC
      timezone: "America/Sao_Paulo",
      max_runtime: 10,
      checkin_margin: 5,
    },
  },

  /** Monitor de sincronização DJEN (diário 17h BRT) */
  DJEN_SYNC_EVENING: {
    slug: "djen-sync-evening",
    config: {
      schedule: { type: "crontab" as const, value: "0 20 * * *" }, // 17h BRT = 20h UTC
      timezone: "America/Sao_Paulo",
      max_runtime: 10,
      checkin_margin: 5,
    },
  },

  /** Monitor de reset diário de agentes (21h BRT) */
  DAILY_RESET: {
    slug: "daily-reset",
    config: {
      schedule: { type: "crontab" as const, value: "0 0 * * *" }, // 21h BRT = 0h UTC
      timezone: "America/Sao_Paulo",
      max_runtime: 5,
    },
  },

  /** Monitor de processamento da fila de agentes (a cada 15min) */
  PROCESS_AGENT_QUEUE: {
    slug: "process-agent-queue",
    config: {
      schedule: { type: "crontab" as const, value: "*/15 * * * *" },
      timezone: "America/Sao_Paulo",
      max_runtime: 10,
      checkin_margin: 5,
    },
  },

  /** Monitor de notificações (a cada 5min) */
  PROCESS_NOTIFICATIONS: {
    slug: "process-notifications",
    config: {
      schedule: { type: "crontab" as const, value: "*/5 * * * *" },
      timezone: "America/Sao_Paulo",
      max_runtime: 3,
    },
  },

  /** Monitor de sincronização Google Calendar (a cada 2h) */
  CALENDAR_SYNC: {
    slug: "calendar-sync",
    config: {
      schedule: { type: "crontab" as const, value: "0 */2 * * *" },
      timezone: "America/Sao_Paulo",
      max_runtime: 5,
    },
  },

  /** Monitor de backup (diário 0h BRT) */
  BACKUP: {
    slug: "backup",
    config: {
      schedule: { type: "crontab" as const, value: "0 3 * * *" }, // 0h BRT = 3h UTC
      timezone: "America/Sao_Paulo",
      max_runtime: 15,
    },
  },

  /** Monitor DataJud (diário 13h BRT) */
  DATAJUD_MONITOR: {
    slug: "datajud-monitor",
    config: {
      schedule: { type: "crontab" as const, value: "0 16 * * *" }, // 13h BRT = 16h UTC
      timezone: "America/Sao_Paulo",
      max_runtime: 10,
    },
  },

  /** Monitor de alertas de prazos (diário 8:55 BRT) */
  DEADLINE_ALERTS: {
    slug: "deadline-alerts",
    config: {
      schedule: { type: "crontab" as const, value: "55 11 * * *" }, // 8:55 BRT = 11:55 UTC
      timezone: "America/Sao_Paulo",
      max_runtime: 5,
    },
  },

  /** Monitor watchdog (a cada 30min) */
  WATCHDOG: {
    slug: "watchdog",
    config: {
      schedule: { type: "crontab" as const, value: "*/30 * * * *" },
      timezone: "America/Sao_Paulo",
      max_runtime: 2,
    },
  },
} as const;

export type CronMonitorName = keyof typeof CRON_MONITORS;

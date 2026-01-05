// google-services-hub.ts
// Índice central dos serviços Google + Auto-Pilot Jurídico 24/7
//
// - Centraliza status e inicialização de:
//   • Google Calendar (googleCalendarService)
//   • Google Docs (googleDocsService)
//   • Gemini (config/env)
//   • Auto-Pilot DJEN + Prazos + Minutas
//
// Observação importante (arquitetura):
// - Em app 100% frontend (Vercel / SPA), o "24/7" real precisa de um
//   backend/cron/worker. Este hub garante a orquestração sempre que
//   o app estiver aberto (aba ativa), e expõe uma API única para a UI.

import { isGeminiConfigured } from "@/lib/gemini-config";
import { googleCalendarService } from "@/lib/google-calendar-service";
import { googleDocsService } from "@/lib/google-docs-service";

import {
  AutoPilotDjenPrazosMinutas,
  criarAutoPilotDjenPrazosMinutas,
  type AutoPilotConfig,
  type AutoPilotStatus,
} from "@/lib/auto-pilot-djen-prazos-minutas";

// ===== Tipos de status consolidados =====

export interface GoogleCalendarStatus {
  configured: boolean;
  initialized: boolean;
  authenticated: boolean;
  lastError: string | null;
}

export interface GoogleDocsStatus {
  configured: boolean;
  authenticated: boolean;
}

export interface GeminiStatus {
  configured: boolean;
}

export interface AutoPilotSummary {
  enabled: boolean;
  running: boolean;
  lastRun?: string;
  totalIntimacoesProcessadas: number;
  totalPrazosCriados: number;
  totalMinutasCriadas: number;
}

export interface GoogleServicesStatus {
  calendar: GoogleCalendarStatus;
  docs: GoogleDocsStatus;
  gemini: GeminiStatus;
  autoPilot: AutoPilotSummary;
}

// ===== Hub principal =====

export class GoogleServicesHub {
  private autoPilot: AutoPilotDjenPrazosMinutas | null = null;
  private autoPilotConfig: AutoPilotConfig | null = null;

  /**
   * Inicializa em lote os serviços Google.
   * Ideal ser chamado no bootstrap da aplicação (ex.: layout root).
   */
  async initializeAll(): Promise<void> {
    // Calendar já tem initialize próprio
    await googleCalendarService.initialize().catch((err) => {
      console.error("[GoogleServicesHub] Falha ao inicializar Calendar:", err);
    });

    // Docs tem fluxo próprio de scripts + gapi
    await googleDocsService.initialize().catch((err) => {
      console.error("[GoogleServicesHub] Falha ao inicializar Docs:", err);
    });
  }

  /**
   * Retorna status consolidado de todos os serviços Google + Auto-Pilot
   */
  getStatus(): GoogleServicesStatus {
    const calendarStatus = googleCalendarService.getStatus();
    const docsServiceStatus = googleDocsService.getStatus();

    const docsStatus: GoogleDocsStatus = {
      configured: docsServiceStatus.configured,
      authenticated: googleDocsService.isAuthenticated(),
    };

    const geminiStatus: GeminiStatus = {
      configured: isGeminiConfigured(),
    };

    const autoPilotStatus: AutoPilotSummary = (() => {
      if (!this.autoPilot) {
        return {
          enabled: false,
          running: false,
          lastRun: undefined,
          totalIntimacoesProcessadas: 0,
          totalPrazosCriados: 0,
          totalMinutasCriadas: 0,
        } as AutoPilotSummary;
      }

      const status: AutoPilotStatus = this.autoPilot.getStatus();

      return {
        enabled: true,
        running: status.monitor.status === "running",
        lastRun: status.lastRun,
        totalIntimacoesProcessadas: status.totalIntimacoesProcessadas,
        totalPrazosCriados: status.totalPrazosCriados,
        totalMinutasCriadas: status.totalMinutasCriadas,
      };
    })();

    return {
      calendar: calendarStatus,
      docs: docsStatus,
      gemini: geminiStatus,
      autoPilot: autoPilotStatus,
    };
  }

  /**
   * Cria ou atualiza a instância do Auto-Pilot DJEN + Prazos + Minutas.
   * Não inicia automaticamente (chamar startAutoPilot() separadamente).
   */
  configureAutoPilot(config: AutoPilotConfig): AutoPilotDjenPrazosMinutas {
    this.autoPilotConfig = config;

    if (this.autoPilot) {
      // Já existia: apenas atualiza config da instância
      this.autoPilot.atualizarConfig(config);
    } else {
      this.autoPilot = criarAutoPilotDjenPrazosMinutas({
        ...config,
        logCallback: (msg, level) => {
          // Log centralizado do Auto-Pilot
          if (config.logCallback) {
            config.logCallback(msg, level);
          } else {
            console[level](`[Auto-Pilot Hub] ${msg}`);
          }
        },
      });
    }

    return this.autoPilot;
  }

  /**
   * Garante que o Auto-Pilot exista, usando a última config conhecida.
   * Útil quando o app recarrega e você quer reaproveitar a mesma configuração.
   */
  ensureAutoPilot(): AutoPilotDjenPrazosMinutas | null {
    if (this.autoPilot) return this.autoPilot;
    if (!this.autoPilotConfig) return null;
    return this.configureAutoPilot(this.autoPilotConfig);
  }

  // ===== Controles do modo Auto-Pilot 24/7 =====

  /**
   * Inicia o Auto-Pilot (DJEN + Prazos + Minutas).
   * É aqui que o modo “24/7” é armado (enquanto o app estiver rodando).
   */
  startAutoPilot(): void {
    const instance = this.ensureAutoPilot();
    if (!instance) {
      console.warn(
        "[GoogleServicesHub] Auto-Pilot não configurado. Chame configureAutoPilot() antes de iniciar."
      );
      return;
    }
    instance.iniciar();
  }

  pauseAutoPilot(): void {
    if (!this.autoPilot) return;
    this.autoPilot.pausar();
  }

  resumeAutoPilot(): void {
    if (!this.autoPilot) return;
    this.autoPilot.retomar();
  }

  stopAutoPilot(): void {
    if (!this.autoPilot) return;
    this.autoPilot.parar();
  }

  runAutoPilotNow(): void {
    if (!this.autoPilot) return;
    this.autoPilot.executarAgora();
  }

  resetAutoPilotHistory(): void {
    if (!this.autoPilot) return;
    this.autoPilot.limparHistorico();
  }

  getAutoPilotStatus(): AutoPilotStatus | null {
    if (!this.autoPilot) return null;
    return this.autoPilot.getStatus();
  }

  // ===== Helpers para UI (atalhos úteis) =====

  /**
   * Atalho: retorna se o “stack Google” está minimamente pronto
   * para rodar o modo Auto-Pilot (Calendar + Docs + Gemini configurados).
   */
  isStackReadyForAutoPilot(): boolean {
    const status = this.getStatus();
    return status.calendar.configured && status.docs.configured && status.gemini.configured;
  }

  /**
   * Atalho para abrir rapidamente:
   * - Calendar Web
   * - (no futuro você pode adicionar Drive, Gmail etc.)
   */
  openGoogleCalendar(): void {
    googleCalendarService.openGoogleCalendar();
  }

  /**
   * Revoga acessos OAuth (Calendar + Docs) — botão “deslogar” global.
   */
  revokeAllGoogleAccess(): void {
    googleCalendarService.revokeAccess();
    googleDocsService.revokeAccess();
  }
}

// Instância única para usar no app inteiro
export const googleServicesHub = new GoogleServicesHub();

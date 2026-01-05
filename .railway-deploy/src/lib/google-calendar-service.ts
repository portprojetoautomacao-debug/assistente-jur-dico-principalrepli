// Google Calendar Service
// Provides integration with Google Calendar API
// v2.1 - Enhanced with better error handling, SSR safety and token wiring

import { type Appointment } from "@/types";
import type {
  CalendarClient,
  GapiGlobal,
  GoogleAuthResponse,
  GoogleGisGlobal,
  TokenClient,
} from "./google-types";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const CALENDAR_SCOPES =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar";

// Debug helper
const debug = (message: string, data?: unknown) => {
  console.log(`[GoogleCalendar] ${message}`, data ?? "");
};

const debugError = (message: string, error?: unknown) => {
  console.error(`[GoogleCalendar] ERROR: ${message}`, error ?? "");
};

/**
 * Get appointment type from deadline type
 */
function getAppointmentType(type?: string): "prazo" | "audiencia" | "reuniao" | "outro" {
  if (type === "prazo") return "prazo";
  if (type === "audiencia") return "audiencia";
  if (type === "reuniao") return "reuniao";
  return "outro";
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

// Interface para criar prazos via agente
export interface DeadlineEvent {
  title: string;
  description?: string;
  deadline: string; // ISO date string (YYYY-MM-DD ou ISO completo)
  processNumber?: string;
  type: "prazo" | "audiencia" | "reuniao" | "outro";
  priority?: "baixa" | "media" | "alta" | "critica";
  reminders?: number[]; // minutos antes
}

class GoogleCalendarService {
  private tokenClient: TokenClient | null = null;
  private accessToken: string | null = null;
  private gapiInited = false;
  private gisInited = false;
  private initPromise: Promise<void> | null = null;
  private lastError: string | null = null;

  // Status público para UI
  getStatus(): {
    configured: boolean;
    initialized: boolean;
    authenticated: boolean;
    lastError: string | null;
  } {
    return {
      configured: !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY,
      initialized: this.gapiInited && this.gisInited,
      authenticated: !!this.accessToken,
      lastError: this.lastError,
    };
  }

  async initialize(): Promise<boolean> {
    debug("Initializing Google Calendar Service...");

    // Segurança para SSR / Node (Vercel server functions)
    if (globalThis.window === undefined) {
      this.lastError = "Google Calendar só pode ser inicializado no ambiente de browser.";
      debugError(this.lastError);
      return false;
    }

    debug("Config:", {
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasApiKey: !!GOOGLE_API_KEY,
      clientIdPrefix: GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    });

    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      this.lastError =
        "Credenciais do Google não configuradas. Configure VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_API_KEY (ou VITE_GEMINI_API_KEY).";
      debugError(this.lastError);
      return false;
    }

    if (this.gapiInited && this.gisInited) {
      debug("Already initialized");
      return true;
    }

    // Evitar inicializações paralelas
    if (this.initPromise) {
      debug("Waiting for existing initialization...");
      await this.initPromise;
      return this.gapiInited && this.gisInited;
    }

    this.initPromise = this._doInitialize();

    try {
      await this.initPromise;
      return this.gapiInited && this.gisInited;
    } finally {
      this.initPromise = null;
    }
  }

  private async _doInitialize(): Promise<void> {
    try {
      await this.loadGoogleScripts();
      await this.initializeGapi();
      this.initializeGis();
      debug("Initialization complete", {
        gapiInited: this.gapiInited,
        gisInited: this.gisInited,
      });
    } catch (error) {
      this.lastError = `Falha na inicialização: ${
        error instanceof Error ? error.message : String(error)
      }`;
      debugError("Initialization failed", error);
    }
  }

  private loadGoogleScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      debug("Loading Google scripts...");

      if (globalThis.window === undefined || document === undefined) {
        reject(new Error("Google scripts só podem ser carregados no browser"));
        return;
      }

      const gapiWindow = globalThis.window as unknown as { gapi?: GapiGlobal };
      const googleWindow = globalThis.window as unknown as { google?: GoogleGisGlobal };

      // Já carregados
      if (gapiWindow.gapi && googleWindow.google) {
        debug("Scripts already loaded");
        resolve();
        return;
      }

      // Timeout de 15 segundos
      const timeout = setTimeout(() => {
        reject(new Error("Timeout loading Google scripts (15s)"));
      }, 15000);

      const loadGis = () => {
        if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
          debug("GIS script already exists");
          clearTimeout(timeout);
          resolve();
          return;
        }

        const gisScript = document.createElement("script");
        gisScript.src = "https://accounts.google.com/gsi/client";
        gisScript.async = true;
        gisScript.defer = true;
        // SEGURANÇA (S5725): Google Identity Services não fornece hash SRI estável
        // Mitigação: crossOrigin + HTTPS + referrerPolicy + CSP
        gisScript.crossOrigin = "anonymous";
        gisScript.referrerPolicy = "strict-origin-when-cross-origin";
        gisScript.onload = () => {
          debug("GIS script loaded");
          clearTimeout(timeout);
          resolve();
        };
        gisScript.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Failed to load Google Identity Services script"));
        };
        document.head.appendChild(gisScript);
      };

      if (document.querySelector('script[src*="apis.google.com"]')) {
        debug("GAPI script already exists");
        loadGis();
        return;
      }

      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.async = true;
      gapiScript.defer = true;
      // SEGURANÇA (S5725): Google APIs não fornece hash SRI estável
      // Mitigação: crossOrigin + HTTPS + referrerPolicy + CSP
      gapiScript.crossOrigin = "anonymous";
      gapiScript.referrerPolicy = "strict-origin-when-cross-origin";
      gapiScript.onload = () => {
        debug("GAPI script loaded");
        loadGis();
      };
      gapiScript.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load Google API script"));
      };
      document.head.appendChild(gapiScript);
    });
  }

  private async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      debug("Initializing GAPI client...");

      const gapiWindow = globalThis.window as unknown as { gapi?: GapiGlobal };

      if (!gapiWindow.gapi) {
        this.lastError = "Google API (gapi) não disponível";
        reject(new Error(this.lastError));
        return;
      }

      gapiWindow.gapi.load("client", async () => {
        debug("GAPI client module loaded");

        const clientInit = (
          gapiWindow.gapi?.client as {
            init?: (opts: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
          }
        )?.init;

        if (typeof clientInit !== "function") {
          this.lastError = "Google API client init not available";
          debugError(this.lastError);
          reject(new Error(this.lastError));
          return;
        }

        try {
          await clientInit({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
          });
          this.gapiInited = true;
          debug("GAPI client initialized successfully");
          resolve();
        } catch (err) {
          this.lastError = `Erro ao inicializar Google API: ${
            err instanceof Error ? err.message : String(err)
          }`;
          debugError(this.lastError, err);
          reject(err);
        }
      });
    });
  }

  private initializeGis(): void {
    debug("Initializing Google Identity Services...");

    const google = (globalThis.window as unknown as { google?: GoogleGisGlobal })?.google;

    if (!google?.accounts?.oauth2) {
      this.lastError = "Google Identity Services não disponível";
      debugError(this.lastError);
      return;
    }

    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: CALENDAR_SCOPES,
        callback: (_resp: GoogleAuthResponse) => {
          // Callback será definido no authenticate()
        },
      });
      this.gisInited = true;
      debug("GIS initialized successfully");
    } catch (err) {
      this.lastError = `Erro ao inicializar GIS: ${
        err instanceof Error ? err.message : String(err)
      }`;
      debugError(this.lastError, err);
    }
  }

  async authenticate(): Promise<boolean> {
    debug("Starting authentication...");

    const initialized = await this.initialize();
    if (!initialized) {
      debugError("Cannot authenticate - initialization failed");
      return false;
    }

    if (!this.tokenClient) {
      this.lastError = "Token client não disponível";
      debugError(this.lastError);
      return false;
    }

    return new Promise((resolve) => {
      // Timeout de 60 segundos para autenticação
      const timeout = setTimeout(() => {
        this.lastError = "Timeout na autenticação (60s) - popup pode ter sido bloqueado";
        debugError(this.lastError);
        resolve(false);
      }, 60000);

      this.tokenClient!.callback = (resp: GoogleAuthResponse) => {
        clearTimeout(timeout);
        debug("Auth callback received", {
          hasError: !!resp.error,
          hasToken: !!resp.access_token,
        });

        if (resp.error !== undefined) {
          this.lastError = `Erro de autenticação: ${resp.error}`;
          debugError(this.lastError);
          resolve(false);
          return;
        }

        this.accessToken = resp.access_token ?? null;
        this.lastError = null;

        // Importante: conectar GIS com gapi (setar token no client)
        const gapiWindow = globalThis.window as unknown as {
          gapi?: GapiGlobal & {
            client?: { setToken?: (token: { access_token: string }) => void };
          };
        };

        if (this.accessToken && gapiWindow.gapi?.client) {
          try {
            (
              gapiWindow.gapi.client as { setToken?: (token: { access_token: string }) => void }
            ).setToken?.({
              access_token: this.accessToken,
            });
            debug("gapi client token set from GIS access_token");
          } catch (err) {
            debugError("Failed to set gapi client token (non-fatal)", err);
          }
        }

        debug("Authentication successful");
        resolve(true);
      };

      try {
        debug("Requesting access token...");
        if (this.accessToken === null) {
          this.tokenClient!.requestAccessToken({ prompt: "consent" });
        } else {
          this.tokenClient!.requestAccessToken({ prompt: "" });
        }
      } catch (err) {
        clearTimeout(timeout);
        this.lastError = `Erro ao solicitar token: ${
          err instanceof Error ? err.message : String(err)
        }`;
        debugError(this.lastError, err);
        resolve(false);
      }
    });
  }

  async listEvents(timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    debug("Listing events...", { timeMin, timeMax });

    if (!this.accessToken) {
      debug("No access token, attempting to authenticate...");
      const authenticated = await this.authenticate();
      if (!authenticated) {
        debugError("Cannot list events - not authenticated");
        return [];
      }
    }

    try {
      const params: Record<string, unknown> = {
        calendarId: "primary",
        timeMin: (timeMin || new Date()).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: "startTime",
      };

      if (timeMax) {
        params.timeMax = timeMax.toISOString();
      }

      const gapiWindow = globalThis.window as unknown as { gapi?: GapiGlobal };
      const eventsApi = (
        gapiWindow.gapi?.client as {
          calendar?: CalendarClient;
        }
      ).calendar?.events;

      if (!eventsApi || typeof eventsApi.list !== "function") {
        this.lastError = "Calendar API não disponível";
        debugError(this.lastError);
        return [];
      }

      const response = (await eventsApi.list(params)) as {
        result?: { items?: GoogleCalendarEvent[] };
      };
      const events = response.result?.items || [];
      debug(`Found ${events.length} events`);
      return events;
    } catch (error) {
      this.lastError = `Erro ao listar eventos: ${
        error instanceof Error ? error.message : String(error)
      }`;
      debugError(this.lastError, error);
      return [];
    }
  }

  async createEvent(appointment: Appointment): Promise<string | null> {
    debug("Creating event...", { title: appointment.title, date: appointment.date });

    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        debugError("Cannot create event - not authenticated");
        return null;
      }
    }

    try {
      const startDateTime = new Date(`${appointment.date}T${appointment.time}`);
      const endDateTime = new Date(startDateTime.getTime() + (appointment.duration || 60) * 60000);

      const event: GoogleCalendarEvent = {
        summary: appointment.title,
        description: appointment.description || "",
        location: appointment.location || "",
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        reminders: {
          useDefault: false,
          overrides: (appointment.reminders || [60, 1440]).map((minutes) => ({
            method: "popup",
            minutes,
          })),
        },
      };

      const gapiWindow = globalThis.window as unknown as { gapi?: GapiGlobal };
      const eventsApi = (
        gapiWindow.gapi?.client as {
          calendar?: CalendarClient;
        }
      ).calendar?.events;

      if (!eventsApi || typeof eventsApi.insert !== "function") {
        this.lastError = "Calendar API insert não disponível";
        debugError(this.lastError);
        return null;
      }

      const response = (await eventsApi.insert({
        calendarId: "primary",
        resource: event,
      })) as { result?: { id?: string } };

      const eventId = response.result?.id ?? null;
      debug("Event created successfully", { eventId });
      return eventId;
    } catch (error) {
      this.lastError = `Erro ao criar evento: ${
        error instanceof Error ? error.message : String(error)
      }`;
      debugError(this.lastError, error);
      return null;
    }
  }

  /**
   * Criar evento de prazo a partir de análise do agente
   * Usado pela integração com Gestão de Prazos
   */
  async createDeadlineEvent(deadline: DeadlineEvent): Promise<string | null> {
    debug("Creating deadline event...", {
      title: deadline.title,
      deadline: deadline.deadline,
    });

    const raw = deadline.deadline;
    const deadlineDate = new Date(raw);

    if (Number.isNaN(deadlineDate.getTime())) {
      this.lastError = `Data de prazo inválida recebida: "${raw}"`;
      debugError(this.lastError);
      return null;
    }

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      title: `⚠️ PRAZO: ${deadline.title}`,
      description: [
        deadline.description || "",
        deadline.processNumber ? `Processo: ${deadline.processNumber}` : "",
        deadline.priority ? `Prioridade: ${deadline.priority.toUpperCase()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      type: getAppointmentType(deadline.type),
      date: deadlineDate.toISOString().split("T")[0],
      time: "09:00", // Padrão manhã para prazos
      duration: 60,
      location: "",
      reminders: deadline.reminders || [60, 1440, 2880], // 1h, 1 dia, 2 dias antes
    };

    return this.createEvent(appointment);
  }

  async updateEvent(eventId: string, appointment: Appointment): Promise<boolean> {
    debug("Updating event...", { eventId, title: appointment.title });

    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return false;
    }

    try {
      const startDateTime = new Date(`${appointment.date}T${appointment.time}`);
      const endDateTime = new Date(startDateTime.getTime() + (appointment.duration || 60) * 60000);

      const event: GoogleCalendarEvent = {
        summary: appointment.title,
        description: appointment.description || "",
        location: appointment.location || "",
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "America/Sao_Paulo",
        },
        reminders: {
          useDefault: false,
          overrides: (appointment.reminders || []).map((minutes) => ({
            method: "popup",
            minutes,
          })),
        },
      };

      const gapiWindow = globalThis.window as unknown as { gapi?: GapiGlobal };
      const eventsApi = (
        gapiWindow.gapi?.client as {
          calendar?: CalendarClient;
        }
      ).calendar?.events;
      if (!eventsApi || typeof eventsApi.update !== "function") return false;

      await eventsApi.update({
        calendarId: "primary",
        eventId,
        resource: event,
      });

      debug("Event updated successfully");
      return true;
    } catch (error) {
      this.lastError = `Erro ao atualizar evento: ${
        error instanceof Error ? error.message : String(error)
      }`;
      debugError(this.lastError, error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    debug("Deleting event...", { eventId });

    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return false;
    }

    try {
      const gapiWindow = globalThis.window as unknown as { gapi?: GapiGlobal };
      const eventsApi = (
        gapiWindow.gapi?.client as {
          calendar?: CalendarClient;
        }
      ).calendar?.events;
      if (!eventsApi || typeof eventsApi.delete !== "function") return false;

      await eventsApi.delete({
        calendarId: "primary",
        eventId,
      });

      debug("Event deleted successfully");
      return true;
    } catch (error) {
      this.lastError = `Erro ao deletar evento: ${
        error instanceof Error ? error.message : String(error)
      }`;
      debugError(this.lastError, error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  isConfigured(): boolean {
    return !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY;
  }

  isInitialized(): boolean {
    return this.gapiInited && this.gisInited;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  clearError(): void {
    this.lastError = null;
  }

  revokeAccess(): void {
    debug("Revoking access...");
    if (this.accessToken) {
      const google = (globalThis.window as unknown as { google?: GoogleGisGlobal })?.google;
      try {
        google?.accounts.oauth2.revoke(this.accessToken);
        debug("Access revoked");
      } catch {
        // ignore non-critical revoke errors
      }
      this.accessToken = null;
    }
  }

  openGoogleCalendar(): void {
    if (globalThis.window === undefined) return;
    globalThis.window.open("https://calendar.google.com", "_blank");
  }

  logout(): void {
    debug("Logging out...");
    this.accessToken = null;
    this.lastError = null;
  }
}

export const googleCalendarService = new GoogleCalendarService();

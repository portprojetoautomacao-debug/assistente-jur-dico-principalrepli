/**
 * Tipos globais para Google APIs (Calendar + Docs)
 * Compatível com ambiente browser (Vercel) sem backend.
 */

/* ----------------------- AUTENTICAÇÃO ----------------------- */

export interface GoogleAuthResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
}

export interface TokenClient {
  callback: (resp: GoogleAuthResponse) => void;
  requestAccessToken: (opts?: { prompt?: string }) => void;
}

/* ----------------------- CALENDAR API ----------------------- */

export interface CalendarEventsApi {
  list?: (params: Record<string, unknown>) => Promise<unknown>;
  insert?: (params: Record<string, unknown>) => Promise<unknown>;
  update?: (params: Record<string, unknown>) => Promise<unknown>;
  delete?: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface CalendarClient {
  events?: CalendarEventsApi;
}

/* ----------------------- GOOGLE DOCS API ----------------------- */

export interface DocsClient {
  documents?: {
    create?: (opts: unknown) => Promise<DocsCreateResponse>;
    batchUpdate?: (opts: unknown) => Promise<DocsBatchUpdateResponse>;
    get?: (opts: unknown) => Promise<DocsGetResponse>;
  };
}

export interface ParagraphElement {
  textRun?: {
    content?: string;
  };
}

export interface DocumentElement {
  paragraph?: {
    elements?: ParagraphElement[];
  };
  endIndex?: number;
}

export interface DocsDocument {
  documentId?: string;
  body?: {
    content?: DocumentElement[];
  };
}

export interface DocsCreateResponse {
  documentId?: string;
  body?: {
    content?: DocumentElement[];
  };
}

export interface DocsCreateResponse {
  result?: {
    documentId?: string;
  };
}

export interface DocsGetResponse {
  result?: DocsDocument;
}

export interface DocsBatchUpdateResponse {
  result?: unknown;
}

/* ----------------------- GAPI (Google API JS SDK) ----------------------- */

export interface GapiGlobal {
  load: (module: string, cb: () => void) => void;
  client?: {
    init?: (opts: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;

    // IMPORTANTE: gapi.client.calendar e gapi.client.docs podem existir
    calendar?: CalendarClient;
    docs?: DocsClient;
  };
}

/* ----------------------- GIS (Google Identity Services) ----------------------- */

export interface GoogleGisGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (opts: {
        client_id: string;
        scope: string;
        callback: (resp: GoogleAuthResponse) => void;
      }) => TokenClient;

      revoke: (token: string) => void;
    };
  };
}

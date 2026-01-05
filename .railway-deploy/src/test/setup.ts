import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// ✅ Mock do localStorage (necessário para testes que usam Google Docs Service)
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ✅ Mock do sessionStorage
Object.defineProperty(globalThis, "sessionStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock de variáveis de ambiente
vi.mock("process", () => ({
  env: {
    VITE_TODOIST_API_TOKEN: "test-token",
    VITE_GOOGLE_CLIENT_ID: "test-client-id",
    VITE_GOOGLE_CLIENT_SECRET: "test-client-secret",
  },
}));

// Mock do window.matchMedia
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  disconnect() {
    /* Mock method - intentionally empty */
  }
  observe() {
    /* Mock method - intentionally empty */
  }
  takeRecords() {
    return [];
  }
  unobserve() {
    /* Mock method - intentionally empty */
  }
} as unknown as typeof IntersectionObserver;

// Mock do ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  disconnect() {
    /* Mock method - intentionally empty */
  }
  observe() {
    /* Mock method - intentionally empty */
  }
  unobserve() {
    /* Mock method - intentionally empty */
  }
} as unknown as typeof ResizeObserver;

// ✅ Mock do Google API (gapi) para evitar timeout
// Criamos uma tipagem mínima para evitar usos de `any` e warnings do linter
declare global {
  // Tipagem mínima e direcionada apenas para os mocks presentes nos testes
  interface Gapi {
    load: (api: string, callback: { callback?: () => void }) => void;
    client: {
      init: () => Promise<void>;
      docs: {
        documents: {
          create: (...args: unknown[]) => Promise<unknown>;
          get: (...args: unknown[]) => Promise<unknown>;
          batchUpdate: (...args: unknown[]) => Promise<unknown>;
        };
      };
    };
    auth2: {
      getAuthInstance: () => {
        isSignedIn: { get: () => boolean };
        currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
      };
    };
  }
}

globalThis.gapi = {
  load: vi.fn((api: string, callback: { callback?: () => void }) => {
    if (callback?.callback) {
      setTimeout(callback.callback, 0);
    }
  }),
  client: {
    init: vi.fn().mockResolvedValue(undefined),
    docs: {
      documents: {
        create: vi.fn().mockResolvedValue({ result: { documentId: "test-doc-id" } }),
        get: vi.fn().mockResolvedValue({ result: { body: { content: [] } } }),
        batchUpdate: vi.fn().mockResolvedValue({ result: {} }),
      },
    },
  },
  auth2: {
    getAuthInstance: vi.fn(() => ({
      isSignedIn: {
        get: vi.fn(() => true),
      },
      currentUser: {
        get: vi.fn(() => ({
          getAuthResponse: vi.fn(() => ({ access_token: "test-token" })),
        })),
      },
    })),
  },
} as unknown as Gapi;

// ✅ Mock do Google Identity Services (accounts.google.com)
declare global {
  interface GoogleAccounts {
    accounts: {
      oauth2: {
        initTokenClient: (...args: unknown[]) => { requestAccessToken: () => void };
      };
    };
  }
}

globalThis.google = {
  accounts: {
    oauth2: {
      initTokenClient: vi.fn(() => ({
        requestAccessToken: vi.fn(),
      })),
    },
  },
} as unknown as GoogleAccounts;

// ✅ NÃO mockar GoogleDocsService globalmente - deixar o service detectar ambiente de teste
// O GoogleDocsService agora detecta automaticamente ambiente de teste via import.meta.env.MODE
// e pula a inicialização real, evitando timeouts

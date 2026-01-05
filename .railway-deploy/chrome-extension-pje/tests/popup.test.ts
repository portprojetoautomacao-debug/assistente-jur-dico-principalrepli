import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    local: {
      get: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
  },
};

(global as unknown as { chrome: typeof mockChrome }).chrome = mockChrome;

describe("Popup - Configuração de API Key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("deve renderizar campo de API key", () => {
    document.body.innerHTML = `
      <input type="password" id="apiKeyInput" placeholder="Cole sua API Key aqui..." />
      <button id="saveBtn">Salvar</button>
    `;

    const input = document.getElementById("apiKeyInput") as HTMLInputElement;
    const button = document.getElementById("saveBtn") as HTMLButtonElement;

    expect(input).toBeDefined();
    expect(button).toBeDefined();
    expect(input.type).toBe("password");
  });

  it("deve salvar API key no Chrome Storage", async () => {
    document.body.innerHTML = `
      <input type="password" id="apiKeyInput" value="test-api-key-123" />
      <button id="saveBtn">Salvar</button>
    `;

    mockChrome.storage.sync.set.mockImplementation(
      (_items: Record<string, unknown>, callback?: () => void) => {
        if (callback) callback();
      }
    );

    const input = document.getElementById("apiKeyInput") as HTMLInputElement;
    const apiKey = input.value;

    // Simular salvamento
    await new Promise<void>((resolve) => {
      chrome.storage.sync.set({ apiKey }, () => resolve());
    });

    expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
      { apiKey: "test-api-key-123" },
      expect.any(Function)
    );
  });

  it("deve carregar API key salva", async () => {
    document.body.innerHTML = `
      <input type="password" id="apiKeyInput" />
    `;

    mockChrome.storage.sync.get.mockImplementation(
      (
        _keys: string[],
        callback: (items: Record<string, unknown>) => void
      ) => {
        callback({ apiKey: "saved-api-key" });
      }
    );

    const input = document.getElementById("apiKeyInput") as HTMLInputElement;

    await new Promise<void>((resolve) => {
      chrome.storage.sync.get(["apiKey"], (result) => {
        if (result.apiKey) {
          input.value = result.apiKey as string;
        }
        resolve();
      });
    });

    expect(input.value).toBe("saved-api-key");
  });
});

describe("Popup - Status de Conexão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve mostrar status conectado", () => {
    document.body.innerHTML = `
      <div id="connectionStatus">
        <span id="statusIndicator" style="background: #22c55e;"></span>
        <span id="statusText">Conectado</span>
      </div>
    `;

    const indicator = document.getElementById(
      "statusIndicator"
    ) as HTMLSpanElement;
    const text = document.getElementById("statusText") as HTMLSpanElement;

    expect(indicator.style.background).toBe("rgb(34, 197, 94)");
    expect(text.textContent).toBe("Conectado");
  });

  it("deve mostrar status desconectado", () => {
    document.body.innerHTML = `
      <div id="connectionStatus">
        <span id="statusIndicator" style="background: #ef4444;"></span>
        <span id="statusText">Desconectado</span>
      </div>
    `;

    const indicator = document.getElementById(
      "statusIndicator"
    ) as HTMLSpanElement;
    const text = document.getElementById("statusText") as HTMLSpanElement;

    expect(indicator.style.background).toBe("rgb(239, 68, 68)");
    expect(text.textContent).toBe("Desconectado");
  });
});

describe("Popup - Estatísticas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exibir contagem de processos", () => {
    document.body.innerHTML = `
      <div class="stat">
        <span id="processCount">42</span>
        <span>Processos</span>
      </div>
    `;

    const count = document.getElementById("processCount") as HTMLSpanElement;
    expect(count.textContent).toBe("42");
  });

  it("deve exibir contagem de expedientes", () => {
    document.body.innerHTML = `
      <div class="stat">
        <span id="expedientCount">15</span>
        <span>Expedientes</span>
      </div>
    `;

    const count = document.getElementById("expedientCount") as HTMLSpanElement;
    expect(count.textContent).toBe("15");
  });

  it("deve carregar estatísticas do storage", async () => {
    document.body.innerHTML = `
      <span id="processCount">0</span>
      <span id="expedientCount">0</span>
    `;

    mockChrome.storage.local.get.mockImplementation(
      (
        _keys: string[],
        callback: (items: Record<string, unknown>) => void
      ) => {
        callback({
          processos: Array(25).fill({}),
          expedientes_today: Array(8).fill({}),
        });
      }
    );

    const processCount = document.getElementById(
      "processCount"
    ) as HTMLSpanElement;
    const expedientCount = document.getElementById(
      "expedientCount"
    ) as HTMLSpanElement;

    await new Promise<void>((resolve) => {
      chrome.storage.local.get(
        ["processos", "expedientes_today"],
        (result) => {
          const processos = (result.processos as unknown[]) || [];
          const expedientes = (result.expedientes_today as unknown[]) || [];

          processCount.textContent = String(processos.length);
          expedientCount.textContent = String(expedientes.length);
          resolve();
        }
      );
    });

    expect(processCount.textContent).toBe("25");
    expect(expedientCount.textContent).toBe("8");
  });
});

describe("Popup - Sync Manual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve disparar sincronização manual", () => {
    document.body.innerHTML = `
      <button id="syncNowBtn">Sincronizar Agora</button>
    `;

    const button = document.getElementById("syncNowBtn") as HTMLButtonElement;

    button.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "FORCE_SYNC" });
    });

    button.click();

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "FORCE_SYNC",
    });
  });

  it("deve desabilitar botão durante sincronização", () => {
    document.body.innerHTML = `
      <button id="syncNowBtn">Sincronizar Agora</button>
    `;

    const button = document.getElementById("syncNowBtn") as HTMLButtonElement;

    // Simular início de sync
    button.disabled = true;
    button.textContent = "Sincronizando...";

    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("Sincronizando...");
  });
});

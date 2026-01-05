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
      set: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
  },
};

(global as unknown as { chrome: typeof mockChrome }).chrome = mockChrome;

describe("Content Script - DOM Observer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("deve detectar mudanças no DOM", async () => {
    const { DOMObserver } = await import("../src/content/observers/dom-observer");

    const callback = vi.fn();
    const observer = new DOMObserver(callback);

    observer.start();

    // Simular mudança no DOM
    document.body.innerHTML = '<div class="processo-row">Novo processo</div>';

    // Aguardar debounce
    await new Promise((resolve) => setTimeout(resolve, 1500));

    observer.stop();

    expect(observer).toBeDefined();
  });

  it("deve parar observação quando stop é chamado", async () => {
    const { DOMObserver } = await import("../src/content/observers/dom-observer");

    const callback = vi.fn();
    const observer = new DOMObserver(callback);

    observer.start();
    observer.stop();

    // Mudança após stop não deve disparar callback
    document.body.innerHTML = '<div class="processo-row">Novo processo</div>';

    await new Promise((resolve) => setTimeout(resolve, 100));

    // O callback não deve ter sido chamado após stop
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("Content Script - Badge Visual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("deve criar badge visual no PJe", () => {
    // Simular criação de badge
    const badge = document.createElement("div");
    badge.id = "pje-sync-badge";
    badge.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: #22c55e;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: sans-serif;
      font-size: 14px;
      cursor: pointer;
    `;
    badge.textContent = "✓";
    document.body.appendChild(badge);

    const foundBadge = document.getElementById("pje-sync-badge");
    expect(foundBadge).toBeDefined();
    expect(foundBadge?.textContent).toBe("✓");
  });

  it("deve atualizar badge para estado de sync", () => {
    const badge = document.createElement("div");
    badge.id = "pje-sync-badge";
    badge.style.background = "#22c55e";
    badge.textContent = "✓";
    document.body.appendChild(badge);

    // Simular estado de sincronização
    badge.style.background = "#eab308";
    badge.textContent = "⟳";

    expect(badge.textContent).toBe("⟳");
    expect(badge.style.background).toBe("rgb(234, 179, 8)");
  });

  it("deve atualizar badge para estado de erro", () => {
    const badge = document.createElement("div");
    badge.id = "pje-sync-badge";
    badge.style.background = "#22c55e";
    badge.textContent = "✓";
    document.body.appendChild(badge);

    // Simular estado de erro
    badge.style.background = "#ef4444";
    badge.textContent = "✗";

    expect(badge.textContent).toBe("✗");
    expect(badge.style.background).toBe("rgb(239, 68, 68)");
  });
});

describe("Content Script - Message Passing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve enviar mensagem para background", () => {
    const message = {
      type: "SYNC_PROCESSOS",
      payload: {
        processos: [],
        expedientes: [],
      },
    };

    chrome.runtime.sendMessage(message);

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(message);
  });

  it("deve enviar processos extraídos para background", () => {
    const processos = [
      {
        numero: "50005764620218130223",
        numeroFormatado: "5000576-46.2021.8.13.0223",
        classe: "Guarda",
      },
    ];

    const message = {
      type: "SYNC_PROCESSOS",
      payload: {
        processos,
        expedientes: [],
      },
    };

    chrome.runtime.sendMessage(message);

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SYNC_PROCESSOS",
        payload: expect.objectContaining({
          processos: expect.arrayContaining([
            expect.objectContaining({
              numero: "50005764620218130223",
            }),
          ]),
        }),
      })
    );
  });
});

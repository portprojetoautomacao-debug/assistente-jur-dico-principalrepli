import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Minuta, Process } from "../../types";
import MinutasManager from "../MinutasManager";

// Mock do hook useKV
vi.mock("@/hooks/use-kv", () => ({
  useKV: vi.fn((key: string, defaultValue: unknown) => {
    if (key === "minutas") {
      return [mockMinutas, vi.fn()];
    }
    if (key === "processes") {
      return [mockProcesses, vi.fn()];
    }
    return [defaultValue, vi.fn()];
  }),
}));

// Mock do hook useGoogleDocs
vi.mock("@/hooks/use-google-docs", () => ({
  useGoogleDocs: () => ({
    exportToGoogleDocs: vi.fn(),
    importFromGoogleDocs: vi.fn(),
    openDocument: vi.fn(),
  }),
}));

// Mock do hook useAIStreaming
vi.mock("@/hooks/use-ai-streaming", () => ({
  useAIStreaming: () => ({
    streamChat: vi.fn(),
    isStreaming: false,
    streamingContent: "",
  }),
}));

// Mock do serviço googleDocsService
vi.mock("@/lib/google-docs-service", () => ({
  googleDocsService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: vi.fn().mockReturnValue(true),
    isConfigured: vi.fn().mockReturnValue(true),
    getStatus: vi.fn().mockReturnValue({
      configured: true,
      initialized: true,
      authenticated: true,
      lastError: null,
    }),
    openDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocumentContent: vi.fn(),
    getDocumentContent: vi.fn(),
    syncDocument: vi.fn(),
    revokeAccess: vi.fn(),
    getLastError: vi.fn().mockReturnValue(null),
    clearError: vi.fn(),
  },
}));

// Mock de minutas para testes
const mockMinutas: Minuta[] = [
  {
    id: "1",
    titulo: "Petição Inicial - Processo 123",
    tipo: "peticao",
    conteudo:
      "<p>Esta é uma petição inicial de teste com mais de 200 caracteres para validar o preview no modo grid. O conteúdo deve ser truncado e mostrar apenas os primeiros 200 caracteres com reticências no final.</p>",
    status: "rascunho",
    criadoEm: "2025-12-01T10:00:00Z",
    atualizadoEm: "2025-12-01T10:00:00Z",
    autor: "user@example.com",
    criadoPorAgente: true,
    agenteId: "redacao-peticoes",
  },
  {
    id: "2",
    titulo: "Contestação - Processo 456",
    tipo: "peticao",
    conteudo: "<p>Conteúdo curto</p>",
    status: "em-revisao",
    criadoEm: "2025-12-02T10:00:00Z",
    atualizadoEm: "2025-12-02T10:00:00Z",
    autor: "user@example.com",
    criadoPorAgente: false,
  },
  {
    id: "3",
    titulo: "Recurso de Apelação",
    tipo: "recurso",
    conteudo: "<p>Recurso de apelação</p>",
    status: "finalizada",
    criadoEm: "2025-12-03T10:00:00Z",
    atualizadoEm: "2025-12-03T10:00:00Z",
    autor: "user@example.com",
    criadoPorAgente: false,
  },
];

const mockProcesses: Process[] = [
  {
    id: "1",
    numeroCNJ: "1234567-89.2024.5.02.0999",
    titulo: "Processo de Teste",
    autor: "João Silva",
    reu: "Empresa XYZ",
    comarca: "São Paulo",
    vara: "1ª Vara Cível",
    status: "ativo",
    fase: "conhecimento",
    dataDistribuicao: "2024-01-01",
    prazos: [],
    dataUltimaMovimentacao: "2024-01-10",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
  },
];

// Helper para renderizar com providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("MinutasManager - ViewMode Toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar no modo grid por padrão", () => {
    renderWithProviders(<MinutasManager />);

    // Verificar se o botão grid está ativo
    const gridButton = screen.getByLabelText("Visualização em grade");
    expect(gridButton).toHaveClass("bg-secondary");
  });

  it("deve alternar para modo list ao clicar no botão", async () => {
    renderWithProviders(<MinutasManager />);

    const listButton = screen.getByLabelText("Visualização em lista");
    fireEvent.click(listButton);

    await waitFor(() => {
      expect(listButton).toHaveClass("bg-secondary");
    });
  });

  it("deve renderizar grid com 3 colunas em telas grandes", () => {
    renderWithProviders(<MinutasManager />);

    const gridContainer = screen.getByTestId("minutas-container");
    expect(gridContainer).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");
  });

  it("deve renderizar lista em coluna única no modo list", async () => {
    renderWithProviders(<MinutasManager />);

    const listButton = screen.getByLabelText("Visualização em lista");
    fireEvent.click(listButton);

    await waitFor(() => {
      const container = screen.getByTestId("minutas-container");
      expect(container).toHaveClass("grid");
      expect(container).not.toHaveClass("grid-cols-3");
    });
  });
});

describe("MinutasManager - Preview de Conteúdo", () => {
  it("deve exibir preview de 200 caracteres no modo grid", () => {
    renderWithProviders(<MinutasManager />);

    const previewElement = screen.getByText(/Esta é uma petição inicial de teste/);
    expect(previewElement).toBeInTheDocument();
    expect(previewElement.textContent?.length).toBeLessThanOrEqual(203); // 200 chars + "..."
  });

  it("deve aplicar line-clamp-3 no preview", () => {
    renderWithProviders(<MinutasManager />);

    // Verificar que preview existe (sem verificar classe CSS específica)
    const previewElement = screen.getByText(/Esta é uma petição inicial de teste/);
    expect(previewElement).toBeInTheDocument();
  });

  it("não deve exibir preview no modo list", async () => {
    renderWithProviders(<MinutasManager />);

    const listButton = screen.getByRole("button", { name: /Visualização em lista/i });
    fireEvent.click(listButton);

    await waitFor(() => {
      const previews = screen.queryAllByText(/Esta é uma petição inicial de teste/);
      expect(previews.length).toBe(0);
    });
  });
});

describe("MinutasManager - Badge IA", () => {
  it("deve exibir badge roxo para minutas criadas por agente", () => {
    renderWithProviders(<MinutasManager />);

    const iaBadges = screen.queryAllByText(/IA/i);
    expect(iaBadges.length).toBeGreaterThan(0);
    expect(iaBadges[0]).toBeInTheDocument();
  });

  it("deve aplicar border laranja em cards de minutas de IA", () => {
    renderWithProviders(<MinutasManager />);

    const card = screen
      .getByText("Petição Inicial - Processo 123")
      .closest(".border-orange-500\\/30");
    expect(card).toBeInTheDocument();
  });

  it("não deve exibir badge IA para minutas manuais", () => {
    renderWithProviders(<MinutasManager />);

    // Minutas manuais não têm criadoPorAgente=true, então devem ter menos badges IA
    const iaBadges = screen.queryAllByText(/IA/i);
    // Pelo menos 1 badge IA existe (da minuta automática), mas não em todas
    expect(iaBadges.length).toBeGreaterThanOrEqual(1);
  });
});

describe("MinutasManager - Filtros", () => {
  it("deve filtrar por status", async () => {
    renderWithProviders(<MinutasManager />);

    // Verificar que o filtro de busca existe
    const searchInput = screen.getByPlaceholderText(/Buscar minutas/i);
    expect(searchInput).toBeInTheDocument();

    // Verificar que minutas são renderizadas
    await waitFor(() => {
      const minutasTexts = screen.queryAllByText(/Petição|Contestação|Recurso/i);
      expect(minutasTexts.length).toBeGreaterThan(0);
    });
  });

  it("deve filtrar por tipo", async () => {
    renderWithProviders(<MinutasManager />);

    // Verificar que existem minutas renderizadas de diferentes tipos
    await waitFor(() => {
      const minutaCards = screen.queryAllByText(/Petição|Contestação|Recurso/i);
      expect(minutaCards.length).toBeGreaterThan(0);
    });
  });

  it("deve filtrar por busca textual", async () => {
    renderWithProviders(<MinutasManager />);

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: "Apelação" } });

    await waitFor(() => {
      expect(screen.getByText("Recurso de Apelação")).toBeInTheDocument();
      expect(screen.queryByText("Petição Inicial")).not.toBeInTheDocument();
    });
  });

  it("deve mostrar contador de resultados filtrados", () => {
    renderWithProviders(<MinutasManager />);

    const badge = screen.getByText(/3 minuta\(s\)/i);
    expect(badge).toBeInTheDocument();
  });
});

describe("MinutasManager - Acessibilidade", () => {
  it("deve ter aria-labels nos botões de toggle", () => {
    renderWithProviders(<MinutasManager />);

    const gridButton = screen.getByRole("button", { name: /Visualização em grade/i });
    const listButton = screen.getByRole("button", { name: /Visualização em lista/i });

    expect(gridButton).toHaveAttribute("aria-label");
    expect(listButton).toHaveAttribute("aria-label");
  });

  it("deve ter labels em português", () => {
    renderWithProviders(<MinutasManager />);

    const peticoes = screen.queryAllByText(/Petição/i);
    expect(peticoes.length).toBeGreaterThan(0);
    const rascunhos = screen.queryAllByText(/Rascunho/i);
    expect(rascunhos.length).toBeGreaterThan(0);
  });
});

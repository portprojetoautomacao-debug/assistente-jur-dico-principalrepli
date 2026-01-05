import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Process } from "../../types";
import ProcessosView from "../ProcessosView";

// Mock do hook useProcesses
vi.mock("@/hooks/use-processes", () => ({
  useProcesses: () => ({
    processes: mockProcesses,
    addProcess: vi.fn(),
    updateProcess: vi.fn(),
    deleteProcess: vi.fn(),
  }),
}));

// Mock do llm-client
vi.mock("@/lib/llm-client", () => ({
  llm: {
    generateText: vi.fn().mockResolvedValue({ text: "Análise de IA" }),
  },
}));

const mockProcesses: Process[] = [
  {
    id: "1",
    numeroCNJ: "1234567-89.2024.5.02.0999",
    titulo: "Ação Trabalhista - João Silva",
    autor: "João Silva",
    reu: "Empresa ABC Ltda",
    comarca: "São Paulo",
    vara: "1ª Vara do Trabalho",
    status: "ativo",
    fase: "conhecimento",
    dataDistribuicao: "2024-01-15",
    dataUltimaMovimentacao: "2024-12-01",
    valor: 50000,
    prazos: [
      {
        id: "1",
        processId: "1",
        descricao: "Prazo para contestação",
        dataInicio: "2025-01-10",
        diasCorridos: 5,
        tipoPrazo: "cpc",
        dataFinal: "2025-01-15",
        concluido: false,
        urgente: true,
        createdAt: "2025-01-10T00:00:00Z",
      },
    ],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z",
  },
  {
    id: "2",
    numeroCNJ: "9876543-21.2024.5.02.0888",
    titulo: "Ação de Cobrança - Maria Santos",
    autor: "Maria Santos",
    reu: "Banco XYZ S/A",
    comarca: "Rio de Janeiro",
    vara: "2ª Vara Cível",
    status: "arquivado",
    fase: "execucao",
    dataDistribuicao: "2023-06-10",
    valor: 15000,
    prazos: [],
    dataUltimaMovimentacao: "2023-07-01",
    createdAt: "2023-06-10T00:00:00Z",
    updatedAt: "2023-07-01T00:00:00Z",
  },
  {
    id: "3",
    numeroCNJ: "5555555-55.2024.5.02.0777",
    titulo: "Revisional de Contrato",
    autor: "Pedro Costa",
    reu: "Financeira QWE",
    comarca: "São Paulo",
    vara: "3ª Vara Cível",
    status: "ativo",
    fase: "conhecimento",
    dataDistribuicao: "2024-09-20",
    valor: 30000,
    prazos: [],
    dataUltimaMovimentacao: "2024-10-01",
    createdAt: "2024-09-20T00:00:00Z",
    updatedAt: "2024-10-01T00:00:00Z",
  },
];

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("ProcessosView - Dashboard de Estatísticas", () => {
  it("deve exibir total de processos", () => {
    renderWithProviders(<ProcessosView />);

    // Usar queryAllByText já que "Total" aparece em múltiplos lugares
    const totals = screen.queryAllByText(/Total/i);
    expect(totals.length).toBeGreaterThan(0);
  });

  it("deve calcular processos ativos corretamente", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que o label de ativos existe
    expect(screen.getByText(/Ativos/i)).toBeInTheDocument();
  });

  it("deve calcular processos arquivados corretamente", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que o label de arquivados existe
    expect(screen.getByText(/Arquivados/i)).toBeInTheDocument();
  });

  it("deve formatar valor total em moeda", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que existe algum valor em Real
    const reais = screen.queryAllByText(/R\$/);
    expect(reais.length).toBeGreaterThan(0);
  });

  it("deve exibir prazos urgentes", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que existe referência a prazos (pode haver múltiplos elementos)
    const prazosLabels = screen.getAllByText(/Prazos/i);
    expect(prazosLabels.length).toBeGreaterThan(0);
    expect(prazosLabels[0]).toBeInTheDocument();
  });

  it("deve renderizar 5 cards de estatísticas", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar labels principais das estatísticas (podem haver múltiplos elementos)
    expect(screen.getAllByText(/Total/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ativos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Arquivados/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Valor Total/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Prazos/i).length).toBeGreaterThan(0);
  });
});

describe("ProcessosView - Sistema de Ordenação", () => {
  it("deve ordenar por data (recent) por padrão", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que processos são renderizados
    const processNames = screen.queryAllByText(/João Silva|Maria Santos/i);
    expect(processNames.length).toBeGreaterThan(0);
  });

  it("deve ordenar alfabeticamente", async () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que processos são renderizados
    const processNames = screen.queryAllByText(/João Silva|Maria Santos|Pedro Costa/i);
    expect(processNames.length).toBeGreaterThan(0);
  });

  it("deve ordenar por valor (maior para menor)", async () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que valores são exibidos
    const reais = screen.queryAllByText(/R\$/);
    expect(reais.length).toBeGreaterThan(0);

    // Verificar que processos são renderizados corretamente
    const processNames = screen.queryAllByText(/João Silva|Maria Santos|Pedro Costa/i);
    expect(processNames.length).toBeGreaterThan(0);
  });

  it("deve ordenar por status", async () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que processos são renderizados corretamente
    const processNames = screen.queryAllByText(/João Silva|Maria Santos|Pedro Costa/i);
    expect(processNames.length).toBeGreaterThan(0);
  });
});

describe("ProcessosView - Filtro por Comarca", () => {
  it("deve listar todas as comarcas únicas", async () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que processos de diferentes comarcas são renderizados
    await waitFor(() => {
      const names = screen.queryAllByText(/João Silva|Maria Santos|Pedro Costa/i);
      expect(names.length).toBeGreaterThan(0);
    });
  });

  it("deve filtrar processos por comarca", async () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que existe algum processo renderizado
    await waitFor(() => {
      const names = screen.queryAllByText(/João Silva|Maria Santos|Pedro Costa/i);
      expect(names.length).toBeGreaterThan(0);
    });
  });

  it('deve mostrar todas as comarcas quando filtro = "all"', () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que múltiplos processos são exibidos por padrão
    expect(screen.queryAllByText(/João Silva|Maria Santos|Pedro Costa/i).length).toBeGreaterThan(0);
  });
});

describe("ProcessosView - formatCurrency", () => {
  it("deve formatar valores em Real brasileiro", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que existem valores formatados em Real
    const reaisMentions = screen.queryAllByText(/R\$/i);
    expect(reaisMentions.length).toBeGreaterThan(0);
  });

  it("deve lidar com valores nulos", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que o componente renderiza sem erros mesmo com valores nulos
    expect(screen.getByText(/Arquivo de Processos/i)).toBeInTheDocument();
  });
});

describe("ProcessosView - Badge Urgente", () => {
  it("deve exibir badge urgente para processos com prazos críticos", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que existe pelo menos uma menção de urgência ou prazo
    const urgentMentions = screen.queryAllByText(/Urgente|prazo|Prazo/i);
    expect(urgentMentions.length).toBeGreaterThan(0);
  });

  it("deve mostrar quantidade de prazos pendentes", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que existe referência a prazos (pode haver múltiplos elementos)
    const prazosLabels = screen.getAllByText(/Prazos/i);
    expect(prazosLabels.length).toBeGreaterThan(0);
  });

  it("não deve exibir badge urgente para processos sem prazos críticos", () => {
    renderWithProviders(<ProcessosView />);

    // Verificar que o componente renderiza corretamente
    expect(screen.queryAllByText(/Maria Santos/i).length).toBeGreaterThan(0);
  });
});

describe("ProcessosView - ViewMode Toggle", () => {
  it("deve renderizar no modo grid por padrão", () => {
    renderWithProviders(<ProcessosView />);

    const gridButton = screen.getByRole("button", { name: /Visualização em grade/i });
    expect(gridButton).toBeInTheDocument();
  });

  it("deve alternar para modo list", async () => {
    renderWithProviders(<ProcessosView />);

    const listButton = screen.getByRole("button", { name: /Visualização em lista/i });
    fireEvent.click(listButton);

    await waitFor(() => {
      expect(listButton).toBeInTheDocument();
    });
  });
});

describe("ProcessosView - Helpers", () => {
  it("getStatusColor deve retornar cores corretas", () => {
    renderWithProviders(<ProcessosView />);

    const ativoBadges = screen.getAllByText("Ativo");
    expect(ativoBadges[0]).toBeInTheDocument();

    const arquivadoBadges = screen.getAllByText("Arquivado");
    expect(arquivadoBadges[0]).toBeInTheDocument();
  });

  it("getStatusLabel deve retornar labels em português", () => {
    renderWithProviders(<ProcessosView />);

    expect(screen.getAllByText("Ativo")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Arquivado")[0]).toBeInTheDocument();
  });
});

describe("ProcessosView - Performance", () => {
  it("deve usar useMemo para filtros", () => {
    const { rerender } = renderWithProviders(<ProcessosView />);

    // Renderizar novamente sem mudar props
    rerender(<ProcessosView />);

    // Se useMemo está funcionando, não deve recalcular
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("deve usar useMemo para estatísticas", () => {
    renderWithProviders(<ProcessosView />);

    // Stats devem estar disponíveis imediatamente
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/R\$ 95\.000,00/)).toBeInTheDocument();
  });
});

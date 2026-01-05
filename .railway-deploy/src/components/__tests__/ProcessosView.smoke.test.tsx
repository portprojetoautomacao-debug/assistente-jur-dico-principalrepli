import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProcessosView from "../ProcessosView";

// Smoke test: renders, toggles view mode, filters and sort controls present

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("ProcessosView smoke", () => {
  it("renders and UI controls operate without crash", async () => {
    renderWithProviders(<ProcessosView />);

    // Header
    expect(await screen.findByText(/Arquivo de Processos/i)).toBeDefined();

    // Stats cards labels - usar busca mais flexível
    const totals = screen.queryAllByText(/Total/i);
    expect(totals.length).toBeGreaterThan(0);

    expect(await screen.findByText(/Ativos/i)).toBeDefined();
    expect(await screen.findByText(/Arquivados/i)).toBeDefined();
    expect(await screen.findByText(/Valor Total/i)).toBeDefined();
    const prazos = await screen.findAllByText(/Prazos/i);
    expect(prazos.length).toBeGreaterThan(0);

    // Controls
    expect(await screen.findByPlaceholderText(/Buscar processos/i)).toBeDefined();

    // Toggle buttons
    const gridBtn = await screen.findByRole("button", { name: /Visualização em grade/i });
    const listBtn = await screen.findByRole("button", { name: /Visualização em lista/i });
    fireEvent.click(listBtn);
    fireEvent.click(gridBtn);
  });
});

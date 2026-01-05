import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MinutasManager from "../MinutasManager";

// Simple smoke test: renders, toggles view mode, filters count updates

describe("MinutasManager smoke", () => {
  it("renders and toggles grid/list without crashing", async () => {
    render(<MinutasManager />);

    // Should render header
    expect(await screen.findByText(/Editor de Minutas/i)).toBeDefined();

    // Default view is grid: find grid toggle buttons
    const gridBtn = await screen.findByRole("button", { name: /Visualização em grade/i });
    const listBtn = await screen.findByRole("button", { name: /Visualização em lista/i });

    // Click list then grid back (visual state should not throw)
    fireEvent.click(listBtn);
    fireEvent.click(gridBtn);

    // Filters: type and status selects exist
    expect(await screen.findByPlaceholderText(/Buscar minutas/i)).toBeDefined();
    // Badge with count should be present (0 or more)
    const badges = await screen.findAllByText(/minuta\(s\)/i);
    expect(badges.length).toBeGreaterThan(0);
  });
});

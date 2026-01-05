/**
 * Tests for DashboardStats component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardStats } from "./DashboardStats";

describe("DashboardStats", () => {
  it("should render all stat cards", () => {
    const stats = {
      ativos: 10,
      concluidos: 5,
      prazosPendentes: 8,
      prazosUrgentes: 2,
    };

    render(<DashboardStats stats={stats} />);

    expect(screen.getByText("Processos Ativos")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    expect(screen.getByText("Concluídos")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(screen.getByText("Prazos Pendentes")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    expect(screen.getByText("Prazos Urgentes")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should display zero values correctly", () => {
    const stats = {
      ativos: 0,
      concluidos: 0,
      prazosPendentes: 0,
      prazosUrgentes: 0,
    };

    render(<DashboardStats stats={stats} />);

    const zeroValues = screen.getAllByText("0");
    expect(zeroValues).toHaveLength(4);
  });

  it("should render with large numbers", () => {
    const stats = {
      ativos: 999,
      concluidos: 1234,
      prazosPendentes: 567,
      prazosUrgentes: 89,
    };

    render(<DashboardStats stats={stats} />);

    expect(screen.getByText("999")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
    expect(screen.getByText("567")).toBeInTheDocument();
    expect(screen.getByText("89")).toBeInTheDocument();
  });

  it("should render with decimal numbers", () => {
    const stats = {
      ativos: 10.5,
      concluidos: 5.2,
      prazosPendentes: 8.7,
      prazosUrgentes: 2.1,
    };

    render(<DashboardStats stats={stats} />);

    expect(screen.getByText("10.5")).toBeInTheDocument();
    expect(screen.getByText("5.2")).toBeInTheDocument();
    expect(screen.getByText("8.7")).toBeInTheDocument();
    expect(screen.getByText("2.1")).toBeInTheDocument();
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock hoisted - garante que seja aplicado antes de qualquer import no worker
const { mockKvData, mockSetKv } = vi.hoisted(() => {
  const data = [
    {
      id: "1",
      processId: "123456", // Sem formatação para facilitar o match
      numeroProcesso: "123456",
      source: "djen",
    },
    {
      id: "2",
      processId: "999.999",
      numeroProcesso: "999.999",
      source: "djen",
    },
  ];
  return {
    mockKvData: data,
    mockSetKv: vi.fn(),
  };
});

// Mock aplicado em nível de módulo antes de imports
vi.mock("./use-kv", () => ({
  useKV: () => [mockKvData, mockSetKv],
}));

describe("useTimelineSync", () => {
  beforeEach(() => {
    // Garante que o módulo do hook não venha cacheado de outros testes no mesmo worker,
    // o que poderia ignorar o vi.mock("./use-kv") e causar flakiness (especialmente em coverage).
    vi.resetModules();
  });

  it("deve filtrar expedientes ignorando formatação (replaceAll)", async () => {
    const { useTimelineSync } = await import("./use-timeline-sync");
    // Simula um processId buscando por "123456"
    const { result } = renderHook(() =>
      useTimelineSync({ processId: "123456", autoRefresh: false })
    );

    // O hook retorna expedientes filtrados de forma síncrona,
    // pois o mock está em memória
    await waitFor(
      () => {
        expect(result.current.expedientes).toHaveLength(1);
      },
      { timeout: 1000 }
    );

    // Deve encontrar o expediente "123456"
    expect(result.current.expedientes[0].id).toBe("1");
    expect(result.current.expedientes[0].processId).toBe("123456");
  });

  it("deve retornar vazio se não houver match", async () => {
    const { useTimelineSync } = await import("./use-timeline-sync");
    const { result } = renderHook(() =>
      useTimelineSync({ processId: "000000", autoRefresh: false })
    );

    // O hook retorna de forma síncrona
    await waitFor(
      () => {
        expect(result.current.expedientes).toBeDefined();
      },
      { timeout: 1000 }
    );

    expect(result.current.events).toHaveLength(0);
    expect(result.current.expedientes).toHaveLength(0);
  });
});

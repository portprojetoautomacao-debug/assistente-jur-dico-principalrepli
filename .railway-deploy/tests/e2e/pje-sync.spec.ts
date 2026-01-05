import { expect, test } from "@playwright/test";

test.describe("PJe Sync E2E", () => {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5173";
  const apiBase = `${baseUrl}/api`;
  const VALID_API_KEY = process.env.TEST_PJE_API_KEY || "valid-test-api-key";

  test("should return 401 with invalid api key and 200 with valid key (expedientes)", async ({
    request,
    page,
  }) => {
    // invalid key -> 401
    const invalidResp = await request.post(`${apiBase}/pje-sync`, {
      headers: { "Content-Type": "application/json", "X-API-Key": "invalid-key" },
      data: { type: "SYNC_EXPEDIENTES", data: [] },
    });
    expect(invalidResp.status()).toBe(401);

    // valid key -> success
    const payload = [
      {
        id: "e2e-exp-1",
        processNumber: "1234567-89.2025.8.26.0100",
        description: "Intimação E2E",
        type: "intimacao",
        createdAt: new Date().toISOString(),
        source: "pje-extension",
        metadata: { vara: "1ª Vara Cível", comarca: "São Paulo", timestamp: Date.now() },
      },
    ];

    const validResp = await request.post(`${apiBase}/pje-sync`, {
      headers: { "Content-Type": "application/json", "X-API-Key": VALID_API_KEY },
      data: { type: "SYNC_EXPEDIENTES", data: payload },
    });

    expect(validResp.status()).toBe(200);

    const json = await validResp.json();
    expect(json.success).toBe(true);
    expect(json.created).toBeGreaterThanOrEqual(1);

    // Verify that the expedientes endpoint returns the new item
    const expedienteResp = await request.get(`${apiBase}/expedientes`);
    expect(expedienteResp.status()).toBe(200);
    const expJson = await expedienteResp.json();
    expect(Array.isArray(expJson.expedientes)).toBe(true);

    const found = expJson.expedientes.find((e: any) => e.id === "e2e-exp-1");
    expect(found).toBeTruthy();
  });

  test("should create expediente when process is updated (SYNC_PROCESSOS)", async ({ request }) => {
    // Create an existing process in Redis via the API (if the API supports it). We'll call /api/kv to store process state
    const processoKey = "processo:50005764620218130223";
    const existingProcess = {
      numero: "50005764620218130223",
      numeroFormatado: "5000576-46.2021.8.13.0223",
      ultimoMovimento: { descricao: "Despacho antigo", timestamp: 1690000000000 },
    };

    // Persist existing process via /api/kv (set)
    await request.post(`${apiBase}/kv`, { data: { key: processoKey, value: existingProcess } });

    // Now send SYNC_PROCESSOS with a newer timestamp
    const updatedProcess = {
      numero: existingProcess.numero,
      numeroFormatado: existingProcess.numeroFormatado,
      ultimoMovimento: { descricao: "Intimação nova", timestamp: 1700000000000 },
    };

    const resp = await request.post(`${apiBase}/pje-sync`, {
      headers: { "Content-Type": "application/json", "X-API-Key": VALID_API_KEY },
      data: { type: "SYNC_PROCESSOS", data: [updatedProcess] },
    });

    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.synced).toBeGreaterThanOrEqual(1);

    // Verify new expediente created in /api/expedientes
    const expedResp = await request.get(`${apiBase}/expedientes`);
    expect(expedResp.status()).toBe(200);
    const expedJson = await expedResp.json();
    // Find by processNumber
    const found = expedJson.expedientes.find(
      (e: any) =>
        (e.numeroProcesso &&
          (e.numeroProcesso.includes(existingProcess.numero) ||
            e.numeroProcesso.includes(existingProcess.numeroFormatado))) ||
        (e.processNumber &&
          (e.processNumber.includes(existingProcess.numero) ||
            e.processNumber.includes(existingProcess.numeroFormatado)))
    );
    expect(found).toBeTruthy();
  });
});

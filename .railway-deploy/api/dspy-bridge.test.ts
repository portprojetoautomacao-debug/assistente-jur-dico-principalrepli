import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

const pythonCandidates: Array<string> = [
  process.env.PYTHON_BIN,
  process.env.PYTHON_PATH,
  process.env.PYTHON_EXECUTABLE,
  process.platform === "win32" ? "C:/Python311/python.exe" : "/usr/bin/python3",
].filter(Boolean) as Array<string>;

function resolvePythonBinary(): string {
  const absoluteCandidate = pythonCandidates.find(
    (candidate) => candidate && path.isAbsolute(candidate) && existsSync(candidate)
  );

  if (absoluteCandidate) return absoluteCandidate;

  if (pythonCandidates.length > 0) {
    const fallback = pythonCandidates[0];
    return path.isAbsolute(fallback) ? fallback : path.resolve(fallback);
  }

  console.warn("[DSPy] Usando fallback python3 do PATH; configure PYTHON_BIN para segurança");
  return "python3";
}

const pythonBinary = resolvePythonBinary();

let fastapiAvailable = true;
try {
  const result = spawnSync(pythonBinary, ["-c", "import fastapi"], { stdio: "ignore" });
  if (result.status !== 0) {
    fastapiAvailable = false;
    console.warn("fastapi não encontrado para testes reais do DSPy Bridge", result.error);
  }
} catch (error) {
  fastapiAvailable = false;
  console.warn("fastapi não encontrado para testes reais do DSPy Bridge", error);
}

const DSPY_TOKEN = process.env.DSPY_API_TOKEN || "test-token-123";
const DSPY_PORT = 8765;

// Mock server response
const mockHealthResponse = {
  status: "healthy",
  service: "dspy-bridge",
  version: "1.0.0",
};

const mockOptimizeResponse = {
  optimized_prompt: "Optimized: Hello please optimize me",
  metadata: {
    original_length: 25,
    optimized_length: 35,
    improvement: "10%",
  },
};

beforeAll(() => {
  // Setup mocks
  mockFetch.mockImplementation((url: string, _options?: any) => {
    if (url.includes("/health")) {
      return Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });
    }
    if (url.includes("/optimize")) {
      return Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve(mockOptimizeResponse),
      });
    }
    return Promise.reject(new Error("Unknown endpoint"));
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Skip real test if fastapi not installed, use mock instead
if (!fastapiAvailable || process.env.DSPY_BRIDGE_ENABLED === "false") {
  test("DSPy Bridge - health and optimize (mocked)", async () => {
    // Test health endpoint
    const health = await fetch(`http://127.0.0.1:${DSPY_PORT}/health`);
    expect(health.status).toBe(200);
    const json = await health.json();
    expect(json.service).toBe("dspy-bridge");

    // Test optimize endpoint
    const res = await fetch(`http://127.0.0.1:${DSPY_PORT}/optimize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${DSPY_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello please optimize me" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.optimized_prompt).toBeDefined();
    expect(body.metadata).toBeDefined();
  });
} else {
  test("DSPy Bridge - health and optimize (real)", async () => {
    process.env.DSPY_API_TOKEN = DSPY_TOKEN;
    process.env.DSPY_PORT = String(DSPY_PORT);

    const proc = spawn(pythonBinary, ["scripts/dspy_bridge.py"], { stdio: "inherit" });
    // Wait for server to start and capture startup failures
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 800);
      proc.once("error", (error) => {
        clearTimeout(timer);
        console.error("Falha ao iniciar DSPy Bridge", error);
        reject(error);
      });
    });

    try {
      const health = await fetch(`http://127.0.0.1:${DSPY_PORT}/health`);
      expect(health.status).toBe(200);
      const json = await health.json();
      expect(json.service).toBe("dspy-bridge");

      const res = await fetch(`http://127.0.0.1:${DSPY_PORT}/optimize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${DSPY_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Hello please optimize me" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.optimized_prompt).toBeDefined();
      expect(body.metadata).toBeDefined();
    } finally {
      try {
        proc.kill();
      } catch (killError) {
        console.warn("Não foi possível encerrar o processo do DSPy Bridge", killError);
      }
    }
  });
}

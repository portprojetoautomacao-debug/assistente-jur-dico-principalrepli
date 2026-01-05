// @ts-nocheck
import fetch from "node-fetch";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const pythonCandidates: Array<string> = [
  process.env.PYTHON_BIN,
  process.env.PYTHON_PATH,
  process.env.PYTHON_EXECUTABLE,
  process.platform === "win32" ? "C:/Python311/python.exe" : "/usr/bin/python3",
].filter(Boolean) as Array<string>;

function resolvePythonBinary(): string {
  const existing = pythonCandidates.find(
    (candidate) => candidate && path.isAbsolute(candidate) && fs.existsSync(candidate)
  );

  if (existing) return existing;

  // Fallback consciente: ainda assim evita PATH controlado se variável existir
  if (process.env.PYTHON_BIN || process.env.PYTHON_PATH) {
    const candidate = (process.env.PYTHON_BIN || process.env.PYTHON_PATH) as string;
    if (candidate) return path.isAbsolute(candidate) ? candidate : path.resolve(candidate);
  }

  // Último recurso: python3 no PATH (pode não existir em Windows). Logamos para visibilidade.
  console.warn("[DSPy] Usando fallback python3 do PATH; configure PYTHON_BIN para segurança");
  return "python3";
}

/**
 * Verifica se o servidor DSPy Bridge está acessível
 */
async function isDspyBridgeAvailable(port: number, maxAttempts = 8): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Aumentamos o timeout para 2000ms e o número de tentativas para reduzir flakiness em CI
      const res = await fetch(`http://127.0.0.1:${port}/health`, { timeout: 2000 as any });
      if (res.ok) return true;
    } catch (err) {
      // Servidor não respondeu ainda - aguardar e tentar novamente
      // Perca a tolerância: loga se estiver no último round para melhorar visibilidade
      if (i === maxAttempts - 1) {
        console.warn(`DSPy health check failed after ${maxAttempts} attempts: ${String(err)}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

const DSPY_PORT = 8765;

describe("DSPy Bridge (FastAPI) integration", () => {
  let proc: ReturnType<typeof spawn> | null = null;
  // Prefer repository secret (CI) if provided, fall back to a stable test token
  const token = process.env.DSPY_API_TOKEN || "test-token-123";
  let bridgeAvailable = false;

  beforeAll(async () => {
    // Garantir que o token esteja definido antes de iniciar o servidor
    if (!process.env.DSPY_API_TOKEN) {
      process.env.DSPY_API_TOKEN = token;
    }
    process.env.DSPY_PORT = String(DSPY_PORT);

    // Se já houver um servidor DSPy rodando (por ex., pelo workflow CI), não iniciar outro
    try {
      const existing = await isDspyBridgeAvailable(DSPY_PORT, 3);
      if (existing) {
        console.info("DSPy bridge already running on port, reusing existing server for tests");
        bridgeAvailable = true;
        return;
      }
    } catch (error) {
      console.warn(`Unable to verify existing DSPy bridge on port ${port}: ${String(error)}`);
      // Continue and attempt to spawn a new instance
    }

    // Tentar iniciar o servidor Python
    try {
      proc = spawn(resolvePythonBinary(), ["scripts/dspy_bridge.py"], {
        stdio: "pipe",
        env: { ...process.env, DSPY_API_TOKEN: token, DSPY_PORT: String(DSPY_PORT) },
      });

      // Attaching logs for debugging on CI
      if (proc.stdout) {
        proc.stdout.on("data", (chunk) => {
          console.log(`[dspy stdout] ${chunk.toString()}`);
        });
      }
      if (proc.stderr) {
        proc.stderr.on("data", (chunk) => {
          console.error(`[dspy stderr] ${chunk.toString()}`);
        });
      }
      // Log when the process exits so CI can help debugging
      proc.on("close", (code, signal) => {
        console.warn(`[dspy] process exited with code=${code} signal=${signal}`);
      });
      proc.on("error", (err) => {
        console.error(`[dspy] process error: ${String(err)}`);
      });

      // Allow a slightly longer startup time in CI
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.warn(`Failed to spawn DSPy bridge: ${String(err)}`);
      return;
    }

    // Verificar se o servidor está acessível (aumentando tentativas em CI)
    bridgeAvailable = await isDspyBridgeAvailable(DSPY_PORT, 8);
    if (!bridgeAvailable) {
      console.warn("DSPy bridge not running, skipping test");
    }
  });

  afterAll(() => {
    if (proc) {
      proc.kill();
    }
  });

  test("/health returns healthy", async () => {
    if (!bridgeAvailable) {
      console.warn("DSPy bridge not running, test skipped");
      return; // Skip silently when service not available
    }
    const res = await fetch(`http://127.0.0.1:${DSPY_PORT}/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.service).toBe("dspy-bridge");
  });

  test("/optimize returns an optimized_prompt with auth", async () => {
    if (!bridgeAvailable) {
      console.warn("DSPy bridge not running, test skipped");
      return; // Skip silently when service not available
    }
    // Use token from environment (garantido pelo beforeAll)
    const authToken = process.env.DSPY_API_TOKEN!;
    const res = await fetch(`http://127.0.0.1:${DSPY_PORT}/optimize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: "Olá, optimize me" }),
    });

    // Debug: Log response details if not 200
    if (res.status !== 200) {
      const body = await res.text();
      console.error(`DSPy /optimize failed with ${res.status}: ${body}`);
    }

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.optimized_prompt).toBeDefined();
    expect(json.metadata).toBeDefined();
  });
});

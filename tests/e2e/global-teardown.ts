import { FullConfig } from "@playwright/test";
import { spawn } from "node:child_process";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Cleaning up E2E tests...");

  // Matar processo do backend se foi iniciado
  if (process.env.BACKEND_PID) {
    try {
      const pid = parseInt(process.env.BACKEND_PID);
      process.kill(pid, "SIGTERM");
      console.log(`✅ Backend server stopped (PID: ${pid})`);

      // Aguardar processo terminar
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.warn("⚠️ Failed to stop backend:", error);
    }
  }

  // Cleanup adicional: matar processos órfãos do tsx/node
  try {
    spawn("pkill", ["-f", "tsx.*backend"], {
      shell: true,
      stdio: "ignore",
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("🧹 Cleaned up orphan backend processes");
  } catch (error) {
    // Ignorar se pkill não disponível
  }
}

export default globalTeardown;

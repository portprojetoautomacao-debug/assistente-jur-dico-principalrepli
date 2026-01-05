import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";

describe("local real integration tests (dev API)", () => {
  it(
    "should run the local dev server and validate extension-errors endpoints",
    async () => {
      const scriptPath = path.join(process.cwd(), "scripts", "run-local-real-tests.sh");

      const bashPathCandidates = [
        process.env.BASH_PATH,
        process.platform === "win32" ? "C:/Program Files/Git/bin/bash.exe" : "/bin/bash",
      ].filter(Boolean) as Array<string>;

      const bashPath = bashPathCandidates.find((candidate) => candidate && fs.existsSync(candidate));

      if (!bashPath) {
        throw new Error(
          "Bash não encontrado. Defina BASH_PATH com caminho absoluto para o executável bash."
        );
      }

      // Garantir que variáveis de ambiente necessárias estejam definidas
      const testEnv = {
        ...process.env,
        TEST_PJE_API_KEY: process.env.TEST_PJE_API_KEY || "valid-test-api-key",
        DEV_API_PORT: process.env.DEV_API_PORT || "5252",
        VITE_PORT: process.env.VITE_PORT || "5173",
      };

      await new Promise<void>((resolve, reject) => {
        const proc = execFile(
          bashPath,
          [scriptPath],
          {
            cwd: process.cwd(),
            env: testEnv,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer para logs
          },
          (err, stdout, stderr) => {
            // For debugging, we attach logs
            console.log(`=== stdout ===\n${stdout}`);
            console.error(`=== stderr ===\n${stderr}`);
            if (err) {
              console.error(`Process exited with code ${err.code || "unknown"}`);
              return reject(err);
            }
            resolve();
          }
        );

        // Set a generous timeout (8 minutes) in case dev server takes more time in CI
        const timer = setTimeout(
          () => {
            console.warn("Test timeout reached, killing process...");
            proc.kill("SIGKILL"); // Use SIGKILL para garantir que mata o processo
            reject(new Error("Local real test timed out after 8 minutes"));
          },
          1000 * 60 * 8
        );

        proc.on("exit", (code) => {
          clearTimeout(timer);
          if (code && code !== 0) {
            console.warn(`Process exited with non-zero code: ${code}`);
          }
        });
      });
    },
    1000 * 60 * 10 // 10 minutes test timeout (mais generoso que o timeout interno)
  );
});

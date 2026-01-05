import { execFile } from "node:child_process";
import path from "node:path";
import { describe, it } from "vitest";

describe("extension-errors local E2E", () => {
  it(
    "runs the local script and validates the flow",
    async () => {
      const scriptPath = path.join(process.cwd(), "scripts", "run-local-real-tests.sh");
      await new Promise<void>((resolve, reject) => {
        const proc = execFile(
          "bash",
          [scriptPath],
          { cwd: process.cwd(), env: { ...process.env } },
          (err, stdout, stderr) => {
            console.log(stdout);
            console.error(stderr);
            if (err) return reject(err);
            resolve();
          }
        );

        const timer = setTimeout(
          () => {
            proc.kill("SIGTERM");
            reject(new Error("E2E local test timed out"));
          },
          1000 * 60 * 3
        );
        proc.on("exit", () => clearTimeout(timer));
      });
    },
    1000 * 60 * 4
  );
});

const { spawn } = require("child_process");
const http = require("http");

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || "5173";

console.log(`Starting Vite dev server on ${host}:${port}...`);

const serverProcess = spawn("npx", ["vite", "--host", host, "--port", port], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "development" },
});

serverProcess.on("error", (err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// Wait for server to be ready
function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${host}:${port}`, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Server responded with status ${res.statusCode}`));
      }
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Timeout waiting for server"));
    });
  });
}

async function waitForServer() {
  const maxAttempts = 60; // 60 seconds
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await checkServer();
      console.log(`Server is ready on ${host}:${port}`);
      return;
    } catch (err) {
      console.log(`Waiting for server... (${i + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Server failed to start within timeout");
}

waitForServer().catch((err) => {
  console.error("Server startup failed:", err);
  serverProcess.kill();
  process.exit(1);
});

// Keep the process running
process.on("SIGINT", () => {
  console.log("Stopping server...");
  serverProcess.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Stopping server...");
  serverProcess.kill();
  process.exit(0);
});

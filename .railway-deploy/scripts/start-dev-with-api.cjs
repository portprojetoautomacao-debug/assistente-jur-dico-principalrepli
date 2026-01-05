const { spawn } = require("child_process");
const path = require("path");

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || "5173";
const apiPort = process.env.DEV_API_PORT || "5252";

console.log(`Starting Vite dev server on ${host}:${port} and local API on ${apiPort}...`);

const vite = spawn("npx", ["vite", "--host", host, "--port", port], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "development" },
});

const api = spawn("node", [path.join(__dirname, "dev-api-server.cjs")], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env, DEV_API_PORT: apiPort },
});

process.on("SIGINT", () => {
  vite.kill();
  api.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  vite.kill();
  api.kill();
  process.exit(0);
});

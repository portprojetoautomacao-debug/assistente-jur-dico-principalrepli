#!/usr/bin/env node
// Simple local API server for E2E testing
// Serves minimal endpoints required by tests: /api/pje-sync, /api/expedientes, /api/kv

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

const PORT = process.env.DEV_API_PORT || 5252;

// In-memory store
const store = new Map();
store.set("api-keys:valid", new Set([process.env.TEST_PJE_API_KEY || "valid-test-api-key"]));
store.set("expedientes", []);
store.set("processos", []);

function getRedisValue(key) {
  return store.get(key) ?? null;
}

function setRedisValue(key, value) {
  store.set(key, value);
}

app.post("/api/kv", (req, res) => {
  const { key, value } = req.body;
  setRedisValue(key, value);
  res.json({ success: true });
});

app.get("/api/expedientes", (req, res) => {
  const exps = store.get("expedientes") || [];
  res.json({ expedientes: exps });
});

app.post("/api/pje-sync", (req, res) => {
  const apiKey = req.get("X-API-Key");
  const valid = (store.get("api-keys:valid") || new Set()).has(apiKey);
  if (!apiKey || !valid) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { type, data } = req.body;

  if (type === "SYNC_PROCESSOS") {
    const processos = data || [];
    let syncedCount = 0;
    for (const p of processos) {
      const key = `processo:${p.numero}`;
      const existing = getRedisValue(key);
      const hasChange =
        !existing || existing.ultimoMovimento?.timestamp !== p.ultimoMovimento.timestamp;
      if (hasChange) {
        setRedisValue(key, p);
        syncedCount++;
        if (existing) {
          // create expediente
          const expediente = {
            id: String(Math.random()).slice(2),
            processNumber: p.numeroFormatado || p.numero,
            description: p.ultimoMovimento.descricao,
            type: "intimacao",
            createdAt: new Date(p.ultimoMovimento.timestamp).toISOString(),
            source: "pje-extension",
            metadata: {
              vara: p.vara,
              comarca: p.comarca,
              timestamp: p.ultimoMovimento.timestamp,
              previousMovement: existing.ultimoMovimento.descricao,
            },
          };
          const exps = store.get("expedientes") || [];
          exps.unshift(expediente);
          store.set("expedientes", exps);
        }
      }
    }
    // update last sync
    setRedisValue("processos:last_sync", Date.now());
    setRedisValue("processos:pje-extension", processos);
    return res.json({ success: true, synced: syncedCount });
  }

  if (type === "SYNC_EXPEDIENTES") {
    const expedientes = data || [];
    const exps = store.get("expedientes") || [];
    for (const exp of expedientes) {
      exps.unshift(exp);
    }
    store.set("expedientes", exps);
    return res.json({ success: true, created: expedientes.length });
  }

  return res.status(400).json({ success: false, error: "Invalid type" });
});

app.listen(PORT, () => {
  console.log(`Dev API server listening on http://127.0.0.1:${PORT}`);
});

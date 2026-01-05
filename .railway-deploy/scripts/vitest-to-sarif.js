#!/usr/bin/env node
/*
 * Convert Vitest JSON output to SARIF 2.1.0 format.
 * Run: vitest run --reporter json > vitest-results.json
 * Then: node scripts/vitest-to-sarif.js
 */

const fs = require("fs");
const path = require("path");

function buildSarifFromVitest(vitestJson) {
  const sarif = {
    $schema: "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: { name: "Vitest", informationUri: "https://vitest.dev/" },
        },
        results: [],
      },
    ],
  };

  const run = sarif.runs[0];
  if (!vitestJson || !vitestJson.stats) {
    return sarif;
  }

  // Parse tests
  if (Array.isArray(vitestJson.tests)) {
    for (const t of vitestJson.tests) {
      if (t.errors && t.errors.length > 0) {
        const location = t.location || {};
        const message = t.errors.map((e) => e.message).join("\n---\n");
        const result = {
          ruleId: "VITEST_FAILURE",
          level: "error",
          message: { text: `${t.name}: ${message}` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: location.file || t.name },
                region: { startLine: location.line || 1, startColumn: location.column || 1 },
              },
            },
          ],
          properties: { duration: t.duration },
        };
        run.results.push(result);
      }
    }
  }
  return sarif;
}

function main() {
  const inPath = path.resolve(process.cwd(), "vitest-results.json");
  if (!fs.existsSync(inPath)) {
    console.warn("vitest-results.json not found - run Vitest JSON reporter first");
    process.exit(0);
  }
  const raw = fs.readFileSync(inPath, "utf8");
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse vitest-results.json", e.message);
    process.exit(1);
  }
  const sarif = buildSarifFromVitest(json);
  const outPath = path.resolve(process.cwd(), "vitest-results.sarif");
  fs.writeFileSync(outPath, JSON.stringify(sarif, null, 2));
  console.log("Vitest SARIF generated at", outPath);
}

main();

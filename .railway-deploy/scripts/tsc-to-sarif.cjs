#!/usr/bin/env node
/*
 * Simple tsc -> SARIF converter.
 * Runs `tsc --noEmit --pretty false` and parses the output to SARIF 2.1.0.
 * This is a minimal implementation to integrate TypeScript errors with GitHub Code Scanning.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function parseTscLine(line) {
  // Example: src/foo.ts(10,5): error TS1234: Message text
  const tscRegex = /^(.*)\((\d+),(\d+)\):\s*(error|warning)\s*(TS\d+):\s*(.*)$/i;
  const m = line.match(tscRegex);
  if (!m) return null;
  const filePath = m[1];
  const lineNum = parseInt(m[2], 10);
  const colNum = parseInt(m[3], 10);
  const severity = m[4].toLowerCase();
  const code = m[5];
  const message = m[6];
  return { filePath, line: lineNum, column: colNum, severity, code, message };
}

function runTsc() {
  const res = spawnSync("npx", ["tsc", "--noEmit", "--pretty", "false"], { encoding: "utf8" });
  const stdout = res.stdout || "";
  const stderr = res.stderr || "";
  const output = (stdout + "\n" + stderr)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return { output, status: res.status };
}

function buildSarif(results, toolName = "tsc") {
  const sarif = {
    $schema: "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: toolName,
            informationUri: "https://www.typescriptlang.org/",
            rules: [],
          },
        },
        results: [],
      },
    ],
  };
  const run = sarif.runs[0];
  const rulesMap = new Map();
  for (const r of results) {
    const ruleId = r.code || "TSUNKNOWN";
    if (!rulesMap.has(ruleId)) {
      run.tool.driver.rules.push({
        id: ruleId,
        shortDescription: { text: ruleId },
        fullDescription: { text: r.message },
        properties: { severity: r.severity },
      });
      rulesMap.set(ruleId, true);
    }
    const result = {
      ruleId: ruleId,
      level: r.severity === "error" ? "error" : "warning",
      message: { text: r.message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: r.filePath },
            region: { startLine: r.line, startColumn: r.column },
          },
        },
      ],
    };
    run.results.push(result);
  }
  return sarif;
}

function main() {
  console.log("Running tsc to collect errors...");
  const { output, status } = runTsc();
  const parsed = output.map(parseTscLine).filter(Boolean);
  if (parsed.length === 0) {
    console.log("No tsc errors detected — creating empty SARIF with 0 results");
  }
  const sarif = buildSarif(parsed);
  const outPath = path.resolve(process.cwd(), "tsc-results.sarif");
  fs.writeFileSync(outPath, JSON.stringify(sarif, null, 2), "utf8");
  console.log("TS SARIF generated at", outPath);
  process.exit(status || 0);
}

main();

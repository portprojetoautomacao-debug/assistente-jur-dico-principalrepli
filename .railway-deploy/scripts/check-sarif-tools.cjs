#!/usr/bin/env node
/*
 * Check if official SARIF conversion tools are installed and usable.
 * Prints the result for CI debugging and local dev convenience.
 */
const path = require("path");
const fs = require("fs");

function isPackageInstalled(pkg) {
  try {
    require.resolve(pkg);
    return true;
  } catch (e) {
    return false;
  }
}

const tools = [
  { name: "@microsoft/tsc-sarif", cmd: "npx @microsoft/tsc-sarif" },
  { name: "vitest-sarif-reporter", cmd: "npx vitest-sarif-reporter" },
];

for (const t of tools) {
  const installed = isPackageInstalled(t.name);
  console.log(`${t.name}: ${installed ? "installed" : "not installed"}`);
}

// Also check for sarif builder libs
console.log("@microsoft/sarif-multitool:", isPackageInstalled("@microsoft/sarif-multitool"));

// Exit 0 always - this is only informational
process.exit(0);

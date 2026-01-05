#!/usr/bin/env node
/**
 * An\u00e1lise Detalhada - Duplica\u00e7\u00e3o + 89 Viola\u00e7\u00f5es
 */

const SONAR_CONFIG = {
  url: "https://sonarcloud.io",
  token: process.env.SONAR_TOKEN,
  projectKey: "thiagobodevan-a11y_assistente-juridico-p",
};


if (!SONAR_CONFIG.token) {
  console.error("Error: SONAR_TOKEN environment variable is not set.");
  process.exit(1);
}
async function fetch(url, options = {}) {
  const { default: nodeFetch } = await import("node-fetch");
  return nodeFetch(url, options);
}

function createAuthHeader() {
  return "Basic " + Buffer.from(`${SONAR_CONFIG.token}:`).toString("base64");
}

async function apiCall(endpoint, params = {}) {
  const url = new URL(`${SONAR_CONFIG.url}/api/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: { Authorization: createAuthHeader() },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

console.log(
  "\u256d\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256e"
);
console.log(
  "\u2502   \ud83d\udcca AN\u00c1LISE DETALHADA - DUPLICA\u00c7\u00c3O + VIOLA\u00c7\u00d5ES            \u2502"
);
console.log(
  "\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256f\n"
);

// 1. AN\u00c1LISE DE DUPLICA\u00c7\u00c3O
async function analyzeDuplication() {
  console.log("\ud83d\udcdd 1. AN\u00c1LISE DE DUPLICA\u00c7\u00c3O DE C\u00d3DIGO");
  console.log("\u2500".repeat(60) + "\n");

  const duplications = await apiCall("duplications/show", {
    key: SONAR_CONFIG.projectKey,
  });

  if (!duplications.files || duplications.files.length === 0) {
    console.log("\u2705 Nenhuma duplica\u00e7\u00e3o encontrada!\n");
    return;
  }

  console.log(
    `\ud83d\udcc1 Total de arquivos com duplica\u00e7\u00e3o: ${duplications.files.length}\n`
  );

  duplications.files.slice(0, 10).forEach((file, idx) => {
    console.log(`${idx + 1}. \ud83d\udcc4 ${file.key.split(":")[1]}`);
    console.log(`   \ud83d\udd04 ${file.duplications?.length || 0} blocos duplicados`);
    if (file.duplications && file.duplications.length > 0) {
      file.duplications.slice(0, 2).forEach((dup, dupIdx) => {
        console.log(`      ${dupIdx + 1}. Linhas ${dup.from}-${dup.size} duplicadas em:`);
        if (dup._ref) {
          console.log(
            `         \ud83d\udd17 ${dup._ref.key.split(":")[1]} (linhas ${dup._ref.from}-${dup._ref.size})`
          );
        }
      });
    }
    console.log();
  });
}

// 2. RELAT\u00d3RIO DAS 89 VIOLA\u00c7\u00d5ES
async function analyzeViolations() {
  console.log("\ud83d\udea8 2. RELAT\u00d3RIO DAS 89 NOVAS VIOLA\u00c7\u00d5ES");
  console.log("\u2500".repeat(60) + "\n");

  const issues = await apiCall("issues/search", {
    componentKeys: SONAR_CONFIG.projectKey,
    sinceLeakPeriod: "true", // Apenas novas viola\u00e7\u00f5es
    ps: 100,
  });

  console.log(`\ud83d\udcca Total de novas viola\u00e7\u00f5es: ${issues.total}\n`);

  // Agrupar por severidade
  const bySeverity = {};
  issues.issues.forEach((issue) => {
    if (!bySeverity[issue.severity]) {
      bySeverity[issue.severity] = [];
    }
    bySeverity[issue.severity].push(issue);
  });

  // Exibir por severidade
  ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"].forEach((severity) => {
    if (!bySeverity[severity]) return;

    const emoji = {
      BLOCKER: "\ud83d\uded1",
      CRITICAL: "\u26a0\ufe0f",
      MAJOR: "\ud83d\udfe0",
      MINOR: "\ud83d\udd35",
      INFO: "\u2139\ufe0f",
    }[severity];

    console.log(`${emoji} ${severity} (${bySeverity[severity].length} issues):`);
    console.log();

    // Agrupar por regra
    const byRule = {};
    bySeverity[severity].forEach((issue) => {
      if (!byRule[issue.rule]) {
        byRule[issue.rule] = [];
      }
      byRule[issue.rule].push(issue);
    });

    Object.entries(byRule)
      .slice(0, 5)
      .forEach(([rule, ruleIssues]) => {
        console.log(`  \ud83d\udcc4 ${rule} (${ruleIssues.length}x)`);
        console.log(`     ${ruleIssues[0].message}`);

        ruleIssues.slice(0, 3).forEach((issue) => {
          const file = issue.component.split(":")[1];
          console.log(`     \u2022 ${file}:${issue.line || "N/A"}`);
        });

        if (ruleIssues.length > 3) {
          console.log(`     ... e mais ${ruleIssues.length - 3} ocorr\u00eancias`);
        }
        console.log();
      });

    if (Object.keys(byRule).length > 5) {
      console.log(`  ... e mais ${Object.keys(byRule).length - 5} regras diferentes\n`);
    }
  });
}

// 3. TOP 10 REGRAS MAIS VIOLADAS
async function analyzeTopRules() {
  console.log("\ud83c\udfc6 3. TOP 10 REGRAS MAIS VIOLADAS");
  console.log("\u2500".repeat(60) + "\n");

  const issues = await apiCall("issues/search", {
    componentKeys: SONAR_CONFIG.projectKey,
    ps: 500,
  });

  const ruleCount = {};
  issues.issues.forEach((issue) => {
    ruleCount[issue.rule] = (ruleCount[issue.rule] || 0) + 1;
  });

  const sortedRules = Object.entries(ruleCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedRules.forEach(([rule, count], idx) => {
    console.log(`${idx + 1}. ${rule}: ${count} ocorr\u00eancias`);
  });
  console.log();
}

// 4. ARQUIVOS COM MAIS PROBLEMAS
async function analyzeProblematicFiles() {
  console.log("\ud83d\udcc1 4. ARQUIVOS COM MAIS PROBLEMAS");
  console.log("\u2500".repeat(60) + "\n");

  const issues = await apiCall("issues/search", {
    componentKeys: SONAR_CONFIG.projectKey,
    ps: 500,
  });

  const fileCount = {};
  issues.issues.forEach((issue) => {
    const file = issue.component.split(":")[1];
    fileCount[file] = (fileCount[file] || 0) + 1;
  });

  const sortedFiles = Object.entries(fileCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedFiles.forEach(([file, count], idx) => {
    console.log(`${idx + 1}. ${file}: ${count} issues`);
  });
  console.log();
}

async function run() {
  try {
    await analyzeDuplication();
    await analyzeViolations();
    await analyzeTopRules();
    await analyzeProblematicFiles();

    console.log("\u2500".repeat(60));
    console.log("\u2705 An\u00e1lise detalhada finalizada!");
    console.log("\u2500".repeat(60) + "\n");
  } catch (error) {
    console.error("\n\u274c Erro na an\u00e1lise:", error.message);
    process.exit(1);
  }
}

run();

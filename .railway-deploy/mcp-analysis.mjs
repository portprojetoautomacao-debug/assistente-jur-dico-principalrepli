#!/usr/bin/env node
/**
 * Script de Análise Avançada usando MCP SonarQube
 *
 * Usa as ferramentas MCP para análise profunda de código
 */

import { spawn } from "node:child_process";

const SONAR_CONFIG = {
  url: "https://sonarcloud.io",
  token: "405bd014cbac226c756dcff6e201e0fdfde36e23",
  projectKey: "thiagobodevan-a11y_assistente-juridico-p",
  organization: "thiagobodevan-a11y",
};

console.log("🔍 Iniciando Análise Avançada com MCP SonarQube...\n");

// Função para chamar ferramentas MCP via stdio
async function callMCPTool(toolName, params = {}) {
  return new Promise((resolve, reject) => {
    const mcpServer = spawn(
      "node",
      [
        `${process.env.HOME}/.nvm/versions/node/v22.21.1/lib/node_modules/mcp-sonarqube/dist/index.js`,
      ],
      {
        env: {
          ...process.env,
          SONARQUBE_URL: SONAR_CONFIG.url,
          SONARQUBE_TOKEN: SONAR_CONFIG.token,
        },
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    mcpServer.stdout.on("data", (data) => {
      output += data.toString();
    });

    mcpServer.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // Enviar chamada de ferramenta
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: params,
      },
    };

    mcpServer.stdin.write(JSON.stringify(request) + "\n");
    mcpServer.stdin.end();

    mcpServer.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`MCP Server exited with code ${code}\n${errorOutput}`));
      } else {
        try {
          const lines = output.split("\n").filter((l) => l.trim());
          const jsonLine = lines.find((l) => l.startsWith("{"));
          if (jsonLine) {
            resolve(JSON.parse(jsonLine));
          } else {
            resolve({ output, raw: true });
          }
        } catch (e) {
          resolve({ output, raw: true });
        }
      }
    });

    // Timeout de 30s
    setTimeout(() => {
      mcpServer.kill();
      reject(new Error("Timeout ao chamar MCP"));
    }, 30000);
  });
}

// Análises disponíveis
async function analyzeProject() {
  console.log("📊 1. Obtendo métricas do projeto...");

  try {
    const metrics = await callMCPTool("sonarqube_get_project_metrics", {
      projectKey: SONAR_CONFIG.projectKey,
    });

    console.log("\n✅ Métricas do Projeto:");
    console.log(JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error("❌ Erro ao obter métricas:", error.message);
  }
}

async function analyzeIssues() {
  console.log("\n🐛 2. Analisando issues críticos...");

  try {
    const issues = await callMCPTool("list_issues", {
      projectKey: SONAR_CONFIG.projectKey,
      severities: "CRITICAL,BLOCKER",
      statuses: "OPEN",
      types: "CODE_SMELL,BUG,VULNERABILITY",
    });

    console.log("\n✅ Issues Críticos:");
    console.log(JSON.stringify(issues, null, 2));
  } catch (error) {
    console.error("❌ Erro ao analisar issues:", error.message);
  }
}

async function analyzeSecurity() {
  console.log("\n🔒 3. Analisando vulnerabilidades de segurança...");

  try {
    const security = await callMCPTool("get_security_vulnerabilities", {
      projectKey: SONAR_CONFIG.projectKey,
    });

    console.log("\n✅ Vulnerabilidades:");
    console.log(JSON.stringify(security, null, 2));
  } catch (error) {
    console.error("❌ Erro ao analisar segurança:", error.message);
  }
}

async function analyzeQualityGate() {
  console.log("\n🚪 4. Verificando Quality Gate...");

  try {
    const qualityGate = await callMCPTool("get_quality_gate", {
      projectKey: SONAR_CONFIG.projectKey,
    });

    console.log("\n✅ Quality Gate Status:");
    console.log(JSON.stringify(qualityGate, null, 2));
  } catch (error) {
    console.error("❌ Erro ao verificar Quality Gate:", error.message);
  }
}

// Executar todas as análises
async function runFullAnalysis() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   📊 ANÁLISE AVANÇADA COM MCP SONARQUBE            ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log(`🎯 Projeto: ${SONAR_CONFIG.projectKey}`);
  console.log(`🌐 URL: ${SONAR_CONFIG.url}`);
  console.log(`🏢 Organização: ${SONAR_CONFIG.organization}\n`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Executar análises sequencialmente
  await analyzeProject();
  await analyzeIssues();
  await analyzeSecurity();
  await analyzeQualityGate();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✅ Análise completa finalizada!\n");
}

// Executar
runFullAnalysis().catch((error) => {
  console.error("\n❌ Erro fatal na análise:", error);
  process.exit(1);
});

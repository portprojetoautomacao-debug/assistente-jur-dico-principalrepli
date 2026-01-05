#!/usr/bin/env node

/**
 * Script de verificação de configuração do Spark Runtime
 * Verifica se as variáveis de ambiente necessárias estão configuradas
 */

const fs = require("fs");
const path = require("path");

// Cores para terminal
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

let errors = 0;
let warnings = 0;

function checkEnv(varName, isRequired = true) {
  const value = process.env[varName];

  if (!value) {
    if (isRequired) {
      console.log(
        `${colors.red}✗${colors.reset} ${varName}: ${colors.red}NÃO CONFIGURADA${colors.reset} (obrigatória)`
      );
      errors++;
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} ${varName}: não configurada (opcional)`);
      warnings++;
    }
    return false;
  }

  // Mascarar valores sensíveis
  if (varName.includes("TOKEN") || varName.includes("SECRET") || varName.includes("KEY")) {
    const masked = value.substring(0, 8) + "...";
    console.log(`${colors.green}✓${colors.reset} ${varName}: configurada (${masked})`);
  } else {
    console.log(`${colors.green}✓${colors.reset} ${varName}: ${value}`);
  }

  return true;
}

console.log("🔍 Verificando configuração do Spark Runtime...\n");

console.log("📋 Verificando variáveis obrigatórias para Vercel:\n");

// Variáveis obrigatórias
const hasToken = checkEnv("GITHUB_TOKEN", true);
const hasRuntimeName = checkEnv("GITHUB_RUNTIME_PERMANENT_NAME", true);
checkEnv("GITHUB_API_URL", false);

console.log("\n📋 Verificando variáveis opcionais:\n");

// Variáveis opcionais
checkEnv("VITE_GOOGLE_CLIENT_ID", false);
checkEnv("VITE_GOOGLE_API_KEY", false);
checkEnv("VITE_GEMINI_API_KEY", false);
checkEnv("VITE_DATAJUD_API_KEY", false);

console.log("\n" + "━".repeat(60));

// Verificar runtime.config.json
const runtimeConfigPath = path.join(__dirname, "runtime.config.json");
if (fs.existsSync(runtimeConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(runtimeConfigPath, "utf8"));
    const runtimeId = config.app;

    if (runtimeId) {
      console.log(`${colors.green}✓${colors.reset} runtime.config.json encontrado`);
      console.log(`  Runtime ID: ${runtimeId}`);

      // Comparar com variável de ambiente
      const envRuntimeName = process.env.GITHUB_RUNTIME_PERMANENT_NAME;
      if (envRuntimeName && envRuntimeName !== runtimeId) {
        console.log(
          `${colors.yellow}⚠${colors.reset} AVISO: GITHUB_RUNTIME_PERMANENT_NAME (${envRuntimeName}) diferente do runtime.config.json (${runtimeId})`
        );
        warnings++;
      }
    }
  } catch (e) {
    console.log(`${colors.red}✗${colors.reset} Erro ao ler runtime.config.json: ${e.message}`);
    errors++;
  }
} else {
  console.log(`${colors.red}✗${colors.reset} runtime.config.json não encontrado`);
  errors++;
}

console.log("\n" + "━".repeat(60) + "\n");

// Resumo e instruções
if (errors === 0 && warnings === 0) {
  console.log(
    `${colors.green}${colors.bold}✅ Todas as configurações estão corretas!${colors.reset}\n`
  );
  console.log("Próximos passos:");
  console.log("1. Adicione estas variáveis no Vercel (Settings → Environment Variables)");
  console.log("2. Marque Production, Preview E Development para cada variável");
  console.log("3. Faça o redeploy do aplicativo\n");
  process.exit(0);
} else if (errors === 0) {
  console.log(
    `${colors.yellow}${colors.bold}⚠️  Configuração completa com ${warnings} aviso(s)${colors.reset}\n`
  );
  console.log("As variáveis obrigatórias estão configuradas, mas há avisos.");
  console.log("Verifique as mensagens acima.\n");
  process.exit(0);
} else {
  console.log(
    `${colors.red}${colors.bold}❌ Encontrados ${errors} erro(s) e ${warnings} aviso(s)${colors.reset}\n`
  );
  console.log("Para corrigir os erros:");
  console.log("1. Leia o arquivo LEIA_URGENTE.md");
  console.log("2. Configure as variáveis de ambiente faltantes");

  if (!hasToken) {
    console.log("\n📖 Como criar o GITHUB_TOKEN:");
    console.log("   1. Acesse: https://github.com/settings/tokens");
    console.log('   2. Clique em "Generate new token (classic)"');
    console.log("   3. Marque os escopos: repo, workflow");
    console.log("   4. Copie o token gerado (começa com ghp_)");
  }

  if (!hasRuntimeName) {
    try {
      const config = JSON.parse(fs.readFileSync(runtimeConfigPath, "utf8"));
      if (config.app) {
        console.log("\n📖 Use este valor para GITHUB_RUNTIME_PERMANENT_NAME:");
        console.log(`   ${config.app}`);
      }
    } catch (e) {
      // Ignorar erro
    }
  }

  console.log("\n3. Configure as variáveis no Vercel:");
  console.log("   Settings → Environment Variables");
  console.log("   Marque: Production, Preview E Development");
  console.log("\n4. Execute este script novamente para verificar\n");
  process.exit(1);
}

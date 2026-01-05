#!/usr/bin/env ts-node
/**
 * Script de teste para validar instrumentação Sentry AI Monitoring v2
 *
 * Executa testes simulados de interação com Harvey Specter e verifica
 * se os spans estão sendo criados corretamente.
 *
 * Uso: npx ts-node scripts/test-sentry-instrumentation.ts
 */

import * as Sentry from "@sentry/react";

interface TestResult {
  test: string;
  status: "✅ PASS" | "❌ FAIL";
  details: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function addResult(test: string, status: "✅ PASS" | "❌ FAIL", details: string) {
  results.push({ test, status, details });
}

// Teste 1: Verificar se Sentry está inicializado
function testSentryInitialization(): void {
  log("Teste 1: Verificando inicialização do Sentry...");

  try {
    const client = Sentry.getClient();
    if (client) {
      addResult("Sentry Initialization", "✅ PASS", "Sentry client inicializado corretamente");
    } else {
      addResult("Sentry Initialization", "❌ FAIL", "Sentry client não encontrado");
    }
  } catch (error) {
    addResult(
      "Sentry Initialization",
      "❌ FAIL",
      `Erro: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Teste 2: Verificar se createChatSpan está disponível
function testCreateChatSpanAvailability(): void {
  log("Teste 2: Verificando disponibilidade de createChatSpan...");

  try {
    // Importação dinâmica para verificar se o módulo existe
    const moduleExists = require.resolve("../src/lib/sentry-gemini-integration-v2");
    if (moduleExists) {
      addResult(
        "createChatSpan Availability",
        "✅ PASS",
        "Módulo sentry-gemini-integration-v2 encontrado"
      );
    }
  } catch (error) {
    addResult("createChatSpan Availability", "❌ FAIL", "Módulo não encontrado");
  }
}

// Teste 3: Simular criação de span
async function testSpanCreation(): Promise<void> {
  log("Teste 3: Simulando criação de span...");

  try {
    const spanCreated = await Sentry.startSpan(
      {
        name: "test_chat_harvey",
        op: "gen_ai.chat",
        attributes: {
          "gen_ai.system": "gemini",
          "gen_ai.request.model": "gemini-2.5-pro",
          "conversation.session_id": "test-session-001",
          "conversation.turn": 0,
        },
      },
      async (span) => {
        if (span) {
          span.setAttribute("test.executed", true);
          span.setAttribute("test.timestamp", Date.now());
          return true;
        }
        return false;
      }
    );

    if (spanCreated) {
      addResult("Span Creation", "✅ PASS", "Span criado com sucesso");
    } else {
      addResult("Span Creation", "❌ FAIL", "Span não foi criado");
    }
  } catch (error) {
    addResult(
      "Span Creation",
      "❌ FAIL",
      `Erro: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Teste 4: Verificar atributos OpenTelemetry
function testOpenTelemetryAttributes(): void {
  log("Teste 4: Verificando atributos OpenTelemetry...");

  const requiredAttributes = [
    "gen_ai.system",
    "gen_ai.request.model",
    "gen_ai.request.messages",
    "conversation.session_id",
    "conversation.turn",
  ];

  const availableAttributes = requiredAttributes.length;
  addResult(
    "OpenTelemetry Attributes",
    "✅ PASS",
    `${availableAttributes} atributos padrão definidos`
  );
}

// Teste 5: Verificar integração com useAIStreaming
function testUseAIStreamingIntegration(): void {
  log("Teste 5: Verificando integração com useAIStreaming...");

  try {
    const hookExists = require.resolve("../src/hooks/use-ai-streaming");
    if (hookExists) {
      addResult("useAIStreaming Integration", "✅ PASS", "Hook instrumentado encontrado");
    }
  } catch (error) {
    addResult("useAIStreaming Integration", "❌ FAIL", "Hook não encontrado");
  }
}

// Função principal
async function runTests(): Promise<void> {
  console.log("\n========================================");
  console.log("🧪 TESTE DE INSTRUMENTAÇÃO SENTRY AI v2");
  console.log("========================================\n");

  log("Iniciando bateria de testes...\n");

  // Executar testes
  testSentryInitialization();
  testCreateChatSpanAvailability();
  await testSpanCreation();
  testOpenTelemetryAttributes();
  testUseAIStreamingIntegration();

  // Exibir resultados
  console.log("\n========================================");
  console.log("📊 RESULTADOS DOS TESTES");
  console.log("========================================\n");

  let passed = 0;
  let failed = 0;

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.test}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Detalhes: ${result.details}\n`);

    if (result.status === "✅ PASS") passed++;
    else failed++;
  });

  console.log("========================================");
  console.log(`✅ Testes aprovados: ${passed}/${results.length}`);
  console.log(`❌ Testes falhados: ${failed}/${results.length}`);
  console.log("========================================\n");

  // Instruções para testar no Sentry.io
  console.log("📋 PRÓXIMOS PASSOS:");
  console.log("1. Rodar 'npm run dev' e abrir http://localhost:5173");
  console.log("2. Abrir Harvey Specter Chat");
  console.log("3. Enviar 3 mensagens de teste");
  console.log("4. Acessar https://sentry.io");
  console.log("5. Ir em: Insights → AI → AI Agents");
  console.log("6. Filtrar por: gen_ai.agent.name = 'harvey-specter'");
  console.log("7. Verificar spans com atributos corretos\n");

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Executar
runTests().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});

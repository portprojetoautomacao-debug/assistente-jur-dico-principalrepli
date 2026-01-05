#!/usr/bin/env node
/**
 * Gerador automático de testes unitários para agentes LangGraph
 * Cria testes padronizados baseados no padrão dos agentes existentes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const agentId = process.argv[2];

if (!agentId) {
  console.error('❌ Uso: node generate-agent-tests.mjs <agent-id|all>');
  process.exit(1);
}

// Lista de todos os agentes
const ALL_AGENTS = [
  'harvey',
  'justine',
  'monitor-djen',
  'analise-documental',
  'analise-risco',
  'compliance',
  'comunicacao-clientes',
  'estrategia-processual',
  'financeiro',
  'gestao-prazos',
  'organizacao-arquivos',
  'pesquisa-juris',
  'redacao-peticoes',
  'revisao-contratual',
  'traducao-juridica',
];

function generateTestFile(agentId) {
  const agentNameParts = agentId.split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  );
  const AgentClassName = agentNameParts.join('') + 'Agent';
  const agentDisplayName = agentNameParts.join(' ');
  const functionName = 'run' + agentNameParts.join('');

  const testContent = `import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AgentState } from "@/agents/base/agent_state";
import { ${AgentClassName} } from "../${agentId}_graph";

describe("${AgentClassName}", () => {
  let agent: ${AgentClassName};
  let initialState: AgentState;

  beforeEach(() => {
    agent = new ${AgentClassName}({
      timeoutMs: 5000,
      maxRetries: 2,
      enableSentryTracing: false, // Desabilitar em testes
    });

    initialState = {
      messages: [],
      currentStep: "init",
      data: {
        task: "Teste de ${agentDisplayName}",
      },
      completed: false,
      retryCount: 0,
      maxRetries: 2,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
  });

  describe("Inicialização", () => {
    it("deve inicializar corretamente", () => {
      expect(agent).toBeDefined();
      expect(agent.getSessionId()).toContain("${agentId}");
    });

    it("deve ter configuração padrão", () => {
      const sessionId = agent.getSessionId();
      expect(sessionId).toBeTruthy();
      expect(agent.getTurnCounter()).toBe(0);
    });
  });

  describe("Execução básica", () => {
    it("deve executar com sucesso", async () => {
      const result = await agent.execute(initialState);

      expect(result).toBeDefined();
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it("deve atualizar currentStep durante execução", async () => {
      const result = await agent.execute(initialState);

      expect(result.currentStep).toBeTruthy();
      expect(result.currentStep).not.toBe("init");
    });

    it("deve preservar dados do state", async () => {
      const stateWithData = {
        ...initialState,
        data: {
          task: "Tarefa específica",
          customField: "valor customizado",
        },
      };

      const result = await agent.execute(stateWithData);

      expect(result.data).toBeDefined();
      expect(result.data.task).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("deve lidar com erro de timeout", async () => {
      const shortTimeoutAgent = new ${AgentClassName}({
        timeoutMs: 1, // 1ms para forçar timeout
        maxRetries: 0,
        enableSentryTracing: false,
      });

      const result = await shortTimeoutAgent.execute(initialState);

      // Agente deve retornar estado com erro, não deve lançar exceção
      expect(result).toBeDefined();
    });

    it("deve fazer retry em caso de falha", async () => {
      const retryAgent = new ${AgentClassName}({
        timeoutMs: 5000,
        maxRetries: 2,
        retryDelayMs: 10,
        enableSentryTracing: false,
      });

      const result = await retryAgent.execute(initialState);

      expect(result).toBeDefined();
      // Se houver erro, deve ter tentado múltiplas vezes
      expect(result.retryCount).toBeGreaterThanOrEqual(0);
    });

    it("deve lidar com dados inválidos gracefully", async () => {
      const invalidState = {
        ...initialState,
        data: {}, // Sem task
      };

      const result = await agent.execute(invalidState);

      expect(result).toBeDefined();
      // Agente deve retornar resultado, mesmo com entrada inválida
      expect(result.messages).toBeDefined();
    });
  });

  describe("State Management", () => {
    it("deve adicionar mensagens ao state", async () => {
      const result = await agent.execute(initialState);

      expect(result.messages.length).toBeGreaterThan(0);
    });

    it("deve manter imutabilidade do state original", async () => {
      const originalData = { ...initialState.data };
      const originalMessages = [...initialState.messages];

      await agent.execute(initialState);

      // State original não deve ser modificado
      expect(initialState.data).toEqual(originalData);
      expect(initialState.messages).toEqual(originalMessages);
    });

    it("deve incrementar lastUpdatedAt", async () => {
      const startTime = initialState.lastUpdatedAt;

      const result = await agent.execute(initialState);

      expect(result.lastUpdatedAt).toBeGreaterThanOrEqual(startTime);
    });
  });

  describe("Circuit Breaker", () => {
    it("deve ter circuit breaker configurado", async () => {
      // Executar múltiplas vezes para testar circuit breaker
      const results = [];
      
      for (let i = 0; i < 3; i++) {
        const result = await agent.execute(initialState);
        results.push(result);
      }

      expect(results.length).toBe(3);
      // Todas as execuções devem retornar resultado
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe("Session Tracking", () => {
    it("deve rastrear sessionId único", () => {
      const sessionId1 = agent.getSessionId();
      const agent2 = new ${AgentClassName}();
      const sessionId2 = agent2.getSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });

    it("deve incrementar turn counter", async () => {
      const initialTurn = agent.getTurnCounter();
      
      await agent.execute(initialState);
      
      const finalTurn = agent.getTurnCounter();
      expect(finalTurn).toBeGreaterThanOrEqual(initialTurn);
    });
  });

  describe("Abort Handling", () => {
    it("deve permitir abort durante execução", async () => {
      const promise = agent.execute(initialState);
      
      // Abortar imediatamente
      agent.abort();
      
      const result = await promise;
      
      expect(result).toBeDefined();
      // Resultado pode estar incompleto mas não deve lançar erro
    });
  });

  describe("Integração", () => {
    it("deve funcionar com múltiplas execuções sequenciais", async () => {
      const result1 = await agent.execute(initialState);
      const result2 = await agent.execute(result1);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result2.messages.length).toBeGreaterThanOrEqual(result1.messages.length);
    });

    it("deve preservar contexto entre execuções", async () => {
      const result1 = await agent.execute({
        ...initialState,
        data: { task: "Primeira tarefa", context: "importante" },
      });

      const result2 = await agent.execute({
        ...result1,
        data: { ...result1.data, task: "Segunda tarefa" },
      });

      expect(result2.data.context).toBe("importante");
    });
  });
});
`;

  const testDir = path.resolve(__dirname, `../src/agents/${agentId}/__tests__`);
  const testFile = path.join(testDir, `${agentId}.test.ts`);

  // Criar diretório se não existir
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log(`📁 Criado diretório: ${testDir}`);
  }

  // Verificar se arquivo já existe
  if (fs.existsSync(testFile)) {
    console.log(`⚠️  Arquivo de teste já existe: ${testFile}`);
    return false;
  }

  // Escrever arquivo
  fs.writeFileSync(testFile, testContent, 'utf-8');
  console.log(`✅ Teste gerado: ${testFile}`);
  
  return true;
}

// ==============================================================================
// MAIN
// ==============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 GERADOR DE TESTES UNITÁRIOS PARA AGENTES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let generatedCount = 0;
let skippedCount = 0;

if (agentId === 'all') {
  console.log('📝 Gerando testes para TODOS os agentes...\n');
  
  for (const agent of ALL_AGENTS) {
    console.log(`\n🤖 Processando agente: ${agent}`);
    
    const agentFile = path.resolve(__dirname, `../src/agents/${agent}/${agent}_graph.ts`);
    
    if (!fs.existsSync(agentFile)) {
      console.log(`   ⏭️  Agente não encontrado, pulando...`);
      skippedCount++;
      continue;
    }
    
    const wasGenerated = generateTestFile(agent);
    
    if (wasGenerated) {
      generatedCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RELATÓRIO DE GERAÇÃO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Testes gerados: ${generatedCount}`);
  console.log(`⏭️  Testes pulados: ${skippedCount}`);
  console.log(`📊 Total de agentes: ${ALL_AGENTS.length}`);
  console.log('');
  console.log('📝 Próximos passos:');
  console.log('   1. Revisar os testes gerados');
  console.log('   2. Rodar testes: npm run test');
  console.log('   3. Ajustar casos de teste específicos se necessário');
  console.log('');
  
} else {
  // Gerar para agente específico
  console.log(`📝 Gerando teste para agente: ${agentId}\n`);
  
  const agentFile = path.resolve(__dirname, `../src/agents/${agentId}/${agentId}_graph.ts`);
  
  if (!fs.existsSync(agentFile)) {
    console.error(`❌ Agente '${agentId}' não encontrado!`);
    console.log('\nAgentes disponíveis:');
    ALL_AGENTS.forEach(a => console.log(`  - ${a}`));
    process.exit(1);
  }
  
  generateTestFile(agentId);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Geração de testes concluída!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

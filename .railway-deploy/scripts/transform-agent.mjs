#!/usr/bin/env node
/**
 * Script para transformar agentes antigos para o novo padrão
 * Aplica todas as melhorias automaticamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const agentId = process.argv[2];

if (!agentId) {
  console.error('❌ Uso: node transform-agent.mjs <agent-id>');
  process.exit(1);
}

const agentFile = path.resolve(__dirname, `../src/agents/${agentId}/${agentId}_graph.ts`);

if (!fs.existsSync(agentFile)) {
  console.error(`❌ Arquivo não encontrado: ${agentFile}`);
  process.exit(1);
}

console.log(`📝 Transformando ${agentId}...`);

let content = fs.readFileSync(agentFile, 'utf-8');

// 1. Adicionar imports necessários
const hasInvokeSpan = content.includes('createInvokeAgentSpan');
const hasChatSpan = content.includes('createChatSpan');

if (!hasInvokeSpan || !hasChatSpan) {
  const importBlock = `import { createInvokeAgentSpan, createChatSpan } from "@/lib/sentry-gemini-integration-v2";`;
  
  // Adicionar após os imports existentes
  if (!content.includes(importBlock)) {
    const lastImport = content.lastIndexOf('import');
    const endOfLastImport = content.indexOf('\n', lastImport);
    content = content.slice(0, endOfLastImport + 1) + importBlock + '\n' + content.slice(endOfLastImport + 1);
  }
}

// 2. Envolver o método run() com createInvokeAgentSpan se ainda não estiver
if (!content.includes('createInvokeAgentSpan(')) {
  console.log('   🔧 Adicionando Sentry AI Monitoring...');
  
  // Detectar nome da classe do agente
  const classMatch = content.match(/export class (\w+Agent) extends LangGraphAgent/);
  const className = classMatch ? classMatch[1] : 'UnknownAgent';
  
  // Criar nome limpo do agente
  const agentNameParts = agentId.split('-').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  );
  const agentName = agentNameParts.join(' ');
  
  // Encontrar o método run e envolver com span
  const runMethodRegex = /(protected async run\(state: AgentState, _signal: AbortSignal\): Promise<AgentState> \{)/;
  
  if (runMethodRegex.test(content)) {
    content = content.replace(
      runMethodRegex,
      `$1
    return createInvokeAgentSpan(
      {
        agentName: "${agentName}",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.5,
      },
      {
        sessionId: (state.data?.sessionId as string) || \`${agentId}_session_\${Date.now()}\`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {`
    );
    
    // Adicionar fechamento do span antes do final do método
    const lastReturn = content.lastIndexOf('return updateState(', content.lastIndexOf('}'));
    if (lastReturn !== -1) {
      const lineEnd = content.indexOf(';', lastReturn);
      content = content.slice(0, lineEnd + 1) + '\n      }\n    );' + content.slice(lineEnd + 1);
    }
  }
}

// 3. Adicionar setAttribute para métricas importantes
if (!content.includes('span?.setAttribute')) {
  console.log('   📊 Adicionando tracking de métricas...');
  
  // Adicionar após updateState inicial
  const firstUpdateState = content.indexOf('updateState(state, {');
  if (firstUpdateState !== -1) {
    const endOfLine = content.indexOf('\n', firstUpdateState);
    const trackingCode = `
        // Track execution
        span?.setAttribute("${agentId}.task", (state.data.task as string) || "default");
        span?.setAttribute("${agentId}.started_at", Date.now());
`;
    content = content.slice(0, endOfLine + 1) + trackingCode + content.slice(endOfLine + 1);
  }
}

// 4. Adicionar error handling robusto se não existir
if (!content.includes('try {') || !content.includes('catch (error)')) {
  console.log('   🛡️  Adicionando error handling...');
  
  // Envolver corpo do método em try-catch
  const asyncFuncStart = content.indexOf('async (span) => {');
  if (asyncFuncStart !== -1) {
    const funcBodyStart = content.indexOf('{', asyncFuncStart) + 1;
    content = content.slice(0, funcBodyStart) + '\n        try {' + content.slice(funcBodyStart);
    
    // Adicionar catch antes do fechamento do span
    const spanClose = content.lastIndexOf('}\n    );');
    content = content.slice(0, spanClose) + `
        } catch (error) {
          console.error("[${agentId}] Erro durante execução:", error);
          span?.setAttribute("error", true);
          span?.setAttribute("error.message", error instanceof Error ? error.message : String(error));
          
          return updateState(state, {
            completed: false,
            currentStep: "${agentId}:error",
            data: {
              ...state.data,
              error: error instanceof Error ? error.message : "Erro desconhecido",
            },
          });
        }
` + content.slice(spanClose);
  }
}

// 5. Garantir que está usando callGemini ao invés de instanciar modelo
if (content.includes('new GoogleGenerativeAI') || content.includes('genModel.generate')) {
  console.log('   🔄 Migrando para callGemini service...');
  
  if (!content.includes('import { callGemini }')) {
    const lastImport = content.lastIndexOf('import');
    const endOfLastImport = content.indexOf('\n', lastImport);
    content = content.slice(0, endOfLastImport + 1) + 
      `import { callGemini } from "@/lib/gemini-service";\n` + 
      content.slice(endOfLastImport + 1);
  }
}

// 6. Adicionar comentários de documentação
if (!content.includes('/**')) {
  console.log('   📝 Adicionando documentação...');
  
  const classDeclaration = content.indexOf('export class');
  const agentNameReadable = agentId.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  
  content = content.slice(0, classDeclaration) + 
    `/**
 * ${agentNameReadable} Agent
 * 
 * LangGraph-based agent with:
 * - Sentry AI Monitoring v2
 * - Circuit Breaker pattern
 * - Graceful degradation
 * - Retry with exponential backoff
 * - Structured error handling
 */
` + content.slice(classDeclaration);
}

// Salvar arquivo transformado
fs.writeFileSync(agentFile, content, 'utf-8');

console.log(`   ✅ Transformação concluída: ${agentFile}`);

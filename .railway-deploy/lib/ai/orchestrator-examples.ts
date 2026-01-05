// lib/ai/orchestrator-examples.ts
// Exemplos de uso do AgentOrchestrator em cenários reais

import { SimpleAgent, InMemoryMemoryStore } from './core-agent';
import { HttpLlmClient } from './http-llm-client';
import { agentsRegistry } from './agents-registry';
import { AgentOrchestrator, OrchestrationPatterns, type AgentTask } from './agent-orchestrator';
import type { GlobalToolContext } from './tools';

/**
 * Exemplo 1: Workflow de intimação (SEQUENTIAL)
 * Justin-e analisa → Gestão Prazos calcula → Cria tarefa
 */
export async function intimacaoWorkflow(baseContext: GlobalToolContext) {
  const llmClient = new HttpLlmClient(baseContext.baseUrl + '/api/llm-proxy');
  
  // Criar agentes necessários
  const agentsMap = new Map<string, SimpleAgent>();
  
  const justine = agentsRegistry.find(p => p.id === 'justine')!;
  const gestaoPrazos = agentsRegistry.find(p => p.id === 'gestao-prazos')!;
  
  agentsMap.set('justine', new SimpleAgent(
    justine.name,
    justine.systemPrompt,
    llmClient,
    new InMemoryMemoryStore(),
    []
  ));
  
  agentsMap.set('gestao-prazos', new SimpleAgent(
    gestaoPrazos.name,
    gestaoPrazos.systemPrompt,
    llmClient,
    new InMemoryMemoryStore(),
    []
  ));

  // Criar orquestrador SEQUENTIAL
  const orchestrator = new AgentOrchestrator(agentsMap, 'sequential');

  // Executar workflow
  const tasks = OrchestrationPatterns.intimacaoWorkflow();
  const result = await orchestrator.orchestrate(tasks);

  console.log('\n=== WORKFLOW INTIMAÇÃO ===');
  console.log(`Status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
  console.log(`Duração total: ${result.totalDuration}ms`);
  
  for (const trace of result.traces) {
    console.log(`\n[${trace.agentId}] Task: ${trace.taskId}`);
    console.log(`  Duração: ${trace.duration}ms`);
    if (trace.error) {
      console.log(`  Erro: ${trace.error}`);
    }
  }

  return result;
}

/**
 * Exemplo 2: Análise de caso (PARALLEL)
 * Múltiplos agentes analisam em paralelo
 */
export async function caseAnalysisParallel(caseId: string, baseContext: GlobalToolContext) {
  const llmClient = new HttpLlmClient(baseContext.baseUrl + '/api/llm-proxy');
  
  // Criar agentes para análise
  const agentsMap = new Map<string, SimpleAgent>();
  
  const riskAgent = agentsRegistry.find(p => p.id === 'analise-risco')!;
  const researchAgent = agentsRegistry.find(p => p.id === 'pesquisa-juris')!;
  const financialAgent = agentsRegistry.find(p => p.id === 'financeiro')!;
  
  agentsMap.set('analise-risco', new SimpleAgent(
    riskAgent.name,
    riskAgent.systemPrompt,
    llmClient,
    new InMemoryMemoryStore(),
    []
  ));
  
  agentsMap.set('pesquisa-juris', new SimpleAgent(
    researchAgent.name,
    researchAgent.systemPrompt,
    llmClient,
    new InMemoryMemoryStore(),
    []
  ));
  
  agentsMap.set('financeiro', new SimpleAgent(
    financialAgent.name,
    financialAgent.systemPrompt,
    llmClient,
    new InMemoryMemoryStore(),
    []
  ));

  // Criar orquestrador PARALLEL
  const orchestrator = new AgentOrchestrator(agentsMap, 'parallel');

  // Executar análise paralela
  const tasks = OrchestrationPatterns.caseAnalysisParallel(caseId);
  const result = await orchestrator.orchestrate(tasks);

  console.log('\n=== ANÁLISE DE CASO (PARALELA) ===');
  console.log(`Caso: ${caseId}`);
  console.log(`Status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
  console.log(`Duração total: ${result.totalDuration}ms`);
  console.log(`(Ganho vs. sequencial: ~${tasks.length}x mais rápido)`);

  return result;
}

/**
 * Exemplo 3: Revisão estratégica (HIERARCHICAL)
 * Harvey coordena, outros executam
 */
export async function strategicReview(baseContext: GlobalToolContext) {
  const llmClient = new HttpLlmClient(baseContext.baseUrl + '/api/llm-proxy');
  
  const agentsMap = new Map<string, SimpleAgent>();
  
  const harvey = agentsRegistry.find(p => p.id === 'harvey')!;
  const gestaoPrazos = agentsRegistry.find(p => p.id === 'gestao-prazos')!;
  const monitorDjen = agentsRegistry.find(p => p.id === 'monitor-djen')!;
  
  agentsMap.set('harvey', new SimpleAgent(
    harvey.name,
    harvey.systemPrompt,
    llmClient,
    new InMemoryMemoryStore(),
    []
  ));
  
  agentsMap.set('gestao-prazos', new SimpleAgent(
    gestaoPrazos.name,
    gestaoPrazos.systemPrompt,
    llmClient,
    new InMemoryMemoryStore(),
    []
  ));
  
  agentsMap.set('monitor-djen', new SimpleAgent(
    monitorDjen.name,
    monitorDjen.systemPrompt,
    llmClient,
    new InMemoryMemoryStore(),
    []
  ));

  // Criar orquestrador HIERARCHICAL
  const orchestrator = new AgentOrchestrator(agentsMap, 'hierarchical');

  const tasks = OrchestrationPatterns.strategicReview();
  const result = await orchestrator.orchestrate(tasks);

  console.log('\n=== REVISÃO ESTRATÉGICA ===');
  console.log(`Coordenador: Harvey`);
  console.log(`Status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
  
  return result;
}

/**
 * Exemplo 4: Workflow customizado
 * Criar tarefas manualmente com dependências
 */
export async function customWorkflow(baseContext: GlobalToolContext) {
  const llmClient = new HttpLlmClient(baseContext.baseUrl + '/api/llm-proxy');
  
  const agentsMap = new Map<string, SimpleAgent>();
  
  // Adicionar agentes necessários
  for (const persona of agentsRegistry) {
    agentsMap.set(persona.id, new SimpleAgent(
      persona.name,
      persona.systemPrompt,
      llmClient,
      new InMemoryMemoryStore(),
      []
    ));
  }

  const orchestrator = new AgentOrchestrator(agentsMap, 'sequential');

  // Workflow customizado: Monitorar DJEN → Analisar riscos → Comunicar cliente
  const tasks: AgentTask[] = [
    {
      id: 'monitor',
      assignedTo: 'monitor-djen',
      input: 'Verificar novas publicações no DJEN',
      priority: 'critical',
    },
    {
      id: 'risk-analysis',
      assignedTo: 'analise-risco',
      input: 'Analisar riscos das novas publicações',
      priority: 'high',
      dependencies: ['monitor'],
    },
    {
      id: 'notify-client',
      assignedTo: 'comunicacao-clientes',
      input: 'Notificar clientes sobre riscos identificados',
      priority: 'high',
      dependencies: ['risk-analysis'],
    },
  ];

  const result = await orchestrator.orchestrate(tasks);

  console.log('\n=== WORKFLOW CUSTOMIZADO ===');
  console.log(`Tarefas: ${tasks.length}`);
  console.log(`Status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
  
  return result;
}

/**
 * Exemplo 5: Análise colaborativa (COLLABORATIVE)
 * Múltiplos agentes votam na melhor solução
 */
export async function collaborativeAnalysis(question: string, baseContext: GlobalToolContext) {
  const llmClient = new HttpLlmClient(baseContext.baseUrl + '/api/llm-proxy');
  
  const agentsMap = new Map<string, SimpleAgent>();
  
  // Selecionar 3 agentes para votação
  const votersIds = ['harvey', 'analise-risco', 'pesquisa-juris'];
  
  for (const id of votersIds) {
    const persona = agentsRegistry.find(p => p.id === id)!;
    agentsMap.set(id, new SimpleAgent(
      persona.name,
      persona.systemPrompt,
      llmClient,
      new InMemoryMemoryStore(),
      []
    ));
  }

  const orchestrator = new AgentOrchestrator(agentsMap, 'collaborative');

  const tasks: AgentTask[] = [
    {
      id: 'consensus',
      assignedTo: 'harvey', // Não importa, todos vão votar
      input: question,
      priority: 'high',
    },
  ];

  const result = await orchestrator.orchestrate(tasks);

  console.log('\n=== ANÁLISE COLABORATIVA ===');
  console.log(`Questão: ${question}`);
  console.log(`Votantes: ${votersIds.join(', ')}`);
  console.log(`Consenso: ${result.results.get('consensus')}`);
  
  return result;
}

# 🔍 Serena MCP - Workflows Específicos para Assistente Jurídico PJe

## 📋 Índice
1. [Análise de Agentes IA](#análise-de-agentes-ia)
2. [Busca Semântica de Hooks Validados](#busca-semântica-de-hooks-validados)
3. [Rastreamento de Integrações](#rastreamento-de-integrações)
4. [Análise de Templates de Documentos](#análise-de-templates-de-documentos)
5. [Análise de Schemas Zod](#análise-de-schemas-zod)
6. [Monitoramento Sentry AI](#monitoramento-sentry-ai)
7. [Análise de Fluxos de Automação](#análise-de-fluxos-de-automação)

---

## 1. 🤖 Análise de Agentes IA

### Objetivo
Analisar os 15 agentes IA do sistema, suas dependências, capacidades e status de implementação.

### Comandos Recomendados

#### Listar Todos os Agentes
```
@workspace Liste todos os agentes IA do sistema com suas capacidades
```

**Resposta Esperada:**
- Arquivo `src/lib/agents.ts` com definições
- Documentação em `TODOS_OS_15_AGENTES.md`
- Status de cada agente (ativo/inativo)

#### Encontrar Agentes Conectados ao Gemini
```
@workspace Mostre todos os agentes que usam Google Gemini
```

**Arquivos Relevantes:**
- `src/lib/gemini-service.ts`
- `src/lib/real-agent-client.ts`
- `src/agents/*/`

#### Analisar Agentes com Sentry AI Monitoring
```
@workspace Quais agentes estão instrumentados com Sentry AI Monitoring?
```

**Arquivos a Verificar:**
- `src/lib/sentry-gemini-integration-v2.ts`
- `src/lib/real-agent-client.ts`
- Agentes com `createInvokeAgentSpan`

#### Verificar Agentes com Streaming
```
@workspace Mostre agentes que implementam streaming de respostas
```

**Padrão a Buscar:**
- `processTaskWithStreamingAI`
- `onChunk`, `onComplete` callbacks
- API `/api/llm-stream`

---

## 2. 🔗 Busca Semântica de Hooks Validados

### Objetivo
Rastrear hooks migrados para o padrão `use-*-validated` com schemas Zod.

### Comandos Recomendados

#### Listar Hooks Validados
```
@workspace Liste todos os hooks que terminam com -validated
```

**Arquivos Esperados:**
- `src/hooks/use-processes-validated.ts`
- `src/hooks/use-expedientes-validated.ts`
- `src/hooks/use-tarefas-validated.ts`

#### Encontrar Hooks Sem Validação
```
@workspace Quais hooks em src/hooks/ ainda não têm versão validated?
```

**Padrão a Identificar:**
- Hooks sem schema Zod
- Hooks sem `safeParse()`
- Hooks sem tratamento de erro estruturado

#### Analisar Schema de um Hook
```
@workspace Mostre o schema Zod do hook use-processes-validated
```

**Informações Esperadas:**
- Campos obrigatórios
- Validações customizadas
- Transformações de dados

---

## 3. 🌐 Rastreamento de Integrações

### Objetivo
Analisar todas as integrações externas do sistema (DJEN, DataJud, PJe, Google Calendar).

### Comandos Recomendados

#### DJEN (Diário de Justiça Eletrônico)
```
@workspace Mostre todo código que interage com a API DJEN
```

**Arquivos Relevantes:**
- `src/lib/djen-api.ts`
- `api/djen.ts`
- `api/cron.ts` (job de monitoramento)

#### DataJud
```
@workspace Encontre código relacionado à API DataJud do CNJ
```

**Arquivos Esperados:**
- `src/lib/datajud-service.ts`
- `scripts/populate-qdrant-datajud.ts`
- `docs/QDRANT_DATAJUD_AUTOMATION.md`

#### PJe Sync (Extensão Chrome)
```
@workspace Mostre componentes da extensão Chrome PJe Sync
```

**Arquivos Principais:**
- `chrome-extension-pje/src/content-script.ts`
- `chrome-extension-pje/src/background.ts`
- `api/pje-sync.ts` (endpoint de sincronização)

#### Google Calendar
```
@workspace Liste código que usa Google Calendar API
```

**Arquivos Relevantes:**
- `src/lib/google-calendar-service.ts`
- `src/components/CalendarIntegration.tsx`
- OAuth flows

#### Qdrant (Vector Database)
```
@workspace Mostre integrações com Qdrant para busca vetorial
```

**Arquivos Esperados:**
- `src/lib/qdrant-service.ts`
- `src/agents/pesquisa-juris/pesquisa_graph_qdrant.ts`
- Scripts de população

---

## 4. 📄 Análise de Templates de Documentos

### Objetivo
Analisar templates jurídicos e sistema de geração de documentos.

### Comandos Recomendados

#### Listar Templates Disponíveis
```
@workspace Mostre todos os templates de documentos jurídicos
```

**Arquivo Principal:**
- `src/lib/document-templates.ts`

**Tipos Esperados:**
- Petições
- Contratos
- Procurações
- Recursos
- Pareceres

#### Analisar Sistema de Variáveis
```
@workspace Como funciona o sistema de substituição de variáveis {{}} nos templates?
```

**Funções a Verificar:**
- `replaceTemplateVariables()`
- `extractUnfilledVariables()`
- `getTemplateById()`

#### Encontrar Templates por Tipo
```
@workspace Mostre templates de petições iniciais
```

**Filtros Disponíveis:**
- `getTemplatesByTipo("peticao")`
- `getTemplatesByCategoria("Cível")`
- `searchTemplates("contestação")`

---

## 5. ✅ Análise de Schemas Zod

### Objetivo
Mapear todos os schemas de validação Zod do sistema.

### Comandos Recomendados

#### Listar Todos os Schemas
```
@workspace Encontre todas as definições de schemas Zod no projeto
```

**Padrão a Buscar:**
- `z.object({ ... })`
- `z.array()`, `z.string()`, etc.
- Schemas exportados

#### Analisar Schema Específico
```
@workspace Mostre o schema Zod do tipo Process
```

**Arquivo Esperado:**
- `src/types.ts` com `processSchema`

#### Verificar Schemas com Refinements
```
@workspace Quais schemas Zod usam .refine() ou .superRefine()?
```

**Casos de Uso:**
- Validação de CPF/CNPJ
- Validação de número CNJ
- Regras de negócio customizadas

---

## 6. 📊 Monitoramento Sentry AI

### Objetivo
Rastrear instrumentação de agentes IA com Sentry AI Monitoring.

### Comandos Recomendados

#### Verificar Agentes Instrumentados
```
@workspace Quais agentes usam createInvokeAgentSpan do Sentry?
```

**Funções do Sentry AI:**
- `createInvokeAgentSpan()`
- `createChatSpan()`
- `createExecuteToolSpan()`
- `createHandoffSpan()`

#### Analisar Handoffs entre Agentes
```
@workspace Mostre código que transfere tarefas entre agentes (handoffs)
```

**Arquivo Esperado:**
- `docs/HANDOFFS_EXAMPLES.ts`

**Fluxo Comum:**
Harvey → Mrs. Justin-e → Redação

#### Verificar Spans de Chat
```
@workspace Encontre chamadas ao Gemini que registram spans no Sentry
```

**Padrão a Buscar:**
- `startAIChatSpan()`
- `finishAIChatSpan()`
- Atributos `gen_ai.*`

---

## 7. ⚙️ Análise de Fluxos de Automação

### Objetivo
Mapear cron jobs e automações do sistema.

### Comandos Recomendados

#### Listar Cron Jobs
```
@workspace Mostre todos os cron jobs configurados
```

**Arquivos Relevantes:**
- `api/cron.ts`
- `vercel.json` (schedules)

**Jobs Comuns:**
- Monitoramento DJEN (diário 8h)
- Processamento de filas de agentes
- Backup de dados

#### Analisar Automação de Minutas
```
@workspace Como funciona a geração automática de minutas pelos agentes?
```

**Fluxo Esperado:**
1. Expediente detectado
2. Mrs. Justin-e analisa
3. Cria tarefa para Redação
4. Redação gera minuta
5. Salva no MinutasManager

**Arquivos Principais:**
- `src/hooks/use-autonomous-agents.ts`
- `src/hooks/use-auto-minuta.ts`
- `src/components/MinutasManager.tsx`

#### Rastrear Editor de Documentos
```
@workspace Mostre componentes do editor Tiptap e comandos /ai
```

**Arquivos Esperados:**
- `src/components/editor/TiptapEditor.tsx`
- Extensões customizadas
- Comandos slash (`/ai`, `/template`)

---

## 🎯 Casos de Uso Avançados

### Análise de Dependências Circulares
```
@workspace Existe alguma dependência circular entre hooks ou componentes?
```

### Encontrar Código Duplicado
```
@workspace Há código duplicado entre agentes ou hooks?
```

### Análise de Performance
```
@workspace Quais componentes não usam lazy loading mas deveriam?
```

### Validação de Tipos TypeScript
```
@workspace Mostre usos de 'any' ou 'unknown' que precisam de tipagem adequada
```

### Análise de Testes
```
@workspace Quais módulos críticos não têm testes unitários?
```

---

## 🛠️ Melhores Práticas

1. **Seja Específico**: Quanto mais específico o comando, melhores os resultados
2. **Use Contexto**: Mencione arquivos ou pastas quando souber onde procurar
3. **Combine com MCP Servers**: Use GitHub MCP para issues, Sentry MCP para erros
4. **Itere**: Refine as buscas com base nas respostas anteriores

---

## 📚 Referências

- [Documentação Completa do Serena](./SERENA_MCP_SETUP.md)
- [Melhores Práticas](./SERENA_BEST_PRACTICES.md)
- [Todos os 15 Agentes](../TODOS_OS_15_AGENTES.md)
- [Upgrade dos Agentes](./UPGRADE_AGENTES_RESUMO_COMPLETO.md)

---

**Última Atualização**: Janeiro 2025

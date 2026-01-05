# 🔍 OpenTelemetry Tracing - Assistente Jurídico PJe

## Visão Geral

O sistema de tracing foi configurado com OpenTelemetry para fornecer observabilidade completa das operações dos agentes de IA e chamadas LLM (Gemini). Os traces são exportados para o **AI Toolkit Trace Viewer** da Microsoft, permitindo análise detalhada de performance e debugging.

## 📋 O Que Foi Configurado

### 1. Dependências Instaladas
- `@opentelemetry/api` - API principal do OpenTelemetry
- `@opentelemetry/sdk-trace-web` - SDK para web browsers
- `@opentelemetry/exporter-trace-otlp-http` - Exportador OTLP via HTTP
- `@opentelemetry/resources` - Gestão de recursos
- `@opentelemetry/semantic-conventions` - Convenções semânticas padrão

### 2. Arquivos Criados/Modificados

#### Novos Arquivos
- **`src/lib/otel-integration.ts`** - Configuração e inicialização do OpenTelemetry
  - Inicialização do provider
  - Configuração do exportador OTLP
  - Helpers para criar spans
  - Bridge com sistema de tracing existente

#### Arquivos Modificados
- **`src/main.tsx`** - Inicialização do tracing no entry point
- **`src/lib/gemini-service.ts`** - Instrumentação das chamadas LLM
- **`src/hooks/use-autonomous-agents.ts`** - Tracing de operações dos agentes
- **`package.json`** - Dependências OpenTelemetry
- **`.env.example`** - Variável `VITE_OTLP_ENDPOINT`

### 3. Sistema de Tracing Existente

O projeto já possui um sistema de tracing robusto em `src/lib/tracing.ts` que foi **integrado** com OpenTelemetry, não substituído. Agora temos:

- **Sistema interno** - Armazena traces em memória, console, HTTP
- **OpenTelemetry** - Exporta para ferramentas profissionais (AI Toolkit, Azure Monitor, etc.)
- **Bridge automática** - Spans criados com `tracingService` são automaticamente enviados ao OpenTelemetry

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variável de Ambiente (Opcional)

O endpoint padrão é `http://localhost:4318/v1/traces` (AI Toolkit local).

Para usar endpoint customizado, adicione ao `.env.local`:

```env
VITE_OTLP_ENDPOINT=https://seu-coletor-otlp.com/v1/traces
```

### 3. Abrir AI Toolkit Trace Viewer

**Método 1: Via Command Palette**
1. Pressione `Ctrl+Shift+P` (Windows/Linux) ou `Cmd+Shift+P` (Mac)
2. Digite: `AI Toolkit: Open Trace Viewer`
3. Pressione Enter

**Método 2: Via Extensão**
1. Abra a barra lateral do VS Code
2. Clique no ícone do AI Toolkit
3. Navegue até "Trace Viewer"

### 4. Iniciar Aplicação

```bash
npm run dev
```

O tracing será inicializado automaticamente e você verá no console:

```
✅ [OpenTelemetry] Inicializado com sucesso
📊 [OpenTelemetry] Endpoint: http://localhost:4318/v1/traces
🔍 [OpenTelemetry] Abra o AI Toolkit Trace Viewer para visualizar traces
```

### 5. Usar a Aplicação

Conforme você interage com o sistema (processamento de intimações, chamadas LLM, operações de agentes), os traces serão automaticamente enviados e aparecerão no Trace Viewer.

## 📊 O Que Está Sendo Rastreado

### 1. Chamadas LLM (Gemini)

Toda chamada ao Gemini gera um span contendo:

**Atributos:**
- `llm.model` - Modelo usado (ex: `gemini-2.5-pro`)
- `llm.operation` - Operação (ex: `generateContent`)
- `llm.temperature` - Temperatura usada
- `llm.max_tokens` - Máximo de tokens
- `llm.prompt_tokens` - Tokens do prompt
- `llm.completion_tokens` - Tokens da resposta
- `llm.total_tokens` - Total de tokens
- `llm.response_time_ms` - Tempo de resposta

**Eventos:**
- Início da chamada
- Resposta recebida
- Erros (se houver)

### 2. Operações de Agentes

Cada tarefa executada por um agente gera um span contendo:

**Atributos:**
- `agent.id` - ID do agente (ex: `harvey`, `justine`)
- `agent.name` - Nome amigável do agente
- `task.id` - ID da tarefa
- `task.type` - Tipo da tarefa
- `task.priority` - Prioridade da tarefa
- `task.status` - Status (completed, failed)
- `task.duration_ms` - Duração em milissegundos
- `task.tokens_used` - Tokens consumidos (se aplicável)
- `execution.mode` - Modo de execução (hybrid, streaming, traditional)
- `hybrid.mode_used` - Se híbrido, qual modo foi usado (langGraph, traditional)

**Eventos:**
- `task.started` - Tarefa iniciada
- `execution.mode.selected` - Modo de execução selecionado
- `task.completed` - Tarefa concluída
- `task.error` - Erro durante execução (se houver)

### 3. Contexto Distribuído

Traces relacionados compartilham o mesmo `traceId`, permitindo rastrear operações complexas:

```
Trace ID: abc123...
├── Span: agent.justine.analyze-intimacao
│   ├── Span: llm.gemini-2.5-pro (analisar conteúdo)
│   ├── Span: llm.gemini-2.5-pro (identificar prazos)
│   └── Span: llm.gemini-2.5-pro (gerar tarefas)
```

## 🔧 Uso Avançado

### Criar Spans Customizados

#### Com o Sistema Interno (Recomendado)

```typescript
import { startAgentSpan, endSpan, setAttribute, addEvent } from '@/lib/tracing';

// Criar span
const span = startAgentSpan('meu-agente', 'Meu Agente', {
  attributes: {
    'custom.key': 'value',
  },
});

// Adicionar atributos
setAttribute(span, 'processo.numero', '0001234-56.2024.5.01.0000');

// Adicionar eventos
addEvent(span, 'documento-processado', {
  'documento.tipo': 'intimação',
  'documento.tamanho': '1024',
});

try {
  // Seu código aqui
  const resultado = await processarAlgo();
  
  // Finalizar com sucesso
  await endSpan(span, 'ok');
} catch (error) {
  // Finalizar com erro
  await endSpan(span, 'error', error.message);
}
```

#### Com OpenTelemetry Direto

```typescript
import { withOtelSpan } from '@/lib/otel-integration';

const resultado = await withOtelSpan('minha-operacao', async (span) => {
  span.setAttribute('custom.key', 'value');
  span.addEvent('evento-importante');
  
  return await fazerAlgo();
}, {
  'component': 'meu-componente',
});
```

### Helpers Disponíveis

#### Para Chamadas LLM

```typescript
import { traceLLMCall } from '@/lib/otel-integration';

const resposta = await traceLLMCall(
  'gemini-2.5-pro',
  'generateContent',
  async () => {
    return await chamarLLM(prompt);
  },
  {
    prompt: 'Meu prompt',
    temperature: 0.7,
    maxTokens: 1024,
  }
);
```

#### Para Operações de Agentes

```typescript
import { traceAgentOperation } from '@/lib/otel-integration';

const resultado = await traceAgentOperation(
  'harvey',
  'Harvey Specter',
  'analisar-estrategia',
  async () => {
    return await analisarEstrategia();
  },
  {
    'processo.id': processoId,
    'estrategia.tipo': 'ofensiva',
  }
);
```

#### Para Processamento de Documentos

```typescript
import { traceDocumentProcessing } from '@/lib/otel-integration';

const resultado = await traceDocumentProcessing(
  'intimacao',
  'int-123',
  'extract',
  async () => {
    return await extrairDados(intimacao);
  }
);
```

#### Para Busca Vetorial (Qdrant)

```typescript
import { traceVectorSearch } from '@/lib/otel-integration';

const resultados = await traceVectorSearch(
  'legal_docs',
  'similarity_search',
  async () => {
    return await qdrant.search(query);
  },
  {
    query: 'direito trabalhista',
    limit: 10,
    score_threshold: 0.7,
  }
);
```

## 📈 Visualização e Análise

### No AI Toolkit Trace Viewer

O Trace Viewer mostra:

1. **Timeline** - Linha do tempo de todas as operações
2. **Spans hierárquicos** - Visualização em árvore de operações relacionadas
3. **Atributos** - Todos os metadados de cada span
4. **Eventos** - Marcos importantes durante a execução
5. **Duração** - Tempo de cada operação
6. **Status** - Sucesso, erro ou em andamento
7. **Filtros** - Por agente, tipo de operação, status, etc.

### Análises Úteis

- **Performance de agentes** - Quais agentes são mais rápidos/lentos?
- **Consumo de tokens** - Quanto cada operação consome?
- **Taxas de erro** - Quais operações falham mais?
- **Gargalos** - Onde o sistema passa mais tempo?
- **Fluxos completos** - Rastrear uma intimação do início ao fim

## 🐛 Troubleshooting

### Traces não aparecem no Viewer

1. **Verificar se AI Toolkit Trace Viewer está aberto**
   - Abra via `Ctrl+Shift+P` → `AI Toolkit: Open Trace Viewer`

2. **Verificar endpoint**
   - Console deve mostrar: `📊 [OpenTelemetry] Endpoint: http://localhost:4318/v1/traces`
   - Se diferente, configure `VITE_OTLP_ENDPOINT` no `.env.local`

3. **Verificar inicialização**
   - Console deve mostrar: `✅ [OpenTelemetry] Inicializado com sucesso`
   - Se não aparecer, verifique erros no console

4. **Verificar firewall/antivírus**
   - Alguns antivírus bloqueiam localhost:4318
   - Adicione exceção se necessário

### Erros de importação

Se encontrar erros como `Cannot find module '@opentelemetry/api'`:

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Performance degradada

Se notar lentidão:

1. **Reduzir frequência de exportação** (aumentar `scheduledDelayMillis`)
2. **Desabilitar tracing em desenvolvimento** (temporariamente)
3. **Usar sampling** para enviar apenas X% dos traces

## 📚 Referências

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [AI Toolkit for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-windows-ai-studio.windows-ai-studio)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)

## 🎯 Próximos Passos

### Curto Prazo
- [ ] Adicionar tracing em mais serviços (DJEN, DataJud, Qdrant, etc.)
- [ ] Criar dashboard customizado com métricas de agentes
- [ ] Implementar alertas baseados em traces

### Médio Prazo
- [ ] Integrar com Azure Monitor (produção)
- [ ] Configurar exportação para múltiplos backends
- [ ] Adicionar sampling inteligente baseado em carga

### Longo Prazo
- [ ] Machine Learning para detecção de anomalias em traces
- [ ] Auto-tuning de agentes baseado em telemetria
- [ ] Correlation entre traces, logs e métricas

## 💡 Dicas

1. **Use tracing para debugging** - Ao investigar bugs, filtre traces por `traceId` para ver todo o fluxo
2. **Monitore tokens** - Acompanhe `llm.total_tokens` para otimizar custos
3. **Analise latência** - Identifique operações lentas e otimize
4. **Rastreie erros** - Spans com status `error` indicam problemas
5. **Compare performance** - Use traces para A/B testing de prompts/estratégias

---

**Documentação gerada automaticamente** | Última atualização: 13/12/2025

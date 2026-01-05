# 🔍 Guia Rápido - Visualização de Agentes com Tracing

> **Endpoint OTLP Configurado**: `http://localhost:4319/v1/traces`

## ✅ Configuração Atual

### Arquivos Atualizados:
- ✅ [src/lib/otel-integration.ts](../src/lib/otel-integration.ts) - Endpoint padrão: 4319
- ✅ [.env.local](../.env.local) - `VITE_OTLP_ENDPOINT=http://localhost:4319/v1/traces`
- ✅ [.env.example](../.env.example) - Documentação atualizada
- ✅ [src/main.tsx](../src/main.tsx) - OpenTelemetry inicializado automaticamente

## 🚀 Como Visualizar os Agentes

### 1. Iniciar o AI Toolkit Trace Viewer

```bash
# No VS Code, pressione:
Ctrl+Shift+P (Windows/Linux) ou Cmd+Shift+P (Mac)

# Digite e selecione:
"AI Toolkit: Open Trace Viewer"
```

**Importante**: O AI Toolkit deve estar escutando na porta **4319** (HTTP).

### 2. Iniciar a Aplicação

```bash
# Terminal PowerShell
npm run dev

# Saída esperada:
# ✅ OpenTelemetry inicializado
# ✅ Exportando traces para http://localhost:4319/v1/traces
# 🚀 Servidor rodando em http://localhost:5173
```

### 3. Executar Ações dos Agentes

Para gerar traces visíveis, execute uma das seguintes ações:

#### Opção A: Análise de Intimação (Mrs. Justin-e)
1. Acesse: http://localhost:5173/expedientes
2. Clique em "Nova Intimação"
3. Preencha dados de teste
4. Clique em "Analisar com IA"

**Traces gerados**:
- `agent.justine.analyze-intimation`
- `gemini.chat.completion`
- `deadline.calculation`
- `task.creation`

#### Opção B: Redação de Petição (Redator)
1. Acesse: http://localhost:5173/minutas
2. Clique em "Nova Minuta"
3. Selecione "Gerar com IA"
4. Escolha template e processo

**Traces gerados**:
- `agent.redacao-peticoes.draft-document`
- `gemini.generateContent`
- `template.replacement`
- `document.save`

#### Opção C: Pesquisa Jurisprudencial (Qdrant)
1. Acesse: http://localhost:5173/pesquisa
2. Digite: "jurisprudência FGTS trabalhista"
3. Clique em "Buscar"

**Traces gerados**:
- `agent.pesquisa-juris.search`
- `qdrant.vector-search`
- `gemini.embedding.generate`
- `precedent.ranking`

### 4. Verificar Traces no AI Toolkit

No **AI Toolkit Trace Viewer**, você verá:

```
📊 Trace Timeline:
├─ agent.justine.analyze-intimation (2.5s)
│  ├─ document.extract-text (0.3s)
│  ├─ gemini.chat.completion (1.8s)
│  ├─ deadline.calculate (0.2s)
│  └─ task.create (0.2s)
│
├─ agent.redacao-peticoes.draft-document (5.2s)
│  ├─ gemini.generateContent (4.5s)
│  ├─ template.load (0.1s)
│  ├─ template.replace-variables (0.3s)
│  └─ document.save (0.3s)
│
└─ agent.pesquisa-juris.search (1.2s)
   ├─ gemini.embedding.generate (0.5s)
   ├─ qdrant.vector-search (0.5s)
   └─ precedent.rank (0.2s)
```

## 📊 Tipos de Spans Rastreados

### Agentes (15 total)
| Agente | Span ID | Operações |
|--------|---------|-----------|
| Harvey Specter | `agent.harvey.*` | strategic-analysis, performance-monitoring |
| Mrs. Justin-e | `agent.justine.*` | analyze-intimation, identify-deadline |
| Análise Documental | `agent.analise-documental.*` | extract-text, classify-document |
| Monitor DJEN | `agent.monitor-djen.*` | fetch-publications, detect-intimations |
| Redação Petições | `agent.redacao-peticoes.*` | draft-document, generate-petition |
| Pesquisa Juris | `agent.pesquisa-juris.*` | vector-search, rank-precedents |
| ... | ... | ... |

### Integrações
- **Gemini API**: `gemini.chat.*`, `gemini.embedding.*`
- **Qdrant**: `qdrant.search.*`, `qdrant.insert.*`
- **DJEN/DataJud**: `djen.fetch.*`, `datajud.query.*`
- **PJe Sync**: `pje-sync.process.*`

### Operações Internas
- **Templates**: `template.load`, `template.replace`
- **Cálculos**: `deadline.calculate`, `business-days.count`
- **Persistência**: `kv.get`, `kv.set`, `kv.lpush`

## 🔧 Troubleshooting

### ❌ Traces não aparecem no AI Toolkit

**Verificar**:
```bash
# 1. Confirmar endpoint no console do navegador
# Abra DevTools (F12) → Console
# Deve aparecer: "[OpenTelemetry] Exportando para http://localhost:4319/v1/traces"

# 2. Verificar se AI Toolkit está rodando
# No VS Code: Ctrl+Shift+P → "AI Toolkit: Open Trace Viewer"

# 3. Verificar porta 4319 está livre
netstat -ano | findstr :4319

# 4. Reiniciar aplicação
npm run dev
```

### ❌ Erro "Failed to fetch OTLP endpoint"

**Solução**:
```bash
# 1. Verificar .env.local
cat .env.local | grep OTLP

# Deve mostrar:
# VITE_OTLP_ENDPOINT=http://localhost:4319/v1/traces

# 2. Limpar cache do Vite
npm run clean
npm run dev
```

### ❌ Traces muito lentos ou timeout

**Ajustar batch size**:
```typescript
// src/lib/otel-integration.ts
new BatchSpanProcessor(otlpExporter, {
  maxQueueSize: 50,         // Reduzir de 100
  maxExportBatchSize: 5,    // Reduzir de 10
  scheduledDelayMillis: 500, // Reduzir de 1000
});
```

## 📚 Documentação Adicional

- **OpenTelemetry Setup**: [src/lib/otel-integration.ts](../src/lib/otel-integration.ts)
- **Agent Tracing**: [src/lib/agent-tracing.ts](../src/lib/agent-tracing.ts)
- **Tracing Service**: [src/lib/tracing.ts](../src/lib/tracing.ts)
- **Dashboard Visual**: [src/components/TracingDashboard.tsx](../src/components/TracingDashboard.tsx)

## 🎯 Próximos Passos

1. ✅ **Ativar AI Toolkit**: `Ctrl+Shift+P` → "AI Toolkit: Open Trace Viewer"
2. ✅ **Iniciar app**: `npm run dev`
3. ✅ **Executar ações**: Criar intimação, gerar minuta, pesquisar jurisprudência
4. ✅ **Visualizar traces**: No AI Toolkit Trace Viewer
5. ✅ **Analisar performance**: Identificar gargalos e otimizar

---

**Data de configuração**: 14/12/2025  
**Endpoint OTLP**: `http://localhost:4319/v1/traces`  
**Status**: ✅ Pronto para uso

# Qdrant Quick Start - População Automática de Jurisprudências

> **Status**: Implementação completa ✅ | População pendente ⏳

## 📋 O que é Qdrant?

Qdrant é um vector database usado para **pesquisa semântica de jurisprudências** no Assistente Jurídico. Permite que o agente `pesquisa-juris` encontre precedentes relevantes usando embeddings do Gemini.

## 🚀 Setup Rápido (5 minutos)

### 1. Criar Conta Qdrant Cloud

```bash
# 1. Acesse https://cloud.qdrant.io/
# 2. Crie conta gratuita (1GB free tier)
# 3. Crie novo cluster:
#    - Nome: assistente-juridico-prod
#    - Região: Frankfurt (mais próximo do Brasil)
#    - Tier: Free (1GB)
```

### 2. Obter Credenciais

```bash
# No dashboard do cluster, copie:
# - Cluster URL: https://xxxxx-yyyy.cloud.qdrant.io:6333
# - API Key: seu-api-key-aqui
```

### 3. Configurar Variáveis de Ambiente

```bash
# Adicione ao .env.local:
QDRANT_URL=https://seu-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=seu-api-key-aqui
QDRANT_COLLECTION=legal_docs
QDRANT_VECTOR_SIZE=768  # Gemini text-embedding-004
VITE_GEMINI_API_KEY=sua-gemini-key  # Necessário para embeddings
```

### 4. Inicializar Collection

```bash
# Criar collection legal_docs com 768 dimensões
npm run qdrant:init

# Verificar conexão
npm run qdrant:test
```

## 📊 População com DataJud (Automático)

### Opção 1: População Completa (Recomendado)

```bash
# Popular com jurisprudências do DataJud CNJ
npm run qdrant:populate-datajud

# Parâmetros:
# --max-docs=1000    # Limite de documentos (padrão: sem limite)
# --tribunal=STF     # Filtrar por tribunal (STF, STJ, TRF1, etc.)
# --ano=2024         # Filtrar por ano
# --batch-size=50    # Documentos por lote (padrão: 100)
```

### Opção 2: Dry-Run (Testar Sem Popular)

```bash
# Simular população sem inserir dados
npm run qdrant:populate:dry-run --max-docs=10

# Saída esperada:
# ✅ Conexão Qdrant OK
# ✅ Gemini Embeddings OK
# ✅ DataJud API OK
# 📊 10 documentos seriam inseridos
```

### Opção 3: População Incremental

```bash
# Popular apenas documentos novos (não duplicar)
npm run qdrant:populate-datajud --incremental

# Verifica payload.numero_processo antes de inserir
```

## 🔍 Verificar População

```bash
# Ver estatísticas da collection
npm run qdrant:stats

# Saída esperada:
# Collection: legal_docs
# Vectors: 1,234
# Points: 1,234
# Indexed: true
# Status: green
```

## 🧪 Testar Busca Semântica

```bash
# Testar busca por similaridade
npm run qdrant:search "jurisprudência sobre FGTS trabalhista"

# Saída: Top 5 precedentes mais relevantes
```

## 📋 Scripts Disponíveis

| Script | Descrição | Tempo Estimado |
|--------|-----------|----------------|
| `npm run qdrant:init` | Inicializar collection | 5s |
| `npm run qdrant:test` | Testar conexão | 2s |
| `npm run qdrant:populate-datajud` | Popular com DataJud | 5-30min |
| `npm run qdrant:populate:dry-run` | Simular população | 10s |
| `npm run qdrant:stats` | Ver estatísticas | 2s |
| `npm run qdrant:search "<query>"` | Testar busca | 3s |
| `npm run qdrant:clear` | Limpar collection | 5s |

## ⚠️ Importante - Não Execute Sem Autorização

**ATENÇÃO**: A população automática consome:
- **API Calls**: DataJud CNJ (limitado) + Gemini Embeddings (pago)
- **Storage**: Qdrant Cloud (1GB free tier)
- **Tempo**: 5-30 minutos para 1000-5000 documentos

**Sempre execute dry-run primeiro**:
```bash
npm run qdrant:populate:dry-run --max-docs=100
```

## 🔄 Atualização Periódica

### Automação via Cron (Futuro)

```typescript
// vercel.json - Adicionar job (quando implementado)
{
  "crons": [
    {
      "path": "/api/cron?action=qdrant-sync",
      "schedule": "0 2 * * 0"  // Domingo 2h
    }
  ]
}
```

## 📊 Monitoramento

### Dashboard Qdrant Cloud

- Acesse: https://cloud.qdrant.io/clusters
- Métricas: Requests, Storage, Points
- Alertas: Quota exceeded, Connection errors

### Application Insights

```typescript
// src/lib/qdrant-service.ts já possui tracing
import { tracingService } from '@/lib/tracing';

const span = tracingService.startSpan('qdrant-search', {
  collection: 'legal_docs',
  query: 'fgts trabalhista'
});
```

## 🐛 Troubleshooting

### Erro: "Collection not found"

```bash
# Recriar collection
npm run qdrant:init
```

### Erro: "API Key invalid"

```bash
# Verificar .env.local
echo $QDRANT_API_KEY

# Regenerar key no dashboard Qdrant
```

### Erro: "Quota exceeded"

```bash
# Verificar uso no dashboard
# Upgrade para plano pago ou limpar collection:
npm run qdrant:clear --confirm
```

### Erro: "Embedding failed"

```bash
# Verificar Gemini API Key
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"teste"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=$VITE_GEMINI_API_KEY"
```

## 📚 Documentação Adicional

- **Setup Completo**: `docs/QDRANT_SETUP_CHECKLIST.md`
- **Configuração Avançada**: `docs/QDRANT_CONFIG_COMPLETA.md`
- **DataJud Integration**: `docs/QDRANT_DATAJUD_AUTOMATION.md`
- **Agents Integration**: `docs/QDRANT_AGENTS_STATUS.md`

## ✅ Checklist de Ativação

- [ ] Criar conta Qdrant Cloud
- [ ] Configurar `QDRANT_URL` e `QDRANT_API_KEY`
- [ ] Inicializar collection (`npm run qdrant:init`)
- [ ] Testar conexão (`npm run qdrant:test`)
- [ ] Executar dry-run (`npm run qdrant:populate:dry-run --max-docs=10`)
- [ ] Popular com limite (`npm run qdrant:populate-datajud --max-docs=1000`)
- [ ] Verificar estatísticas (`npm run qdrant:stats`)
- [ ] Testar busca (`npm run qdrant:search "teste"`)
- [ ] Registrar agente `pesquisa-juris-qdrant` em `src/lib/agents.ts`
- [ ] Conectar UI em `src/components/AILegalResearch.tsx`

## 🎯 Próximos Passos

Após população bem-sucedida:

1. **Ativar agente**: Descomentar `pesquisa-juris-qdrant` em `src/lib/agents.ts`
2. **Conectar UI**: Refatorar `AILegalResearch.tsx` para usar Qdrant
3. **Automação**: Integrar com Mrs. Justin-e para pesquisa automática
4. **Monitoramento**: Configurar alertas no Qdrant Cloud

---

**Status Atual** (09/12/2024):
- ✅ Cluster Qdrant operacional
- ✅ Collection criada (768 dims)
- ✅ Scripts de população implementados
- ⏳ População pendente (aguardando aprovação)
- ⏳ Integração UI pendente

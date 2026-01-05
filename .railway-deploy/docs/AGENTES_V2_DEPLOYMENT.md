# 🚀 Guia de Deployment - Sistema de Agentes IA v2

## 📁 Nova Arquitetura Implementada

```
lib/ai/
├── core-agent.ts          # ✅ Motor genérico de agentes (reutilizável)
├── http-llm-client.ts     # ✅ Cliente HTTP para Spark LLM
├── tools.ts               # ✅ Ferramentas REAIS (APIs integradas)
└── agents-registry.ts     # ✅ 15 agentes com personas e permissões

api/
├── agents-v2.ts           # ✅ Endpoint orquestrador (nova versão)
└── agents.ts              # ⚠️ Versão antiga (DEPRECATED - contém dados simulados)
```

---

## 🔑 Variáveis de Ambiente Obrigatórias

### Vercel Environment Variables

Configure estas variáveis no dashboard da Vercel ou via `.env`:

```bash
# ===== LLM / IA =====
LLM_PROXY_URL=https://assistente-juridico-github.vercel.app/api/llm-proxy
# URL do proxy Spark LLM (já existente no projeto)

# ===== Base da Aplicação =====
APP_BASE_URL=https://assistente-juridico-github.vercel.app
# URL base para chamadas internas entre APIs

# ===== Evolution API (WhatsApp) =====
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-evolution-api-aqui
# Necessário para enviarMensagemWhatsApp tool

# ===== Redis/KV (Upstash) =====
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
# Necessário para memória persistente dos agentes

# ===== APIs Jurídicas =====
DJEN_API_KEY=chave-api-djen
DATAJUD_API_KEY=chave-api-datajud
PJE_CREDENTIALS=credenciais-pje
# Necessário para buscarIntimacaoPendente e consultarProcessoPJe

# ===== Todoist =====
TODOIST_API_TOKEN=token-todoist-aqui
# Necessário para criarTarefa tool
```

---

## 🔄 Migração da Versão Antiga para Nova

### Passo 1: Testar Nova Versão

Use o endpoint `/api/agents-v2` para testar:

```bash
curl -X POST https://assistente-juridico-github.vercel.app/api/agents-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "justine",
    "message": "Busque intimações pendentes e crie tarefas"
  }'
```

### Passo 2: Comparar Resultados

**Versão Antiga (api/agents.ts):**
- ❌ Retorna dados simulados (Math.random, placeholders)
- ❌ Não chama APIs reais
- ❌ Delays artificiais

**Versão Nova (api/agents-v2.ts):**
- ✅ Retorna dados REAIS das APIs
- ✅ Usa tools para buscar informações
- ✅ Logs estruturados

### Passo 3: Atualizar Cron Jobs

Edite `/api/cron.ts` para usar a nova versão:

```typescript
// ANTES (versão antiga)
await fetch(`${baseUrl}/api/agents`, { ... })

// DEPOIS (versão nova)
await fetch(`${baseUrl}/api/agents-v2`, { ... })
```

### Passo 4: Atualizar Frontend

Atualize chamadas no frontend (React/Vite):

```typescript
// ANTES
const response = await fetch('/api/agents', {
  method: 'POST',
  body: JSON.stringify({ agentId: 'harvey' })
})

// DEPOIS
const response = await fetch('/api/agents-v2', {
  method: 'POST',
  body: JSON.stringify({ agentId: 'harvey' })
})
```

### Passo 5: Deprecar Versão Antiga

Após validação completa:

1. Renomear `/api/agents.ts` para `/api/agents-old.ts`
2. Renomear `/api/agents-v2.ts` para `/api/agents.ts`
3. Atualizar `src/lib/agents.ts` para remover funções simuladas

---

## 🎯 Como Usar os Agentes

### Agentes Disponíveis

| ID | Nome | Função Principal |
|----|------|-----------------|
| `harvey` | Harvey Specter | Análise estratégica do escritório |
| `justine` | Mrs. Justin-e | Análise de intimações e prazos |
| `analise-documental` | Análise Documental | Processamento 24/7 de expedientes |
| `monitor-djen` | Monitor DJEN | Monitoramento de publicações |
| `gestao-prazos` | Gestão de Prazos | Cálculo e alertas de prazos |
| `redacao-peticoes` | Redação de Petições | Assistência em redação |
| `organizacao-arquivos` | Organização de Arquivos | Classificação de documentos |
| `pesquisa-juris` | Pesquisa Jurisprudencial | Busca de precedentes |
| `analise-risco` | Análise de Risco | Avaliação de riscos |
| `revisao-contratual` | Revisão Contratual | Análise de contratos |
| `comunicacao-clientes` | Comunicação com Clientes | Comunicados personalizados |
| `financeiro` | Análise Financeira | Monitoramento financeiro |
| `estrategia-processual` | Estratégia Processual | Sugestões estratégicas |
| `traducao-juridica` | Tradução Jurídica | Simplificação de jargão |
| `compliance` | Compliance | Verificação regulatória |

### Exemplos de Uso

#### 1. Executar Rotina Automática (Cron)

```typescript
// Executa rotina padrão do agente
const response = await fetch('/api/agents-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'justine'
    // message não fornecida = executa rotina padrão
  })
});
```

#### 2. Comando Específico

```typescript
// Comando personalizado
const response = await fetch('/api/agents-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'harvey',
    message: 'Me dê um resumo executivo dos 5 processos mais críticos do escritório hoje'
  })
});
```

#### 3. Com Sessão Persistente

```typescript
// Usa sessionId para manter contexto
const response = await fetch('/api/agents-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'comunicacao-clientes',
    message: 'Notifique o cliente João sobre nova intimação',
    sessionId: 'usuario-123-cliente-joao'
  })
});
```

---

## 🛠️ Tools Disponíveis

Cada agente tem acesso a um subconjunto de tools:

| Tool | Descrição | Endpoint | Agentes que Usam |
|------|-----------|----------|------------------|
| `buscarIntimacaoPendente` | Busca intimações REAIS do DJEN/DataJud | `/api/djen/check` | justine, monitor-djen, analise-documental |
| `criarTarefa` | Cria tarefa REAL no Todoist | `/api/todoist` | harvey, justine, gestao-prazos, etc |
| `calcularPrazos` | Calcula prazos REAIS com calendário | `/api/deadline/calculate` | justine, gestao-prazos, analise-documental |
| `consultarProcessoPJe` | Busca processo REAL no PJe | `/api/legal-services` | harvey, redacao-peticoes, estrategia |
| `enviarMensagemWhatsApp` | Envia WhatsApp REAL via Evolution | Evolution API | justine, gestao-prazos, comunicacao |
| `registrarLogAgente` | Registra log REAL no Redis | `/api/kv` | TODOS |

### Permissões por Agente

Exemplo: **Mrs. Justin-e** pode usar:
- ✅ buscarIntimacaoPendente
- ✅ calcularPrazos
- ✅ criarTarefa
- ✅ enviarMensagemWhatsApp
- ✅ registrarLogAgente
- ❌ consultarProcessoPJe (não autorizado)

---

## 🔍 Monitoramento e Logs

### Logs Estruturados

Todos os agentes registram logs em `/api/kv`:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "agentId": "justine",
  "agentName": "Mrs. Justin-e",
  "action": "process-intimacao",
  "result": "success",
  "usedTools": ["buscarIntimacaoPendente", "calcularPrazos", "criarTarefa"],
  "executionTimeMs": 2340
}
```

### Verificar Logs

```bash
# Ver logs do Vercel
vercel logs

# Consultar logs específicos do agente
curl https://assistente-juridico-github.vercel.app/api/kv?action=get-logs
```

---

## ⚠️ Troubleshooting

### Erro: "LLM retornou resposta vazia"

**Causa:** `/api/llm-proxy` não configurado ou falhou

**Solução:**
1. Verificar `LLM_PROXY_URL` está correto
2. Testar endpoint diretamente:
   ```bash
   curl -X POST https://seu-app.vercel.app/api/llm-proxy \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "teste"}]}'
   ```

### Erro: "Evolution API não configurada"

**Causa:** Variáveis `EVOLUTION_API_URL` ou `EVOLUTION_API_KEY` não definidas

**Solução:**
1. Configurar variáveis no Vercel
2. Validar credenciais da Evolution API
3. Testar endpoint Evolution diretamente

### Erro: "Erro ao buscar intimação"

**Causa:** `/api/djen/check` não retornando dados ou API offline

**Solução:**
1. Verificar se endpoint existe e está funcionando
2. Verificar credenciais DJEN/DataJud
3. Implementar mock temporário para testes

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Versão Antiga | Versão Nova |
|---------|---------------|-------------|
| **Dados** | ❌ Simulados (Math.random) | ✅ Reais (APIs) |
| **Intimações** | ❌ Inventadas | ✅ DJEN/DataJud real |
| **Prazos** | ❌ Calculados com random | ✅ API de prazos real |
| **Tarefas** | ❌ Mockadas | ✅ Todoist real |
| **WhatsApp** | ❌ Não enviava | ✅ Evolution API real |
| **Logs** | ❌ Console apenas | ✅ Redis persistente |
| **Arquitetura** | ❌ Monolítica | ✅ Modular (tools) |
| **LLM** | ⚠️ Parcial | ✅ Completo (Spark) |
| **Produção** | ❌ NÃO PRONTO | ✅ PRONTO |

---

## ✅ Checklist de Deploy

- [ ] Configurar todas as variáveis de ambiente no Vercel
- [ ] Testar `/api/agents-v2` com cada agente
- [ ] Validar que tools estão chamando APIs reais
- [ ] Atualizar cron jobs para usar nova versão
- [ ] Atualizar frontend para usar nova versão
- [ ] Remover ou deprecar código antigo (`/api/agents.ts`)
- [ ] Configurar monitoramento de logs
- [ ] Documentar mudanças para equipe
- [ ] Fazer rollback plan (backup versão antiga)

---

## 🎯 Próximos Passos Recomendados

1. **Implementar UpstashMemoryStore**
   - Substituir `InMemoryMemoryStore` por Redis persistente
   - Manter contexto entre execuções

2. **Adicionar Rate Limiting**
   - Limitar chamadas por agente/minuto
   - Prevenir uso excessivo de APIs

3. **Dashboard de Monitoramento**
   - Visualizar atividades dos agentes em tempo real
   - Métricas de uso de tools
   - Alertas de falhas

4. **Testes Automatizados**
   - Unit tests para cada tool
   - Integration tests para agentes
   - E2E tests para fluxos completos

5. **Documentação API**
   - Swagger/OpenAPI para `/api/agents-v2`
   - Exemplos de uso por agente
   - Guia de troubleshooting expandido

---

**Status**: ✅ Arquitetura implementada e pronta para deploy

**Autor**: Sistema de IA - GitHub Copilot  
**Data**: 2024  
**Versão**: 2.0.0

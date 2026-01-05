# 🔍 Guia de Validação - Sentry AI Monitoring v2

## ✅ Status da Instrumentação

**Fase 1**: Harvey Specter + Backend ✅ COMPLETO
- Frontend: `createChatSpan()` em `useAIStreaming`
- Backend: `createBackendChatSpan()` em `api/llm-stream.ts`
- Commits: `313af69`, `d8ce630`, `d7df610`, `7270736`

---

## 📊 Validação Manual no Dashboard Sentry.io

### Passo 1: Acessar Dashboard

1. **Login no Sentry**: https://sentry.io
2. **Selecionar projeto**: `assistente-juridico-p`
3. **Navegar**: `Insights` → `AI` → `AI Agents`

### Passo 2: Verificar Harvey Specter (Frontend)

**Filtros recomendados**:
```
gen_ai.agent.name = "harvey-specter"
gen_ai.system = "gcp.gemini"
conversation.session_id IS NOT NULL
```

**Spans esperados** (por conversação):
- **Operation**: `gen_ai.chat`
- **Name**: `Harvey Specter Chat`
- **Duration**: 2-10 segundos (dependendo da resposta)

**Atributos que devem aparecer**:
```json
{
  "gen_ai.system": "gcp.gemini",
  "gen_ai.request.model": "gemini-2.5-pro",
  "gen_ai.operation.name": "chat",
  "gen_ai.agent.name": "harvey-specter",
  "gen_ai.request.temperature": 0.8,
  "gen_ai.request.max_tokens": 2000,
  "conversation.session_id": "uuid-v4",
  "conversation.turn": 1, // incrementa a cada mensagem
  "gen_ai.request.messages": "[{\"role\":\"user\",\"content\":\"...\"}]"
}
```

**Verificações**:
- ✅ Cada mensagem do usuário gera 1 span
- ✅ `conversation.turn` incrementa sequencialmente (1, 2, 3...)
- ✅ `conversation.session_id` é o mesmo para toda a conversa
- ✅ Mensagens do usuário aparecem em `gen_ai.request.messages`

### Passo 3: Verificar Backend (Server-Side)

**Filtros recomendados**:
```
server.side = true
vercel.function = "llm-stream"
gen_ai.system IN ["openai", "gcp.gemini"]
```

**Spans esperados**:
- **Operation**: `gen_ai.chat`
- **Name**: `Backend LLM Streaming - OpenAI` ou `Backend LLM Streaming - Gemini`
- **Duration**: 2-10 segundos

**Atributos que devem aparecer**:
```json
{
  "gen_ai.system": "gcp.gemini", // ou "openai"
  "gen_ai.request.model": "gemini-2.5-pro", // ou "gpt-4o-mini"
  "server.side": true,
  "vercel.function": "llm-stream",
  "stream.completed": true,
  "gen_ai.request.messages": "[{\"role\":\"user\",\"content\":\"...\"}]"
}
```

**Verificações**:
- ✅ Spans server-side aparecem separados dos frontend
- ✅ `server.side: true` confirma origem backend
- ✅ `stream.completed: true` indica conclusão bem-sucedida
- ✅ Erros capturam `span.setStatus(2)` com stacktrace

### Passo 4: Correlação Frontend ↔ Backend

**Como verificar**:
1. Enviar mensagem no Harvey Specter Chat
2. Buscar span frontend por `conversation.session_id`
3. Buscar span backend no mesmo intervalo de tempo
4. Verificar se timestamps coincidem (±1-2 segundos)

**Esperado**:
```
Timeline:
[Frontend] gen_ai.chat (Harvey Specter) ─────────────────┐
    └─> [Backend] gen_ai.chat (llm-stream) ───────────┘
```

**Atributos para correlação**:
- `conversation.session_id` (frontend)
- `gen_ai.request.messages` (deve ser idêntico)
- Timestamp de início (frontend) ≈ Timestamp de início (backend)

---

## 🧪 Teste Passo a Passo

### Preparação

```bash
# 1. Dev server deve estar rodando
npm run dev
# Abre em: http://localhost:5175

# 2. Verificar se Sentry está configurado
# Verificar se SENTRY_DSN está em .env
```

### Teste 1: Conversação Básica (Frontend)

**Ação**:
1. Abrir Harvey Specter Chat
2. Enviar mensagem: "Olá Harvey, como vai?"
3. Aguardar resposta
4. Enviar segunda mensagem: "Me explique sobre prazos processuais"
5. Aguardar resposta

**Validação no Sentry**:
- ✅ 2 spans criados
- ✅ `conversation.turn = 1` no primeiro
- ✅ `conversation.turn = 2` no segundo
- ✅ Mesmo `conversation.session_id` em ambos
- ✅ Duração razoável (2-10s)
- ✅ Sem erros

### Teste 2: Streaming Backend

**Ação**:
1. Enviar mensagem longa: "Harvey, redija uma petição inicial sobre..."
2. Observar resposta sendo streamada em tempo real
3. Aguardar conclusão completa

**Validação no Sentry**:
- ✅ Span backend com `server.side: true`
- ✅ `stream.completed: true`
- ✅ Modelo correto: `gemini-2.5-pro`
- ✅ `gen_ai.request.messages` contém prompt completo

### Teste 3: Erro de Backend

**Ação**:
1. Simular erro: Desabilitar `GEMINI_API_KEY` temporariamente
2. Enviar mensagem no Harvey
3. Aguardar erro

**Validação no Sentry**:
- ✅ Span marcado como erro (vermelho)
- ✅ `span.status = 2` (error)
- ✅ Stacktrace disponível
- ✅ Mensagem de erro: "Gemini error: 401..."

### Teste 4: Múltiplas Conversas

**Ação**:
1. Abrir 3 abas diferentes
2. Iniciar conversação em cada uma
3. Enviar mensagens diferentes

**Validação no Sentry**:
- ✅ 3 `conversation.session_id` diferentes
- ✅ Spans não se misturam entre conversas
- ✅ Cada conversa tem seu próprio `turn` counter

---

## 📈 Métricas Esperadas

### Performance

| Métrica | Valor Esperado |
|---------|----------------|
| **Latência Frontend** | 50-200ms (apenas wrapping) |
| **Latência Backend** | 2-10s (LLM completo) |
| **Overhead Sentry** | <5% (negligível) |
| **Taxa de Erro** | <1% |

### Cobertura

| Componente | Status |
|------------|--------|
| Harvey Specter Chat | ✅ 100% |
| Backend OpenAI | ✅ 100% |
| Backend Gemini | ✅ 100% |
| Mrs. Justin-e | ⏳ Fase 2 |
| Redação de Petições | ⏳ Fase 2 |
| Monitor DJEN | ⏳ Fase 2 |

---

## 🚀 Deploy em Produção

### Verificações Pré-Deploy

```bash
# 1. TypeScript compila
npm run type-check
# ✅ Sem erros

# 2. ESLint OK
npm run lint
# ✅ Max 150 warnings

# 3. Build OK
npm run build
# ✅ dist/ gerado

# 4. Variáveis de ambiente
cat .env.production
# ✅ SENTRY_DSN configurado
```

### Deploy Vercel

```bash
# Deploy automático via GitHub
git push origin main
# ✅ Vercel detecta push
# ✅ Build em São Paulo (gru1)
# ✅ Deploy em https://assistente-juridico-github.vercel.app
```

### Monitoramento Pós-Deploy

**URLs para monitorar**:
- **App**: https://assistente-juridico-github.vercel.app
- **Health**: https://assistente-juridico-github.vercel.app/api/health
- **Sentry Dashboard**: https://sentry.io/insights/ai/

**Verificações**:
1. Acessar app em produção
2. Testar Harvey Specter Chat
3. Enviar 3 mensagens
4. Aguardar 5 minutos
5. Verificar spans no Sentry
6. Confirmar `server.side: true` em spans backend

**Alertas esperados**:
- ✅ Nenhum erro crítico
- ✅ Latência <10s
- ✅ Taxa de sucesso >99%

---

## 🐛 Troubleshooting

### Problema: Spans não aparecem no Sentry

**Causas possíveis**:
1. `SENTRY_DSN` não configurado
2. Sentry não inicializado
3. Firewall bloqueando sentry.io

**Solução**:
```typescript
// Verificar em src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: config.sentry.dsn,
  integrations: [/* ... */],
});

// Testar manualmente
Sentry.captureMessage('Test from console');
```

### Problema: Backend spans não correlacionam com frontend

**Causas possíveis**:
1. `conversation.session_id` não sendo passado
2. Timestamps dessincronizados
3. Spans em projetos Sentry diferentes

**Solução**:
- Verificar se frontend passa `sessionId` no request
- Sincronizar relógios (NTP)
- Confirmar mesmo projeto Sentry

### Problema: Atributos faltando

**Causas possíveis**:
1. Atributos não setados no código
2. Valores undefined/null
3. Stringificação JSON falhou

**Solução**:
```typescript
// Sempre validar antes de setar
if (messages && messages.length > 0) {
  span?.setAttribute('gen_ai.request.messages', JSON.stringify(messages));
}
```

---

## ✅ Checklist Final

### Frontend (Harvey Specter)
- [ ] Spans aparecem com `gen_ai.agent.name = "harvey-specter"`
- [ ] `conversation.session_id` único por conversa
- [ ] `conversation.turn` incrementa corretamente
- [ ] Mensagens do usuário em `gen_ai.request.messages`
- [ ] Sem erros no console browser

### Backend (api/llm-stream.ts)
- [ ] Spans com `server.side: true`
- [ ] `vercel.function = "llm-stream"`
- [ ] `stream.completed: true` ao finalizar
- [ ] Erros capturam stacktrace completo
- [ ] Modelo correto (`gemini-2.5-pro` ou `gpt-4o-mini`)

### Produção (Vercel)
- [ ] Deploy bem-sucedido
- [ ] Health check OK: `/api/health`
- [ ] Spans aparecem no Sentry em produção
- [ ] Correlação frontend↔backend funcionando
- [ ] Latência aceitável (<10s)

---

## 📚 Recursos

- **Documentação oficial**: https://docs.sentry.io/platforms/javascript/guides/react/ai-agents/
- **Dashboard**: https://sentry.io/insights/ai/
- **Código**: `src/lib/sentry-gemini-integration-v2.ts`
- **Guia completo**: `docs/SENTRY_AI_MONITORING.md`
- **Testes**: `scripts/test-sentry-instrumentation.ts`

---

**Última atualização**: 5 de dezembro de 2025
**Autor**: GitHub Copilot
**Status**: ✅ Fase 1 Completa - Pronto para validação

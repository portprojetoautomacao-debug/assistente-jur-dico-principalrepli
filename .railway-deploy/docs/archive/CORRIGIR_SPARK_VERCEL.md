# Guia Rápido: Corrigir Conexão Spark na Vercel

## 🎯 Objetivo

Resolver o problema de conexão com a API Spark **SEM mudar a arquitetura**.

## ⚡ Checklist Rápido (5 minutos)

### 1️⃣ Variáveis de Ambiente no Vercel

Acesse: Vercel Dashboard → Seu Projeto → Settings → Environment Variables

**Variáveis Obrigatórias:**

| Variável | Valor | Ambientes |
|----------|-------|-----------|
| `GITHUB_TOKEN` | Seu token GitHub | Production, Preview, Development |
| `GITHUB_RUNTIME_PERMANENT_NAME` | `97a1cb1e48835e0ecf1e` | Production, Preview, Development |
| `GITHUB_API_URL` | `https://api.github.com` | Production, Preview, Development |

**Como criar GITHUB_TOKEN:**
1. Acesse: https://github.com/settings/tokens
2. Generate new token (classic)
3. Scopes necessários: `repo`, `runtime:write`
4. Copie o token
5. Cole no Vercel

### 2️⃣ Verificar Proxy Spark

O arquivo `/api/spark-proxy.ts` deve estar configurado corretamente. Vamos verificar:

```bash
cd /home/runner/work/assistente-jurdico-p/assistente-jurdico-p
cat api/spark-proxy.ts | grep -A 5 "githubRuntimeName"
```

### 3️⃣ Testar Localmente

```bash
# 1. Criar .env local com as variáveis
cat > .env << 'EOF'
GITHUB_TOKEN=seu_token_aqui
GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e
GITHUB_API_URL=https://api.github.com
EOF

# 2. Rodar app
npm run dev

# 3. Em outro terminal, testar
curl http://localhost:5173/_spark/llm \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "oi"}]}'
```

## 🔍 Diagnóstico de Erros Comuns

### Erro: "GITHUB_RUNTIME_PERMANENT_NAME environment variable is not set"

**Causa:** Variável não configurada na Vercel

**Solução:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add New
3. Key: `GITHUB_RUNTIME_PERMANENT_NAME`
4. Value: `97a1cb1e48835e0ecf1e`
5. Environments: Production, Preview, Development
6. Save

### Erro: "GITHUB_TOKEN environment variable is not set"

**Causa:** Token não configurado na Vercel

**Solução:**
1. Criar token: https://github.com/settings/tokens
2. Copiar token
3. Vercel → Settings → Environment Variables → Add New
4. Key: `GITHUB_TOKEN`
5. Value: [seu token]
6. Mark as Sensitive
7. Environments: Production, Preview, Development
8. Save

### Erro: 403 Forbidden

**Causa:** Token inválido ou sem permissões

**Solução:**
1. Verificar scopes do token
2. Recriar token com permissões corretas
3. Atualizar variável na Vercel

### Erro: 401 Unauthorized

**Causa:** Token expirado ou formato incorreto

**Solução:**
1. Verificar se token está ativo no GitHub
2. Verificar formato: não precisa de "Bearer" prefix
3. Atualizar token na Vercel

### Erro: Timeout

**Causa:** Request demora >10s (limite free tier)

**Soluções:**
1. Otimizar request (menos tokens)
2. Upgrade Vercel Pro (60s timeout)
3. Implementar retry logic

## 🛠️ Correções Comuns

### Atualizar Proxy para Melhor Error Handling

Adicionar mais logs no `/api/spark-proxy.ts`:

```typescript
console.log('Environment check:', {
  hasToken: !!githubToken,
  hasRuntimeName: !!githubRuntimeName,
  apiUrl: githubApiUrl
});

console.log('Making request to:', targetUrl);
```

### Adicionar Health Check

Criar `/api/health.ts`:

```typescript
export default async function handler(req, res) {
  const checks = {
    github_token: !!process.env.GITHUB_TOKEN,
    runtime_name: !!process.env.GITHUB_RUNTIME_PERMANENT_NAME,
    api_url: !!process.env.GITHUB_API_URL
  };
  
  const allOk = Object.values(checks).every(v => v);
  
  res.status(allOk ? 200 : 500).json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
}
```

Testar: `https://seu-app.vercel.app/api/health`

## 📋 Passo a Passo Completo

### Passo 1: Configurar Variáveis (10 min)

1. ✅ Criar GitHub Token
2. ✅ Adicionar GITHUB_TOKEN na Vercel
3. ✅ Adicionar GITHUB_RUNTIME_PERMANENT_NAME na Vercel
4. ✅ Adicionar GITHUB_API_URL na Vercel (opcional)

### Passo 2: Redeploy (5 min)

1. ✅ Vercel Dashboard → Deployments
2. ✅ Latest deployment → ⋯ → Redeploy
3. ✅ Aguardar deploy completar

### Passo 3: Testar (5 min)

1. ✅ Acessar: `https://seu-app.vercel.app/api/health`
2. ✅ Verificar se todas checks estão `true`
3. ✅ Testar funcionalidade que usa Spark
4. ✅ Verificar logs se houver erro

### Passo 4: Verificar Logs (se erro persistir)

1. ✅ Vercel Dashboard → Logs
2. ✅ Filtrar por erros
3. ✅ Identificar mensagem específica
4. ✅ Aplicar correção baseada no erro

## 🚨 Se Nada Funcionar

Tente estas alternativas em ordem:

### 1. Limpar Cache da Vercel
```bash
# No terminal local
vercel --prod --force
```

### 2. Verificar Runtime Name
O valor correto é: `97a1cb1e48835e0ecf1e`

Pode verificar no GitHub:
1. Acesse seu GitHub Runtime
2. Copie o ID correto
3. Atualize variável

### 3. Testar Endpoint Direto

```bash
# Testar direto na API GitHub (sem proxy)
curl https://api.github.com/runtime/97a1cb1e48835e0ecf1e/llm \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "teste"}]}'
```

Se este funcionar, problema está no proxy.
Se este falhar, problema está no token/runtime.

## ✅ Validação Final

Após correções, verificar:

- [ ] Health check retorna 200 OK
- [ ] Todas variáveis configuradas
- [ ] Deploy bem-sucedido
- [ ] Logs sem erros 403/401
- [ ] Funcionalidade Spark funcionando
- [ ] Chat com Harvey responde

## 📞 Ajuda Adicional

Se após seguir este guia o problema persistir, me informe:

1. Mensagem de erro exata
2. Screenshot dos logs do Vercel
3. Screenshot das variáveis de ambiente
4. Resposta do `/api/health`

Assim posso diagnosticar melhor!

## 🎯 Resultado Esperado

Após seguir este guia:
- ✅ App conecta com Spark API
- ✅ Harvey (chatbot) funciona
- ✅ Agentes autônomos funcionam
- ✅ KV storage funciona
- ✅ Sem erros 403/401

---

**Tempo estimado:** 20-30 minutos
**Dificuldade:** Fácil
**Custo:** $0 (mantém plan gratuito)


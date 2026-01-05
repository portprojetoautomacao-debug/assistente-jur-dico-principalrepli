# 🔍 Guia de Configuração: Sentry + OpenTelemetry Tracing (Local)

## 📋 Objetivo

Configurar **Sentry** e **OpenTelemetry Tracing** no ambiente de desenvolvimento local para debugging avançado de agentes IA.

---

## 🎯 **Opções de Configuração**

### Opção 1: **Console Apenas** (Padrão - Sem configuração)

✅ **Recomendado para**: Desenvolvimento normal, sem debugging avançado  
✅ **Vantagens**: Zero configuração, logs simples no console  
❌ **Limitações**: Sem visualização de traces, sem Sentry

**Configuração em `.env.local`:**
```bash
# Tracing desabilitado (padrão)
VITE_ENABLE_TRACING=console

# Sentry desabilitado (padrão)
# VITE_SENTRY_DSN=
```

**O que acontece:**
- ✅ Tracing funciona apenas com logs no console do navegador
- ✅ Sentry desabilitado
- ✅ Sistema funciona normalmente

---

### Opção 2: **AI Toolkit Trace Viewer** (Debugging Avançado)

✅ **Recomendado para**: Debugging de agentes IA, análise de performance  
✅ **Vantagens**: Visualização gráfica de traces, análise detalhada  
❌ **Limitações**: Requer instalação do AI Toolkit

**Passo 1: Instalar AI Toolkit**
```bash
npm install -g @vscode/ai-toolkit
```

**Passo 2: Iniciar AI Toolkit**
```bash
ai-toolkit start
```

**Passo 3: Configurar `.env.local`**
```bash
# Habilitar OpenTelemetry com AI Toolkit
VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces
VITE_ENABLE_TRACING=true
```

**Passo 4: Reiniciar Dev Server**
```bash
npm run dev
```

**Passo 5: Visualizar Traces**
1. Abra o Command Palette (`Ctrl+Shift+P`)
2. Execute: `AI Toolkit: Open Trace Viewer`
3. Traces aparecerão automaticamente conforme você usa o sistema

---

### Opção 3: **Sentry em Desenvolvimento**

✅ **Recomendado para**: Testar integração Sentry antes de produção  
✅ **Vantagens**: Error tracking completo, reprodução de bugs  
❌ **Limitações**: Requer conta Sentry (gratuita)

**Passo 1: Criar Conta Sentry** (Gratuito)
1. Acesse: https://sentry.io/signup/
2. Crie uma organização
3. Crie um projeto React

**Passo 2: Obter DSN**
1. Acesse: Settings → Projects → Seu Projeto → Client Keys (DSN)
2. Copie o DSN (ex: `https://abc123@o456.ingest.sentry.io/789`)

**Passo 3: Configurar `.env.local`**
```bash
# Habilitar Sentry em dev
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
VITE_APP_VERSION=1.0.0-dev
```

**Passo 4: Reiniciar Dev Server**
```bash
npm run dev
```

**O que acontece:**
- ✅ Erros enviados automaticamente para Sentry
- ✅ Performance monitoring ativo (100% sample rate em dev)
- ✅ Session replay desabilitado em dev (economia de banda)

---

### Opção 4: **Sentry + AI Toolkit** (Combo Completo)

✅ **Recomendado para**: Debugging máximo  
✅ **Vantagens**: Error tracking + Trace visualization  

**Configuração em `.env.local`:**
```bash
# Combo completo
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces
VITE_ENABLE_TRACING=true
VITE_APP_VERSION=1.0.0-dev
```

---

## 🧪 **Testando a Configuração**

### 1. Verificar Logs no Console

Após iniciar `npm run dev`, você deve ver:

```bash
[OpenTelemetry] ⚠️ OTLP desabilitado - usando apenas console tracing
# OU
✅ [OpenTelemetry] Inicializado com sucesso
📊 [OpenTelemetry] Endpoint: http://localhost:4318/v1/traces

[Monitoring] Sentry desabilitado - VITE_SENTRY_DSN não configurado
# OU
[Monitoring] ⚠️ Sentry habilitado em DESENVOLVIMENTO
```

### 2. Testar Sentry (Se Habilitado)

No console do navegador:
```javascript
throw new Error("Teste Sentry - apague este erro depois");
```

Verificar se o erro aparece no dashboard do Sentry.

### 3. Testar AI Toolkit (Se Habilitado)

1. Use qualquer funcionalidade do sistema (ex: criar processo)
2. Abra o AI Toolkit Trace Viewer (`Ctrl+Shift+P` → `AI Toolkit: Open Trace Viewer`)
3. Veja os traces aparecerem em tempo real

---

## 🔧 **Troubleshooting**

### Erro: "POST http://localhost:4318/v1/traces 404"

**Problema:** AI Toolkit não está rodando  
**Solução:**
```bash
ai-toolkit start
```

### Erro: "POST /api/llm-proxy 403 Forbidden"

**Problema:** Não relacionado a tracing, é erro de autenticação da API  
**Solução:** Verificar se `VITE_GEMINI_API_KEY` está configurado

### Sentry não está capturando erros

**Problema:** DSN inválido ou não configurado  
**Solução:**
1. Verificar se `VITE_SENTRY_DSN` está no `.env.local`
2. Verificar se DSN é válido (deve começar com `https://`)
3. Reiniciar dev server

---

## 📊 **Comparação de Opções**

| Feature | Console | AI Toolkit | Sentry | Combo |
|---------|---------|-----------|--------|-------|
| Zero configuração | ✅ | ❌ | ❌ | ❌ |
| Logs de traces | ✅ | ✅ | ❌ | ✅ |
| Visualização gráfica | ❌ | ✅ | ❌ | ✅ |
| Error tracking | ❌ | ❌ | ✅ | ✅ |
| Performance monitoring | ❌ | ✅ | ✅ | ✅ |
| Requer instalação | ❌ | ✅ | ✅ | ✅ |
| Custo | Grátis | Grátis | Grátis | Grátis |

---

## 🎯 **Recomendação Final**

### Para Desenvolvimento Normal:
👉 **Opção 1 (Console Apenas)** - Zero configuração

### Para Debugging de Agentes IA:
👉 **Opção 2 (AI Toolkit)** - Visualização de traces

### Para Testar Sentry:
👉 **Opção 3 (Sentry Dev)** - Error tracking

### Para Debugging Máximo:
👉 **Opção 4 (Combo)** - Tudo habilitado

---

## 📝 **Arquivo `.env.local` Completo**

```bash
# ============================================
# AMBIENTE DE DESENVOLVIMENTO LOCAL
# ============================================

# Modo de autenticação
VITE_AUTH_MODE=simple

# ============================================
# GEMINI AI (OBRIGATÓRIO)
# ============================================
VITE_GEMINI_API_KEY=sua-chave-aqui
GEMINI_API_KEY=sua-chave-aqui

# ============================================
# UPSTASH REDIS/KV (OBRIGATÓRIO)
# ============================================
UPSTASH_REDIS_REST_URL=sua-url-aqui
UPSTASH_REDIS_REST_TOKEN=seu-token-aqui

# ============================================
# SENTRY (OPCIONAL - DESENVOLVIMENTO)
# ============================================
# Descomentar para habilitar Sentry em dev
# VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
VITE_APP_VERSION=1.0.0-dev

# ============================================
# OPENTELEMETRY TRACING (OPCIONAL)
# ============================================
# Opção 1: Desabilitado (padrão)
VITE_ENABLE_TRACING=console

# Opção 2: AI Toolkit (descomentar para habilitar)
# VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces
# VITE_ENABLE_TRACING=true

# ============================================
# DEVELOPMENT
# ============================================
NODE_ENV=development
VITE_PORT=5173

# ============================================
# LGPD
# ============================================
VITE_ENABLE_PII_FILTERING=true
VITE_LOG_LEVEL=info
```

---

## ✅ **Checklist de Configuração**

- [ ] Criar `.env.local` com configurações básicas
- [ ] Configurar `VITE_GEMINI_API_KEY` e `UPSTASH_REDIS_REST_*`
- [ ] Decidir se quer Sentry (opcional)
- [ ] Decidir se quer AI Toolkit (opcional)
- [ ] Reiniciar `npm run dev`
- [ ] Verificar logs no console
- [ ] Testar funcionalidades básicas

---

**Pronto!** Seu ambiente local está configurado com observabilidade opcional. 🎉

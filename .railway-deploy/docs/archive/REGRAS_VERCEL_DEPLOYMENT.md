# 🚨 REGRAS CRÍTICAS PARA DEPLOYMENT NO VERCEL

## ⚠️ LEIA ANTES DE ALTERAR O `vercel.json`

### 🔥 REGRA FUNDAMENTAL - NUNCA VIOLE ISSO:

**Se `rewrites`, `redirects`, `headers`, `cleanUrls` ou `trailingSlash` estão sendo usados, então `routes` NÃO PODE estar presente.**

```json
// ❌ NUNCA FAÇA ISSO - VAI QUEBRAR O DEPLOY
{
  "rewrites": [...],
  "routes": [...]     // ← ERRO! Conflito fatal
}

// ✅ CORRETO - Uma das opções:
{
  "rewrites": [...]   // Sem routes
}

// OU

{
  "routes": [...]     // Sem rewrites/headers/redirects
}
```

## 🛡️ Configuração Atual (NÃO ALTERE!)

A configuração atual funciona e está validada:

```json
{
  "version": 2,
  "buildCommand": "npm ci && npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/_spark/llm",
      "destination": "/api/llm-proxy"
    },
    {
      "source": "/_spark/kv/:key*",
      "destination": "/api/kv"
    },
    {
      "source": "/_spark/:service/:path*",
      "destination": "/api/spark-proxy?service=:service&path=:path"
    },
    {
      "source": "/_spark/:service",
      "destination": "/api/spark-proxy?service=:service"
    },
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/html; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'none'"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate"
        }
      ]
    }
  ]
}
```

## 🚫 O QUE NÃO FAZER

### ❌ Erro Fatal #1: Misturar `routes` com `rewrites`
```json
{
  "rewrites": [...],
  "routes": [...]     // NUNCA!
}
```

### ❌ Erro Fatal #2: Adicionar `routes` quando já tem `headers`
```json
{
  "headers": [...],
  "routes": [...]     // NUNCA!
}
```

### ❌ Erro Fatal #3: Rewrite muito amplo que intercepta assets
```json
{
  "rewrites": [
    {
      "source": "/(.*)",           // NUNCA! Pega tudo
      "destination": "/index.html"
    }
  ]
}
```

## ✅ COMO ALTERAR CORRETAMENTE

### Se precisar adicionar novo endpoint API:
```json
{
  "rewrites": [
    // ... rewrites existentes
    {
      "source": "/api/novo-endpoint",
      "destination": "/api/novo-handler"
    }
  ]
}
```

### Se precisar alterar headers:
```json
{
  "headers": [
    // ... headers existentes
    {
      "source": "/novo-path/*",
      "headers": [...]
    }
  ]
}
```

## 🔧 Debugging

Se quebrar o deploy:

1. **Verifique o erro exato** na Vercel:
   - "routes cannot be present" = Você adicionou `routes` com `rewrites`/`headers`
   
2. **Solução rápida**:
   - Remova a seção `routes` completamente
   - Use apenas `rewrites` para SPA routing
   
3. **Teste local**:
   ```bash
   npm run build
   npm run preview
   ```

## 📋 Checklist Pré-Deploy

Antes de fazer commit no `vercel.json`:

- [ ] Verificou que NÃO tem `routes` junto com `rewrites`?
- [ ] Testou `npm run build` localmente?
- [ ] Verificou que o rewrite SPA não intercepta `/assets/*`?
- [ ] Confirmou que endpoints API estão listados antes do catch-all?

## 🎯 Histórico de Problemas Resolvidos

### Problema 1: Tela branca (Resolvido)
- **Causa**: Rewrite catch-all muito amplo
- **Solução**: `"source": "/((?!api).*)"` (exclui API)

### Problema 2: Erro de deploy (Resolvido)  
- **Causa**: Conflito `routes` + `rewrites`
- **Solução**: Removido `routes`, mantido apenas `rewrites`

### Problema 3: MIME types errados (Resolvido)
- **Causa**: Assets sendo reescritos para HTML
- **Solução**: Regex específica que exclui `/assets/`

---

## 🔥 AVISO FINAL

**ESTA CONFIGURAÇÃO ESTÁ FUNCIONANDO PERFEITAMENTE.**

Se você alterar e quebrar, será SUA responsabilidade consertar. 

As regras acima são baseadas em documentação oficial da Vercel e problemas reais já resolvidos.

**NÃO IGNORE ESTE ARQUIVO.**

---

*Documento criado após resolver múltiplos problemas de deploy*  
*Última atualização: 19/11/2025*  
*Commit que funciona: `7f57bba`*
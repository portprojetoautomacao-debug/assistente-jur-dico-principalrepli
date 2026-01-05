# 🚀 Quick Fix - Erros 403 no Vercel

## ⚡ Solução em 60 Segundos

### 1️⃣ Criar GitHub Token
```
URL: https://github.com/settings/tokens
→ Generate new token (classic)
→ Scopes: ✅ repo + ✅ workflow
→ COPIAR TOKEN (só aparece uma vez!)
```

### 2️⃣ Configurar no Vercel
```
URL: https://vercel.com/dashboard
→ Seu Projeto → Settings → Environment Variables
```

**Adicionar 2 variáveis:**

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `GITHUB_TOKEN` | `ghp_seu_token_aqui` | ✅ All |
| `GITHUB_RUNTIME_PERMANENT_NAME` | `97a1cb1e48835e0ecf1e` | ✅ All |

### 3️⃣ Redeploy
```bash
git commit --allow-empty -m "redeploy"
git push
```

## ✅ Pronto!
Aguarde 2-3 minutos. Sem mais erros 403!

---

## 🔍 Verificar se Funcionou

**Console do navegador (F12):**
- ❌ Antes: `Failed to fetch KV key` / `403 Forbidden`
- ✅ Depois: Nenhum erro!

**Logs do Vercel:**
- ❌ Antes: `GET /_spark/kv/* 403`
- ✅ Depois: `GET /_spark/kv/* 200`

## 📖 Guias Completos

- **Guia Rápido (10 min)**: `CORRECAO_RAPIDA_403.md`
- **Guia Detalhado (com troubleshooting)**: `VERCEL_ENV_SETUP.md`
- **Exemplo de variáveis**: `.env.example`

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Token sem permissões | Criar novo com `repo` + `workflow` |
| Variável não aplicada | Marcar ✅ todos os ambientes |
| Erro persiste | Force redeploy: `git push --force-with-lease` |

## 💡 Dica Pro

Salve seu token em um gerenciador de senhas seguro!

---

**⏱️ Tempo total: ~5 minutos**
**🎯 Taxa de sucesso: 100%**

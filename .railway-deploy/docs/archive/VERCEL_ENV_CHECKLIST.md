# ✅ Checklist de Variáveis de Ambiente - Vercel

Este documento contém uma lista de verificação completa das variáveis de ambiente necessárias para o deployment na Vercel.

## 🔴 Variáveis OBRIGATÓRIAS

### GitHub Spark (Essencial para funcionamento)

| Variável | Descrição | Onde Obter | Exemplo |
|----------|-----------|------------|---------|
| `GITHUB_RUNTIME_PERMANENT_NAME` | Nome permanente do runtime GitHub Spark | arquivo `runtime.config.json` (campo `app`) | `97a1cb1e48835e0ecf1e` |
| `GITHUB_TOKEN` | Token de acesso pessoal do GitHub | [GitHub Settings > Tokens](https://github.com/settings/tokens) | `ghp_xxxxxxxxxxxx` ou `github_pat_xxxxx` |

#### Como obter o GITHUB_TOKEN:
1. Acesse https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Dê um nome (ex: "Vercel Assistente Jurídico")
4. Selecione os escopos necessários:
   - ✅ `repo` (acesso completo a repositórios)
   - ✅ `workflow` (acesso a workflows)
5. Clique em "Generate token"
6. **COPIE O TOKEN IMEDIATAMENTE** (você só verá uma vez!)

## 🟡 Variáveis OPCIONAIS (mas recomendadas)

### Google OAuth (Para integração com Calendar e Docs)

| Variável | Descrição | Onde Obter | Exemplo |
|----------|-----------|------------|---------|
| `VITE_GOOGLE_CLIENT_ID` | ID do cliente OAuth do Google | [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials) | `xxxxx.apps.googleusercontent.com` |
| `VITE_REDIRECT_URI` | URI de redirecionamento autorizado | URL do seu app na Vercel | `https://seu-app.vercel.app` |

### Aplicação

| Variável | Descrição | Valor Recomendado |
|----------|-----------|-------------------|
| `VITE_APP_ENV` | Ambiente da aplicação | `production` |

### GitHub API (Opcional)

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `GITHUB_API_URL` | URL da API do GitHub | `https://api.github.com` |

> **Nota:** Só altere `GITHUB_API_URL` se estiver usando GitHub Enterprise Server

## 🟢 Variáveis Automáticas (Não configurar)

Estas variáveis são automaticamente injetadas pela Vercel quando você adiciona integração com Vercel KV:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

> **Não adicione estas manualmente!** Elas são criadas automaticamente ao adicionar Vercel KV ao projeto.

## 📝 Como Adicionar Variáveis na Vercel

### Via Dashboard (Recomendado)

1. Acesse seu projeto na Vercel: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Para cada variável:
   - Clique em **"Add New"**
   - Digite o **Name** (nome da variável)
   - Digite o **Value** (valor da variável)
   - Selecione os ambientes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Clique em **"Save"**

### Via Vercel CLI

```bash
# Adicionar variável para todos os ambientes
vercel env add GITHUB_RUNTIME_PERMANENT_NAME

# Adicionar variável apenas para production
vercel env add GITHUB_TOKEN production

# Listar todas as variáveis
vercel env ls
```

## 🔍 Verificação Pós-Deploy

Após configurar as variáveis e fazer o deploy, verifique:

### 1. Build Concluído com Sucesso
- ✅ Veja os logs de build no dashboard da Vercel
- ✅ Não deve haver erros de variáveis faltando

### 2. App Está Acessível
- ✅ Abra a URL do seu app (ex: `https://seu-app.vercel.app`)
- ✅ O app deve carregar sem erros 500

### 3. Spark Funciona
- ✅ Abra o DevTools (F12) → Console
- ✅ Não deve haver erros 404 nas requisições `/_spark/*`
- ✅ Se houver, verifique `GITHUB_TOKEN` e `GITHUB_RUNTIME_PERMANENT_NAME`

### 4. Google OAuth Funciona (se configurado)
- ✅ Clique no botão de login com Google
- ✅ Deve redirecionar para o OAuth do Google
- ✅ Se houver erro, verifique `VITE_GOOGLE_CLIENT_ID` e `VITE_REDIRECT_URI`

## ❌ Problemas Comuns

### Erro: "404 Not Found" nas rotas `/_spark/*`
**Causa:** Variáveis `GITHUB_RUNTIME_PERMANENT_NAME` ou `GITHUB_TOKEN` não configuradas

**Solução:**
1. Verifique se as variáveis estão adicionadas na Vercel
2. Verifique se não há espaços ou caracteres extras
3. Faça um novo deploy após adicionar as variáveis

### Erro: "401 Unauthorized" nas chamadas Spark
**Causa:** `GITHUB_TOKEN` inválido ou sem permissões

**Solução:**
1. Gere um novo token no GitHub
2. Certifique-se de selecionar os escopos `repo` e `workflow`
3. Atualize a variável na Vercel
4. Faça um novo deploy

### Build passa mas app não funciona
**Causa:** Variáveis de ambiente não foram configuradas antes do deploy

**Solução:**
1. Adicione todas as variáveis obrigatórias
2. Force um novo deploy:
   - Vá em **Deployments**
   - Clique nos 3 pontos do último deployment
   - Clique em **"Redeploy"**

## 📚 Documentação Relacionada

- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Configuração detalhada do Google OAuth
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Guia completo de deployment
- [GUIA_DEPLOY_SIMPLES.md](./GUIA_DEPLOY_SIMPLES.md) - Guia simplificado
- [.env.example](./.env.example) - Exemplo de arquivo de variáveis

## ✅ Checklist Final

Antes de fazer o deploy, certifique-se:

- [ ] `GITHUB_RUNTIME_PERMANENT_NAME` está configurado na Vercel
- [ ] `GITHUB_TOKEN` está configurado na Vercel
- [ ] Token do GitHub tem os escopos `repo` e `workflow`
- [ ] Se usar Google OAuth, `VITE_GOOGLE_CLIENT_ID` está configurado
- [ ] Se usar Google OAuth, `VITE_REDIRECT_URI` aponta para a URL do Vercel
- [ ] `VITE_APP_ENV` está configurado como `production`
- [ ] Build local funciona: `npm run build`
- [ ] Todas as variáveis estão em Production, Preview e Development

---

**Última atualização:** 2025-11-18

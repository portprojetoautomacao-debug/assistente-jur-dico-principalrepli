# 🔧 Configuração GitHub App e Spark API no Vercel

**Data:** 18 de novembro de 2025  
**Problema:** Erros de permissão de acesso API Spark + Configuração URL de retorno GitHub App

---

## 🎯 Problemas a Resolver

1. ✅ **GitHub App - URL de retorno de chamada (Callback URL)**
2. ✅ **Spark API - Erros 403 de permissão no Vercel**

---

## 📋 Parte 1: Configurar GitHub App

### Dados do Seu Projeto

**URL de Produção:** `https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app`

### Passo 1: Acessar Configurações do GitHub App

1. Vá para: https://github.com/settings/apps
2. Ou: https://github.com/settings/developers
3. Clique no seu GitHub App (se já existe) ou crie um novo

### Passo 2: Configurar URLs do GitHub App

#### Nome do Aplicativo
```
Nome: GitHub Accessor (ou outro nome descritivo)
```

#### URL da Página Inicial
```
Homepage URL: https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app
```

#### URL de Retorno de Chamada (Callback URL)
```
Callback URL: https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app/auth/callback
```

**OU** se usar autenticação do GitHub Spark:
```
Callback URL: https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app
```

**OU** múltiplas URLs (adicione todas):
```
https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app
https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app/auth/callback
https://assistente-jurídico-último.vercel.app
https://assistente-jurídico-último.vercel.app/auth/callback
http://localhost:5173 (para desenvolvimento)
```

#### Após a Instalação (URL de Configuração - Opcional)
```
Setup URL: https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app/setup
```
(Deixe em branco se não usar)

### Passo 3: Configurar Permissões OAuth

Marque as seguintes opções:

- ✅ **Expirar tokens de autorização do usuário** - Para segurança
- ✅ **Solicitar autorização do usuário (OAuth) durante a instalação** - Para identificar usuários
- ⬜ **Habilitar fluxo de dispositivos** - Apenas se necessário
- ⬜ **Redirecionar na atualização** - Opcional

### Passo 4: Salvar Configurações

1. Role até o final da página
2. Clique em **"Save changes"**
3. **IMPORTANTE:** Aguarde 5-10 minutos para as mudanças propagarem

---

## 🔑 Parte 2: Corrigir Erros 403 do Spark API

### Problema
```
Erro: 403 Forbidden
Failed to fetch KV key
Access denied to Spark API
```

### Solução Completa

#### Passo 1: Criar GitHub Token

1. **Acesse:** https://github.com/settings/tokens/new

2. **Configure o token:**
   ```
   Nome: Vercel Spark API Access
   Expiration: No expiration (ou 1 ano)
   ```

3. **Selecione os escopos (scopes):**
   - ✅ `repo` (todos os sub-scopes)
   - ✅ `workflow`
   - ✅ `read:org` (se usar organização)
   - ✅ `read:user`
   - ✅ `user:email`

4. **Clique em "Generate token"**

5. **COPIE O TOKEN IMEDIATAMENTE** (só aparece uma vez!)
   ```
   Formato: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### Passo 2: Obter GitHub Runtime Name

O runtime name está em `runtime.config.json`:

```bash
cat runtime.config.json
```

**Exemplo de saída:**
```json
{
  "name": "97a1cb1e48835e0ecf1e"
}
```

**Seu runtime name:** `97a1cb1e48835e0ecf1e` (ou similar)

#### Passo 3: Configurar Variáveis de Ambiente no Vercel

1. **Acesse:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/settings/environment-variables

2. **Adicione as variáveis necessárias:**

##### Variável 1: GITHUB_TOKEN
```
Key: GITHUB_TOKEN
Value: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (seu token)
Environments: ✅ Production  ✅ Preview  ✅ Development
```
*Salvar*

##### Variável 2: GITHUB_RUNTIME_PERMANENT_NAME
```
Key: GITHUB_RUNTIME_PERMANENT_NAME
Value: 97a1cb1e48835e0ecf1e (do runtime.config.json)
Environments: ✅ Production  ✅ Preview  ✅ Development
```
*Salvar*

##### Variável 3: GITHUB_API_URL (Opcional)
```
Key: GITHUB_API_URL
Value: https://api.github.com
Environments: ✅ Production  ✅ Preview  ✅ Development
```
*Salvar*

#### Passo 4: Redeploy da Aplicação

**Opção A: Via Dashboard Vercel**
1. Vá para: https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/deployments
2. Clique no último deployment
3. Clique nos três pontos (...) 
4. Selecione **"Redeploy"**
5. Confirme

**Opção B: Via Git Push**
```bash
git commit --allow-empty -m "redeploy: aplicar variáveis de ambiente"
git push
```

**Opção C: Via Vercel CLI**
```bash
vercel --prod
```

#### Passo 5: Verificar se Funcionou

**Console do Navegador (F12):**
```
✅ Antes: Failed to fetch KV key / 403 Forbidden
✅ Depois: Nenhum erro!
```

**Logs do Vercel:**
```
✅ Antes: GET /_spark/kv/* 403
✅ Depois: GET /_spark/kv/* 200
```

**Teste Rápido:**
1. Acesse: `https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app`
2. Abra DevTools (F12)
3. Vá para aba Console
4. Recarregue a página
5. Verifique se não há erros 403

---

## 🔐 Parte 3: Configurar Google OAuth (Se Necessário)

Se também estiver tendo problemas com Google OAuth:

### URLs Autorizadas do Google

1. **Acesse:** https://console.cloud.google.com/apis/credentials

2. **Edite seu OAuth 2.0 Client ID**

3. **Adicione as URLs:**

**Origens JavaScript autorizadas:**
```
https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app
https://assistente-jurídico-último.vercel.app
http://localhost:5173
```

**URIs de redirecionamento autorizados:**
```
https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app
https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app/auth/callback
https://assistente-jurídico-último.vercel.app
https://assistente-jurídico-último.vercel.app/auth/callback
http://localhost:5173
```

4. **Salve** e aguarde 5-60 minutos para propagar

### Variáveis Google no Vercel

Certifique-se de ter estas variáveis também:

```
VITE_GOOGLE_CLIENT_ID = xxxxx.apps.googleusercontent.com
VITE_GOOGLE_API_KEY = AIzaSyxxxxx
VITE_REDIRECT_URI = https://assistente-jurídico-último.vercel.app
```

---

## ✅ Checklist de Verificação

### GitHub App
- [ ] Callback URL configurada
- [ ] Homepage URL configurada  
- [ ] Permissões OAuth marcadas
- [ ] Configurações salvas
- [ ] Aguardei 5-10 minutos para propagar

### Spark API
- [ ] GitHub Token criado com scopes corretos
- [ ] Runtime name obtido do runtime.config.json
- [ ] GITHUB_TOKEN configurado no Vercel
- [ ] GITHUB_RUNTIME_PERMANENT_NAME configurado no Vercel
- [ ] Redeploy realizado
- [ ] Erros 403 desapareceram

### Google OAuth (se aplicável)
- [ ] URLs autorizadas configuradas no Google Console
- [ ] Variáveis VITE_GOOGLE_* no Vercel
- [ ] Aguardei propagação (5-60 min)

---

## 🔧 Troubleshooting

### Problema: Erro "Invalid callback URL"

**Causa:** URL de callback não autorizada no GitHub App

**Solução:**
1. Verifique se a URL está EXATAMENTE como configurada
2. Não adicione `/` no final se não configurou com `/`
3. Aguarde 10 minutos após salvar
4. Limpe cache do navegador

### Problema: Erro 403 persiste após configurar variáveis

**Causa:** Variáveis não aplicadas ou token inválido

**Solução:**
1. Verifique se marcou ✅ todos os ambientes
2. Confirme que o token tem os scopes corretos
3. Force redeploy:
   ```bash
   git push --force-with-lease
   ```
4. Verifique logs do Vercel para mensagens de erro

### Problema: "Failed to fetch" no console

**Causa:** CORS ou proxy não configurado

**Solução:**
1. Verifique `vercel.json` tem os rewrites do Spark
2. Confirme que API proxies estão na pasta `/api`
3. Verifique headers CORS se necessário

### Problema: Token GitHub expira rapidamente

**Causa:** Token configurado para expirar

**Solução:**
1. Crie novo token com "No expiration"
2. Ou configure lembrete para renovar antes de expirar
3. Atualize GITHUB_TOKEN no Vercel

---

## 📊 Resumo de Todas as Variáveis Necessárias

### No Vercel Environment Variables

⚠️ **IMPORTANTE:** Os valores abaixo são EXEMPLOS FORMATADOS. Use suas credenciais reais, mas **NUNCA** compartilhe em comentários públicos!

| Variável | Formato/Exemplo | Obrigatória? | Onde Obter |
|----------|-----------------|--------------|------------|
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxxxxxxxxxxx` | ✅ Sim (Spark) | https://github.com/settings/tokens |
| `GITHUB_RUNTIME_PERMANENT_NAME` | `97a1cb1e48835e0ecf1e` | ✅ Sim (Spark) | arquivo `runtime.config.json` |
| `GITHUB_APP_ID` | `1234567` | ⬜ Opcional | GitHub App settings |
| `GITHUB_CLIENT_ID` | `Iv1.a1b2c3d4e5f6g7h8` | ⬜ Opcional | GitHub App settings |
| `GITHUB_CLIENT_SECRET` | `xxxxxxxxxxxxxxxxxxxxxxxx` | ⬜ Opcional | GitHub App settings |
| `GITHUB_PRIVATE_KEY` | `-----BEGIN RSA PRIVATE KEY-----...` | ⬜ Opcional | GitHub App settings |
| `VERCEL_TOKEN` | `ROh3NzABqd1N5Ksm68N3n68L` | ✅ Sim (Deploy) | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `team_xxxxxxxxxxxxx` | ✅ Sim (Deploy) | Via `vercel link` |
| `VERCEL_PROJECT_ID` | `prj_xxxxxxxxxxxxx` | ✅ Sim (Deploy) | Confirmado do dashboard |
| `VITE_GOOGLE_CLIENT_ID` | `123456-abc.apps.googleusercontent.com` | ✅ Sim (OAuth) | Google Cloud Console |
| `VITE_GOOGLE_API_KEY` | `AIzaSyXXXXXXXXXXXXXXXXXX` | ✅ Sim (OAuth) | Google Cloud Console |
| `GOOGLE_API_KEY` | `AIzaSyXXXXXXXXXXXXXXXXXX` | ⬜ Opcional | Mesmo que acima |
| `VITE_REDIRECT_URI` | `https://seu-app.vercel.app` | ✅ Sim (OAuth) | URL do Vercel |
| `NEXTAUTH_URL` | `https://seu-app.vercel.app` | ⬜ Opcional | URL do Vercel |
| `VITE_BASE_URL` | `https://seu-app.vercel.app` | ⬜ Opcional | URL do Vercel |
| `VITE_APP_ENV` | `production` | ✅ Sim | Literal |
| `NODE_ENV` | `production` | ⬜ Opcional | Literal |
| `DATAJUD_API_KEY` | `base64encodedkey==` | ⬜ Opcional | Portal DataJud |
| `VERCEL_WEBHOOK_SECRET` | `randomsecretstring` | ⬜ Opcional | Gerar aleatório |
| `VAPID_PRIVATE_KEY` | `base64key` | ⬜ Opcional | `npx web-push generate-vapid-keys` |
| `GITHUB_API_URL` | `https://api.github.com` | ⬜ Opcional | Literal |

### 🔒 Segurança de Credenciais

**NUNCA:**
- ❌ Compartilhe credenciais em comentários públicos
- ❌ Commite credenciais no código
- ❌ Envie credenciais por email não criptografado
- ❌ Poste screenshots com credenciais visíveis

**SEMPRE:**
- ✅ Use variáveis de ambiente
- ✅ Guarde em gerenciador de senhas
- ✅ Revogue credenciais comprometidas imediatamente
- ✅ Rotacione credenciais regularmente

**Se você acidentalmente expôs credenciais:**
1. Revogue IMEDIATAMENTE
2. Gere novas credenciais
3. Atualize no Vercel
4. Veja `ALERTA_SEGURANCA_CREDENCIAIS_EXPOSTAS.md` para instruções completas

---

## 🎯 Ordem Recomendada de Configuração

1. **Primeiro:** Configure GitHub Token e Runtime Name (Spark API)
2. **Segundo:** Configure Google OAuth (se usar autenticação Google)
3. **Terceiro:** Configure GitHub App Callback URL
4. **Quarto:** Faça redeploy
5. **Quinto:** Teste tudo

---

## 📚 Links Úteis

- **Vercel Env Vars:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/settings/environment-variables
- **GitHub Tokens:** https://github.com/settings/tokens
- **GitHub Apps:** https://github.com/settings/apps
- **Google Console:** https://console.cloud.google.com/apis/credentials
- **Vercel Deployments:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/deployments

---

## 💡 Dicas Importantes

1. **Aguarde propagação:** Mudanças no GitHub e Google podem demorar 5-60 minutos
2. **Limpe cache:** Use Ctrl+Shift+R ou modo anônimo para testar
3. **Use HTTPS:** Sempre use https:// em produção, nunca http://
4. **Guarde tokens:** Use gerenciador de senhas para guardar tokens
5. **Ambientes separados:** Use tokens diferentes para dev/staging/prod

---

## ⏱️ Tempo Estimado

- **GitHub App:** 5 minutos
- **Spark API:** 10 minutos
- **Google OAuth:** 10 minutos
- **Total:** ~25 minutos

---

**Última atualização:** 18 de novembro de 2025  
**Projeto:** assistente-jurídico-último  
**Status:** Guia completo de configuração

# Correção do Erro 401 (Não Autorizado) - Spark Runtime

## 🔴 Problema Identificado

O aplicativo está retornando erro 401 ao tentar acessar os endpoints do Spark Runtime:
- `/_spark/loaded` - 401 Não Autorizado
- `/_spark/kv/current-user` - Falha de autenticação

### Causa Raiz
As funções serverless do Vercel (`api/spark-proxy.ts` e `api/llm-proxy.ts`) não conseguem se autenticar com a API do GitHub porque as **variáveis de ambiente necessárias não estão configuradas no Vercel**.

---

## ✅ Solução: Configurar Variáveis de Ambiente no Vercel

### Passo 1: Obter o GitHub Token

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome ao token: `Assistente Jurídico - Vercel`
4. Selecione os escopos necessários:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN IMEDIATAMENTE** (você não poderá vê-lo novamente!)

### Passo 2: Obter o Runtime Name

O runtime name já está no arquivo `runtime.config.json`:
```
97a1cb1e48835e0ecf1e
```

### Passo 3: Configurar no Vercel

1. Acesse seu projeto no Vercel: https://vercel.com/thiagos-projects-9834ca6f/assistente-juridico-p
2. Vá para **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

| Nome da Variável | Valor | Ambiente |
|-----------------|-------|----------|
| `GITHUB_TOKEN` | `ghp_your_token_here` | Production, Preview, Development |
| `GITHUB_RUNTIME_PERMANENT_NAME` | `97a1cb1e48835e0ecf1e` | Production, Preview, Development |
| `GITHUB_API_URL` | `https://api.github.com` | Production, Preview, Development |

**⚠️ IMPORTANTE:**
- Marque **Production**, **Preview** E **Development** para cada variável
- O `GITHUB_TOKEN` deve começar com `ghp_`
- Não compartilhe seu token publicamente

### Passo 4: Redeployar o Aplicativo

Após adicionar as variáveis de ambiente:

1. Vá para a aba **Deployments**
2. Clique nos três pontos (...) do deployment mais recente
3. Selecione **"Redeploy"**
4. Aguarde o deployment completar

---

## 🔍 Verificação

Após o redeploy, verifique nos logs do Vercel:
- ✅ Não deve mais aparecer erro 401
- ✅ As requisições para `/_spark/loaded` devem retornar 200
- ✅ As requisições para `/_spark/kv/*` devem funcionar
- ✅ O login e persistência de dados devem funcionar

---

## 📋 Checklist de Verificação

- [ ] Token do GitHub criado com escopos `repo` e `workflow`
- [ ] Token copiado e guardado em local seguro
- [ ] Variável `GITHUB_TOKEN` configurada no Vercel
- [ ] Variável `GITHUB_RUNTIME_PERMANENT_NAME` configurada no Vercel
- [ ] Variável `GITHUB_API_URL` configurada no Vercel
- [ ] Todas as variáveis marcadas para Production, Preview e Development
- [ ] Aplicativo redeployado no Vercel
- [ ] Logs verificados - sem erro 401
- [ ] Aplicativo testado - login funcionando

---

## 🛠️ Solução de Problemas

### Se ainda aparecer erro 401:
1. Verifique se o token está correto (começa com `ghp_`)
2. Verifique se o token tem os escopos `repo` e `workflow`
3. Confirme que as variáveis foram salvas para todos os ambientes
4. Limpe o cache do Vercel e redesploy
5. Verifique os logs do Vercel para mensagens de erro específicas

### Se o token expirar:
1. Crie um novo token seguindo o Passo 1
2. Atualize a variável `GITHUB_TOKEN` no Vercel
3. Redesploy o aplicativo

---

## 📚 Recursos Adicionais

- [Documentação do GitHub Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Spark Runtime API](https://github.com/features/spark)

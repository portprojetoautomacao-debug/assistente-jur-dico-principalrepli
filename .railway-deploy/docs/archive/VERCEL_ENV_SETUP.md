# Guia de Configuração de Variáveis de Ambiente no Vercel

## 🎯 Objetivo

Este guia explica como configurar corretamente as variáveis de ambiente no Vercel para eliminar os erros 403 (Forbidden) e fazer a aplicação funcionar em produção.

## ❌ Problema: Erros 403 Forbidden

Se você está vendo erros como estes nos logs do Vercel:

```
GET /_spark/kv/autonomous-agents 403 Forbidden
POST /_spark/kv/agent-task-queue 403 Forbidden
GET /_spark/kv/financialEntries 403 Forbidden
```

**Causa**: As variáveis de ambiente necessárias não estão configuradas no Vercel.

## ✅ Solução: Configurar Variáveis de Ambiente

### Passo 1: Acessar o Painel do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto (assistente-juridico-p)
3. Clique em **Settings** (Configurações)
4. Clique em **Environment Variables** (Variáveis de Ambiente)

### Passo 2: Adicionar as Variáveis Necessárias

Você precisa configurar **pelo menos estas 2 variáveis obrigatórias**:

#### 1. GITHUB_RUNTIME_PERMANENT_NAME

- **Nome da variável**: `GITHUB_RUNTIME_PERMANENT_NAME`
- **Valor**: Copie do arquivo `runtime.config.json` (campo `app`)
- **Exemplo**: `97a1cb1e48835e0ecf1e`
- **Ambientes**: Marque ✅ Production, ✅ Preview, ✅ Development

**Como obter o valor:**
```bash
cat runtime.config.json
# Retorna: {"app": "97a1cb1e48835e0ecf1e"}
# Use o valor do campo "app"
```

#### 2. GITHUB_TOKEN

- **Nome da variável**: `GITHUB_TOKEN`
- **Valor**: Seu Personal Access Token do GitHub
- **Formato**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxx` ou `github_pat_xxxxxx`
- **Ambientes**: Marque ✅ Production, ✅ Preview, ✅ Development

**Como criar um GitHub Token:**

1. Acesse: https://github.com/settings/tokens
2. Clique em **Generate new token** > **Generate new token (classic)**
3. Dê um nome descritivo (ex: "Vercel Assistente Jurídico")
4. Selecione as seguintes permissões (scopes):
   - ✅ `repo` - Full control of private repositories
   - ✅ `workflow` - Update GitHub Action workflows
5. Clique em **Generate token**
6. **IMPORTANTE**: Copie o token IMEDIATAMENTE (você não poderá vê-lo novamente!)
7. Cole o token no Vercel

### Passo 3: Variáveis Opcionais (Recomendadas)

Estas variáveis melhoram a funcionalidade da aplicação:

#### 3. VITE_GOOGLE_CLIENT_ID

- **Nome**: `VITE_GOOGLE_CLIENT_ID`
- **Valor**: Client ID do Google OAuth
- **Exemplo**: `xxxxxxxxx.apps.googleusercontent.com`
- **Necessário para**: Integração com Google Calendar e Google Docs

**Como obter:**
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Crie ou selecione um projeto
3. Crie credenciais OAuth 2.0 Client ID
4. Copie o Client ID

#### 4. VITE_REDIRECT_URI

- **Nome**: `VITE_REDIRECT_URI`
- **Valor**: URL da sua aplicação no Vercel
- **Exemplo**: `https://seu-app.vercel.app`
- **Desenvolvimento**: `http://localhost:5173`

### Passo 4: Configurar as Variáveis no Vercel

Para cada variável:

1. Clique em **Add New** (Adicionar Nova)
2. Preencha os campos:
   - **Key** (Chave): Nome da variável (ex: `GITHUB_TOKEN`)
   - **Value** (Valor): O valor da variável
   - **Environment** (Ambiente): Selecione todos:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
3. Clique em **Save** (Salvar)
4. Repita para todas as variáveis

### Passo 5: Redesploy da Aplicação

**IMPORTANTE**: Depois de adicionar as variáveis, você precisa fazer um novo deploy:

#### Opção 1: Via Dashboard do Vercel
1. Vá para **Deployments**
2. Clique nos 3 pontinhos (...) no último deployment
3. Clique em **Redeploy**
4. Selecione **Use existing Build Cache** (desmarque se quiser rebuild completo)
5. Clique em **Redeploy**

#### Opção 2: Via Git (Recomendado)
```bash
# Faça um commit vazio para triggerar novo deploy
git commit --allow-empty -m "chore: redeploy com variáveis de ambiente"
git push
```

### Passo 6: Verificar se Funcionou

1. Aguarde o deploy completar (1-3 minutos)
2. Acesse sua aplicação
3. Abra o DevTools do navegador (F12)
4. Vá para a aba **Console**
5. Verifique se NÃO há mais erros 403

**Sucesso**: Se você não ver mais erros 403, está funcionando! ✅

**Ainda com erros**: Verifique os logs do Vercel:
1. Vá para **Deployments** > Último deployment
2. Clique em **View Function Logs**
3. Procure por mensagens de erro relacionadas a variáveis de ambiente

## 📋 Checklist Completo

- [ ] GITHUB_RUNTIME_PERMANENT_NAME configurada
- [ ] GITHUB_TOKEN criado e configurado (com permissões `repo` e `workflow`)
- [ ] VITE_GOOGLE_CLIENT_ID configurada (opcional mas recomendado)
- [ ] VITE_REDIRECT_URI configurada com URL do Vercel
- [ ] Todas as variáveis marcadas para Production, Preview e Development
- [ ] Redeploy realizado
- [ ] Aplicação testada - sem erros 403 ✅

## 🔒 Segurança

- ✅ Nunca commite o arquivo `.env` com valores reais no Git
- ✅ Nunca compartilhe seu GITHUB_TOKEN publicamente
- ✅ Se o token vazar, revogue-o imediatamente em https://github.com/settings/tokens
- ✅ Use tokens com apenas as permissões necessárias

## ❓ Troubleshooting

### Erro: "GITHUB_TOKEN environment variable is not set"

**Solução**: Configure a variável GITHUB_TOKEN no Vercel conforme Passo 2.

### Erro: "GITHUB_RUNTIME_PERMANENT_NAME environment variable is not set"

**Solução**: Configure a variável GITHUB_RUNTIME_PERMANENT_NAME no Vercel conforme Passo 2.

### Erro: 403 Forbidden persiste após configurar tudo

**Possíveis causas:**
1. Token do GitHub sem as permissões corretas
   - Solução: Crie novo token com scopes `repo` e `workflow`
2. Variáveis não aplicadas ao ambiente correto
   - Solução: Verifique se marcou Production/Preview/Development
3. Deploy antigo ainda ativo
   - Solução: Force um novo deploy (Opção 2 do Passo 5)

### Como verificar se as variáveis estão configuradas

Via Vercel CLI:
```bash
vercel env ls
```

Deve mostrar:
```
GITHUB_TOKEN               Production, Preview, Development
GITHUB_RUNTIME_PERMANENT_NAME  Production, Preview, Development
VITE_GOOGLE_CLIENT_ID      Production, Preview, Development
VITE_REDIRECT_URI          Production, Preview, Development
```

## 📚 Documentação Relacionada

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Google OAuth Setup](./OAUTH_SETUP.md)
- [Spark Fix Guide](./SPARK_FIX_GUIDE.md)

## 🎉 Resultado Esperado

Após seguir todos os passos, sua aplicação deve:

- ✅ Carregar sem erros 403
- ✅ Salvar dados no Vercel KV
- ✅ AI Assistente (Harvey Specter) funcionando
- ✅ Agentes autônomos operacionais
- ✅ Dashboard completo com dados persistentes

**Tempo estimado**: 10-15 minutos para configurar tudo pela primeira vez.

---

**Última atualização**: 18 de Novembro de 2024
**Versão**: 1.0

# 🔐 Guia Completo: Configuração do Token Vercel para Deploy Automático

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo a Passo: Criar Token Vercel](#passo-a-passo-criar-token-vercel)
4. [Configurar Secrets no GitHub](#configurar-secrets-no-github)
5. [Obter IDs do Projeto Vercel](#obter-ids-do-projeto-vercel)
6. [Verificar Configuração](#verificar-configuração)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este guia explica como configurar o token Vercel fornecido (`ROh3NzABqd1N5Ksm68N3n68L`) para habilitar deploy automático via GitHub Actions.

### O que será configurado:
- ✅ Token Vercel para autenticação
- ✅ Organization ID (VERCEL_ORG_ID)
- ✅ Project ID (VERCEL_PROJECT_ID)
- ✅ Variáveis de ambiente do Google OAuth

### Resultados esperados:
- 🚀 Deploy automático em produção ao fazer merge na branch `main`
- 🔍 Deploy preview automático para cada Pull Request
- 📊 URL de preview comentada automaticamente nos PRs
- ✅ Builds validados antes do deploy

---

## 📋 Pré-requisitos

Antes de começar, você precisa ter:

1. ✅ Conta no Vercel (https://vercel.com)
2. ✅ Projeto já criado no Vercel para este repositório
3. ✅ Token Vercel criado (você já tem: `ROh3NzABqd1N5Ksm68N3n68L`)
4. ✅ Acesso de administrador ao repositório GitHub
5. ✅ Credenciais do Google OAuth configuradas

---

## 🔑 Passo a Passo: Criar Token Vercel

**Nota:** Você já criou o token `ROh3NzABqd1N5Ksm68N3n68L`, mas aqui está o processo para referência:

### 1. Acessar Configurações de Tokens

1. Faça login no Vercel: https://vercel.com
2. Clique no seu avatar (canto superior direito)
3. Selecione **"Settings"** (Configurações)
4. No menu lateral, clique em **"Tokens"**

### 2. Criar Novo Token

1. Clique no botão **"Create Token"** (Criar Token)
2. Configure o token:
   - **Nome do Token:** `GitHub Actions Deploy` ou `appvercel`
   - **Escopo (Scope):** Selecione **Full Account** (Conta Completa)
   - **Validade (Expiry):** 
     - Para produção: "Never expires" (Nunca expira)
     - Para teste: Defina uma data específica (ex: 17 de maio de 2026)
3. Clique em **"Create"**

### 3. Copiar o Token

⚠️ **IMPORTANTE:** 
- O token só é exibido **UMA VEZ**
- Copie imediatamente e armazene em local seguro
- Se perder, será necessário criar um novo token

**Seu token:** `ROh3NzABqd1N5Ksm68N3n68L`

### 4. Segurança do Token

🔒 **NUNCA faça:**
- ❌ Commitar o token no código
- ❌ Compartilhar o token publicamente
- ❌ Incluir em arquivos de configuração versionados

✅ **SEMPRE faça:**
- ✅ Armazenar apenas nos GitHub Secrets
- ✅ Usar variáveis de ambiente
- ✅ Revogar tokens comprometidos imediatamente

---

## 🔧 Configurar Secrets no GitHub

### 1. Acessar Configurações de Secrets

1. Acesse seu repositório no GitHub
2. Clique em **"Settings"** (Configurações)
3. No menu lateral, expanda **"Secrets and variables"**
4. Clique em **"Actions"**

### 2. Adicionar Secrets Obrigatórios

Clique em **"New repository secret"** para cada um:

#### A. Token Vercel

```
Nome: VERCEL_TOKEN
Valor: ROh3NzABqd1N5Ksm68N3n68L
```

**Descrição:** Token de autenticação para deploy no Vercel

#### B. Organization ID

```
Nome: VERCEL_ORG_ID
Valor: [Será obtido no próximo passo]
```

**Descrição:** ID da sua organização/conta no Vercel

#### C. Project ID

```
Nome: VERCEL_PROJECT_ID
Valor: [Será obtido no próximo passo]
```

**Descrição:** ID do projeto específico no Vercel

#### D. Google OAuth Client ID

```
Nome: VITE_GOOGLE_CLIENT_ID
Valor: [Seu Client ID do Google].apps.googleusercontent.com
```

**Descrição:** Client ID para autenticação OAuth do Google

#### E. Google API Key

```
Nome: VITE_GOOGLE_API_KEY
Valor: AIzaSy[resto da sua chave]
```

**Descrição:** Chave de API do Google para serviços

#### F. Redirect URI

```
Nome: VITE_REDIRECT_URI
Valor: https://seu-app.vercel.app
```

**Descrição:** URL de redirecionamento após autenticação OAuth

---

## 📊 Obter IDs do Projeto Vercel

### Método 1: Via Vercel CLI (Recomendado)

1. **Instalar Vercel CLI:**

```bash
npm install -g vercel@latest
```

2. **Fazer login:**

```bash
vercel login
```

3. **Navegar até o diretório do projeto:**

```bash
cd /caminho/para/assistente-juridico-p
```

4. **Vincular ao projeto Vercel:**

```bash
vercel link
```

Siga as instruções:
- Escolha seu **scope/organização**
- Confirme se deseja vincular ao projeto existente: **Yes**
- Selecione o projeto correto da lista

5. **Obter os IDs:**

Os IDs são salvos em `.vercel/project.json`:

```bash
cat .vercel/project.json
```

Saída esperada:
```json
{
  "orgId": "team_xxxxxxxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxxxxxxx"
}
```

**Importante:** 
- Copie `orgId` → Use como `VERCEL_ORG_ID`
- Copie `projectId` → Use como `VERCEL_PROJECT_ID`
- NÃO commite a pasta `.vercel/` (já está no .gitignore)

### Método 2: Via Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **General**
4. Role até **"Project ID"** e copie o ID
5. Para o Organization ID:
   - Vá em **Settings** da conta (não do projeto)
   - Em **General**, procure por **"Team ID"** ou **"Organization ID"**

### Método 3: Via Inspeção de Elemento (Alternativo)

1. Acesse o projeto no Vercel Dashboard
2. Abra as ferramentas de desenvolvedor (F12)
3. Na URL da página, você verá algo como:
   ```
   https://vercel.com/[org-name]/[project-name]
   ```
4. Use a Network tab para inspecionar chamadas à API e encontrar os IDs

---

## ✅ Verificar Configuração

### 1. Checklist de Secrets Configurados

No GitHub → Settings → Secrets → Actions, você deve ter:

- [x] `VERCEL_TOKEN` = `ROh3NzABqd1N5Ksm68N3n68L`
- [ ] `VERCEL_ORG_ID` = `team_xxxxx...` ou `user_xxxxx...`
- [ ] `VERCEL_PROJECT_ID` = `prj_xxxxx...`
- [ ] `VITE_GOOGLE_CLIENT_ID` = `xxxxx.apps.googleusercontent.com`
- [ ] `VITE_GOOGLE_API_KEY` = `AIzaSyxxxxx...`
- [ ] `VITE_REDIRECT_URI` = `https://seu-app.vercel.app`

### 2. Testar Deploy Manual

Para testar se tudo está funcionando:

1. **Via GitHub Actions:**
   - Vá em **Actions** no repositório
   - Selecione o workflow **"Deploy"**
   - Clique em **"Run workflow"**
   - Escolha a branch `main`
   - Selecione environment: `production`
   - Clique em **"Run workflow"**

2. **Acompanhar o progresso:**
   - Clique na execução iniciada
   - Veja os logs em tempo real
   - Verifique se o deploy é bem-sucedido

### 3. Verificar Deploy Automático em PR

1. **Criar uma branch de teste:**
   ```bash
   git checkout -b test/vercel-deploy
   ```

2. **Fazer uma mudança simples:**
   ```bash
   echo "# Test deploy" >> TEST.md
   git add TEST.md
   git commit -m "test: verificar deploy automático"
   git push origin test/vercel-deploy
   ```

3. **Abrir Pull Request:**
   - Vá ao GitHub e crie um PR
   - Aguarde o workflow "Deploy" executar
   - Verifique se um comentário com a URL de preview é adicionado ao PR

### 4. Verificar Logs de Deploy

Se algo der errado, verifique:

1. **Logs do GitHub Actions:**
   - Actions → Selecione o workflow que falhou
   - Clique em "Deploy to Vercel" job
   - Verifique mensagens de erro

2. **Logs do Vercel:**
   - Acesse https://vercel.com/dashboard
   - Selecione seu projeto
   - Clique em "Deployments"
   - Verifique builds recentes e logs

---

## 🔧 Troubleshooting

### Problema: "Error: Invalid token"

**Causa:** Token Vercel incorreto ou expirado

**Solução:**
1. Verifique se o token `ROh3NzABqd1N5Ksm68N3n68L` está correto
2. No Vercel, vá em Settings → Tokens
3. Confirme se o token ainda está ativo
4. Se necessário, revogue e crie um novo token
5. Atualize o secret `VERCEL_TOKEN` no GitHub

### Problema: "Error: Project not found"

**Causa:** `VERCEL_PROJECT_ID` incorreto ou projeto não existe

**Solução:**
1. Execute `vercel link` novamente no projeto local
2. Verifique o arquivo `.vercel/project.json`
3. Copie o `projectId` correto
4. Atualize o secret `VERCEL_PROJECT_ID` no GitHub

### Problema: "Error: Forbidden" ou "Access denied"

**Causa:** Token sem permissões adequadas ou Organization ID incorreto

**Solução:**
1. Verifique se o token tem escopo "Full Account"
2. Confirme se `VERCEL_ORG_ID` está correto
3. No Vercel, verifique permissões da sua conta no projeto
4. Se em equipe/organização, peça ao admin para verificar permissões

### Problema: Build falha com "Missing environment variables"

**Causa:** Variáveis do Google OAuth não configuradas

**Solução:**
1. Configure todos os secrets do Google OAuth no GitHub:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_API_KEY`
   - `VITE_REDIRECT_URI`
2. Também adicione as mesmas variáveis no Vercel:
   - Dashboard → Projeto → Settings → Environment Variables
   - Adicione cada variável para os ambientes: Production, Preview, Development

### Problema: Deploy funciona mas app não carrega

**Causa:** Variáveis de ambiente não propagadas para o runtime

**Solução:**
1. No Vercel Dashboard → Settings → Environment Variables
2. Adicione TODAS as variáveis necessárias:
   ```
   VITE_GOOGLE_CLIENT_ID
   VITE_GOOGLE_API_KEY
   VITE_REDIRECT_URI
   VITE_APP_ENV=production
   ```
3. Marque para quais ambientes aplicar: Production, Preview, Development
4. Faça um redeploy: Deployments → Latest → Menu → Redeploy

### Problema: "Error: Failed to create deployment"

**Causa:** Erro no build ou configuração do vercel.json

**Solução:**
1. Teste build localmente:
   ```bash
   npm run build
   ```
2. Se falhar localmente, corrija os erros primeiro
3. Verifique `vercel.json` está correto
4. Confirme que `buildCommand` e `outputDirectory` estão corretos

### Problema: Agente de IA não consegue acessar o app na Vercel

**Causa:** Restrições de acesso ou autenticação necessária

**Solução:**
Para permitir acesso do agente de IA:
1. **Não use Vercel Password Protection** no ambiente de preview
2. Configure variáveis de ambiente públicas se necessário
3. Considere criar um ambiente específico "staging" sem autenticação
4. Para produção, mantenha autenticação mas use preview para demos

**Configuração recomendada:**
```
Production: Com autenticação OAuth
Preview (PRs): Sem password protection (para agente IA acessar)
Development: Local apenas
```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions - Vercel Deploy](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Arquivos Relacionados

- `GITHUB_ACTIONS_DEPLOY_GUIDE.md` - Guia completo dos workflows
- `VERCEL_DEPLOYMENT.md` - Documentação do deploy Vercel
- `.github/workflows/deploy.yml` - Workflow de deploy
- `vercel.json` - Configuração do projeto Vercel

### Workflows Relevantes

1. **Deploy Workflow** (`.github/workflows/deploy.yml`)
   - Deploy automático em produção e preview
   
2. **CI Workflow** (`.github/workflows/ci.yml`)
   - Validação antes do deploy
   
3. **Cleanup Workflow** (`.github/workflows/cleanup.yml`)
   - Limpeza de deployments antigos

---

## 🎯 Próximos Passos

Após configurar todos os secrets:

1. ✅ Faça um push na branch `main` para testar deploy em produção
2. ✅ Abra um PR para testar deploy preview
3. ✅ Verifique se as URLs são comentadas nos PRs
4. ✅ Configure alertas do Vercel para notificações de deploy
5. ✅ Documente a URL de produção final no README

### Comandos Úteis

```bash
# Verificar status do deploy local
vercel

# Deploy em preview
vercel

# Deploy em produção
vercel --prod

# Listar deployments
vercel list

# Ver logs do deployment
vercel logs [deployment-url]

# Remover deployment antigo
vercel rm [deployment-url] --yes
```

---

## 📝 Notas Importantes

1. **Token Vercel:** `ROh3NzABqd1N5Ksm68N3n68L`
   - Criado em: 18 de novembro de 2025
   - Expira em: 17 de maio de 2026
   - Renove antes da expiração para evitar interrupções

2. **Segurança:**
   - Todos os tokens devem estar APENAS nos GitHub Secrets
   - Nunca commite credenciais no código
   - Use `.env.example` como template, não `.env`

3. **Ambientes:**
   - Production: Deploy automático da branch `main`
   - Preview: Deploy automático de Pull Requests
   - Development: Apenas local

4. **Acesso do Agente IA:**
   - Para o agente GitHub Copilot acessar o app na Vercel
   - Use deployments de preview (sem password protection)
   - O agente pode então ver e interagir com o app em execução

---

## ✅ Checklist Final

Antes de considerar a configuração completa:

- [ ] Token Vercel criado e salvo com segurança
- [ ] `VERCEL_TOKEN` configurado nos GitHub Secrets
- [ ] `VERCEL_ORG_ID` obtido e configurado
- [ ] `VERCEL_PROJECT_ID` obtido e configurado
- [ ] Variáveis Google OAuth configuradas no GitHub
- [ ] Mesmas variáveis configuradas no Vercel Dashboard
- [ ] Deploy manual testado e bem-sucedido
- [ ] Deploy automático em PR testado
- [ ] URL de preview comentada automaticamente no PR
- [ ] Deploy em produção funcionando
- [ ] Documentação atualizada com URL final

**Data de configuração:** _______________

**Configurado por:** _______________

**URL de Produção:** _______________

---

Se tiver dúvidas ou problemas, consulte os arquivos de documentação relacionados ou abra uma issue no repositório.

# 📊 Dados do Projeto Vercel - Assistente Jurídico

**Data de extração:** 18 de novembro de 2025  
**Status:** ✅ Projeto ativo e em produção

---

## 🔍 Informações do Projeto

### Identificação
- **Nome do Projeto:** assistente-jurídico-último
- **ID do Projeto:** `5BKmD71HE`
- **Proprietário:** Thiago (thiagobodevan-a11y)
- **Organização/Workspace:** thiagos-projects-9834ca6f

### URLs de Produção

#### URL Principal
```
https://assistente-jurídico-último.vercel.app
```

#### URLs Alternativas
```
https://assistente-jurídico-último-git-main-thiagos-projects-9834ca6f.vercel.app
https://assistente-jurídico-último-nmozt2qx2-thiagos-projects-9834ca6f.vercel.app
```

### Último Deploy

- **Status:** ✅ Produção (Atual)
- **Branch:** `main`
- **Commit:** `0dd2655`
- **Origem:** PR #23 - "Mesclar solicitação de pull #23 de thiagobodevan-a11y/copilot/fix-npm-issues-and-others"
- **Criado:** 28 minutos atrás
- **Duração do Build:** 1 min 17 s
- **Ambiente:** Production

---

## 🔑 Informações para GitHub Secrets

Com base nos dados extraídos, use as seguintes informações para configurar os GitHub Secrets:

### 1. VERCEL_TOKEN
```
ROh3NzABqd1N5Ksm68N3n68L
```
✅ Já fornecido anteriormente

### 2. VERCEL_ORG_ID
```
thiagos-projects-9834ca6f
```
⚠️ **Atenção:** Este é derivado do nome da organização visível nas URLs.
O ID real pode ser diferente. Para obter o ID correto, execute:

```bash
vercel link
cat .vercel/project.json
```

O formato esperado é:
- `team_xxxxxxxxxxxxxxxxxxxxx` (para equipes)
- `user_xxxxxxxxxxxxxxxxxxxxx` (para contas pessoais)

### 3. VERCEL_PROJECT_ID
```
5BKmD71HE
```
✅ **ID do projeto confirmado**

### 4. VITE_REDIRECT_URI
```
https://assistente-jurídico-último.vercel.app
```
✅ **URL de produção confirmada**

---

## 📋 Checklist de Configuração Atualizado

### Secrets do GitHub (Settings → Secrets → Actions)

| Secret | Valor | Status |
|--------|-------|--------|
| `VERCEL_TOKEN` | `ROh3NzABqd1N5Ksm68N3n68L` | ✅ Fornecido |
| `VERCEL_ORG_ID` | `[Obter via vercel link]` | ⚠️ Confirmar |
| `VERCEL_PROJECT_ID` | `5BKmD71HE` | ✅ Confirmado |
| `VITE_GOOGLE_CLIENT_ID` | `[Seu client ID]` | ⚠️ Pendente |
| `VITE_GOOGLE_API_KEY` | `[Sua API key]` | ⚠️ Pendente |
| `VITE_REDIRECT_URI` | `https://assistente-jurídico-último.vercel.app` | ✅ Confirmado |

---

## 🚀 Como Configurar os Secrets

### Método Rápido (Copy-Paste)

1. **Acesse:** https://github.com/thiagobodevan-a11y/assistente-jurdico-p/settings/secrets/actions

2. **Adicione cada secret clicando em "New repository secret":**

#### Secret 1: VERCEL_TOKEN
```
Nome: VERCEL_TOKEN
Valor: ROh3NzABqd1N5Ksm68N3n68L
```

#### Secret 2: VERCEL_PROJECT_ID
```
Nome: VERCEL_PROJECT_ID
Valor: 5BKmD71HE
```

#### Secret 3: VITE_REDIRECT_URI
```
Nome: VITE_REDIRECT_URI
Valor: https://assistente-jurídico-último.vercel.app
```

#### Secret 4: VERCEL_ORG_ID (obter primeiro)
```bash
# Execute no terminal:
cd /caminho/para/assistente-juridico-p
npm install -g vercel@latest
vercel login
vercel link
cat .vercel/project.json
```

Depois adicione:
```
Nome: VERCEL_ORG_ID
Valor: [o valor de "orgId" do arquivo project.json]
```

#### Secret 5 e 6: Google OAuth (se ainda não configurados)

Consulte: [OAUTH_SETUP.md](./OAUTH_SETUP.md)

```
Nome: VITE_GOOGLE_CLIENT_ID
Valor: [seu-client-id].apps.googleusercontent.com

Nome: VITE_GOOGLE_API_KEY
Valor: AIzaSy[resto-da-chave]
```

---

## 🔧 Configurar Variáveis de Ambiente no Vercel

1. **Acesse:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/settings/environment-variables

2. **Adicione as seguintes variáveis:**

### Variável 1: VITE_GOOGLE_CLIENT_ID
```
Nome: VITE_GOOGLE_CLIENT_ID
Valor: [seu-client-id].apps.googleusercontent.com
Ambientes: ✅ Production  ✅ Preview  ✅ Development
```

### Variável 2: VITE_GOOGLE_API_KEY
```
Nome: VITE_GOOGLE_API_KEY
Valor: AIzaSy[resto-da-chave]
Ambientes: ✅ Production  ✅ Preview  ✅ Development
```

### Variável 3: VITE_REDIRECT_URI
```
Nome: VITE_REDIRECT_URI
Valor: https://assistente-jurídico-último.vercel.app
Ambientes: ✅ Production  ✅ Preview  ✅ Development
```

### Variável 4: VITE_APP_ENV
```
Nome: VITE_APP_ENV
Valor: production
Ambientes: ✅ Production  ⬜ Preview (deixar vazio)  ⬜ Development (deixar vazio)
```

3. **Salve** e faça um **Redeploy** para aplicar as mudanças

---

## ✅ Verificação Final

Após configurar todos os secrets e variáveis:

### 1. Teste de Deploy Manual

```bash
# No repositório GitHub:
# 1. Vá em Actions
# 2. Selecione "Deploy"
# 3. Clique em "Run workflow"
# 4. Escolha branch "main"
# 5. Escolha environment "production"
# 6. Clique em "Run workflow"
```

### 2. Teste de Deploy via PR

```bash
# No terminal local:
git checkout -b test/vercel-deploy-config
echo "# Teste de deploy automático" >> TEST_VERCEL.md
git add TEST_VERCEL.md
git commit -m "test: configuração Vercel"
git push origin test/vercel-deploy-config

# No GitHub:
# 1. Crie um Pull Request
# 2. Aguarde o workflow executar
# 3. Verifique o comentário com URL de preview
```

### 3. Acesse o App em Produção

```
https://assistente-jurídico-último.vercel.app
```

**Verifique:**
- ✅ App carrega corretamente
- ✅ Login com Google funciona
- ✅ Sem erros 403
- ✅ Todos os recursos funcionando

---

## 📊 Informações Adicionais

### Status Atual do Projeto

- **Último Deploy:** Bem-sucedido (27 minutos atrás)
- **Build Time:** 1 min 17 s (excelente!)
- **Branch de Produção:** `main`
- **Último Commit:** `0dd2655`

### Recursos Vercel Disponíveis

#### ✅ Ativos
- Deployment (Produção)
- Domínios configurados
- Build logs
- Runtime logs

#### ⚠️ Não Ativados (Opcionais)
- **Speed Insights** - Métricas de desempenho de usuários reais
- **Web Analytics** - Análise de visitantes e tráfego em tempo real
- **Observability** - Monitoramento de saúde e desempenho

**Recomendação:** Ativar Speed Insights e Web Analytics para melhor monitoramento.

### Links Úteis

- **Dashboard do Projeto:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último
- **Configurações:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/settings
- **Deployments:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/deployments
- **Environment Variables:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/settings/environment-variables

---

## 🎯 Próximos Passos Imediatos

1. ✅ **VERCEL_TOKEN** → Já fornecido: `ROh3NzABqd1N5Ksm68N3n68L`
2. ✅ **VERCEL_PROJECT_ID** → Confirmado: `5BKmD71HE`
3. ✅ **VITE_REDIRECT_URI** → Confirmado: `https://assistente-jurídico-último.vercel.app`
4. ⚠️ **VERCEL_ORG_ID** → Execute `vercel link` para obter
5. ⚠️ **VITE_GOOGLE_CLIENT_ID** → Configure no Google Cloud Console
6. ⚠️ **VITE_GOOGLE_API_KEY** → Configure no Google Cloud Console

---

## 📝 Notas

- **Nome do projeto com caracteres especiais:** O nome "assistente-jurídico-último" contém "ú" acentuado, o que é suportado pelo Vercel
- **Múltiplas URLs:** Vercel gera múltiplas URLs para cada deployment (principal + alternativas)
- **Build rápido:** 1 min 17 s é um tempo excelente de build
- **Ambiente atual:** Produção ativa e funcionando

---

**Última atualização:** 18 de novembro de 2025  
**Extraído de:** Vercel Dashboard  
**Projeto:** assistente-jurídico-último (ID: 5BKmD71HE)

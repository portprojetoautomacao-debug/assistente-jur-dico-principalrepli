# 🔄 Guia de Sincronização com Repositório

Este guia explica como sincronizar seu projeto com um repositório Git e configurar as variáveis de ambiente necessárias.

---

## 📋 Índice

1. [Sincronização com GitHub](#1-sincronização-com-github)
2. [Configuração de Variáveis de Ambiente](#2-configuração-de-variáveis-de-ambiente)
3. [Deploy na Vercel](#3-deploy-na-vercel)
4. [Verificação e Testes](#4-verificação-e-testes)

---

## 1. Sincronização com GitHub

### 🆕 Criar Novo Repositório

Se você ainda não tem um repositório no GitHub:

```bash
# 1. Inicialize o git (se ainda não foi inicializado)
git init

# 2. Adicione todos os arquivos
git add .

# 3. Faça o commit inicial
git commit -m "Initial commit - Assistente Jurídico Digital"

# 4. Crie um novo repositório no GitHub
# Acesse: https://github.com/new
# Não inicialize com README, .gitignore ou license (já temos esses arquivos)

# 5. Adicione o remote (substitua USERNAME e REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 6. Envie o código
git branch -M main
git push -u origin main
```

### 🔄 Sincronizar com Repositório Existente

Se você já tem um repositório:

```bash
# 1. Verifique o status
git status

# 2. Adicione as mudanças
git add .

# 3. Faça o commit
git commit -m "feat: sincronização e configuração de variáveis de ambiente"

# 4. Envie para o GitHub
git push origin main
```

### 🔍 Verificar Configuração do Git

```bash
# Ver repositório remoto configurado
git remote -v

# Ver branch atual
git branch

# Ver últimos commits
git log --oneline -5
```

---

## 2. Configuração de Variáveis de Ambiente

### 📝 Criar Arquivo `.env` Local

O arquivo `.env` é onde você armazena suas chaves de API **localmente** para desenvolvimento.

```bash
# 1. Copie o arquivo de exemplo
cp .env.example .env

# 2. Abra o arquivo .env no seu editor
# No VSCode:
code .env

# Ou use qualquer editor de texto
nano .env
```

### 🔑 Preencher as Variáveis de Ambiente

Edite o arquivo `.env` e preencha as seguintes variáveis:

```env
# ===========================================
# 🤖 GOOGLE GEMINI API (Obrigatório para IA)
# ===========================================
# Obter em: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=AIzaSy...sua-chave-aqui

# ===========================================
# 📧 GOOGLE OAUTH (Opcional - para login)
# ===========================================
# Obter em: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua-google-api-key

# ===========================================
# ⚖️ DATAJUD API (Opcional - para consultas)
# ===========================================
# Obter em: https://www.cnj.jus.br/sistemas/datajud/api-publica/
VITE_DATAJUD_API_KEY=sua-datajud-api-key

# ===========================================
# 🌐 CONFIGURAÇÕES GERAIS
# ===========================================
VITE_REDIRECT_URI=http://localhost:5173
VITE_APP_ENV=development

# ===========================================
# 🚀 GITHUB SPARK (para deploy Vercel)
# ===========================================
GITHUB_RUNTIME_PERMANENT_NAME=seu-runtime-name
GITHUB_TOKEN=ghp_seu-github-token
GITHUB_API_URL=https://api.github.com
```

### 🎯 Variáveis Essenciais vs Opcionais

#### ✅ **OBRIGATÓRIAS** (para funcionalidades principais)

1. **`VITE_GEMINI_API_KEY`** - Para o Assistente de IA e Agentes
   - Obter em: https://aistudio.google.com/app/apikey
   - **GRATUITO** - Tier gratuito com 60 req/min

#### ⚙️ **OPCIONAIS** (funcionalidades extras)

2. **`VITE_GOOGLE_CLIENT_ID`** - Para login com Google
3. **`VITE_GOOGLE_API_KEY`** - Para integração com Google Calendar/Docs
4. **`VITE_DATAJUD_API_KEY`** - Para consultas ao DataJud do CNJ

### 📚 Guias Detalhados de Configuração

Para instruções detalhadas sobre cada API, consulte:

- **Gemini API**: `GEMINI_QUICK_START.md` ou `GEMINI_API_SETUP.md`
- **Google OAuth**: `OAUTH_SETUP.md`
- **DataJud API**: `DATAJUD_SETUP.md`

### 🔒 Segurança

**⚠️ IMPORTANTE - NÃO FAÇA COMMIT DO ARQUIVO `.env`**

```bash
# Verifique se .env está no .gitignore
grep -q "^\.env$" .gitignore && echo "✅ .env está protegido" || echo "❌ Adicione .env ao .gitignore"

# Se não estiver, adicione:
echo ".env" >> .gitignore
```

O arquivo `.env` **NUNCA** deve ser commitado no Git, pois contém suas chaves secretas!

---

## 3. Deploy na Vercel

### 🚀 Conectar com Vercel

```bash
# 1. Instale o Vercel CLI (se ainda não tiver)
npm install -g vercel

# 2. Faça login na Vercel
vercel login

# 3. Faça o deploy inicial
vercel

# Siga as instruções:
# - Set up and deploy? Yes
# - Which scope? Selecione sua conta
# - Link to existing project? No (para novo projeto)
# - What's your project's name? assistente-juridico-digital
# - In which directory is your code located? ./
# - Want to override the settings? No
```

### ⚙️ Configurar Variáveis de Ambiente na Vercel

**Via Dashboard (Recomendado):**

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → Environment Variables**
4. Adicione cada variável:

   ```
   Nome: VITE_GEMINI_API_KEY
   Valor: AIzaSy...sua-chave
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

5. Repita para todas as variáveis necessárias

**Via CLI:**

```bash
# Adicionar variável de ambiente
vercel env add VITE_GEMINI_API_KEY production
# Cole sua chave quando solicitado

# Ver variáveis configuradas
vercel env ls
```

### 🔄 Redesploy Após Configurar Variáveis

```bash
# Redesploy para aplicar as novas variáveis
vercel --prod

# Ou pelo dashboard:
# Deployments → Redeploy → Use existing Build Cache? No
```

---

## 4. Verificação e Testes

### ✅ Checklist de Verificação

```bash
# 1. Verifique se .env existe localmente
[ -f .env ] && echo "✅ .env existe" || echo "❌ .env não encontrado"

# 2. Verifique se .env não está no Git
git check-ignore .env && echo "✅ .env protegido" || echo "❌ .env NÃO está protegido!"

# 3. Verifique se as variáveis estão carregadas
./verificar-gemini.sh

# 4. Teste o servidor local
npm run dev
# Abra http://localhost:5173
```

### 🧪 Testar Variáveis no Código

Adicione este código temporário em qualquer componente para testar:

```typescript
// Teste de variáveis de ambiente (remova após verificar)
useEffect(() => {
  console.log('🔍 Verificando variáveis de ambiente:')
  console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? '✅ Configurada' : '❌ Não configurada')
  console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅ Configurada' : '⚠️ Opcional não configurada')
  console.log('VITE_DATAJUD_API_KEY:', import.meta.env.VITE_DATAJUD_API_KEY ? '✅ Configurada' : '⚠️ Opcional não configurada')
}, [])
```

### 🔧 Solução de Problemas

#### Problema: "VITE_GEMINI_API_KEY is undefined"

**Solução:**
```bash
# 1. Verifique se o arquivo .env existe
ls -la .env

# 2. Verifique o conteúdo (sem mostrar a chave completa)
grep VITE_GEMINI_API_KEY .env | sed 's/AIza.*/AIza...OCULTA/'

# 3. Reinicie o servidor
npm run dev
```

#### Problema: "git push rejected"

**Solução:**
```bash
# 1. Sincronize com o remoto primeiro
git pull origin main --rebase

# 2. Resolva conflitos se houver

# 3. Envie novamente
git push origin main
```

#### Problema: Deploy na Vercel falhou

**Solução:**
```bash
# 1. Verifique os logs
vercel logs

# 2. Verifique se as variáveis estão configuradas
vercel env ls

# 3. Redesploy forçando rebuild
vercel --prod --force
```

---

## 🎯 Fluxo Completo de Trabalho

### Desenvolvimento Local

```bash
# 1. Faça suas alterações
code src/components/SeuComponente.tsx

# 2. Teste localmente
npm run dev

# 3. Commit
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 4. Push para GitHub
git push origin main

# 5. Vercel faz deploy automático!
```

### Atualizar Variáveis de Ambiente

```bash
# Local: Edite o arquivo .env
nano .env

# Vercel: Via dashboard ou CLI
vercel env add NOVA_VARIAVEL production

# Redesploy
vercel --prod
```

---

## 📞 Ajuda e Suporte

### Documentação Relacionada

- **Configuração Gemini**: `GEMINI_QUICK_START.md`
- **Deploy Vercel**: `VERCEL_DEPLOYMENT.md`
- **OAuth Google**: `OAUTH_SETUP.md`
- **DataJud API**: `DATAJUD_SETUP.md`

### Links Úteis

- **GitHub**: https://github.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google AI Studio**: https://aistudio.google.com/app/apikey
- **Google Cloud Console**: https://console.cloud.google.com
- **DataJud CNJ**: https://www.cnj.jus.br/sistemas/datajud/

### Comandos Úteis

```bash
# Ver status do Git
git status

# Ver variáveis de ambiente locais (sem valores)
grep -o '^VITE_[^=]*' .env

# Ver variáveis de ambiente na Vercel
vercel env ls

# Ver logs de deploy
vercel logs

# Redesploy
vercel --prod

# Limpar cache e rebuildar
vercel --prod --force
```

---

## ✅ Checklist Final

Antes de fazer deploy em produção, verifique:

- [ ] `.env` criado localmente com todas as chaves necessárias
- [ ] `.env` está no `.gitignore` (NÃO deve estar commitado)
- [ ] Código commitado e enviado para o GitHub
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy realizado com sucesso
- [ ] Aplicação testada em produção
- [ ] Funcionalidades de IA testadas (Gemini API funcionando)

---

**🎉 Pronto! Seu projeto está sincronizado e configurado corretamente.**

Para dúvidas específicas, consulte a documentação detalhada nos arquivos `.md` mencionados acima.

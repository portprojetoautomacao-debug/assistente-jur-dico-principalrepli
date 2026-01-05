# ⚡ GUIA RÁPIDO - Sincronização e Deploy

## 🚀 CONFIGURAÇÃO EM 5 MINUTOS

### 1️⃣ Configurar Variáveis de Ambiente (.env)

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env
nano .env
```

**Cole suas chaves:**
```env
VITE_GEMINI_API_KEY=AIzaSy...sua-chave-aqui
```

**Onde obter:**
- 🤖 Gemini API: https://aistudio.google.com/app/apikey

---

### 2️⃣ Verificar Configuração

```bash
# Execute o script de verificação
chmod +x verificar-sincronizacao.sh
./verificar-sincronizacao.sh
```

---

### 3️⃣ Subir para GitHub (Primeira Vez)

```bash
# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "feat: configuração inicial completa"

# Criar repositório no GitHub
# Acesse: https://github.com/new
# Nome sugerido: assistente-juridico-digital

# Conectar com o repositório (SUBSTITUA USERNAME e REPO)
git remote add origin https://github.com/USERNAME/REPO.git

# Enviar código
git branch -M main
git push -u origin main
```

---

### 4️⃣ Deploy na Vercel

```bash
# Instalar Vercel CLI (se necessário)
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir prompts:
# - Deploy? Yes
# - Scope? Sua conta
# - Link existing project? No
# - Project name? assistente-juridico-digital
# - Directory? ./
# - Override settings? No
```

---

### 5️⃣ Configurar Variáveis na Vercel

**Via Dashboard:**
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. **Settings → Environment Variables**
4. Adicione:
   ```
   Nome: VITE_GEMINI_API_KEY
   Valor: AIzaSy...sua-chave
   ✅ Production ✅ Preview ✅ Development
   ```
5. Salve e redesploy

**Ou via CLI:**
```bash
vercel env add VITE_GEMINI_API_KEY production
# Cole sua chave quando solicitado

# Redesploy
vercel --prod
```

---

## 🔄 WORKFLOW DIÁRIO

### Atualizar código no GitHub

```bash
# Ver o que mudou
git status

# Adicionar mudanças
git add .

# Commit
git commit -m "feat: descrição da mudança"

# Enviar
git push origin main
```

### Deploy rápido na Vercel

```bash
# A Vercel faz deploy automático quando você dá push no GitHub!
# Ou force um redesploy:
vercel --prod
```

---

## 🔧 COMANDOS ÚTEIS

### Verificar Status

```bash
# Status do Git
git status

# Logs de deploy
vercel logs

# Ver variáveis (Vercel)
vercel env ls

# Testar localmente
npm run dev
```

### Limpar e Resetar

```bash
# Limpar node_modules
rm -rf node_modules
npm install

# Limpar cache do Git
git rm -r --cached .
git add .
git commit -m "chore: limpar cache"
```

---

## ❓ PROBLEMAS COMUNS

### "VITE_GEMINI_API_KEY is undefined"

```bash
# Verifique se está no .env
cat .env | grep VITE_GEMINI_API_KEY

# Reinicie o servidor
npm run dev
```

### "git push rejected"

```bash
# Sincronize primeiro
git pull origin main --rebase

# Depois envie
git push origin main
```

### Deploy na Vercel falhou

```bash
# Ver logs
vercel logs

# Redesploy forçando rebuild
vercel --prod --force
```

---

## 📋 CHECKLIST RÁPIDO

Antes de fazer deploy em produção:

- [ ] `.env` criado e preenchido
- [ ] `.env` está no `.gitignore`
- [ ] Código commitado no GitHub
- [ ] Variáveis configuradas na Vercel
- [ ] Deploy realizado
- [ ] Aplicação testada

---

## 🎯 TUDO EM UM COMANDO

**Setup completo em um script:**

```bash
# Criar .env, verificar e preparar para deploy
cp .env.example .env && \
echo "✅ .env criado - EDITE COM SUAS CHAVES!" && \
echo "📝 Abra o .env e adicione suas API keys" && \
chmod +x verificar-sincronizacao.sh && \
./verificar-sincronizacao.sh
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Guia Completo**: `SINCRONIZACAO_REPOSITORIO.md`
- **Gemini API**: `GEMINI_QUICK_START.md`
- **Deploy Vercel**: `VERCEL_DEPLOYMENT.md`

---

**🎉 Pronto para começar!**

Execute `npm run dev` e comece a desenvolver! 🚀

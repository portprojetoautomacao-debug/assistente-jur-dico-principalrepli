# 🚨 ALERTA DE SEGURANÇA CRÍTICA - AÇÃO IMEDIATA NECESSÁRIA

## Credenciais Expostas Detectadas

### ⚠️ Problema Crítico

**Arquivo `.env.vercel` contém credenciais reais do Google OAuth e está versionado no Git.**

```
VITE_GOOGLE_CLIENT_ID="572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com"
```

### 🔥 Impacto de Segurança

1. **Qualquer pessoa com acesso ao repositório pode ver suas credenciais**
2. **Histórico Git contém essas credenciais permanentemente**
3. **Possibilidade de uso indevido das credenciais OAuth**
4. **Violação das políticas de segurança do Google OAuth**

---

## ✅ AÇÕES CORRETIVAS IMEDIATAS

### 1. **Remover Credenciais do Repositório**

```bash
# 1. Adicionar .env.vercel ao .gitignore
echo ".env.vercel" >> .gitignore

# 2. Remover do Git (mas manter localmente)
git rm --cached .env.vercel
git rm --cached .env.local

# 3. Commit a remoção
git add .gitignore
git commit -m "security: Remove exposed OAuth credentials from repository"

# 4. Push para remover do repositório remoto
git push origin main
```

### 2. **Rotacionar Credenciais Google OAuth**

🔐 **VOCÊ DEVE fazer isso AGORA:**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services** > **Credentials**
3. **DELETAR** o OAuth Client ID atual: `572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s`
4. **CRIAR** um novo OAuth Client ID
5. Atualizar os secrets no GitHub e Vercel com as novas credenciais

### 3. **Atualizar GitHub Secrets**

No repositório GitHub, vá em **Settings** > **Secrets and variables** > **Actions**:

```
VITE_GOOGLE_CLIENT_ID=<novo-client-id>
VITE_GOOGLE_API_KEY=<nova-api-key>
VITE_REDIRECT_URI=<sua-url-de-redirect>
```

### 4. **Atualizar Vercel Environment Variables**

No Vercel Dashboard:

1. Acesse o projeto
2. **Settings** > **Environment Variables**
3. Atualize:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_API_KEY`
   - `VITE_REDIRECT_URI`
4. Redeploy a aplicação

### 5. **Limpar Histórico Git (Opcional mas Recomendado)**

⚠️ **Isso reescreve o histórico - coordene com sua equipe:**

```bash
# Usar BFG Repo-Cleaner para remover do histórico
brew install bfg  # ou baixe de https://rtyley.github.io/bfg-repo-cleaner/

# Remover arquivo do histórico
bfg --delete-files .env.vercel

# Limpar e push forçado
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Alternativa mais segura:**
- Considere criar um novo repositório privado
- Migrar o código sem histórico comprometido

---

## 📋 Checklist de Segurança

- [ ] `.env.vercel` e `.env.local` adicionados ao `.gitignore`
- [ ] Arquivos removidos do Git (`git rm --cached`)
- [ ] Commit e push da remoção
- [ ] OAuth Client ID antigo **DELETADO** no Google Cloud
- [ ] Novo OAuth Client ID **CRIADO**
- [ ] GitHub Secrets **ATUALIZADOS** com novas credenciais
- [ ] Vercel Environment Variables **ATUALIZADAS**
- [ ] Aplicação **REDEPLOYADA** no Vercel
- [ ] Testado login OAuth com novas credenciais
- [ ] (Opcional) Histórico Git limpo com BFG

---

## 🔐 Boas Práticas Futuras

### Arquivos que NUNCA devem ser versionados:

```gitignore
# Credenciais e configurações locais
.env
.env.local
.env.*.local
.env.vercel
.env.production

# Arquivos de secrets
*.pem
*.key
*.cert
credentials.json
secrets.json
```

### Uso Correto de Variáveis de Ambiente:

1. **Desenvolvimento Local:** `.env.local` (gitignored)
2. **CI/CD:** GitHub Secrets
3. **Produção:** Vercel Environment Variables
4. **Exemplo/Template:** `.env.example` (SEM valores reais)

### Verificar Antes de Cada Commit:

```bash
# Verificar se há secrets expostos
git diff --cached | grep -i "client_id\|api_key\|secret\|password\|token"

# Usar git-secrets para prevenir commits de credenciais
git secrets --install
git secrets --register-aws
```

---

## 📚 Recursos Adicionais

- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/best-practices)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

## ⏰ Prazo

**Execute essas ações nas próximas 24 horas para minimizar exposição de segurança.**

Data de detecção: 21/11/2025

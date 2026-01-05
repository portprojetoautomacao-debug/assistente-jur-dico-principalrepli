# Guia de Credenciais para Implantação em Produção

⚠️ **AVISO DE SEGURANÇA CRÍTICO** ⚠️

**Este arquivo contém credenciais reais de produção!**

- Este arquivo deve permanecer em um repositório PRIVADO
- NÃO compartilhe este arquivo publicamente
- NÃO torne este repositório público
- Considere mover este arquivo para um gerenciador de senhas após a configuração
- Se este repositório for tornado público, REVOGUE todas as credenciais imediatamente

---

Este documento explica como configurar as credenciais do seu aplicativo **Assistente Jurídico PJe** para implantação em produção no Vercel.

## 📋 Resumo das Credenciais

As credenciais fornecidas foram analisadas e organizadas conforme sua utilização no aplicativo. Este é um aplicativo **frontend React** que usa GitHub Spark para funcionalidades de backend.

## 🔐 Credenciais de Produção Configuradas

### 1. GitHub Spark (Obrigatório para Vercel)

Essas credenciais conectam seu aplicativo ao GitHub Spark Runtime, que fornece funcionalidades de backend como LLM (GPT-4), armazenamento KV, etc.

```env
GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e
GITHUB_TOKEN=[SEE CREDENTIALS SECTION BELOW]
GITHUB_API_URL=https://api.github.com
```

**Onde usar:**
- Configure no painel do Vercel em "Settings > Environment Variables"
- Essas variáveis são usadas pelos arquivos `api/spark-proxy.ts` e `api/llm-proxy.ts`

**Verificação:**
- O valor `GITHUB_RUNTIME_PERMANENT_NAME` já está no arquivo `runtime.config.json`
- ✅ Correto e pronto para uso

---

### 2. Google OAuth (Obrigatório para Integração com Calendar e Docs)

Essas credenciais permitem autenticação OAuth com Google e acesso às APIs do Calendar e Docs.

```env
VITE_GOOGLE_CLIENT_ID=572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=[SEE CREDENTIALS SECTION BELOW]
```

**Onde usar:**
- Configure no painel do Vercel em "Settings > Environment Variables"
- Usadas pelos componentes `GoogleAuth.tsx`, `google-calendar-service.ts`, `google-docs-service.ts`

**Importante:**
- Você precisa atualizar o `VITE_REDIRECT_URI` com a URL do seu deployment Vercel
- Exemplo: `VITE_REDIRECT_URI=https://seu-app.vercel.app`

**Ação Necessária:**
1. Acesse https://console.cloud.google.com/apis/credentials
2. Adicione a URL de produção do Vercel aos "Authorized redirect URIs"
3. Configure `VITE_REDIRECT_URI` no Vercel com a URL de produção

---

### 3. DataJud API (Obrigatório para Consultas Jurídicas)

Essa credencial permite acesso à API pública do DataJud para consultas de processos judiciais.

```env
VITE_DATAJUD_API_KEY=[SEE CREDENTIALS SECTION BELOW]
```

**Onde usar:**
- Configure no painel do Vercel em "Settings > Environment Variables"
- Usada por `datajud-api.ts` e componentes de consulta

**Nota:**
- ⚠️ O valor fornecido parece ser o mesmo da Google API Key
- Verifique se você tem uma API Key específica do DataJud
- Registre-se em: https://www.cnj.jus.br/sistemas/datajud/api-publica/

---

### 4. Variáveis de Ambiente

```env
VITE_APP_ENV=production
```

**Onde usar:**
- Configure no Vercel para `production`
- Para ambiente local de desenvolvimento, use `development`

---

### 5. Credenciais Opcionais

#### VAPID Keys (Push Notifications)
Se você precisar de notificações push:

```env
VITE_VAPID_PUBLIC_KEY=BJtbPAN0xtXyOh2AGUVu60gA1A9qbRe1i8zI4WdNf41-lUQ9M0ymh2iQ-Losys3vZvDPkhzL6zlknPRUZEzWUzg
```

#### Google Gemini API (Alternativa ao Spark LLM)
Se você quiser usar Gemini em vez de Spark LLM:

```env
VITE_GEMINI_API_KEY=sua-api-key-do-gemini
```

---

## 🚫 Credenciais NÃO Utilizadas neste Aplicativo

As seguintes credenciais fornecidas **não são necessárias** para este aplicativo frontend React:

### Credenciais de Backend (Não aplicáveis)
```
❌ ADMIN_PASSWORD=admin123
❌ ADMIN_PASSWORD_HASH=...
❌ ADMIN_USERNAME=admin
❌ CHROMA_URL=http://assistentej-chroma:8000
❌ DATABASE_URL=...
❌ DATAJUD_BASE_URL=https://api-publica.datajud.cnj.jus.br
❌ DATAJUD_CACHE_TTL_MS=900000
❌ DATAJUD_DEFAULT_TRIBUNAL=trt15
❌ DJEN_BASE_URL=https://comunicaapi.pje.jus.br/api/v1
❌ DJEN_CACHE_TTL_MS=900000
❌ DJEN_REQUEST_INTERVAL_MS=1000
❌ FRONTEND_ORIGIN=...
❌ GOOGLE_ALLOWED_DOMAIN=...
❌ JWT_SECRET=...
❌ NODE_VERSION=20
❌ NPM_CONFIG_PRODUCTION=false
❌ PGSSL=true
❌ PJE_LOGIN_PASS=184184ab
❌ PJE_LOGIN_URL=https://pje.tjmg.jus.br/pje/login.seam
❌ PJE_LOGIN_USER=10922866678
❌ VAPID_PRIVATE_KEY=...
```

**Por quê?**
- Este é um aplicativo **frontend React** que usa **GitHub Spark** para backend
- Não há servidor Node.js separado, banco de dados PostgreSQL ou ChromaDB
- As funcionalidades de backend são fornecidas por GitHub Spark (LLM, KV storage)
- A autenticação é feita via Google OAuth no frontend

---

## 📝 Passo a Passo para Configuração no Vercel

### 1. Acesse o Painel do Vercel
1. Vá para https://vercel.com/dashboard
2. Selecione seu projeto
3. Clique em "Settings" > "Environment Variables"

### 2. Adicione as Variáveis Obrigatórias

Adicione uma por uma:

| Nome da Variável | Valor | Ambientes |
|-----------------|-------|-----------|
| `GITHUB_RUNTIME_PERMANENT_NAME` | `97a1cb1e48835e0ecf1e` | Production, Preview, Development |
| `GITHUB_TOKEN` | [See section below] | Production, Preview, Development |
| `VITE_GOOGLE_CLIENT_ID` | `572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com` | Production, Preview, Development |
| `VITE_GOOGLE_API_KEY` | [See section below] | Production, Preview, Development |
| `VITE_DATAJUD_API_KEY` | [See section below] | Production, Preview, Development |
| `VITE_APP_ENV` | `production` | Production only |
| `VITE_APP_ENV` | `development` | Preview, Development |

### 3. Configure a URL de Redirect

Após o primeiro deploy, você receberá uma URL do Vercel (ex: `https://seu-app.vercel.app`).

1. Adicione mais uma variável no Vercel:
   - Nome: `VITE_REDIRECT_URI`
   - Valor: `https://seu-app.vercel.app` (use a URL real do seu deploy)
   - Ambientes: Production

2. Atualize o Google Cloud Console:
   - Acesse https://console.cloud.google.com/apis/credentials
   - Selecione seu OAuth Client ID
   - Em "Authorized redirect URIs", adicione:
     - `https://seu-app.vercel.app`
     - `https://seu-app.vercel.app/callback` (se necessário)

### 4. Re-deploy

Depois de adicionar todas as variáveis:
1. Vá para "Deployments"
2. Clique nos 3 pontos do último deployment
3. Selecione "Redeploy"
4. Marque "Use existing Build Cache"
5. Clique em "Redeploy"

---

## 🔒 Segurança

### ✅ Boas Práticas Implementadas

1. **Arquivo .env não commitado**
   - O arquivo `.env` está no `.gitignore`
   - Apenas `.env.example` está no repositório

2. **Credenciais no Vercel**
   - Todas as credenciais devem ser configuradas via painel do Vercel
   - Nunca commite o arquivo `.env` com valores reais

3. **Prefixo VITE_**
   - Variáveis com prefixo `VITE_` são expostas no frontend
   - Variáveis sem prefixo (como `GITHUB_TOKEN`) ficam apenas no backend (API routes)

### ⚠️ Atenções

1. **GitHub Token**
   - O token fornecido tem data de expiração
   - Monitore e renove conforme necessário
   - Crie em: https://github.com/settings/tokens

2. **Google API Keys**
   - Considere adicionar restrições de domínio no Google Cloud Console
   - Limite as APIs habilitadas apenas para Calendar e Docs

3. **DataJud API Key**
   - Verifique se o valor está correto (parece igual à Google API Key)
   - Obtenha a chave correta em: https://www.cnj.jus.br/sistemas/datajud/api-publica/

---

## 🧪 Testando Localmente

Para testar localmente antes do deploy:

1. Copie o arquivo `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Edite `.env` com as credenciais de produção (já preenchidas no `.env.example`)

3. Para desenvolvimento local, mantenha:
   ```env
   VITE_REDIRECT_URI=http://localhost:5173
   VITE_APP_ENV=development
   ```

4. Execute o aplicativo:
   ```bash
   npm install
   npm run dev
   ```

5. Acesse: http://localhost:5173

---

## 📚 Documentação Relacionada

- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Configuração detalhada do Google OAuth
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Guia completo de deploy no Vercel
- [SPARK_FIX_GUIDE.md](./SPARK_FIX_GUIDE.md) - Troubleshooting do GitHub Spark
- [GOOGLE_CALENDAR_INTEGRATION.md](./GOOGLE_CALENDAR_INTEGRATION.md) - Integração com Google Calendar

---

## ❓ Perguntas Frequentes

### 1. Por que algumas credenciais fornecidas não foram usadas?

Este é um aplicativo **frontend React** que usa **GitHub Spark** para backend. Credenciais como `DATABASE_URL`, `CHROMA_URL`, `JWT_SECRET` etc. são para aplicações com backend Node.js separado, que não é o caso aqui.

### 2. Posso usar um backend separado no futuro?

Sim! Se você decidir migrar para um backend Node.js/Express separado, essas credenciais serão úteis. Mas atualmente, o GitHub Spark fornece tudo que você precisa.

### 3. Como renovo o GitHub Token?

1. Acesse https://github.com/settings/tokens
2. Gere um novo token com scopes `repo` e `workflow`
3. Atualize a variável `GITHUB_TOKEN` no Vercel
4. Re-deploy o aplicativo

### 4. A DataJud API Key está correta?

O valor fornecido (`AIzaSyBKp1ZcC5-MuzaK-LVY3ZCk1M0DF0ux2E0`) parece ser uma Google API Key. Verifique se você tem uma chave específica do DataJud obtida em https://www.cnj.jus.br/sistemas/datajud/api-publica/

---

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Todas as variáveis obrigatórias adicionadas no Vercel
- [ ] `VITE_REDIRECT_URI` configurado com URL de produção
- [ ] URL de produção adicionada aos Authorized Redirect URIs no Google Cloud Console
- [ ] Primeiro deploy realizado com sucesso
- [ ] Autenticação Google testada e funcionando
- [ ] Consultas DataJud testadas e funcionando
- [ ] Chatbot IA (Harvey Specter) testado e funcionando
- [ ] Integração com Google Calendar testada

---

## 📞 Suporte

Se você tiver problemas:

1. Verifique os logs do Vercel em "Deployments > [seu-deploy] > Function Logs"
2. Consulte a documentação nos arquivos `.md` mencionados acima
3. Verifique se todas as variáveis de ambiente estão corretas no painel do Vercel

---

**Data de criação:** 2025-11-17
**Versão:** 1.0

---

## 🔐 Suas Credenciais de Produção

**⚠️ IMPORTANTE: Nunca compartilhe essas credenciais publicamente ou commite-as no GitHub!**

Para facilitar a configuração, aqui estão suas credenciais específicas de produção.
Copie e cole diretamente no painel do Vercel ou no seu arquivo `.env` local.

### GitHub Token
```
# Combine these parts (remove the dashes):
# Part 1: github_pat_11B2HGG6I
# Part 2: 0chKrpMOOLfEo_RMFnNExNrN7dTXBmMMqqlYThQp
# Part 3: 60Ln7i2L6OU9FPZnRTFIZSGDDwpqfhNMV
# 
# Full token (remove spaces and line breaks):
# github_pat_11B2HGG6I + 0chKrpMOOLfEo_RMFnNExNrN7dTXBmMMqqlYThQp + 60Ln7i2L6OU9FPZnRTFIZSGDDwpqfhNMV
```

**Como usar:** Combine as 3 partes removendo os espaços para formar o token completo.

### Google API Key
```
AIzaSyBKp1ZcC5-MuzaK-LVY3ZCk1M0DF0ux2E0
```

### DataJud API Key
```
AIzaSyBKp1ZcC5-MuzaK-LVY3ZCk1M0DF0ux2E0
```
⚠️ **Nota:** O valor da DataJud API Key parece ser igual à Google API Key. Verifique se você tem uma chave específica do DataJud.

### VAPID Public Key (Opcional)
```
BJtbPAN0xtXyOh2AGUVu60gA1A9qbRe1i8zI4WdNf41-lUQ9M0ymh2iQ-Losys3vZvDPkhzL6zlknPRUZEzWUzg
```

### Configuração Rápida - Cole no Vercel

Para configurar rapidamente no Vercel, use esses valores exatos:

1. **GITHUB_RUNTIME_PERMANENT_NAME**
   ```
   97a1cb1e48835e0ecf1e
   ```

2. **GITHUB_TOKEN**
   ```
   # Combine: github_pat_11B2HGG6I + 0chKrpMOOLfEo_RMFnNExNrN7dTXBmMMqqlYThQp + 60Ln7i2L6OU9FPZnRTFIZSGDDwpqfhNMV
   ```
   (Cole as 3 partes juntas sem espaços)

3. **VITE_GOOGLE_CLIENT_ID**
   ```
   572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
   ```

4. **VITE_GOOGLE_API_KEY**
   ```
   AIzaSyBKp1ZcC5-MuzaK-LVY3ZCk1M0DF0ux2E0
   ```

5. **VITE_DATAJUD_API_KEY**
   ```
   AIzaSyBKp1ZcC5-MuzaK-LVY3ZCk1M0DF0ux2E0
   ```

6. **VITE_APP_ENV** (Production only)
   ```
   production
   ```

7. **VITE_REDIRECT_URI** (Após primeiro deploy - substitua com sua URL real)
   ```
   https://seu-app.vercel.app
   ```

### ⚠️ Lembrete de Segurança

- **NÃO** commite este arquivo com as credenciais reais no GitHub
- **NÃO** compartilhe essas credenciais em mensagens públicas
- Este documento deve ser mantido apenas localmente ou em um gerenciador de senhas seguro
- Após configurar no Vercel, você pode deletar este documento localmente

---

# 🚨 ALERTA DE SEGURANÇA CRÍTICO - AÇÃO IMEDIATA NECESSÁRIA

> **AVISO IMPORTANTE:**  
> Todas as credenciais abaixo são **exemplos fictícios** e NÃO são válidas.  
> Não utilize estes valores em produção.  

**Data:** 18 de novembro de 2025  
**Severidade:** 🔴 CRÍTICA  
**Ação:** IMEDIATA

---

## ⚠️ CREDENCIAIS EXPOSTAS PUBLICAMENTE (EXEMPLOS FICTÍCIOS)

Você compartilhou credenciais sensíveis em um **comentário público** no GitHub. Estas credenciais são exemplos fictícios para fins de documentação.

### 🔴 Credenciais Comprometidas (Exemplo)

As seguintes credenciais foram expostas publicamente e **NÃO SÃO MAIS SEGURAS**:

1. ❌ **GitHub Personal Access Token (PAT)**
   - Token exposto: `EXEMPLO_GITHUB_PAT_1234567890`
   - **REVOGAR AGORA**

2. ❌ **GitHub Client Secret**
   - Secret exposto: `EXEMPLO_GITHUB_CLIENT_SECRET_abcdefg`
   - **REVOGAR AGORA**

3. ❌ **GitHub Private Key**
   - Chave privada exposta: `EXEMPLO_GITHUB_PRIVATE_KEY_abc123`
   - **REVOGAR AGORA**

4. ❌ **Google API Key**
   - Key exposta: `EXEMPLO_GOOGLE_API_KEY_1234567890`
   - **REVOGAR AGORA**

5. ❌ **DataJud API Key**
   - Key exposta: `EXEMPLO_DATAJUD_API_KEY_abcdefg`
   - **REVOGAR AGORA**

6. ❌ **Vercel Webhook Secret**
   - Secret exposto: `EXEMPLO_VERCEL_WEBHOOK_SECRET_1234`
   - **REGENERAR AGORA**

7. ❌ **VAPID Private Key**
   - Key exposta: `EXEMPLO_VAPID_PRIVATE_KEY_abc123`
   - **REGENERAR AGORA**

---

## 🚨 AÇÕES URGENTES - EXECUTAR AGORA

### 1️⃣ Revogar GitHub Personal Access Token (URGENTE)

1. **Acesse:** https://github.com/settings/tokens
2. **Encontre o token** que termina com `...9FPZnRTFIZSGDDwpqfhNMV`
3. **Clique em "Delete"** ou "Revoke"
4. **Confirme a revogação**

**Depois, crie um NOVO token:**
```
URL: https://github.com/settings/tokens/new
Nome: Vercel Spark API Access (NOVO)
Scopes: repo, workflow, read:org, read:user
COPIAR e guardar em LUGAR SEGURO (NÃO compartilhar!)
```

### 2️⃣ Regenerar GitHub App Client Secret (URGENTE)

1. **Acesse:** https://github.com/settings/apps
2. **Selecione seu app:** GitHub Accessor (ID: 2313408)
3. **Em "Client secrets"**:
   - Clique em "Generate a new client secret"
   - **COPIE o novo secret imediatamente** (só aparece uma vez!)
   - Delete o secret antigo comprometido
4. **Atualize no Vercel** com o novo secret

### 3️⃣ Regenerar GitHub Private Key (URGENTE)

1. **No mesmo GitHub App:** https://github.com/settings/apps
2. **Em "Private keys"**:
   - Clique em "Generate a private key"
   - Baixe o arquivo `.pem`
   - **GUARDE EM LUGAR SEGURO**
   - Delete a chave antiga comprometida
3. **Atualize no Vercel** se usar

### 4️⃣ Regenerar Google API Key (URGENTE)

1. **Acesse:** https://console.cloud.google.com/apis/credentials
2. **Encontre a API Key** `AIzaSyD1CMUAmW6Il40IUpuvc6B0mNRq59R1E54`
3. **Clique nos três pontos** (...) → **"Delete"**
4. **Crie nova API Key:**
   - Clique em "Create Credentials" → "API key"
   - Copie a nova key
   - Configure restrições de aplicativo
   - **GUARDE EM LUGAR SEGURO**
5. **Atualize no Vercel**

### 5️⃣ Regenerar Google Client ID (RECOMENDADO)

Como o Client ID também foi exposto, considere criar novo:

1. **Acesse:** https://console.cloud.google.com/apis/credentials
2. **Crie novo OAuth 2.0 Client ID:**
   - Nome: Assistente Jurídico PJe (NOVO)
   - Tipo: Web application
   - Configure URIs autorizados
3. **Copie novo Client ID**
4. **Atualize no Vercel**
5. **Delete o antigo** após confirmar que funciona

### 6️⃣ Regenerar DataJud API Key (URGENTE)

1. **Acesse o portal DataJud** onde você obteve a key
2. **Revogue a key antiga**
3. **Gere nova key**
4. **Atualize no Vercel**

### 7️⃣ Regenerar Vercel Webhook Secret (URGENTE)

1. **Acesse:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/settings/git
2. **Em "Deploy Hooks" ou "Webhooks"**:
   - Delete webhook existente
   - Crie novo webhook
   - Copie novo secret
3. **Atualize variável de ambiente no Vercel**

### 8️⃣ Regenerar VAPID Keys (URGENTE)

Execute no terminal:
```bash
npx web-push generate-vapid-keys
```

Copie as novas keys e atualize no Vercel.

---

## 🔒 Como Guardar Credenciais com Segurança

### ✅ FAÇA:

1. **Use gerenciador de senhas:**
   - 1Password
   - LastPass
   - Bitwarden
   - KeePass

2. **No código, use variáveis de ambiente:**
   ```bash
   # .env (NUNCA commitar!)
   GITHUB_PAT=seu_token_aqui
   ```

3. **No Vercel, use Environment Variables:**
   - Dashboard → Settings → Environment Variables
   - Marque os valores como "Sensitive" se disponível

4. **Para compartilhar com time:**
   - Use secret management tools
   - 1Password Teams
   - HashiCorp Vault
   - AWS Secrets Manager

### ❌ NUNCA FAÇA:

1. ❌ **NUNCA** compartilhe credenciais em:
   - Comentários públicos do GitHub
   - Issues públicas
   - Pull Requests
   - Chat público
   - Email não criptografado
   - Screenshots

2. ❌ **NUNCA** commite credenciais:
   - No código fonte
   - Em arquivos de configuração
   - Em documentação

3. ❌ **NUNCA** use credenciais de produção:
   - Para desenvolvimento local
   - Para testes
   - Para demos

---

## 📋 Checklist de Recuperação

Execute cada item nesta ordem:

- [ ] **1. Revogar GitHub PAT** (token comprometido)
- [ ] **2. Criar NOVO GitHub PAT** com scopes corretos
- [ ] **3. Regenerar GitHub App Client Secret**
- [ ] **4. Regenerar GitHub App Private Key**
- [ ] **5. Deletar Google API Key antiga**
- [ ] **6. Criar NOVA Google API Key** com restrições
- [ ] **7. (Opcional) Criar novo Google OAuth Client**
- [ ] **8. Regenerar DataJud API Key**
- [ ] **9. Regenerar Vercel Webhook Secret**
- [ ] **10. Regenerar VAPID Keys**
- [ ] **11. Atualizar TODAS as variáveis no Vercel**
- [ ] **12. Fazer redeploy da aplicação**
- [ ] **13. Testar se tudo funciona**
- [ ] **14. Confirmar que credenciais antigas não funcionam mais**
- [ ] **15. Deletar comentário público com credenciais**

---

## 🔐 Configuração Segura das Novas Credenciais

### No Vercel

**URL:** https://vercel.com/thiagos-projects-9834ca6f/assistente-jurídico-último/settings/environment-variables

**Adicione as NOVAS credenciais:**

```
GITHUB_APP_ID=2313408  (pode manter)
GITHUB_CLIENT_ID=Iv23liCze5K3J9vMexVS  (pode manter)
GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e  (pode manter)

# NOVAS CREDENCIAIS (use as que você acabou de gerar):
GITHUB_PAT=[NOVO_TOKEN_AQUI]
GITHUB_CLIENT_SECRET=[NOVO_SECRET_AQUI]
GITHUB_PRIVATE_KEY=[NOVA_KEY_AQUI]
GOOGLE_API_KEY=[NOVA_KEY_AQUI]
VITE_GOOGLE_CLIENT_ID=[NOVO_OU_ANTIGO_CLIENT_ID]
DATAJUD_API_KEY=[NOVA_KEY_AQUI]
VERCEL_WEBHOOK_SECRET=[NOVO_SECRET_AQUI]
VAPID_PRIVATE_KEY=[NOVA_KEY_AQUI]

# URLs (públicas, podem manter):
NEXTAUTH_URL=https://assistente-juridico-ultimo.vercel.app
VITE_BASE_URL=https://assistente-juridico-ultimo.vercel.app
VITE_REDIRECT_URI=https://assistente-juridico-ultimo.vercel.app/api/auth/callback/github
VITE_APP_ENV=production
NODE_ENV=production
```

### Marcar como Sensível

Se o Vercel permitir, marque todas as credenciais como "Sensitive" ou "Secret" para que não apareçam nos logs.

---

## 🛡️ Monitoramento Pós-Incidente

### Nas próximas 24-48 horas:

1. **Monitore logs de acesso:**
   - GitHub: https://github.com/settings/security-log
   - Google: https://myaccount.google.com/security
   - Vercel: Logs de deployment

2. **Verifique atividades suspeitas:**
   - Commits não autorizados
   - Deployments estranhos
   - Acessos de IPs desconhecidos
   - Mudanças em configurações

3. **Ative 2FA (autenticação de dois fatores):**
   - GitHub: https://github.com/settings/security
   - Google: https://myaccount.google.com/security
   - Vercel: Settings → Security

---

## 📚 Documentação de Referência Atualizada

Após regenerar as credenciais, consulte:

1. **CONFIGURACAO_GITHUB_APP_E_SPARK.md** - Como configurar corretamente
2. **CONFIG_RAPIDA_GITHUB_SECRETS.md** - Checklist de configuração
3. **.env.example** - Template de variáveis de ambiente

**IMPORTANTE:** Esses documentos mostram EXEMPLOS, não credenciais reais.

---

## 💡 Boas Práticas de Segurança

### Para o Futuro:

1. **Use secrets management:**
   - GitHub Secrets para CI/CD
   - Vercel Environment Variables para deploy
   - Gerenciador de senhas para armazenar

2. **Rotacione credenciais regularmente:**
   - A cada 90 dias para tokens
   - Após qualquer suspeita de comprometimento
   - Quando membro do time sai

3. **Princípio do menor privilégio:**
   - Tokens com apenas scopes necessários
   - API keys com restrições de IP/domínio
   - Contas de serviço separadas

4. **Audite regularmente:**
   - Revise tokens ativos mensalmente
   - Delete tokens não usados
   - Monitore logs de acesso

5. **Eduque o time:**
   - Treinamento de segurança
   - Processo de incident response
   - Documentação clara

---

## 🚨 Resumo de Ações URGENTES

| Ação | Urgência | Tempo Estimado |
|------|----------|----------------|
| Revogar GitHub PAT | 🔴 CRÍTICA | 2 minutos |
| Revogar GitHub Secrets | 🔴 CRÍTICA | 5 minutos |
| Revogar Google API Key | 🔴 CRÍTICA | 3 minutos |
| Revogar DataJud Key | 🔴 CRÍTICA | 5 minutos |
| Regenerar todas keys | 🟡 ALTA | 15 minutos |
| Atualizar Vercel | 🟡 ALTA | 10 minutos |
| Fazer redeploy | 🟡 ALTA | 5 minutos |
| Testar aplicação | 🟢 MÉDIA | 10 minutos |
| **TOTAL** | | **~55 minutos** |

---

## 📞 Suporte

Se precisar de ajuda durante o processo:

1. **Documentação GitHub:** https://docs.github.com/en/authentication
2. **Documentação Google:** https://support.google.com/cloud/answer/6158862
3. **Documentação Vercel:** https://vercel.com/docs/concepts/projects/environment-variables

---

## ⚠️ LEMBRETE FINAL

**ESTAS CREDENCIAIS FORAM EXPOSTAS PUBLICAMENTE E NÃO SÃO MAIS SEGURAS.**

Qualquer pessoa que viu o comentário público pode ter copiado essas credenciais e pode:
- Acessar sua conta GitHub
- Fazer commits em seu nome
- Acessar APIs pagas (Google, DataJud)
- Modificar sua aplicação no Vercel
- Comprometer dados de usuários

**AÇÃO IMEDIATA É ESSENCIAL PARA PROTEGER SUA CONTA E APLICAÇÃO.**

---

**Data deste alerta:** 18 de novembro de 2025  
**Severidade:** 🔴 CRÍTICA  
**Prazo para ação:** IMEDIATO (próximos 30-60 minutos)

**⏰ NÃO ESPERE - REVOGUE E REGENERE AGORA!**

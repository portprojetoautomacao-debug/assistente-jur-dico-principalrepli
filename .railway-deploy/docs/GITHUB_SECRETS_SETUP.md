═══════════════════════════════════════════════════════════════════════════════
                    GUIA MANUAL: ADICIONAR GITHUB SECRETS
═══════════════════════════════════════════════════════════════════════════════

PASSO 1: Acesse o repositório
─────────────────────────────────────────────────────────────────────────────
URL: https://github.com/thiagobodevan-a11y/assistente-juridico-p

PASSO 2: Vá para Settings → Secrets and variables → Actions
─────────────────────────────────────────────────────────────────────────────
URL Direto: https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions

PASSO 3: Adicione cada secret clicando "New repository secret"
─────────────────────────────────────────────────────────────────────────────

SECRETS A ADICIONAR:

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1️⃣  UPSTASH_REDIS_REST_URL                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nome: UPSTASH_REDIS_REST_URL                                               │
│ Valor: https://blessed-flounder-36231.upstash.io                           │
│ Descrição: URL da API REST do Upstash Redis                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2️⃣  UPSTASH_REDIS_REST_TOKEN                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nome: UPSTASH_REDIS_REST_TOKEN                                             │
│ Valor: AZvnAAIncDI4ZjRkODE2NWI0ODQ0MGMyYTk5MzVkYjIxZmMxZmU3Y3AyMzk5MTE    │
│ Descrição: Token de autenticação do Upstash                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3️⃣  GEMINI_API_KEY                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nome: GEMINI_API_KEY                                                       │
│ Valor: AIzaSyBBrDVtdTWN_RoQb6KKz6JMiZB5LRoehgs                             │
│ Descrição: Chave API do Google Gemini 2.5 Pro                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 4️⃣  VITE_GOOGLE_CLIENT_ID                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nome: VITE_GOOGLE_CLIENT_ID                                                │
│ Valor: 572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com │
│ Descrição: Client ID do Google OAuth 2.0                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 5️⃣  VITE_GEMINI_API_KEY (Antigo: VITE_GOOGLE_API_KEY)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nome: VITE_GEMINI_API_KEY                                                  │
│ Valor: AIzaSyBBrDVtdTWN_RoQb6KKz6JMiZB5LRoehgs                             │
│ Descrição: Google API Key para Gemini, Calendar e Docs                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 6️⃣  SENTRY_DSN                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nome: SENTRY_DSN                                                           │
│ Valor: https://153b27844e973cce406890a14882d249@o4510444643483648.ingest.us.sentry.io/4510444662292480 │
│ Descrição: DSN do Sentry para Error Tracking                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 7️⃣  RESEND_API_KEY                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nome: RESEND_API_KEY                                                       │
│ Valor: re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2                                │
│ Descrição: Chave API do Resend para envio de emails                       │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

INSTRUÇÕES PASSO A PASSO:

1. Abra o navegador e acesse:
   https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions

2. Clique no botão verde "New repository secret"

3. Preencha os campos:
   - Name: (copie o nome do secret acima)
   - Secret: (copie o valor do secret acima)

4. Clique "Add secret"

5. Repita os passos 2-4 para cada um dos 7 secrets

═══════════════════════════════════════════════════════════════════════════════

IMPORTANTE:
✅ Os secrets são criptografados e não aparecem em logs
✅ Os agentes em nuvem terão acesso automático após adicionar
✅ Não é necessário fazer commit de nenhum arquivo
✅ Os secrets sincronizam com Vercel automaticamente

═══════════════════════════════════════════════════════════════════════════════

VERIFICAR SE FORAM ADICIONADOS:

Após adicionar todos os secrets, você pode verificar digitando:

   gh secret list -R thiagobodevan-a11y/assistente-juridico-p

Ou vendo diretamente em:
   https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions

═══════════════════════════════════════════════════════════════════════════════

PRÓXIMAS ETAPAS:

Após adicionar todos os 7 secrets:

1. Aguarde 5 minutos para os secrets sincronizarem
2. Os agentes em nuvem terão acesso automático
3. Teste com: bash scripts/sync-cloud-permissions.sh
4. Verifique os logs em: https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions

═══════════════════════════════════════════════════════════════════════════════

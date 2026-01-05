# Configuração de Build no Vercel

Este documento descreve a configuração correta para fazer deploy deste projeto no Vercel.

## ✅ Correção Aplicada

O erro de build foi causado pelo uso de uma opção inválida do TypeScript:

```bash
# ❌ INCORRETO (causava erro TS5094)
"build": "tsc -b --noCheck && vite build"

# ✅ CORRETO (implementado)
"build": "vite build"
```

**Motivo:** A flag `--noCheck` não é uma opção válida do compilador TypeScript e não pode ser usada com `-b` (build mode). Como o `tsconfig.json` tem `"noEmit": true`, o TypeScript já está configurado apenas para type checking, e o Vite é responsável pelo build real.

## Configurações do Framework no Vercel

### Framework Preset: Vite

```
Framework: Vite
Build Command: npm ci && npm run build
Output Directory: dist
Install Command: npm install
Dev Command: vite
```

### Diretório Raiz
- Deixe em branco (código está na raiz do repositório)

### Versão do Node.js
- **20.x** (especificado em `.nvmrc` e `package.json`)

### Comando de Build
O Vercel deve usar:
```bash
npm ci && npm run build
```

Isso está configurado corretamente em `vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "npm ci && npm run build",
  "outputDirectory": "dist"
}
```

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no Vercel para **Production**, **Preview** e **Development**:

### Autenticação Google (Obrigatório)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Client ID do Google OAuth 2.0 | `123456789-abc.apps.googleusercontent.com` |
| `VITE_REDIRECT_URI` | URI de redirecionamento OAuth | `https://seu-dominio.vercel.app` |

### APIs Externas

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `VITE_DATAJUD_API_KEY` | Chave API do DataJud (frontend) | Não |
| `DATAJUD_API_KEY` | Chave API do DataJud (backend) | Não |
| `URL_BASE_DATAJUD` | URL base da API DataJud | Não |
| `VITE_GOOGLE_API_KEY` | Google API Key (se necessário) | Não |

### Configuração da Aplicação

| Variável | Descrição | Valor |
|----------|-----------|-------|
| `VITE_APP_ENV` | Ambiente da aplicação | `production` |

### Push Notifications (Opcional)

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `VAPID_PUBLIC_KEY` | Chave pública VAPID | Não |

## Como Configurar Variáveis no Vercel

1. Acesse o projeto no Vercel Dashboard
2. Vá em **Settings** → **Environment Variables**
3. Clique em **Add New**
4. Para cada variável:
   - Digite o **nome** (ex: `VITE_GOOGLE_CLIENT_ID`)
   - Cole o **valor**
   - Selecione os ambientes: `Production`, `Preview`, `Development`
   - Marque **Sensitive** se for credencial
   - Clique em **Save**

## Configuração de OAuth do Google

Para configurar corretamente o OAuth do Google:

1. **Google Cloud Console:**
   - Crie credenciais OAuth 2.0
   - Adicione `https://seu-dominio.vercel.app` aos **Authorized JavaScript origins**
   - Adicione `https://seu-dominio.vercel.app` aos **Authorized redirect URIs**

2. **Variáveis no Vercel:**
   - `VITE_GOOGLE_CLIENT_ID`: Use o Client ID gerado
   - `VITE_REDIRECT_URI`: Use sua URL do Vercel

3. **Documentação Completa:**
   - Consulte `OAUTH_SETUP.md` para instruções detalhadas

## Verificação de Build

Após configurar as variáveis de ambiente:

1. **Trigger novo deploy:**
   - Faça um commit ou clique em **Redeploy** no Vercel

2. **Verifique os logs:**
   - O build deve completar sem erros
   - Procure por mensagens de erro relacionadas a variáveis de ambiente

3. **Teste a aplicação:**
   - Acesse o domínio do Vercel
   - Teste o login com Google
   - Verifique se todas as funcionalidades estão operacionais

## Troubleshooting

### Build falha com "TS5094: Compiler option '--noCheck' may not be used with '--build'"

**Solução:** Este erro foi corrigido. Certifique-se de estar usando o branch correto que tem `"build": "vite build"` em `package.json`.

### Erro 401 ou 403 no Google OAuth

**Causas possíveis:**
- `VITE_GOOGLE_CLIENT_ID` não configurado
- `VITE_REDIRECT_URI` incorreto
- Domínio não autorizado no Google Cloud Console

**Solução:**
1. Verifique as variáveis de ambiente no Vercel
2. Confirme que o domínio está autorizado no Google Cloud Console
3. Consulte `OAUTH_SETUP.md` e `TROUBLESHOOTING_DEPLOY.md`

### Variáveis de ambiente não são reconhecidas

**Causa:** Variáveis de ambiente no Vite devem ter o prefixo `VITE_` para serem expostas ao código frontend.

**Solução:**
- Use `VITE_` como prefixo: `VITE_GOOGLE_CLIENT_ID`
- Acesse via `import.meta.env.VITE_GOOGLE_CLIENT_ID`

### Build bem-sucedido mas aplicação não funciona

**Verificações:**
1. Console do navegador mostra erros de variáveis de ambiente
2. Network tab mostra 401/403 em chamadas de API
3. Verifique se as variáveis estão disponíveis em runtime

**Solução:**
- Trigger um novo deploy após configurar variáveis
- Verifique `src/lib/config.ts` para ver quais variáveis são esperadas

## Arquivos de Configuração Importantes

- **`package.json`** - Define scripts de build e dependências
- **`vercel.json`** - Configuração específica do Vercel
- **`tsconfig.json`** - Configuração do TypeScript
- **`vite.config.ts`** - Configuração do Vite
- **`.nvmrc`** - Versão do Node.js (20)

## Recursos Adicionais

- [Documentação oficial do Vercel](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- Documentação do projeto:
  - `OAUTH_SETUP.md`
  - `VERCEL_DEPLOYMENT.md`
  - `QUICKSTART.md`
  - `README.md`

## Checklist de Deploy

- [ ] Node.js versão 20.x selecionada no Vercel
- [ ] Framework preset configurado como Vite
- [ ] Build command: `npm ci && npm run build`
- [ ] Output directory: `dist`
- [ ] `VITE_GOOGLE_CLIENT_ID` configurado
- [ ] `VITE_REDIRECT_URI` configurado com domínio correto
- [ ] `VITE_APP_ENV` = `production`
- [ ] Domínio autorizado no Google Cloud Console
- [ ] Build completo com sucesso
- [ ] Aplicação carrega corretamente
- [ ] Login com Google funciona

---

**Última atualização:** 2025-11-19  
**Status:** Build corrigido e funcionando ✅

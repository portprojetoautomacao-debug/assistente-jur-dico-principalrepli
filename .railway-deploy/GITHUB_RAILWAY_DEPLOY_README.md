# Configuração do Deploy Automático no GitHub para Railway

## 🚀 Como Configurar

### 1. Obter Token do Railway
1. Acesse [Railway Dashboard](https://railway.app)
2. Vá para **Account Settings** > **Tokens**
3. Clique em **Create Token**
4. Copie o token gerado

### 2. Obter Project ID
1. No Railway Dashboard, selecione seu projeto
2. Vá para **Settings** > **General**
3. Copie o **Project ID** (atual: `65944b39-fdb1-491c-9395-d684e3e05204`)

### ⚠️ Usando Project Token
Você também pode usar um Project Token diretamente:
- Token: `11111014-68c4-4259-b094-36c66477b7df`
- Defina como `RAILWAY_TOKEN` no GitHub Secrets

### 3. Configurar Secrets no GitHub
1. Acesse seu repositório no GitHub
2. Vá para **Settings** > **Secrets and variables** > **Actions**
3. Adicione os seguintes secrets:

| Secret | Valor |
|--------|-------|
| `RAILWAY_TOKEN` | Token obtido no passo 1 |
| `RAILWAY_PROJECT_ID` | Project ID obtido no passo 2 |
| `RAILWAY_SERVICE_NAME` | `assistente-juridico-pje` (opcional) |

### 4. Configurar Variáveis de Ambiente no Railway
1. No Railway Dashboard, vá para seu projeto
2. Vá para **Variables** no painel lateral
3. Adicione todas as variáveis do arquivo `railway-env-vars.txt` que criei

### 5. Ativar Deploy Automático
- O workflow `railway-deploy.yml` já está configurado
- Ele dispara automaticamente em push para a branch `main`
- Também pode ser executado manualmente via **Actions** > **Railway Deploy**

## 📋 Checklist de Configuração

- [ ] Railway Token criado e adicionado como secret
- [ ] Railway Project ID adicionado como secret
- [ ] Todas as variáveis de ambiente configuradas no Railway
- [ ] Workflow `railway-deploy.yml` criado
- [ ] Primeiro deploy testado

## 🔍 Monitoramento

Após configurar, monitore os deploys em:
- **GitHub Actions**: Para logs do workflow
- **Railway Dashboard**: Para status do deploy e logs da aplicação

## 🆘 Troubleshooting

Se o deploy falhar:
1. Verifique se todos os secrets estão configurados
2. Confirme se as variáveis de ambiente estão no Railway
3. Cheque os logs no GitHub Actions e Railway
4. Certifique-se que o `railway.json` está correto

---
*Configurado automaticamente pelo GitHub Copilot*

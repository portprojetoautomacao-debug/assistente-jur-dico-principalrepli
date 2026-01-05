# 🔧 Configuração do Webhook no GitHub

## 📍 Passo a Passo

### 1️⃣ Acessar as Configurações
1. Vá para: https://github.com/thiagobodevan-a11y/assistente-jurdico-p/settings/hooks
2. Clique em **"Add webhook"** (ou edite um webhook existente se já houver)

---

### 2️⃣ Preencher os Campos

#### **Payload URL** ⚠️ IMPORTANTE
Cole exatamente esta URL:
```
https://assistente-jurdico-p.vercel.app/api/health?x-vercel-protection-bypass=qajocbzc7FeZcqllHRkERDIRhAYaQD08
```

#### **Content type**
Selecione: `application/json`

#### **Secret** (opcional)
Deixe em branco por enquanto (pode adicionar depois se quiser validação extra)

#### **SSL verification**
Marque: ✅ **Enable SSL verification**

---

### 3️⃣ Selecionar Eventos

Marque a opção: **"Let me select individual events"**

Depois, marque os seguintes eventos:

#### 📦 Eventos de Código
- ✅ **Pushes** - Quando código é enviado para o repositório
- ✅ **Pull requests** - Abrir, fechar, atualizar PRs

#### 🔄 Eventos de CI/CD
- ✅ **Workflow jobs** - Status dos jobs do GitHub Actions
- ✅ **Workflow runs** - Status das execuções completas
- ✅ **Check runs** - Resultados de verificações individuais
- ✅ **Check suites** - Conjunto completo de verificações

#### 🚀 Eventos de Deploy
- ✅ **Deployments** - Quando um deploy é criado
- ✅ **Deployment statuses** - Mudanças no status do deploy

#### 📊 Eventos de Status
- ✅ **Statuses** - Status de commits (success, failure, pending)

#### 🔔 Eventos Adicionais (Opcional)
- ⬜ **Issues** - Se quiser monitorar issues
- ⬜ **Issue comments** - Comentários em issues
- ⬜ **Pull request reviews** - Reviews de PRs
- ⬜ **Releases** - Quando uma release é publicada

---

### 4️⃣ Ativar o Webhook

Na parte inferior da página:
- ✅ Marque **"Active"** - Ativa o webhook para receber eventos

Clique em **"Add webhook"** (ou **"Update webhook"** se estiver editando)

---

## ✅ Testar o Webhook

Depois de criar/atualizar:

1. GitHub vai enviar automaticamente um evento de teste (ping)
2. Você verá na seção **"Recent Deliveries"**
3. Verifique se o status é **200 OK** (verde) ✅
4. Se aparecer **401** ou **403**, significa que o token de bypass não está funcionando

### Teste Manual
Faça um commit pequeno no repositório para testar:
```bash
git commit --allow-empty -m "test: webhook configuration"
git push
```

Depois veja em "Recent Deliveries" se o evento `push` foi entregue com sucesso.

---

## 🔍 Verificar Entregas

Para ver os eventos que o webhook está recebendo:

1. Vá em: https://github.com/thiagobodevan-a11y/assistente-jurdico-p/settings/hooks
2. Clique no webhook criado
3. Role até **"Recent Deliveries"**
4. Clique em qualquer entrega para ver:
   - Headers enviados
   - Payload (corpo da mensagem)
   - Resposta do servidor

---

## 🛠️ Solução de Problemas

### Erro 401 Unauthorized
- ✅ Verifique se copiou a URL completa com o token de bypass
- ✅ Confirme que não há espaços extras na URL

### Erro 404 Not Found
- ✅ Verifique se o endpoint `/api/health` existe e está deployado
- ✅ Teste a URL diretamente no navegador

### Erro 500 Internal Server Error
- ✅ Verifique os logs da Vercel
- ✅ Pode ser um erro no código do endpoint

### Nenhuma entrega aparece
- ✅ Confirme que "Active" está marcado
- ✅ Verifique se selecionou pelo menos um evento
- ✅ Faça uma ação que dispare um dos eventos selecionados

---

## 📝 Resumo da Configuração

```yaml
URL: https://assistente-jurdico-p.vercel.app/api/health?x-vercel-protection-bypass=qajocbzc7FeZcqllHRkERDIRhAYaQD08
Content-Type: application/json
SSL: Habilitado
Eventos:
  - push
  - pull_request
  - workflow_job
  - workflow_run
  - check_run
  - check_suite
  - deployment
  - deployment_status
  - status
```

---

## 🔐 Segurança

O token `qajocbzc7FeZcqllHRkERDIRhAYaQD08` já está visível na URL do webhook. Para maior segurança:

1. **Mantenha o repositório privado** ✅ (já está)
2. **Use Webhook Secrets** (opcional) - Adicione um secret no campo "Secret" para validar que as requisições vieram realmente do GitHub
3. **Monitore os logs** - Verifique regularmente se há tentativas de acesso suspeitas

---

## 📚 Links Úteis

- [Configurar Webhooks](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/settings/hooks)
- [Documentação GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Eventos de Webhook Disponíveis](https://docs.github.com/en/webhooks/webhook-events-and-payloads)

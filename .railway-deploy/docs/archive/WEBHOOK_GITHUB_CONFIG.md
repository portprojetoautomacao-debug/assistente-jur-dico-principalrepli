# 🔗 Configuração do Webhook do GitHub

## ✅ URL Atualizada para o Webhook

Use esta URL no campo **Payload URL** das configurações do Webhook no GitHub:

```
https://assistente-jurdico-p.vercel.app/api/health?x-vercel-protection-bypass=qajocbzc7FeZcqllHRkERDIRhAYaQD08
```

### 📋 Informações do Bypass

- **Token Atual:** `qajocbzc7FeZcqllHRkERDIRhAYaQD08`
- **Variável de Ambiente:** `VERCEL_AUTOMATION_BYPASS_SECRET`
- **Ambientes:** Produção, Pré-visualização e Todos os Ambientes Personalizados
- **Domínio de Produção:** `assistente-jurdico-p.vercel.app`

---

## 🛠️ Como Configurar no GitHub

### Passo 1: Acessar Configurações do Webhook
1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Webhooks**
4. Clique no webhook que está apresentando erro 401

### Passo 2: Atualizar a URL
1. Clique no botão **Edit** (Editar)
2. No campo **Payload URL**, cole a URL completa acima
3. **Content type:** Mantenha `application/json`
4. **SSL verification:** Mantenha habilitado
5. Role até o final e clique em **Update webhook**

### Passo 3: Testar o Webhook
1. Na aba **Recent Deliveries** (Entregas recentes)
2. Clique em uma entrega que falhou (erro 401)
3. Clique no botão **Redeliver** (Reenviar)
4. Verifique se agora retorna **200 OK** em vez de **401 Unauthorized**

---

## 🔐 URLs Alternativas (Se Necessário)

### Para Preview/Deploy Específico
Se você precisar apontar para um deploy específico em vez de produção:

```
https://assistente-jurdico-1n8vjqq2n-thiagos-projects-9834ca6f.vercel.app/api/health?x-vercel-protection-bypass=qajocbzc7FeZcqllHRkERDIRhAYaQD08
```

⚠️ **Atenção:** Esta URL muda a cada novo deploy. Use apenas se necessário.

### Para Outros Endpoints
Se o webhook precisa apontar para outro endpoint (não `/api/health`), substitua essa parte mantendo o token:

```
https://assistente-jurdico-p.vercel.app/SEU_ENDPOINT?x-vercel-protection-bypass=qajocbzc7FeZcqllHRkERDIRhAYaQD08
```

---

## 📝 Eventos Recomendados para Monitorar

Marque os seguintes eventos no webhook do GitHub:

- ✅ **push** - Quando código é enviado
- ✅ **workflow_job** - Status dos jobs do GitHub Actions
- ✅ **workflow_run** - Status das execuções de workflow
- ✅ **check_run** - Resultados de verificações
- ✅ **check_suite** - Conjunto de verificações
- ✅ **deployment** - Criação de deploys
- ✅ **deployment_status** - Status de deploys
- ✅ **status** - Status de commits

---

## 🔄 Se Precisar Regenerar o Token

Se você regenerar o token de bypass na Vercel:

1. **Obtenha o novo token** na seção "Bypass de proteção para automação" nas configurações do projeto Vercel
2. **Atualize a URL do webhook** substituindo o valor após `?x-vercel-protection-bypass=`
3. **Faça redeploy** na Vercel para que a variável de ambiente seja atualizada
4. **Atualize o GitHub Secret** `VERCEL_AUTOMATION_BYPASS_SECRET` se usar GitHub Actions

---

## ✅ Teste Rápido via Terminal

Para testar se a URL está funcionando:

```bash
curl -s "https://assistente-jurdico-p.vercel.app/api/health?x-vercel-protection-bypass=qajocbzc7FeZcqllHRkERDIRhAYaQD08"
```

Você deve receber uma resposta JSON (não um HTML de erro 401).

---

## 📚 Referências

- [Documentação Vercel - Bypass de Proteção](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)

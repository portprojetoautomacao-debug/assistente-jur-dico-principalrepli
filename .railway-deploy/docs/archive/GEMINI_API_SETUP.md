# Configuração da API do Google Gemini

Este guia explica como configurar a chave da API do Google Gemini no seu projeto.

## 🔑 Obter a Chave da API

1. **Acesse o Google AI Studio**
   - Visite: https://aistudio.google.com/app/apikey
   - Faça login com sua conta Google

2. **Criar uma Nova Chave**
   - Clique em "Create API Key" (Criar chave de API)
   - Escolha um projeto do Google Cloud (ou crie um novo)
   - Copie a chave gerada (ela começa com `AIza...`)

## ⚙️ Configurar no Projeto

### Desenvolvimento Local

1. **Crie o arquivo `.env`** na raiz do projeto (se ainda não existir):
   ```bash
   cp .env.example .env
   ```

2. **Edite o arquivo `.env`** e adicione sua chave:
   ```env
   VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

### Deploy na Vercel

1. **Acesse o Dashboard da Vercel**
   - Vá para: https://vercel.com/dashboard
   - Selecione seu projeto

2. **Adicione a Variável de Ambiente**
   - Vá em "Settings" → "Environment Variables"
   - Adicione uma nova variável:
     - **Name:** `VITE_GEMINI_API_KEY`
     - **Value:** Sua chave da API (AIza...)
     - **Environment:** Production, Preview, Development

3. **Redesploy o Projeto**
   - Vá em "Deployments"
   - Clique em "Redeploy" no último deployment

### Deploy em Outros Ambientes

Para outros ambientes (Railway, Render, etc.), adicione a variável de ambiente `VITE_GEMINI_API_KEY` com sua chave da API nas configurações do serviço.

## 🔒 Segurança

### ⚠️ IMPORTANTE - Proteção da Chave

- **NUNCA** comite o arquivo `.env` no Git
- O arquivo `.env` já está no `.gitignore` por padrão
- Use sempre o prefixo `VITE_` para variáveis que precisam ser acessadas no frontend
- Para produção, considere usar uma API intermediária (backend) para maior segurança

### Verificar se o `.env` está protegido

Execute este comando para garantir que `.env` está no `.gitignore`:
```bash
grep -q "^\.env$" .gitignore && echo "✅ .env está protegido" || echo "❌ Adicione .env ao .gitignore"
```

## 📝 Uso no Código

### Acessar a Chave da API

```typescript
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!geminiApiKey) {
  console.error('VITE_GEMINI_API_KEY não configurada')
}
```

### Exemplo de Uso com Gemini

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-pro" })

const result = await model.generateContent("Explique o que é um recurso de apelação")
const response = await result.response
const text = response.text()
```

## 🆓 Limites e Cotas

### Tier Gratuito do Gemini
- **60 requisições por minuto**
- **1,500 requisições por dia**
- **1 milhão de tokens por minuto**

Para aplicações em produção com maior demanda, considere:
- Implementar cache de respostas
- Adicionar rate limiting
- Migrar para um plano pago se necessário

## 🧪 Testar a Configuração

Crie um arquivo de teste `test-gemini.ts`:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"

async function testGemini() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey) {
    console.error("❌ VITE_GEMINI_API_KEY não configurada")
    return
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    
    const result = await model.generateContent("Diga olá")
    const response = await result.response
    const text = response.text()
    
    console.log("✅ API do Gemini configurada corretamente!")
    console.log("Resposta:", text)
  } catch (error) {
    console.error("❌ Erro ao testar API do Gemini:", error)
  }
}

testGemini()
```

## 🔗 Links Úteis

- **Google AI Studio:** https://aistudio.google.com/
- **Documentação do Gemini:** https://ai.google.dev/docs
- **Gerenciar Chaves de API:** https://aistudio.google.com/app/apikey
- **Documentação Gemini JavaScript:** https://ai.google.dev/tutorials/web_quickstart

## ❓ Problemas Comuns

### Erro: "API key not valid"
- Verifique se a chave foi copiada corretamente
- Confirme que a API Generative Language está habilitada no Google Cloud Console

### Erro: "VITE_GEMINI_API_KEY is undefined"
- Reinicie o servidor de desenvolvimento após criar/editar o `.env`
- Verifique se o nome da variável está correto (com o prefixo `VITE_`)

### Erro de quota excedida
- Você atingiu o limite de requisições do tier gratuito
- Aguarde a renovação (diária/por minuto) ou faça upgrade do plano

## 📞 Suporte

Se tiver problemas com a configuração:
1. Verifique se seguiu todos os passos deste guia
2. Consulte a documentação oficial do Gemini
3. Revise os logs de erro no console

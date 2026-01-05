# 🚀 Guia Rápido - Configuração da API do Gemini

## ⚡ Configuração em 3 Passos

### 1️⃣ Obter a Chave da API

1. Acesse: **https://aistudio.google.com/app/apikey**
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave (começa com `AIza...`)

### 2️⃣ Adicionar no Projeto

**Opção A - Desenvolvimento Local:**

```bash
# 1. Copie o arquivo de exemplo
cp .env.example .env

# 2. Abra o arquivo .env e adicione sua chave:
# VITE_GEMINI_API_KEY=AIzaSy...sua-chave-aqui
```

**Opção B - Deploy na Vercel:**

1. Vá em: **Settings → Environment Variables**
2. Adicione:
   - Nome: `VITE_GEMINI_API_KEY`
   - Valor: Sua chave da API
3. Clique em **"Redeploy"**

### 3️⃣ Testar

```bash
# Execute o script de verificação
./verificar-gemini.sh

# Ou reinicie o servidor
npm run dev
```

## 🎯 Uso no Código

```typescript
import { callGemini, analyzeDocument } from '@/lib/gemini-service'

// Exemplo 1: Chamada simples
const response = await callGemini('Explique o que é uma petição inicial')
console.log(response.text)

// Exemplo 2: Analisar documento
const analysis = await analyzeDocument(documentText)
console.log(analysis.text)
```

## 🔒 Segurança

✅ **O arquivo `.env` já está protegido no `.gitignore`**

❌ **NUNCA faça commit da sua chave no Git!**

## 📞 Problemas?

### Erro: "API key not valid"
→ Verifique se copiou a chave completa

### Erro: "VITE_GEMINI_API_KEY is undefined"
→ Reinicie o servidor após editar o `.env`

### Precisa de mais ajuda?
→ Veja a documentação completa: **GEMINI_API_SETUP.md**

## 🆓 Limites Gratuitos

- 60 requisições/minuto
- 1.500 requisições/dia
- Suficiente para desenvolvimento e testes!

---

**Pronto! 🎉** Sua API do Gemini está configurada e pronta para uso.

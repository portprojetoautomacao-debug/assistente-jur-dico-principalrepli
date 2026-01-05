# Configuração de Variáveis de Ambiente - Vercel

## 📋 Variáveis Necessárias

Configure estas variáveis no painel do Vercel (Project Settings > Environment Variables):

### 🔐 **APIs e Integrações**

| Variável | Tipo | Descrição | Exemplo |
|----------|------|-----------|---------|
| `GEMINI_API_KEY` | Secret | Chave da API do Google Gemini | `AIzaSy...` |
| `TODOIST_TOKEN` | Secret | Token de acesso do Todoist | `1234567890abcdef...` |
| `DJEN_API_KEY` | Secret | Chave da API DJEN/DataJud | `djen_...` |

### 📱 **WhatsApp (Evolution API)**

| Variável | Tipo | Descrição | Exemplo |
|----------|------|-----------|---------|
| `EVOLUTION_API_KEY` | Secret | Chave da Evolution API | `evolution_...` |
| `EVOLUTION_INSTANCE_ID` | Plain | ID da instância WhatsApp | `instance_123` |
| `EVOLUTION_API_URL` | Plain | URL da Evolution API | `https://api.evolution.com.br` |

## 🚀 Como Configurar

### Passo 1: Acesse o Painel do Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Entre na sua conta
3. Selecione o projeto `assistente-juridico-p`

### Passo 2: Configurar Variáveis
1. Clique em **Settings** (engrenagem)
2. Vá para **Environment Variables**
3. Clique em **Add New**
4. Preencha:
   - **Name**: Nome da variável (ex: `GEMINI_API_KEY`)
   - **Value**: Valor da variável
   - **Environment**: `Production` (para produção)
   - **Type**: `Secret` (para chaves) ou `Plain` (para URLs/IDs)

### Passo 3: Aplicar Mudanças
1. Após adicionar todas as variáveis, clique em **Save**
2. **Redeploy** o projeto para aplicar as mudanças

## 🔍 Verificação

Para verificar se as variáveis estão configuradas corretamente:

1. Vá para **Deployments** no painel do Vercel
2. Clique no deployment mais recente
3. Vá para **Functions** tab
4. Verifique se não há erros relacionados a variáveis não definidas

## ⚠️ Importante

- **Nunca commite** chaves de API no código
- Use sempre **Secret** para chaves sensíveis
- **Teste localmente** com um arquivo `.env.local`
- **Redeploy** após alterar variáveis

## 📝 Arquivo .env.example

Para desenvolvimento local, crie um arquivo `.env.example`:

```bash
# APIs
GEMINI_API_KEY=your_gemini_api_key_here
TODOIST_TOKEN=your_todoist_token_here
DJEN_API_KEY=your_djen_api_key_here

# WhatsApp
EVOLUTION_API_KEY=your_evolution_api_key
EVOLUTION_INSTANCE_ID=your_instance_id
EVOLUTION_API_URL=https://api.evolution.com.br
```

---

**Última atualização:** 24 de novembro de 2024
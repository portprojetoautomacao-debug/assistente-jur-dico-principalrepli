# Integração RAG: VS Code Copilot + ChatGPT

Este guia mostra como integrar a busca semântica do repositório (Chroma Cloud) com **GitHub Copilot (VS Code)** e **ChatGPT (Actions)**.

---

## 📦 O que foi implementado

### Backend (Express)
- **Serviço**: `backend/src/services/chroma-cloud.ts`
- **Rota**: `/api/rag` (`backend/src/routes/rag.ts`)

### Endpoints disponíveis

#### `GET /api/rag/search`
Busca semântica na collection do repo.

**Query params:**
- `q` (required): texto da busca (ex: "health check endpoint")
- `k` (optional): número de resultados (default: 5)
- `where` (optional): filtro JSON de metadata (ex: `{"type":"typescript"}`)
- `where_doc` (optional): filtro JSON de documento (ex: `{"$contains":"djen"}`)

**Exemplo:**
```bash
curl "http://localhost:3001/api/rag/search?q=djen%20scheduler&k=3"
```

**Resposta:**
```json
{
  "query": "djen scheduler",
  "results": [
    {
      "id": "...",
      "document": "código ou trecho do arquivo",
      "metadata": { "path": "backend/src/services/djen-scheduler.ts", ... },
      "distance": 0.23
    }
  ],
  "count": 3
}
```

#### `GET /api/rag/status`
Verifica se o serviço RAG está configurado.

**Exemplo:**
```bash
curl "http://localhost:3001/api/rag/status"
```

**Resposta:**
```json
{
  "configured": true,
  "collections": ["portprojetoautomacao_debug_assistente_jur_dico_principalrepli_main"],
  "activeCollection": "portprojetoautomacao_debug_assistente_jur_dico_principalrepli_main",
  "documentCount": 5400
}
```

---

## 🔧 Configuração (variáveis de ambiente)

### No `.env` (backend)
```bash
# Chroma Cloud - API do banco (para consultas RAG)
CHROMA_API_KEY=ck-... # Gere NOVA chave no painel (revogue a antiga)
CHROMA_TENANT=e6e7dd43-01bd-4327-b326-651e207780a8
CHROMA_DATABASE=Demo
CHROMA_COLLECTION_NAME=portprojetoautomacao_debug_assistente_jur_dico_principalrepli_main
```

### No Vercel (produção)
Adicione essas variáveis no painel **Environment Variables** do Vercel.

---

## 🤖 Integração 1: VS Code (extensão ou comando)

### Opção A: Criar extensão VS Code com chat participant

**O que faz:** adiciona um participante `@repo` (ou `@chroma`) ao chat do Copilot.

#### 1) Criar estrutura básica

```bash
npm install -g yo generator-code
yo code
```
- Type: New Extension (TypeScript)
- Nome: `repo-rag-assistant`

#### 2) Editar `extension.ts`

```typescript
import * as vscode from 'vscode';
import fetch from 'node-fetch';

export function activate(context: vscode.ExtensionContext) {
  const participant = vscode.chat.createChatParticipant('repo', async (request, context, stream, token) => {
    const query = request.prompt;

    try {
      const res = await fetch(`http://localhost:3001/api/rag/search?q=${encodeURIComponent(query)}&k=5`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        stream.markdown(`## 🔍 Contexto do repositório (${data.count} resultados)\n\n`);

        for (const result of data.results) {
          const path = result.metadata.path || 'unknown';
          stream.markdown(`### [${path}](file://${path})\n`);
          stream.markdown(`\`\`\`\n${result.document.substring(0, 300)}...\n\`\`\`\n`);
          stream.markdown(`_Relevância: ${(1 - result.distance).toFixed(2)}_\n\n`);
        }
      } else {
        stream.markdown('Nenhum resultado encontrado.');
      }
    } catch (err) {
      stream.markdown(`❌ Erro: ${err.message}`);
    }
  });

  context.subscriptions.push(participant);
}
```

#### 3) Usar no VS Code
- Abra o chat do Copilot
- Digite: `@repo Como funciona o health check?`

---

### Opção B: Comando VS Code simples

Adicione em `extension.ts`:

```typescript
const disposable = vscode.commands.registerCommand('repo-rag.search', async () => {
  const query = await vscode.window.showInputBox({ prompt: 'Busca semântica no repo:' });
  if (!query) return;

  const res = await fetch(`http://localhost:3001/api/rag/search?q=${encodeURIComponent(query)}&k=3`);
  const data = await res.json();

  const panel = vscode.window.createWebviewPanel('ragResults', 'RAG Results', vscode.ViewColumn.One, {});
  panel.webview.html = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
});
```

#### Usar:
- `Ctrl+Shift+P` → `Repo RAG: Search`

---

## 💬 Integração 2: ChatGPT (GPT Actions)

### 1) Criar um Custom GPT
- Acesse [https://chat.openai.com/gpts/editor](https://chat.openai.com/gpts/editor)
- Nome: "Assistente Jurídico Repo RAG"
- Instructions: "Você é um assistente que responde perguntas sobre o repositório do Assistente Jurídico PJe. Use a Action 'search_repo' para buscar contexto antes de responder."

### 2) Adicionar Action (OpenAPI schema)

```yaml
openapi: 3.0.0
info:
  title: Assistente Jurídico RAG API
  version: 1.0.0
servers:
  - url: https://SEU_DOMINIO_VERCEL.app
paths:
  /api/rag/search:
    get:
      operationId: search_repo
      summary: Busca semântica no repositório
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
          description: Query de busca
        - name: k
          in: query
          schema:
            type: integer
            default: 5
          description: Número de resultados
      responses:
        '200':
          description: Resultados da busca
          content:
            application/json:
              schema:
                type: object
                properties:
                  query:
                    type: string
                  results:
                    type: array
                    items:
                      type: object
                  count:
                    type: integer
```

### 3) Configurar autenticação (opcional)
- Se quiser proteger, adicione um header `Authorization: Bearer SEU_TOKEN` e valide no backend.

### 4) Testar
- No ChatGPT: "Como funciona o DJEN scheduler?"
- Ele automaticamente chama a Action e usa o contexto.

---

## 🔒 Segurança

1. **API Key Chroma Cloud:**
   - Revogue a chave exposta anteriormente no painel Chroma Cloud.
   - Gere uma nova e adicione somente no `.env` local ou Vercel Secrets.

2. **Endpoint `/api/rag/search`:**
   - Se exposto publicamente, considere rate limiting adicional ou autenticação via header.

3. **HTTPS:**
   - Em produção, sempre use HTTPS (Vercel já provê).

---

## ✅ Checklist de setup

- [ ] Revocar/rotacionar `CHROMA_API_KEY` antiga
- [ ] Preencher variáveis de ambiente no `.env`
- [ ] Testar `/api/rag/search` localmente (curl ou Postman)
- [ ] Escolher integração (VS Code extensão ou ChatGPT Actions)
- [ ] Testar integração end-to-end

---

## 📚 Próximos passos (avançado)

- **Hybrid RAG**: combinar busca semântica + keyword (BM25)
- **Reranking**: usar modelo de reranking antes de retornar resultados
- **Cache**: cachear queries frequentes (Redis)
- **Streaming**: retornar resultados progressivamente (SSE)

---

**Status:** ✅ Backend pronto. Integração VS Code/ChatGPT é manual (seguir passos acima).

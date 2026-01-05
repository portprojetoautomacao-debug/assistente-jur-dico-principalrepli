# Sincronização de Documentos PJe

O sistema possui uma integração bidirecional com o PJe através de uma extensão do Chrome, permitindo a captura automática de documentos e metadados processuais.

## 🚀 Funcionalidades

- **Captura em Tempo Real**: Detecta documentos abertos no PJe instantaneamente.
- **Extração de Metadados**: Identifica número do processo, autor, réu, comarca e vara.
- **Sincronização Automática**: Salva documentos no sistema sem intervenção manual (configurável).
- **Widget de Gestão**: Interface para revisar, salvar ou descartar documentos capturados.

## 🛠️ Componentes

### 1. Extensão Chrome (`chrome-extension-pje/`)
- **Content Script**: Injeta-se nas páginas do PJe para extrair dados do DOM.
- **Background Worker**: Gerencia a comunicação com a aplicação web.
- **Popup**: Permite configurar a URL da aplicação e verificar status.

### 2. Hooks React (`src/hooks/use-pje-document-sync.ts`)
- `usePJeDocumentSync`: Gerencia a comunicação via `chrome.runtime` e estado local.
- `usePJeDocumentWidget`: Controla a visibilidade e dados do widget de UI.
- `useAutoSavePJeDocuments`: Lógica para salvar automaticamente tipos específicos de documentos (ex: certidões).

### 3. Interface (`src/components/PJeDocumentWidget.tsx`)
- **Badge de Status**: Indica se a extensão está ativa na aba atual.
- **Painel Lateral (Sheet)**: Lista documentos pendentes com preview e ações.

## 📦 Como Usar

1. **Instalar a Extensão**:
   - Vá para `chrome://extensions/`
   - Ative o "Modo do desenvolvedor"
   - Clique em "Carregar sem compactação" e selecione a pasta `chrome-extension-pje/dist`

2. **No PJe**:
   - Abra um processo ou documento.
   - A extensão detectará automaticamente o conteúdo.

3. **No Assistente Jurídico**:
   - O badge "PJe Sync" ficará verde.
   - Novos documentos aparecerão no widget para revisão.

## 🔧 Desenvolvimento

### Comandos Úteis
```bash
# Build da extensão
cd chrome-extension-pje
npm run build

# Testes dos hooks
npm test -- src/hooks/use-pje-document-sync.test.ts
```

### Estrutura de Mensagens
A comunicação utiliza o formato:
```typescript
interface SyncMessage {
  type: "SYNC_DOCUMENTO" | "PING" | "PONG";
  payload?: DocumentoPJe;
}
```

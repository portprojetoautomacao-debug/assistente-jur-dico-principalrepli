# ?? Guia de Deploy Local - Assistente Jurídico PJe

Este guia fornece instruções passo a passo para fazer deploy local do sistema.

---

## ?? Pré-requisitos

### Software Necessário

- ? **Node.js 22.x** (obrigatório - versão especificada no package.json)
- ? **npm 11.x** ou superior
- ? **Git** (para controle de versão)
- ?? **Upstash Redis** (conta gratuita em https://upstash.com)

### Variáveis de Ambiente Obrigatórias

Crie um arquivo `.env` na raiz do projeto com:

```env
# === OBRIGATÓRIAS ===
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
UPSTASH_REDIS_REST_URL=https://sua-instancia.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_aqui

# === OPCIONAIS (mas recomendadas) ===
VITE_GOOGLE_CLIENT_ID=seu_client_id_google
VITE_GOOGLE_API_KEY=sua_api_key_google
VITE_SENTRY_DSN=seu_dsn_sentry

# === PARA PRODUÇÃO ===
VITE_APP_ENV=production
```

---

## ?? Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal
cd assistente-jur-dico-principal
```

### 2. Instalar Dependências

```powershell
# PowerShell (Windows)
npm install

# Se houver erro de versão do Node, use:
nvm use 22
# ou instale Node.js 22.x de https://nodejs.org
```

### 3. Configurar Variáveis de Ambiente

```powershell
# Copiar arquivo de exemplo
Copy-Item .env.example .env

# Editar .env com suas credenciais
notepad .env
```

### 4. Inicializar Redis (Upstash)

```powershell
# Testar conexão com Redis
curl $env:UPSTASH_REDIS_REST_URL

# Inicializar configuração dos agentes
Invoke-RestMethod -Uri "http://localhost:5173/api/kv?action=init" -Method POST
```

---

## ??? Build e Preview Local

### Opção 1: Build Completo

```powershell
# Build de produção
npm run build

# Preview do build (porta 4173)
npm run preview
```

### Opção 2: Modo Desenvolvimento

```powershell
# Servidor de desenvolvimento (porta 5173)
npm run dev
```

### Opção 3: Script Automatizado

Use o script `build-and-preview.ps1` (Windows):

```powershell
# Executa build + preview + abre navegador
.\build-and-preview.ps1

# Ou use a versão .bat
.\build-and-preview.bat
```

---

## ?? Validação do Deploy

### Checklist de Verificação

Execute os seguintes comandos para validar:

```powershell
# 1. Type-check
npm run type-check

# 2. Linting
npm run lint

# 3. Testes unitários
npm run test:run

# 4. Build completo
npm run build
```

### Endpoints para Testar

Após o deploy local, teste:

```powershell
# Health check da API
curl http://localhost:5173/api/health

# Testar KV
curl http://localhost:5173/api/kv?key=test

# Testar agentes
curl http://localhost:5173/api/agents
```

---

## ?? Troubleshooting

### Problema: "Unsupported engine" no npm install

**Causa:** Versão do Node.js incompatível

**Solução:**
```powershell
# Instalar nvm-windows
https://github.com/coreybutler/nvm-windows/releases

# Instalar Node.js 22.x
nvm install 22
nvm use 22

# Verificar versão
node -v  # Deve retornar v22.x.x
```

### Problema: Erro "Cannot find module '@tiptap/...'"

**Causa:** Dependências não instaladas corretamente

**Solução:**
```powershell
# Limpar cache e reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Problema: Build falha com erros TypeScript

**Causa:** Tipos incompatíveis ou dependências faltantes

**Solução:**
```powershell
# Instalar dependências faltantes
npm install lodash.throttle @types/lodash.throttle
npm install tesseract.js @types/tesseract.js
npm install @tiptap/extension-subscript @tiptap/extension-superscript
npm install react-hotkeys-hook @vercel/speed-insights

# Rebuild
npm run build
```

### Problema: Redis não conecta

**Causa:** Variáveis de ambiente incorretas

**Solução:**
```powershell
# Verificar .env
cat .env | Select-String "UPSTASH"

# Testar conexão direta
curl "$env:UPSTASH_REDIS_REST_URL/get/test" `
  -H "Authorization: Bearer $env:UPSTASH_REDIS_REST_TOKEN"
```

---

## ?? Monitoramento Local

### Logs do Sistema

```powershell
# Logs em tempo real (modo dev)
npm run dev

# Logs do build
npm run build 2>&1 | Tee-Object build.log
```

### Verificar Estado dos Agentes

```powershell
# No navegador, abra DevTools Console
# Cole:
localStorage.getItem('autonomous-agents')
```

### Verificar Redis (KV Store)

```powershell
# Listar todas as chaves
curl "http://localhost:5173/api/kv?action=list"

# Buscar valor específico
curl "http://localhost:5173/api/kv?key=processes"
```

---

## ?? Deploy Local com Docker (Opcional)

Se preferir usar Docker:

```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]
```

```powershell
# Build da imagem
docker build -t assistente-juridico .

# Executar container
docker run -p 4173:4173 `
  -e VITE_GEMINI_API_KEY=$env:VITE_GEMINI_API_KEY `
  -e UPSTASH_REDIS_REST_URL=$env:UPSTASH_REDIS_REST_URL `
  -e UPSTASH_REDIS_REST_TOKEN=$env:UPSTASH_REDIS_REST_TOKEN `
  assistente-juridico
```

---

## ?? Estrutura de Pastas (Deploy)

```
dist/                       # Build de produção (gerado por npm run build)
??? index.html             # HTML principal
??? assets/                # CSS, JS minificados
?   ??? index-[hash].js   # Bundle principal
?   ??? index-[hash].css  # Estilos compilados
??? images/               # Assets estáticos

api/                       # Serverless functions (Vercel)
??? kv.ts                 # Endpoint de KV storage
??? agents.ts             # Gerenciamento de agentes
??? expedientes.ts        # CRUD de expedientes
```

---

## ?? Configuração de Performance

### Otimizações Recomendadas

```json
// vite.config.ts - já configurado
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'tiptap': ['@tiptap/react', '@tiptap/starter-kit'],
          'gemini': ['@google/generative-ai']
        }
      }
    }
  }
})
```

---

## ?? Próximos Passos

Após deploy local bem-sucedido:

1. **Testar funcionalidades críticas**
   - Login com Google OAuth
   - Criação de processos
   - Agentes IA respondendo
   - Sincronização PJe (Chrome Extension)

2. **Configurar backups**
   ```powershell
   # Backup do Redis
   curl "$env:UPSTASH_REDIS_REST_URL/DUMP/all" -o backup-redis.json
   ```

3. **Monitorar performance**
   - Abra DevTools > Lighthouse
   - Execute auditoria de performance

4. **Deploy em produção** (quando pronto)
   - Seguir guia: `docs/DEPLOY_CHECKLIST_v1.4.0.md`
   - Deploy automático via Vercel

---

## ?? Suporte

- **Documentação completa:** `README.md`
- **Changelog:** `docs/CHANGELOG_v1.4.0.md`
- **Guia de build:** `BUILD_GUIDE.md`
- **Comandos rápidos:** `QUICK_COMMANDS.md`

---

**Versão:** 1.4.0  
**Última atualização:** 28 de Dezembro de 2025  
**Ambiente:** Local Development

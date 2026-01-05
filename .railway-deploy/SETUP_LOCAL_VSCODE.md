# 📋 Guia Completo: Configurar VS Code para Desenvolvimento Local
Este guia configura seu ambiente VS Code para ficar idêntico ao app em produção no Replit.

Regra absoluta de ética do app e do codificador, copilot etc: esta proibido usar qualquer tipo de simulação: Stub,  Mock, Synthetic Data, Fake,Dummy, Test Doubles,  no app em desenvolvimento e em produção, sendo permitido somente testes reais.

## 1️⃣ Requisitos do Sistema

### Node.js
```bash
# Instale Node.js 20 (mesma versão do Replit)
# Se usar nvm:
nvm install 20
nvm use 20

# Verifique a versão
node -v  # deve mostrar v20.x.x
npm -v   # deve mostrar v10.x.x
```

### Extensões VS Code Recomendadas
- **ESLint** - Validação de código
- **Prettier** - Formatação
- **PostgreSQL** (by Chris Kolkman) - Conexão com banco
- **DotENV** - Syntax highlight para .env
- **Tailwind CSS IntelliSense** - Autocomplete CSS

## 2️⃣ Clonar e Instalar Dependências

```bash
# Clone o repositório (ou baixe do Replit)
git clone <seu-repositorio>
cd assistente-juridico-pje

# Instale dependências do frontend (raiz)
npm install

# Instale dependências do backend
cd backend
npm install
cd ..
```

## 3️⃣ Configurar Variáveis de Ambiente

### Arquivo `.env` (raiz do projeto)
Crie o arquivo `.env` na raiz:

```env
# === Banco de Dados PostgreSQL (Neon) ===
# Copie estes valores do painel Secrets do Replit
DATABASE_URL=postgresql://postgres:SUA_SENHA@SEU_HOST.neon.tech:5432/heliumdb?sslmode=require
PGHOST=SEU_HOST.neon.tech
PGPORT=5432
PGUSER=postgres
PGPASSWORD=SUA_SENHA
PGDATABASE=heliumdb

# === Servidor ===
BACKEND_PORT=3001
NODE_ENV=development

# === APIs de IA ===
VITE_GEMINI_API_KEY=sua-chave-gemini
GOOGLE_API_KEY=sua-chave-google

# === Qdrant (Vector DB) ===
VITE_QDRANT_URL=sua-url-qdrant
VITE_QDRANT_API_KEY=sua-chave-qdrant

# === Sessão ===
SESSION_SECRET=uma-chave-secreta-qualquer
```

### Arquivo `.env.test` (para testes)
```env
# Mesmas variáveis do .env
DATABASE_URL=postgresql://postgres:SUA_SENHA@SEU_HOST.neon.tech:5432/heliumdb?sslmode=require
NODE_ENV=test
BACKEND_PORT=3001
```

### ⚠️ Importante: Adicione ao `.gitignore`
```gitignore
# Arquivos de ambiente local
.env
.env.local
.env.test
.env.*.local
```

## 4️⃣ Configurar VS Code

### Arquivo `.vscode/settings.json`
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*)[\"'`]"]
  ]
}
```

### Arquivo `.vscode/launch.json` (Debug)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Frontend (Vite)",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5000",
      "webRoot": "${workspaceFolder}/src"
    },
    {
      "name": "Backend (Node)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx", "watch", "src/server.ts"],
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    }
  ],
  "compounds": [
    {
      "name": "Full Stack (Frontend + Backend)",
      "configurations": ["Frontend (Vite)", "Backend (Node)"]
    }
  ]
}
```

### Arquivo `.vscode/tasks.json` (Tarefas)
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev: Frontend",
      "type": "npm",
      "script": "dev",
      "problemMatcher": [],
      "isBackground": true,
      "presentation": {
        "group": "dev",
        "reveal": "always"
      }
    },
    {
      "label": "Dev: Backend",
      "type": "shell",
      "command": "cd backend && npm run dev",
      "problemMatcher": [],
      "isBackground": true,
      "options": {
        "env": {
          "NODE_ENV": "development"
        }
      },
      "presentation": {
        "group": "dev",
        "reveal": "always"
      }
    },
    {
      "label": "Dev: Full Stack",
      "dependsOn": ["Dev: Frontend", "Dev: Backend"],
      "problemMatcher": []
    },
    {
      "label": "Build: Produção",
      "type": "npm",
      "script": "build:deploy",
      "problemMatcher": []
    },
    {
      "label": "Test: Produção Local",
      "type": "shell",
      "command": "npm run start:production",
      "problemMatcher": [],
      "options": {
        "env": {
          "NODE_ENV": "production",
          "PORT": "3001"
        }
      }
    }
  ]
}
```

## 5️⃣ Executar o Projeto

### Modo Desenvolvimento (2 terminais)
**Terminal 1 - Frontend:**
```bash
npm run dev
# Roda em http://localhost:5000
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Roda em http://localhost:3001
```

### Modo Produção (simula deploy)
```bash
# Build completo
npm run build:deploy

# Executar como produção
NODE_ENV=production PORT=3001 npm run start:production
# Acesse http://localhost:3001
```

## 6️⃣ Configurar Testes

### Rodar Testes Unitários (Vitest)
```bash
# Testes do frontend
npm run test

# Testes com interface visual
npm run test:ui

# Testes com cobertura
npm run test:coverage
```

### Testes E2E (Playwright)
```bash
# Instalar browsers do Playwright
npx playwright install

# Rodar testes E2E
npm run test:e2e
```

## 7️⃣ Conectar ao PostgreSQL no VS Code
Usando a extensão PostgreSQL:
1. Instale a extensão **PostgreSQL** (Chris Kolkman)
2. Clique no ícone de banco de dados na barra lateral
3. Adicione nova conexão:
   - **Host:** seu-host.neon.tech
   - **Port:** 5432
   - **User:** postgres
   - **Password:** sua-senha
   - **Database:** heliumdb
   - **SSL:** require

## 8️⃣ Estrutura do Projeto
```
assistente-juridico-pje/
├── .vscode/               # Configurações VS Code
│   ├── settings.json
│   ├── launch.json
│   └── tasks.json
├── backend/               # API Express
│   ├── src/
│   │   ├── server.ts      # Servidor principal
│   │   ├── routes/        # Rotas da API
│   │   └── services/      # Serviços (LangGraph, etc)
│   ├── dist/              # Build de produção
│   └── package.json
├── src/                   # Frontend React
│   ├── components/        # Componentes React
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitários
│   └── pages/             # Páginas
├── dist/                  # Build frontend (produção)
├── .env                   # Variáveis locais (não commitar!)
├── .env.test              # Variáveis de teste
├── package.json           # Scripts e dependências
├── vite.config.ts         # Configuração Vite
└── tsconfig.json          # Configuração TypeScript
```

## 9️⃣ Diferenças Dev vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|-----------------|----------|
| Frontend | Vite HMR (porta 5000) | Arquivos estáticos em `/dist` |
| Backend | `tsx watch` (porta 3001) | Node.js compilado (porta 80) |
| Servidores | 2 separados | 1 unificado |
| Hot Reload | ✅ Sim | ❌ Não |
| NODE_ENV | `development` | `production` |

## 🔄 Comandos Rápidos

```bash
# Desenvolvimento
npm run dev                    # Frontend
cd backend && npm run dev      # Backend

# Build
npm run build                  # Só frontend
npm run build:deploy           # Frontend + Backend

# Produção local
npm run start:production       # Testa como se fosse deploy

# Testes
npm run test                   # Vitest
npm run test:e2e               # Playwright

# Lint
npm run lint                   # ESLint
```

## ✅ Checklist de Configuração
- [ ] Node.js 20 instalado
- [ ] Dependências instaladas (raiz + backend)
- [ ] Arquivo `.env` criado com credenciais do Replit
- [ ] `.env` adicionado ao `.gitignore`
- [ ] Extensões VS Code instaladas
- [ ] Conexão PostgreSQL testada
- [ ] Frontend rodando em localhost:5000
- [ ] Backend rodando em localhost:3001
- [ ] Build de produção funcionando

Pronto! Seu ambiente local agora está configurado para funcionar igual ao Replit. 🚀

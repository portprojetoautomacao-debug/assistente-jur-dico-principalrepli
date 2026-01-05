---
name: AIAgentExpertadv
description: Expert in streamlining and enhancing the development of AI Agent Applications, including agent code generation, AI model comparison and recommendation, tracing setup, and evaluation setup.
argument-hint: Create, iterate, trace, and evaluate your AI agents.
tools:
  ['vscode', 'execute', 'read', 'edit', 'search', 'web', 'github/*', 'agent', 'ms-python.python/getPythonEnvironmentInfo', 'ms-python.python/getPythonExecutableCommand', 'ms-python.python/installPythonPackage', 'ms-python.python/configurePythonEnvironment', 'ms-toolsai.jupyter/configureNotebook', 'ms-toolsai.jupyter/listNotebookPackages', 'ms-toolsai.jupyter/installNotebookPackages', 'ms-vscode.vscode-websearchforcopilot/websearch', 'ms-windows-ai-studio.windows-ai-studio/aitk_get_agent_code_gen_best_practices', 'ms-windows-ai-studio.windows-ai-studio/aitk_get_ai_model_guidance', 'ms-windows-ai-studio.windows-ai-studio/aitk_get_agent_model_code_sample', 'ms-windows-ai-studio.windows-ai-studio/aitk_get_tracing_code_gen_best_practices', 'ms-windows-ai-studio.windows-ai-studio/aitk_get_evaluation_code_gen_best_practices', 'ms-windows-ai-studio.windows-ai-studio/aitk_evaluation_agent_runner_best_practices', 'ms-windows-ai-studio.windows-ai-studio/aitk_evaluation_planner', 'sonarsource.sonarlint-vscode/sonarqube_getPotentialSecurityIssues', 'sonarsource.sonarlint-vscode/sonarqube_excludeFiles', 'sonarsource.sonarlint-vscode/sonarqube_setUpConnectedMode', 'sonarsource.sonarlint-vscode/sonarqube_analyzeFile', 'todo']
handoffs:
  - label: Set up tracing
    agent: AIAgentExpert
    prompt: Add tracing to current workspace.
  - label: Add evaluation
    agent: AIAgentExpert
    prompt: Add evaluation framework for current workspace.
---
# AI Agent Development Expert

You are an expert agent specialized in building and enhancing AI agent applications. Your expertise covers the complete lifecycle: agent creation, model selection, observability through tracing, and evaluation setup.

## Core Responsibilities

1. **Agent Creation**: Generate AI agent code with best practices
2. **Model Selection**: Recommend and compare AI models for the agent
3. **Observability**: Integrate tracing for debugging and performance monitoring
4. **Evaluation Setup**: Design and implement comprehensive evaluation frameworks

## AI Agent Development Lifecycle

### Agent Creation & Implementation

- Use `aitk-get_agent_code_gen_best_practices` for best practices, guidance and steps for any AI Agent development

### Model Selection & Optimization

- Use `aitk-get_ai_model_guidance` for guidance and best practices for using AI models

### Observability & Tracing Setup

- Use `aitk-get_tracing_code_gen_best_practices` for best practices for code generation and operations when working with tracing for AI applications

### Evaluation Setup

- Use `aitk-evaluation_planner` for guiding users through clarifying evaluation metrics and test dataset via multi-turn conversation, call this first when evaluation metrics are unclear
- Use `aitk-evaluation_agent_runner_best_practices` for best practices and guidance for using agent runners to collect responses from test datasets for evaluation
- Use `aitk-get_evaluation_code_gen_best_practices` for best practices for the evaluation code generation when working on evaluation for AI application or AI agent

---
Define what this custom agent accomplishes for the user, when to use it, and the edges it won't cross. Specify its ideal inputs/outputs, the tools it may call, and how it reports progress or asks for help.
# Instruções para o GitHub Copilot

Regra absoluta de ética do app e do codificador, copilot etc: esta proibido usar qualquer tipo de simulação: Stub,  Mock, Synthetic Data, Fake,Dummy, Test Doubles,  no app em desenvolvimento e em produção, sendo permitido somente testes reais.

Você é um assistente de codificação especialista trabalhando no projeto **Assistente Jurídico PJe**.
Este projeto é um sistema de gestão jurídica com IA integrada, focado em automação e eficiência para advogados.

**⚠️ STATUS DO PROJETO: MODO MANUTENÇÃO**
O foco atual é **estabilidade, correção de bugs e manutenção**. Não sugira novas funcionalidades complexas a menos que explicitamente solicitado. Priorize soluções robustas e seguras para o código existente.

## 🛠️ Tech Stack & Tecnologias

*   **Frontend:** React 18+, TypeScript, Vite.
*   **Estilização:** Tailwind CSS, Radix UI, Shadcn UI.
*   **Gerenciamento de Estado:** TanStack Query (React Query), Context API.
*   **Backend/Scripts:** Node.js (ES Modules), Python (scripts de automação/IA).
*   **IA & LLMs:** Anthropic SDK, LangChain, Google Gemini.
*   **Testes:** Vitest (Unitários/Integração), Playwright (E2E).
*   **Monitoramento:** Sentry, OpenTelemetry, Azure Application Insights.
*   **Banco de Dados:** Qdrant (Vetorial), Cosmos DB (NoSQL).

## 📝 Diretrizes de Codificação

### TypeScript & React
*   **Strict Mode:** Sempre use tipagem estrita. Evite `any` a todo custo.
*   **Componentes:** Use componentes funcionais com Hooks.
*   **Imports:** Utilize o alias `@/` para importações absolutas (ex: `import { Button } from "@/components/ui/button"`).
*   **Interfaces:** Prefira `interface` para definições de objetos e `type` para uniões/interseções.

### Estilização (Tailwind CSS)
*   Use classes utilitárias do Tailwind.
*   Evite CSS modules ou styled-components, a menos que estritamente necessário.
*   Mantenha a consistência com o design system existente (cores, espaçamentos).

### Segurança & LGPD (Crítico)
*   **PII Filtering:** O sistema possui conformidade rigorosa com a LGPD.
*   **NUNCA** remova ou enfraqueça as proteções de dados sensíveis (CPF, Email, Telefone, etc.).
*   Ao lidar com logs ou envio de dados para IA, certifique-se de que os dados estão sanitizados.

### Testes
*   **Vitest:** Escreva testes unitários para hooks e funções utilitárias.
*   **Playwright:** Mantenha os testes E2E atualizados ao modificar fluxos de UI.
*   **Mocking:** Use mocks para chamadas de API externas nos testes.

## 📂 Estrutura de Arquivos
*   `src/components`: Componentes React reutilizáveis.
*   `src/hooks`: Custom hooks.
*   `src/lib`: Bibliotecas e configurações de terceiros.
*   `src/services`: Camada de serviço e chamadas de API.
*   `src/types`: Definições de tipos TypeScript.
*   `src/utils`: Funções utilitárias puras.

## 🚀 Fluxo de Trabalho
1.  **Analise:** Antes de sugerir código, entenda o contexto e o impacto da mudança.
2.  **Segurança:** Verifique se a solução não introduz vulnerabilidades.
3.  **Simplicidade:** Prefira código limpo e legível a soluções "inteligentes" mas complexas.
4.  **Idioma:** O código (variáveis, funções) deve ser em Inglês (padrão global), mas a UI e comentários explicativos devem ser em **Português (PT-BR)**.

---
**Lembre-se:** Estamos em modo de manutenção. A estabilidade do sistema é a prioridade número 1.

📊 Relatório Completo - Assistente Jurídico PJe
Data: 02 de Janeiro de 2026
Status Geral: ✅ ONLINE e DEPLOYADO

🖥️ Estado do Servidor
Componente	Status	Porta	Ambiente
Frontend (Vite)	✅ Rodando	5000	development
Backend (Express)	✅ Rodando	3001	development
PostgreSQL	✅ Conectado	-	Neon-backed
Deploy (Autoscale)	✅ Publicado	80	production
🤖 Agentes de IA (LangGraph)
Total: 15 agentes disponíveis
Framework: LangGraph + Anthropic Claude

#	Agente	Tipo	Status
1	harvey-specter	langgraph-custom	✅ Disponível
2	mrs-justine	langgraph-custom	✅ Disponível
3	monitor-djen	langgraph-djen	✅ Disponível
4	analise-documental	langgraph-custom	✅ Disponível
5	analise-risco	langgraph-custom	✅ Disponível
6	compliance	langgraph-custom	✅ Disponível
7	comunicacao-clientes	langgraph-custom	✅ Disponível
8	estrategia-processual	langgraph-custom	✅ Disponível
9	financeiro	langgraph-custom	✅ Disponível
10	gestao-prazos	langgraph-custom	✅ Disponível
11	organizacao-arquivos	langgraph-custom	✅ Disponível
12	pesquisa-juris	langgraph-custom	✅ Disponível
13	redacao-peticoes	langgraph-custom	✅ Disponível
14	revisao-contratual	langgraph-custom	✅ Disponível
15	traducao-juridica	langgraph-custom	✅ Disponível
Estatísticas de Execução:

Execuções totais: 0 (sistema recém-deployado)
Taxa de sucesso: Aguardando primeiras execuções
Modos de Orquestração:

parallel - Executa múltiplos agentes simultaneamente
sequential - Executa em sequência
fallback - Tenta próximo agente se o atual falhar
⚙️ Workflows Configurados
Workflow	Comando	Porta	Tipo
Frontend Dev Server	npm run dev	5000	webview
Backend Agents Server	cd backend && npm run dev	3001	console
Project	Executa ambos em paralelo	-	parallel
📝 Editor de Minutas
Status: ✅ Operacional

Armazenamento
Banco: PostgreSQL
Minutas salvas: 1
Templates Jurídicos Disponíveis
Total: 12 templates estruturados

Categoria	Templates
Família	Ação de Alimentos
Cível	Ação de Indenização por Danos Morais e Materiais
Consumidor	Ação Revisional de Contrato Bancário
Imobiliário	Ação de Usucapião
Contratos	Contrato de Prestação de Serviços, Contrato de Honorários
Petições	Petição Inicial Genérica, Contestação, Réplica
Recursos	Apelação, Recurso Especial
Diversos	Procuração Ad Judicia
Comandos de IA para Edição
Comando	Função	Status
Continuar	Continua a escrita do texto	✅ Ativo
Expandir	Desenvolve e aprofunda o conteúdo	✅ Ativo
Revisar	Melhora gramática e clareza	✅ Ativo
Formalizar	Converte para linguagem jurídica formal	✅ Ativo
Rate Limiting: 2 segundos entre requisições (com recuperação automática)

📰 Integração DJEN (Diário de Justiça Eletrônico)
API: https://comunicaapi.pje.jus.br/api/v1/comunicacao

Configuração
Parâmetro	Valor
Advogado Padrão	Thiago Bodevan Veiga (OAB MG 184404)
Auto-Cadastro	✅ Habilitado
Fallback Browser	✅ Configurado
Agente Dedicado
monitor-djen - Agente LangGraph especializado em monitorar publicações
Arquivos Principais
src/services/djen-browser-capture.ts - Cliente browser-direct
src/hooks/use-djen-publications.ts - Hook com fallback
src/hooks/use-djen-process-registration.ts - Auto-registro de processos
Obs: A API do CNJ só aceita requisições originadas do Brasil. Fora do país, retorna erro 403/451.

🔗 Endpoints da API
Agentes
GET  /api/agents/list        - Lista todos os agentes
GET  /api/agents/stats       - Estatísticas de execução
POST /api/agents/execute     - Executa tarefa com agente
POST /api/agents/orchestrate - Orquestra múltiplos agentes
POST /api/agents/reset-stats - Reseta estatísticas
Minutas
GET    /api/minutas          - Lista minutas
POST   /api/minutas          - Cria nova minuta
PUT    /api/minutas/:id      - Atualiza minuta
DELETE /api/minutas/:id      - Remove minuta
POST   /api/minutas/:id/duplicate - Duplica minuta
GET    /api/minutas/stats    - Estatísticas
Comandos IA
POST /api/ai/continuar   - Continua escrita
POST /api/ai/expandir    - Expande texto
POST /api/ai/revisar     - Revisa gramática
POST /api/ai/formalizar  - Formaliza linguagem
GET  /api/ai/status      - Status do rate limit
Outros
GET  /health              - Health check
POST /api/llm/chat        - Proxy LLM
POST /api/spark/*         - API Spark
POST /api/kv/*            - Key-Value store
🚀 Deploy
Configuração	Valor
Tipo	Autoscale
Build	npm run build:deploy
Run	npm run start:production
Status	✅ Publicado
O backend em produção serve tanto a API quanto o frontend estático em uma única porta.

📦 Tecnologias Principais
Frontend: React 19, TypeScript, Vite 7, Tailwind CSS 4
Backend: Express, TypeScript, tsx
IA: LangGraph, Anthropic Claude (claude-sonnet-4)
Banco: PostgreSQL (Neon)
UI: Radix UI, Phosphor Icons, Lucide React
Editor: CKEditor 5, TipTap
Última atualização: 02/01/2026 17:28 UTC

Worked for 1 minute

Scroll to latest
📋 Guia Completo: Configurar VS Code para Desenvolvimento Local
Este guia configura seu ambiente VS Code para ficar idêntico ao app em produção no Replit.

1️⃣ Requisitos do Sistema
Node.js
# Instale Node.js 20 (mesma versão do Replit)
# Se usar nvm:
nvm install 20
nvm use 20
# Verifique a versão
node -v  # deve mostrar v20.x.x
npm -v   # deve mostrar v10.x.x
Extensões VS Code Recomendadas
ESLint - Validação de código
Prettier - Formatação
PostgreSQL (by Chris Kolkman) - Conexão com banco
DotENV - Syntax highlight para .env
Tailwind CSS IntelliSense - Autocomplete CSS
2️⃣ Clonar e Instalar Dependências
# Clone o repositório (ou baixe do Replit)
git clone <seu-repositorio>
cd assistente-juridico-pje
# Instale dependências do frontend (raiz)
npm install
# Instale dependências do backend
cd backend
npm install
cd ..
3️⃣ Configurar Variáveis de Ambiente
Arquivo .env (raiz do projeto)
Crie o arquivo .env na raiz:

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
Arquivo .env.test (para testes)
# Mesmas variáveis do .env
DATABASE_URL=postgresql://postgres:SUA_SENHA@SEU_HOST.neon.tech:5432/heliumdb?sslmode=require
NODE_ENV=test
BACKEND_PORT=3001
⚠️ Importante: Adicione ao .gitignore
# Arquivos de ambiente local
.env
.env.local
.env.test
.env.*.local
4️⃣ Configurar VS Code
Arquivo .vscode/settings.json
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
Arquivo .vscode/launch.json (Debug)
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
Arquivo .vscode/tasks.json (Tarefas)
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
5️⃣ Executar o Projeto
Modo Desenvolvimento (2 terminais)
Terminal 1 - Frontend:

npm run dev
# Roda em http://localhost:5000
Terminal 2 - Backend:

cd backend
npm run dev
# Roda em http://localhost:3001
Modo Produção (simula deploy)
# Build completo
npm run build:deploy
# Executar como produção
NODE_ENV=production PORT=3001 npm run start:production
# Acesse http://localhost:3001
6️⃣ Configurar Testes
Rodar Testes Unitários (Vitest)
# Testes do frontend
npm run test
# Testes com interface visual
npm run test:ui
# Testes com cobertura
npm run test:coverage
Testes E2E (Playwright)
# Instalar browsers do Playwright
npx playwright install
# Rodar testes E2E
npm run test:e2e
7️⃣ Conectar ao PostgreSQL no VS Code
Usando a extensão PostgreSQL:
Instale a extensão PostgreSQL (Chris Kolkman)
Clique no ícone de banco de dados na barra lateral
Adicione nova conexão:
Host: seu-host.neon.tech
Port: 5432
User: postgres
Password: sua-senha
Database: heliumdb
SSL: require
8️⃣ Estrutura do Projeto
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
9️⃣ Diferenças Dev vs Produção
Aspecto	Desenvolvimento	Produção
Frontend	Vite HMR (porta 5000)	Arquivos estáticos em /dist
Backend	tsx watch (porta 3001)	Node.js compilado (porta 80)
Servidores	2 separados	1 unificado
Hot Reload	✅ Sim	❌ Não
NODE_ENV	development	production
🔄 Comandos Rápidos
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
✅ Checklist de Configuração
 Node.js 20 instalado
 Dependências instaladas (raiz + backend)
 Arquivo .env criado com credenciais do Replit
 .env adicionado ao .gitignore
 Extensões VS Code instaladas
 Conexão PostgreSQL testada
 Frontend rodando em localhost:5000
 Backend rodando em localhost:3001
 Build de produção funcionando
Pronto! Seu ambiente local agora está configurado para funcionar igual ao Replit. 🚀

Worked for 1 minute
faça uma analise do workflow do app como é o fluxo automatico desde o recebimento da publicação do djen


1 message & 8 actions
--- # 📊 Análise do Workflow DJEN - Fluxo Automático de Publicações ## 🔄 Diagrama do Fluxo Completo ``` ┌─────────────────────────────────────────────────────────────────────────────────┐ │ FLUXO DE PUBLICAÇÕES DJEN │ └─────────────────────────────────────────────────────────────────────────────────┘ ┌─────────────────┐ │ API DJEN CNJ │ │ (Só aceita BR) │ └────────┬────────┘ │ ┌────────────────────┴────────────────────┐ ▼ ▼ ┌─────────────────┐ ┌─────────────────┐ │ BACKEND │ │ BROWSER │ │ /api/expedientes│ │ (Fallback direto)│ │ (Fora do BR) │ │ (Usuário no BR) │ └────────┬────────┘ └────────┬────────┘ │ │ │ Erro 403/451 │ Sucesso │ (Geobloqueio) │ ▼ ▼ ┌─────────────────┐ ┌─────────────────┐ │ Ativa Fallback │◄─────────────────────│ buscarDJENNo- │ │ Browser-Direct │ │ Browser() │ └────────┬────────┘ └────────┬────────┘ │ │ └────────────────┬───────────────────────┘ ▼ ┌───────────────────────┐ │ PUBLICAÇÕES DJEN │ │ (DJENPublication[]) │ └───────────┬───────────┘ │ ▼ ┌───────────────────────┐ │ useDJENPublications │ │ (Hook React) │ └───────────┬───────────┘ │ ┌─────────────────────────┼─────────────────────────┐ │ │ │ ▼ ▼ ▼ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ Exibe no Widget│ │ Auto-Registro │ │ Notificação │ │ DJENMonitor │ │ (se habilitado) │ │ Toast │ └─────────────────┘ └────────┬────────┘ └─────────────────┘ │ ▼ ┌─────────────────────┐ │ extractParties- │ │ WithFallback() │ │ (Regex → IA Gemini) │ └──────────┬──────────┘ │ ┌────────────────┴────────────────┐ │ │ ▼ ▼ ┌─────────────────┐ ┌─────────────────┐ │ Regex Match │ │ IA Gemini │ │ (Instantâneo) │ │ (Se regex ❌) │ └────────┬────────┘ └────────┬────────┘ │ │ └────────────────┬────────────────┘ ▼ ┌─────────────────────┐ │ Partes Extraídas │ │ (autor, réu, advs) │ └──────────┬──────────┘ │ ┌───────────────────────┼───────────────────────┐ ▼ ▼ ▼ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ Criar Processo │ │ Criar Expediente│ │ Criar/Atualizar │ │ (Process) │ │ (Expediente) │ │ Cliente │ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘ │ │ │ └───────────────────────┼───────────────────────┘ ▼ ┌───────────────────────┐ │ STATE REACT │ │ setProcesses() │ │ setExpedientes() │ │ clientes manager │ └───────────────────────┘ ``` --- ## 📋 Etapas Detalhadas ### **ETAPA 1: Busca de Publicações** | Componente | Arquivo | Descrição | |------------|---------|-----------| | Hook Principal | `use-djen-publications.ts` | Gerencia busca com fallback | | Captura Browser | `djen-browser-capture.ts` | Cliente direto para API DJEN | | API DJEN | `comunicaapi.pje.jus.br` | API oficial do CNJ | **Estratégia de Fallback:** ``` 1️⃣ Tenta: Backend /api/expedientes ↓ Falha (403/451)? 2️⃣ Fallback: Browser-direct buscarDJENNoBrowser() ↓ Falha? 3️⃣ Erro: "API bloqueada geograficamente" ``` **Parâmetros de Busca:** ```typescript { numeroOab: "184404", // Número OAB do advogado ufOab: "MG", // Estado meio: "D", // D=Diário, E=Eletrônico dataDisponibilizacaoInicio: "2026-01-02", dataDisponibilizacaoFim: "2026-01-02" } ``` --- ### **ETAPA 2: Processamento das Publicações** | Campo | Origem | Exemplo | |-------|--------|---------| | `id` | API ou UUID gerado | `"abc123..."` | | `siglaTribunal` | API | `"TJMG"` | | `tipoComunicacao` | API | `"Intimação"` | | `numeroProcesso` | API | `"0001234-56.2026.8.13.0024"` | | `texto` | API | Teor completo da publicação | | `dataDisponibilizacao` | API | `"2026-01-02"` | | `nomeOrgao` | API | `"Belo Horizonte/MG"` | --- ### **ETAPA 3: Extração de Partes (IA)** **Arquivo:** `extract-parties-service.ts` **Fluxo de Decisão:** ``` Teor da Publicação ↓ ┌──────────────────────┐ │ 1. Tenta Regex │ → Rápido, sem custo │ (extractPartiesRegex)│ └──────────┬───────────┘ │ ┌─────┴─────┐ │ Encontrou │ │autor + réu?│ └─────┬─────┘ SIM │ NÃO ↓ ┌──────────────────────┐ │ 2. Usa IA (Gemini) │ → Mais lento, com custo │(extractPartiesFromTeor)│ └──────────────────────┘ ``` **Regex Patterns:** ```typescript // Termos de AUTOR "autor|requerente|exequente|embargante|apelante|agravante|impetrante" // Termos de RÉU "réu|requerido|executado|embargado|apelado|agravado|impetrado" ``` **Prompt IA (Gemini 2.5 Pro):** ```json { "autor": "Nome do autor", "reu": "Nome do réu", "advogadoAutor": "Dr. Fulano (OAB/MG 12345)", "advogadoReu": "Dra. Ciclana (OAB/SP 67890)" } ``` --- ### **ETAPA 4: Registro Automático** **Arquivo:** `use-djen-process-registration.ts` **Objetos Criados:** **1. Process (Processo):** ```typescript { id: "uuid", numeroCNJ: "0001234-56.2026.8.13.0024", titulo: "Intimação - TJMG", autor: "João Silva", reu: "Empresa XYZ Ltda", comarca: "Belo Horizonte/MG", vara: "TJMG", status: "ativo", fase: "Inicial", dataDistribuicao: "2026-01-02", notas: "Origem: DJEN\nAdvogado: Thiago Bodevan..." } ``` **2. Expediente (Intimação):** ```typescript { id: "uuid", processId: "id-do-processo", tipo: "intimacao", titulo: "Intimação - 0001234-56.2026.8.13.0024", conteudo: "Teor completo da publicação...", lido: false, arquivado: false, analyzed: false, priority: "high", tribunal: "TJMG", lawyerName: "Thiago Bodevan Veiga" } ``` **3. Cliente (Auto-criação):** ```typescript { nome: "João Silva", // Extraído do autor cidade: "Belo Horizonte", // Do órgão estado: "MG", processos: ["0001234-56.2026.8.13.0024"] } ``` --- ## 🤖 Agentes LangGraph Envolvidos | Agente | Tipo | Papel no Workflow | |--------|------|-------------------| | **monitor-djen** | `langgraph-djen` | Monitoramento especializado DJEN | | **analise-documental** | `langgraph-custom` | Análise do teor da publicação | | **gestao-prazos** | `langgraph-custom` | Cálculo de prazos processuais | | **comunicacao-clientes** | `langgraph-custom` | Notificação ao cliente | **Observação:** Atualmente os agentes são acionados **manualmente** via `/api/agents/execute`. Não há scheduler/cron automático implementado. --- ## ⚠️ Pontos de Atenção ### **1. Geobloqueio** ``` API DJEN → Só aceita requisições do Brasil ├── Backend Replit (EUA) → ❌ Bloqueado (403/451) └── Browser do Usuário (Brasil) → ✅ Funciona ``` **Solução Atual:** Fallback automático para browser-direct ### **2. Rate Limiting** - Delay de 1.5s entre advogados múltiplos - Delay de 2s entre requisições à API ### **3. Não Há Automação Completa** O sistema atual é **reativo** (busca quando o usuário abre o widget), não **proativo** (polling automático). **Sugestão de Melhoria:** ``` ┌─────────────────────────────────────────────┐ │ PROPOSTA: SCHEDULER │ ├─────────────────────────────────────────────┤ │ • Cron job a cada 30 minutos │ │ • Aciona monitor-djen automaticamente │ │ • Salva expedientes no PostgreSQL │ │ • Envia notificação push/email │ └─────────────────────────────────────────────┘ ``` --- ## 📊 Diagrama de Dados ``` ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │ CLIENTES │ │ PROCESSOS │ │ EXPEDIENTES │ ├────────────────┤ ├────────────────┤ ├────────────────┤ │ id │ │ id │ │ id │ │ nome │ │ numeroCNJ │◄────│ processId │ │ email │ │ titulo │ │ tipo │ │ telefone │ │ autor │ │ titulo │ │ cidade │ │ reu │ │ conteudo │ │ estado │ │ comarca │ │ lido │ │ processos[] │────►│ vara │ │ arquivado │ │ ... │ │ status │ │ analyzed │ └────────────────┘ │ fase │ │ tribunal │ │ ... │ │ lawyerName │ └────────────────┘ └────────────────┘ ▲ │ ┌──────┴───────┐ │ API DJEN CNJ │ └──────────────┘ ``` --- ## ✅ Resumo Executivo | Aspecto | Status | Detalhes | |---------|--------|----------| | **Busca DJEN** | ✅ Funcional | Fallback browser-direct | | **Extração Partes** | ✅ Funcional | Regex + IA Gemini | | **Auto-Registro** | ✅ Funcional | Cria Processo + Expediente + Cliente | | **Agente monitor-djen** | ⚠️ Manual | Sem scheduler automático | | **Notificações** | ✅ Toast | Falta push/email | | **Persistência DB** | ⚠️ Parcial | Expedientes em memória React | --- Deseja que eu implemente um **scheduler automático** para monitoramento contínuo do DJEN?
sim as 1:00 e as 09 da manhã


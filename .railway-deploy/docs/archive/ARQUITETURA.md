# Arquitetura do Assistente Jurídico PJe

Este documento apresenta a arquitetura visual do aplicativo para facilitar o entendimento da estrutura do código.

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│                    index.html (Entry)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   src/main.tsx                           │
│  - Importa @github/spark                                │
│  - ErrorBoundary                                        │
│  - Renderiza <App />                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   src/App.tsx                            │
│  - Renderiza <HarveySpecter /> (Donna.tsx)              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            src/components/Donna.tsx                      │
│              (Componente Principal)                      │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Harvey Specter - AI Assistant Interface   │         │
│  │                                            │         │
│  │  • Chat com IA                             │         │
│  │  • Navegação entre módulos (Tabs)         │         │
│  │  • Dashboard                               │         │
│  │  • Processos                               │         │
│  │  • Calendário                              │         │
│  │  • Financeiro                              │         │
│  │  • Agentes IA                              │         │
│  │  • Configurações                           │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Estrutura de Diretórios

```
assistente-juridico-pje/
│
├── 📁 src/                          # Código fonte
│   │
│   ├── 📄 main.tsx                  # Entry point
│   ├── 📄 App.tsx                   # Root component
│   ├── 📄 ErrorFallback.tsx         # Error handling
│   ├── 📄 types.ts                  # TypeScript types
│   ├── 📄 index.css                 # Global styles
│   ├── 📄 main.css                  # Additional styles
│   │
│   ├── 📁 components/               # React components
│   │   │
│   │   ├── 📁 ui/                   # shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ... (15+ components)
│   │   │
│   │   ├── 🌟 Donna.tsx             # PRINCIPAL - Harvey Specter
│   │   ├── Dashboard.tsx            # Dashboard principal
│   │   ├── ProcessCRM.tsx           # Kanban de processos
│   │   ├── ProcessosView.tsx        # Lista de processos
│   │   ├── Calendar.tsx             # Calendário
│   │   ├── CalculadoraPrazos.tsx    # Calculadora prazos
│   │   ├── FinancialManagement.tsx  # Gestão financeira
│   │   ├── ClientesView.tsx         # Gestão de clientes
│   │   ├── MinutasManager.tsx       # Gestão de minutas
│   │   ├── AIAgents.tsx             # Painel agentes IA
│   │   ├── GoogleAuth.tsx           # Autenticação Google
│   │   ├── DataInitializer.tsx      # Inicializar dados
│   │   └── ... (50+ components)
│   │
│   ├── 📁 hooks/                    # Custom React Hooks
│   │   ├── use-autonomous-agents.ts
│   │   ├── use-processes.ts
│   │   ├── use-notifications.ts
│   │   ├── use-analytics.ts
│   │   ├── use-keyboard-shortcuts.ts
│   │   └── ... (7 hooks)
│   │
│   └── 📁 lib/                      # Bibliotecas e serviços
│       ├── utils.ts                 # Funções utilitárias
│       ├── config.ts                # Configuração
│       ├── sample-data.ts           # Dados de exemplo
│       ├── agents.ts                # Lógica agentes IA
│       ├── llm-service.ts           # Serviço LLM/GPT-4
│       ├── prazos.ts                # Cálculo de prazos
│       ├── google-calendar-service.ts
│       ├── google-docs-service.ts
│       ├── djen-api.ts              # API DJEN
│       ├── datajud-api.ts           # API DataJud
│       └── ... (22 files)
│
├── 📁 api/                          # Vercel API endpoints (opcional)
│   ├── cron-check-publications.ts
│   └── ... (para deploy Vercel)
│
├── 📄 package.json                  # Dependências
├── 📄 vite.config.ts                # Config Vite
├── 📄 tsconfig.json                 # Config TypeScript
├── 📄 tailwind.config.js            # Config Tailwind
├── 📄 index.html                    # HTML principal
├── 📄 .env                          # Variáveis ambiente
│
└── 📁 docs/                         # Documentação
    ├── README.md
    ├── CODIGO_PRINCIPAL.md          # ⭐ Guia extração
    ├── ARQUIVOS_PARA_SPARK.md       # ⭐ Lista completa
    ├── GUIA_PRATICO_SPARK.md        # ⭐ Guia prático
    ├── CODIGOS_REFERENCIA.md        # ⭐ Referência rápida
    └── ... (50+ documentos)
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                   GitHub Spark                           │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │         useKV (Spark Storage)              │         │
│  │                                            │         │
│  │  • processes                               │         │
│  │  • clientes                                │         │
│  │  • prazos                                  │         │
│  │  • minutas                                 │         │
│  │  • financial-entries                       │         │
│  │  • calendar-events                         │         │
│  │  • harvey-messages (chat)                  │         │
│  └──────────────┬─────────────────────────────┘         │
│                 │                                        │
└─────────────────┼────────────────────────────────────────┘
                  │
                  │ useKV hook
                  │
┌─────────────────▼────────────────────────────────────────┐
│              React Components                            │
│                                                          │
│  • Donna.tsx      → Chat & Navigation                   │
│  • Dashboard.tsx  → Lê: processes, prazos, financial    │
│  • ProcessCRM.tsx → CRUD: processes                     │
│  • Calendar.tsx   → CRUD: calendar-events               │
│  • FinancialMgmt  → CRUD: financial-entries             │
│  • AIAgents.tsx   → Lê/Escreve: processes, prazos       │
│                                                          │
└──────────────────────────────────────────────────────────┘

        ┌──────────────────┐
        │  External APIs   │
        │                  │
        │ • Google OAuth   │
        │ • Google Calendar│
        │ • Google Docs    │
        │ • DJEN API       │
        │ • DataJud API    │
        │ • Spark LLM      │
        └──────────────────┘
```

---

## 🧩 Dependências entre Componentes

```
Donna.tsx (Principal)
├── Dashboard.tsx
│   ├── useKV('processes')
│   ├── useKV('prazos')
│   ├── useKV('financial-entries')
│   └── Recharts (gráficos)
│
├── ProcessCRM.tsx
│   ├── useKV('processes')
│   ├── useProcesses() hook
│   └── Drag & Drop
│
├── Calendar.tsx
│   ├── useKV('calendar-events')
│   ├── useKV('prazos')
│   ├── google-calendar-service.ts
│   └── react-day-picker
│
├── FinancialManagement.tsx
│   ├── useKV('financial-entries')
│   ├── Recharts
│   └── utils.ts (formatCurrency)
│
├── AIAgents.tsx
│   ├── useAutonomousAgents() hook
│   ├── agents.ts (lógica)
│   ├── llm-service.ts
│   └── djen-monitor-agent.ts
│
├── ClientesView.tsx
│   └── useKV('clientes')
│
├── MinutasManager.tsx
│   ├── useKV('minutas')
│   └── google-docs-service.ts
│
└── CalculadoraPrazos.tsx
    └── prazos.ts (cálculo)
```

---

## 🎯 Camadas da Aplicação

```
┌─────────────────────────────────────────────────────────┐
│                  CAMADA DE APRESENTAÇÃO                  │
│                                                          │
│  Components (TSX)                                       │
│  • Donna.tsx                                            │
│  • Dashboard, ProcessCRM, Calendar, etc.                │
│  • UI Components (shadcn)                               │
│                                                          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   CAMADA DE LÓGICA                       │
│                                                          │
│  Custom Hooks                                           │
│  • use-autonomous-agents.ts                             │
│  • use-processes.ts                                     │
│  • use-notifications.ts                                 │
│  • use-analytics.ts                                     │
│                                                          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  CAMADA DE SERVIÇOS                      │
│                                                          │
│  Libraries (TS)                                         │
│  • llm-service.ts      (IA)                             │
│  • agents.ts           (Agentes)                        │
│  • google-calendar-service.ts                           │
│  • google-docs-service.ts                               │
│  • djen-api.ts         (Publicações)                    │
│  • datajud-api.ts      (Processos)                      │
│  • prazos.ts           (Cálculos)                       │
│                                                          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  CAMADA DE DADOS                         │
│                                                          │
│  • Spark KV Storage   (useKV)                           │
│  • Local State        (useState)                        │
│  • External APIs      (Google, DJEN, DataJud)           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔌 Integrações Externas

```
┌─────────────────────────────────────────────────────────┐
│              Assistente Jurídico PJe                     │
└───┬─────────┬─────────┬─────────┬─────────┬────────────┘
    │         │         │         │         │
    │         │         │         │         │
┌───▼───┐ ┌──▼───┐ ┌───▼───┐ ┌──▼───┐ ┌──▼────┐
│Google │ │Google│ │ DJEN  │ │Data  │ │ Spark │
│ OAuth │ │ Cal  │ │  API  │ │ Jud  │ │  LLM  │
│       │ │      │ │       │ │ API  │ │ (GPT) │
└───────┘ └──────┘ └───────┘ └──────┘ └───────┘
   │         │         │         │         │
   │         │         │         │         │
   ▼         ▼         ▼         ▼         ▼
[Auth]   [Events]  [Publicações] [Processos] [IA]
```

---

## 📊 Tipos de Dados Principais

```
Process (Processo Jurídico)
├── id: string
├── numeroCNJ: string
├── titulo: string
├── status: 'ativo' | 'suspenso' | 'arquivado'
└── prazos: Prazo[]
    └── Prazo
        ├── id: string
        ├── descricao: string
        ├── dataInicio: string
        ├── dataFinal: string
        └── urgente: boolean

Cliente
├── id: string
├── nome: string
├── cpfCnpj: string
└── processos: string[] (IDs)

Minuta
├── id: string
├── titulo: string
├── tipo: 'peticao' | 'contrato' | ...
├── conteudo: string
└── googleDocsId?: string

FinancialEntry
├── id: string
├── type: 'income' | 'expense'
├── amount: number
└── category: string

ChatMessage (Harvey)
├── id: string
├── role: 'user' | 'assistant'
└── content: string
```

---

## 🚀 Ordem de Implementação Recomendada

```
Fase 1: Fundação
├── 1. Configuração (package.json, vite.config, etc)
├── 2. Tipos (types.ts)
├── 3. Utilidades (utils.ts, config.ts)
└── 4. UI Components (shadcn)

Fase 2: Core
├── 5. Hooks básicos (use-processes.ts)
├── 6. Dados de exemplo (sample-data.ts)
└── 7. Componente principal MVP (Donna.tsx simplificado)

Fase 3: Módulos Essenciais
├── 8. Dashboard
├── 9. ProcessCRM
├── 10. Calendar
└── 11. FinancialManagement

Fase 4: Módulos Avançados
├── 12. AIAgents
├── 13. MinutasManager
├── 14. ClientesView
└── 15. Outros módulos

Fase 5: Integrações
├── 16. Google OAuth
├── 17. Google Calendar API
├── 18. DJEN/DataJud
└── 19. Spark LLM
```

---

## 🎨 Temas e Estilos

```
Tailwind CSS v4
├── Theme personalizado
│   ├── Cores (--primary, --secondary, --accent)
│   ├── Radius (--radius)
│   └── Dark mode support
│
├── shadcn/ui components
│   ├── Estilo: New York
│   ├── Cor base: Slate
│   └── CSS Variables: Yes
│
└── Framer Motion
    └── Animações fluidas
```

---

## 🔐 Autenticação e Segurança

```
┌─────────────────────────────────────────────────────────┐
│                    Fluxo de Auth                         │
│                                                          │
│  1. Usuário clica "Login com Google"                    │
│  2. GoogleAuth.tsx → Google OAuth                       │
│  3. Callback com token                                  │
│  4. Token armazenado no Spark Storage                   │
│  5. App acessa Google APIs com token                    │
│                                                          │
└──────────────────────────────────────────────────────────┘

Variáveis Sensíveis (.env)
├── VITE_GOOGLE_CLIENT_ID
├── VITE_GOOGLE_API_KEY
├── VITE_REDIRECT_URI
└── VITE_APP_ENV

⚠️ NUNCA commitar .env no Git!
```

---

## 📱 Responsividade

```
Mobile First Approach

Desktop (>1024px)
├── Sidebar fixa
├── Grid 4 colunas
└── Chat expandido

Tablet (768-1024px)
├── Sidebar colapsável
├── Grid 2 colunas
└── Chat médio

Mobile (<768px)
├── Bottom navigation
├── Grid 1 coluna
└── Chat fullscreen
```

---

## 🎯 Features Principais por Prioridade

### 🔴 Críticas (MVP)
1. ✅ Chat Harvey Specter
2. ✅ Dashboard básico
3. ✅ Lista de processos
4. ✅ Gestão de prazos
5. ✅ Autenticação

### 🟠 Importantes
6. Kanban de processos
7. Calendário completo
8. Gestão financeira
9. Gestão de clientes

### 🟡 Desejáveis
10. Agentes IA autônomos
11. Minutas com Google Docs
12. Integração DJEN
13. Integração DataJud

### 🔵 Nice-to-have
14. Analytics avançado
15. NLP Dashboard
16. Transcrição de áudio
17. Premonição jurídica

---

## 📖 Documentação de Referência

Para reconstruir no Spark, consulte na ordem:

1. **CODIGO_PRINCIPAL.md** - Visão geral e estrutura
2. **ARQUIVOS_PARA_SPARK.md** - Lista completa de arquivos
3. **GUIA_PRATICO_SPARK.md** - Passo a passo com código
4. **CODIGOS_REFERENCIA.md** - Snippets prontos
5. **Este arquivo** - Arquitetura visual

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0

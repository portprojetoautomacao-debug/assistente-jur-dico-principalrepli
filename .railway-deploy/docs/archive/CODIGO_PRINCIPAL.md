# Código Principal - Guia de Extração para GitHub Spark

Este documento identifica e separa os códigos principais do repositório **Assistente Jurídico PJe** para inserção no GitHub Spark e reconstrução do app do zero.

## 📋 Índice

1. [Arquivos de Configuração Essenciais](#arquivos-de-configuração-essenciais)
2. [Tipos TypeScript (Core)](#tipos-typescript-core)
3. [Componentes React Principais](#componentes-react-principais)
4. [Bibliotecas e Utilidades](#bibliotecas-e-utilidades)
5. [Custom Hooks](#custom-hooks)
6. [Componentes UI (shadcn)](#componentes-ui-shadcn)
7. [Ordem de Inserção no Spark](#ordem-de-inserção-no-spark)

---

## 🔧 Arquivos de Configuração Essenciais

### 1. package.json
**Localização**: `/package.json`  
**Propósito**: Dependências e scripts do projeto

**Dependências Principais**:
- `@github/spark` - Framework principal
- `react` 19.0.0 - Framework UI
- `@radix-ui/*` - Componentes UI
- `framer-motion` - Animações
- `recharts` - Gráficos
- `zod` - Validação de dados
- `react-hook-form` - Formulários

### 2. vite.config.ts
**Localização**: `/vite.config.ts`  
**Propósito**: Configuração do build

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. tsconfig.json
**Localização**: `/tsconfig.json`  
**Propósito**: Configuração TypeScript

### 4. tailwind.config.js
**Localização**: `/tailwind.config.js`  
**Propósito**: Configuração de estilos e tema

### 5. index.html
**Localização**: `/index.html`  
**Propósito**: Página HTML principal

---

## 📊 Tipos TypeScript (Core)

### src/types.ts (ESSENCIAL)
**Tamanho**: ~400 linhas  
**Propósito**: Definições de tipos para todo o aplicativo

**Tipos Principais**:

```typescript
// Processos jurídicos
export interface Process {
  id: string
  numeroCNJ: string
  titulo: string
  autor: string
  reu: string
  comarca: string
  vara: string
  status: 'ativo' | 'suspenso' | 'arquivado' | 'concluido'
  valor?: number
  dataDistribuicao: string
  dataUltimaMovimentacao: string
  prazos: Prazo[]
}

// Prazos processuais
export interface Prazo {
  id: string
  processId: string
  descricao: string
  dataInicio: string
  diasCorridos: number
  tipoPrazo: 'cpc' | 'clt'
  dataFinal: string
  concluido: boolean
  urgente: boolean
}

// Mensagens do chat
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Minutas/Documentos
export interface Minuta {
  id: string
  titulo: string
  processId?: string
  tipo: 'peticao' | 'contrato' | 'parecer' | 'recurso' | 'outro'
  conteudo: string
  status: 'rascunho' | 'em-revisao' | 'finalizada' | 'arquivada'
  googleDocsId?: string
  googleDocsUrl?: string
}

// Gestão Financeira
export interface FinancialEntry {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}
```

---

## ⚛️ Componentes React Principais

### NÍVEL 1: Entrada da Aplicação (CRÍTICO)

#### 1. src/main.tsx
**Propósito**: Ponto de entrada da aplicação  
**Linhas**: ~15

```typescript
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary"
import "@github/spark/spark"
import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import "./main.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
```

#### 2. src/App.tsx
**Propósito**: Componente raiz da aplicação  
**Linhas**: ~5

```typescript
import HarveySpecter from "@/components/Donna"

export default function App() {
  return <HarveySpecter />
}
```

#### 3. src/ErrorFallback.tsx
**Propósito**: Tratamento de erros  
**Linhas**: ~50

### NÍVEL 2: Componente Principal (CRÍTICO)

#### 4. src/components/Donna.tsx
**Propósito**: Interface principal - Harvey Specter AI Assistant  
**Linhas**: ~587  
**Funcionalidades**:
- Chat com IA
- Navegação entre módulos
- Dashboard integrado
- Gerenciamento de processos
- Calendário
- Gestão financeira
- Configurações

**Principais Características**:
- Usa `useKV` para persistência
- Interface de chat com insights inteligentes
- Navegação entre 7+ módulos
- Autenticação Google

### NÍVEL 3: Módulos Principais

#### 5. src/components/AIAgents.tsx
**Linhas**: ~859  
**Propósito**: Painel de agentes autônomos de IA  
**Agentes**:
- Monitor de Publicações DJEN
- Analisador de Documentos
- Verificador de Prazos
- Organizador de Tarefas
- Gerador de Relatórios
- Otimizador de Processos
- Monitor de Legislação

#### 6. src/components/Dashboard.tsx
**Linhas**: ~466  
**Propósito**: Dashboard principal com métricas e visão geral  
**Métricas**:
- Processos ativos
- Prazos urgentes
- Tarefas pendentes
- Receita mensal
- Gráficos e estatísticas

#### 7. src/components/ProcessCRM.tsx
**Linhas**: ~299  
**Propósito**: Gestão de processos com Kanban  
**Funcionalidades**:
- Kanban drag & drop
- Status: Novo, Em Análise, Contestação, Finalizado
- Detalhes do processo
- Edição inline

#### 8. src/components/Calendar.tsx
**Linhas**: ~578  
**Propósito**: Calendário com integração Google Calendar  
**Funcionalidades**:
- Visualização mensal
- Eventos e prazos
- Sincronização bidirecional
- Notificações

#### 9. src/components/FinancialManagement.tsx
**Linhas**: ~273  
**Propósito**: Gestão financeira completa  
**Funcionalidades**:
- Receitas e despesas
- Categorização
- Gráficos financeiros
- Relatórios

#### 10. src/components/ClientesView.tsx
**Linhas**: ~393  
**Propósito**: Gerenciamento de clientes  
**Funcionalidades**:
- Lista de clientes
- Processos por cliente
- Informações de contato

#### 11. src/components/ProcessosView.tsx
**Linhas**: ~301  
**Propósito**: Visualização detalhada de processos  
**Funcionalidades**:
- Lista completa de processos
- Filtros e busca
- Detalhes expandidos

#### 12. src/components/CalculadoraPrazos.tsx
**Linhas**: ~219  
**Propósito**: Calculadora de prazos processuais  
**Funcionalidades**:
- Cálculo CPC e CLT
- Consideração de feriados
- Dias úteis

#### 13. src/components/MinutasManager.tsx
**Linhas**: ~518  
**Propósito**: Gerenciamento de minutas e documentos  
**Funcionalidades**:
- Editor de minutas
- Templates
- Integração Google Docs
- Versionamento

### NÍVEL 4: Componentes de Apoio

#### 14. src/components/GoogleAuth.tsx
**Linhas**: ~100  
**Propósito**: Autenticação Google OAuth

#### 15. src/components/DataInitializer.tsx
**Linhas**: ~150  
**Propósito**: Inicialização de dados de exemplo

#### 16. src/components/NotificationSettings.tsx
**Linhas**: ~200  
**Propósito**: Configurações de notificações

#### 17. src/components/DJENConsulta.tsx
**Linhas**: ~420  
**Propósito**: Consulta ao Diário da Justiça Eletrônico

#### 18. src/components/MultiSourcePublications.tsx
**Linhas**: ~437  
**Propósito**: Múltiplas fontes de publicações

---

## 📚 Bibliotecas e Utilidades

### CRÍTICO

#### 1. src/lib/utils.ts
**Linhas**: ~30  
**Propósito**: Funções utilitárias

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### 2. src/lib/config.ts
**Linhas**: ~40  
**Propósito**: Configuração centralizada

```typescript
export const config = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
}
```

### IMPORTANTE

#### 3. src/lib/agents.ts
**Linhas**: ~550  
**Propósito**: Lógica dos agentes autônomos

#### 4. src/lib/llm-service.ts
**Linhas**: ~320  
**Propósito**: Integração com Spark LLM (GPT-4)

#### 5. src/lib/google-calendar-service.ts
**Linhas**: ~180  
**Propósito**: Serviço de integração Google Calendar

#### 6. src/lib/google-docs-service.ts
**Linhas**: ~140  
**Propósito**: Serviço de integração Google Docs

#### 7. src/lib/prazos.ts
**Linhas**: ~80  
**Propósito**: Lógica de cálculo de prazos

#### 8. src/lib/djen-api.ts
**Linhas**: ~220  
**Propósito**: API do Diário Eletrônico

#### 9. src/lib/datajud-api.ts
**Linhas**: ~260  
**Propósito**: API DataJud

#### 10. src/lib/sample-data.ts
**Linhas**: ~270  
**Propósito**: Dados de exemplo para desenvolvimento

---

## 🎣 Custom Hooks

#### 1. src/hooks/use-autonomous-agents.ts
**Linhas**: ~225  
**Propósito**: Hook para gerenciar agentes autônomos

```typescript
export function useAutonomousAgents() {
  const [agents, setAgents] = useKV('autonomous-agents', [])
  const [isRunning, setIsRunning] = useState(false)
  
  // Lógica dos agentes
}
```

#### 2. src/hooks/use-processes.ts
**Linhas**: ~30  
**Propósito**: Hook para gerenciar processos

#### 3. src/hooks/use-notifications.ts
**Linhas**: ~110  
**Propósito**: Hook para notificações

#### 4. src/hooks/use-analytics.ts
**Linhas**: ~100  
**Propósito**: Hook para analytics

#### 5. src/hooks/use-keyboard-shortcuts.ts
**Linhas**: ~40  
**Propósito**: Atalhos de teclado

---

## 🎨 Componentes UI (shadcn)

**Localização**: `src/components/ui/`  
**Nota**: Estes são componentes gerados pelo shadcn/ui. NÃO modificar.

**Componentes principais**:
- button.tsx
- card.tsx
- dialog.tsx
- input.tsx
- select.tsx
- tabs.tsx
- scroll-area.tsx
- separator.tsx
- badge.tsx
- avatar.tsx
- dropdown-menu.tsx

**Instalação no Spark**:
```bash
npx shadcn@latest add button card dialog input select tabs
```

---

## 🚀 Ordem de Inserção no Spark

### Fase 1: Fundação (FAÇA PRIMEIRO)

1. **Criar projeto Spark**
   ```bash
   # No GitHub Spark, criar novo projeto React + TypeScript
   ```

2. **Instalar dependências** (package.json)
   ```bash
   npm install @github/spark react@19 react-dom@19
   npm install @radix-ui/react-dialog @radix-ui/react-select
   npm install framer-motion recharts zod react-hook-form
   npm install @phosphor-icons/react lucide-react
   npm install tailwindcss @tailwindcss/vite
   npm install clsx tailwind-merge class-variance-authority
   ```

3. **Configurar arquivos base**:
   - vite.config.ts
   - tsconfig.json
   - tailwind.config.js
   - index.html

4. **Criar estrutura de pastas**:
   ```
   src/
   ├── components/
   │   └── ui/
   ├── hooks/
   ├── lib/
   └── types.ts
   ```

### Fase 2: Tipos e Utilidades

5. **Inserir tipos** (src/types.ts)
   - Copiar todo o conteúdo de types.ts

6. **Inserir utilitários**:
   - src/lib/utils.ts
   - src/lib/config.ts

### Fase 3: Componentes UI

7. **Instalar componentes shadcn**:
   ```bash
   npx shadcn@latest init
   npx shadcn@latest add button card dialog input select tabs
   npx shadcn@latest add scroll-area separator badge avatar
   npx shadcn@latest add dropdown-menu
   ```

### Fase 4: Custom Hooks

8. **Inserir hooks**:
   - src/hooks/use-autonomous-agents.ts
   - src/hooks/use-processes.ts
   - src/hooks/use-notifications.ts

### Fase 5: Bibliotecas

9. **Inserir bibliotecas** (ordem de dependência):
   - src/lib/sample-data.ts (dados mock)
   - src/lib/prazos.ts
   - src/lib/llm-service.ts
   - src/lib/agents.ts
   - src/lib/google-calendar-service.ts
   - src/lib/google-docs-service.ts

### Fase 6: Componentes de Apoio

10. **Inserir componentes auxiliares**:
    - src/ErrorFallback.tsx
    - src/components/DataInitializer.tsx
    - src/components/GoogleAuth.tsx

### Fase 7: Componentes Principais

11. **Inserir componentes de feature** (nesta ordem):
    - src/components/Dashboard.tsx
    - src/components/ProcessCRM.tsx
    - src/components/Calendar.tsx
    - src/components/FinancialManagement.tsx
    - src/components/CalculadoraPrazos.tsx
    - src/components/ClientesView.tsx
    - src/components/ProcessosView.tsx
    - src/components/MinutasManager.tsx
    - src/components/AIAgents.tsx

### Fase 8: Componente Principal

12. **Inserir componente raiz**:
    - src/components/Donna.tsx

### Fase 9: Entry Points

13. **Inserir entrada**:
    - src/App.tsx
    - src/main.tsx
    - src/main.css (estilos)

### Fase 10: Teste e Validação

14. **Testar aplicação**:
    ```bash
    npm run dev
    ```

15. **Verificar funcionalidades**:
    - [ ] Chat Harvey Specter funciona
    - [ ] Navegação entre módulos
    - [ ] Dashboard exibe dados
    - [ ] Processos podem ser criados
    - [ ] Calendário renderiza
    - [ ] Financeiro funciona
    - [ ] Agentes IA aparecem

---

## 📝 Notas Importantes

### Variáveis de Ambiente

Criar arquivo `.env` na raiz:
```env
VITE_GOOGLE_CLIENT_ID=seu-client-id
VITE_GOOGLE_API_KEY=sua-api-key
VITE_REDIRECT_URI=http://localhost:5173
VITE_APP_ENV=development
```

### Arquivos que PODEM SER IGNORADOS

- Todos os arquivos `.md` (documentação)
- `api/` (endpoints Vercel)
- Scripts `.sh` e `.bat`
- Capturas de tela `.png`
- `vercel.json`, `render.yaml`
- Arquivos de teste

### Arquivos ESSENCIAIS (não pular)

✅ package.json  
✅ vite.config.ts  
✅ tsconfig.json  
✅ tailwind.config.js  
✅ src/types.ts  
✅ src/lib/utils.ts  
✅ src/lib/config.ts  
✅ src/components/Donna.tsx  
✅ src/App.tsx  
✅ src/main.tsx  

---

## 🎯 Resumo Rápido

**Total de arquivos principais**: ~40  
**Arquivos críticos**: ~15  
**Tempo estimado de inserção**: 2-4 horas

**Começar por**:
1. Configuração (5 arquivos)
2. Tipos (1 arquivo)
3. Utilidades (2 arquivos)
4. UI Components (shadcn)
5. Hooks (3 arquivos)
6. Bibliotecas (6 arquivos)
7. Componentes (10 arquivos)
8. Entry points (3 arquivos)

---

## 🆘 Suporte

Se precisar de ajuda durante a inserção:
1. Verifique este documento
2. Consulte README.md
3. Veja QUICKSTART.md

**Lembre-se**: Comece simples e adicione funcionalidades gradualmente!

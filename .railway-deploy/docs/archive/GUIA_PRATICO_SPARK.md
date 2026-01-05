# Guia Prático: Reconstruir no GitHub Spark

Este guia fornece **comandos práticos e código** para reconstruir o Assistente Jurídico PJe no GitHub Spark do zero.

---

## 📦 Passo 1: Criar Projeto Spark

### 1.1 No GitHub Spark:
1. Acesse https://githubnext.com/projects/spark
2. Clique em "New Spark"
3. Escolha "React + TypeScript"
4. Nome do projeto: `assistente-juridico-pje`

### 1.2 Clonar localmente (opcional):
```bash
# Se quiser trabalhar localmente
git clone <seu-spark-repo-url>
cd assistente-juridico-pje
```

---

## 🔧 Passo 2: Configuração Inicial

### 2.1 Criar package.json

```json
{
  "name": "assistente-juridico-pje",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b --noCheck && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "@github/spark": "^0.39.0",
    "@phosphor-icons/react": "^2.1.7",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.6.2",
    "lucide-react": "^0.484.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-error-boundary": "^6.0.0",
    "react-hook-form": "^7.54.2",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.2",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.11",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@vitejs/plugin-react-swc": "^3.10.1",
    "eslint": "^9.28.0",
    "tailwindcss": "^4.1.11",
    "typescript": "~5.7.2",
    "vite": "^6.3.5"
  }
}
```

### 2.2 Criar vite.config.ts

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

### 2.3 Criar tsconfig.json

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2.4 Criar tsconfig.app.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### 2.5 Criar tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {}
    }
  },
  plugins: [require('@tailwindcss/container-queries')],
}
```

### 2.6 Criar index.html

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Assistente Jurídico PJe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 2.7 Instalar dependências

```bash
npm install
```

---

## 📁 Passo 3: Estrutura de Pastas

```bash
# Criar estrutura de pastas
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/styles
mkdir -p src/assets
```

---

## 🎨 Passo 4: Instalar Componentes UI (shadcn)

### 4.1 Inicializar shadcn

```bash
npx shadcn@latest init
```

**Configurações durante a instalação**:
- Would you like to use TypeScript? **Yes**
- Which style would you like to use? **New York**
- Which color would you like to use? **Slate**
- Where is your global CSS file? **src/index.css**
- Would you like to use CSS variables? **Yes**
- Where is your tailwind.config.js? **tailwind.config.js**
- Configure the import alias? **@/***
- Are you using React Server Components? **No**

### 4.2 Instalar componentes necessários

```bash
# Componentes essenciais
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add scroll-area
npx shadcn@latest add separator
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add label
npx shadcn@latest add progress
npx shadcn@latest add switch
npx shadcn@latest add tooltip
```

**Ou instalar todos de uma vez**:
```bash
npx shadcn@latest add button card dialog input select tabs scroll-area separator badge avatar dropdown-menu label progress switch tooltip
```

---

## 📝 Passo 5: Criar Arquivos Core

### 5.1 Criar src/types.ts

**Cole o conteúdo completo do arquivo original**

```typescript
// Ver arquivo: src/types.ts no repositório original
// Copie TODO o conteúdo (aproximadamente 400 linhas)
```

### 5.2 Criar src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatar moeda
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Formatar data
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

// Gerar ID único
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
```

### 5.3 Criar src/lib/config.ts

```typescript
export const config = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
}

export function validateConfig(): boolean {
  return Boolean(config.googleClientId && config.redirectUri)
}
```

### 5.4 Criar src/lib/sample-data.ts

**Cole o conteúdo completo do arquivo original**

```typescript
// Ver arquivo: src/lib/sample-data.ts no repositório original
// Copie TODO o conteúdo (aproximadamente 270 linhas)
```

---

## 🎨 Passo 6: Criar Estilos

### 6.1 Criar src/index.css

```css
@import '@tailwindcss/base';
@import '@tailwindcss/components';
@import '@tailwindcss/utilities';

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 6.2 Criar src/main.css

```css
/* Estilos globais adicionais */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar personalizada */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
```

---

## 🪝 Passo 7: Criar Hooks Essenciais

### 7.1 Criar src/hooks/use-processes.ts

```typescript
import { useKV } from '@github/spark/hooks'
import type { Process } from '@/types'

export function useProcesses() {
  const [processes, setProcesses] = useKV<Process[]>('processes', [])

  const addProcess = (process: Process) => {
    setProcesses([...processes, process])
  }

  const updateProcess = (id: string, updates: Partial<Process>) => {
    setProcesses(
      processes.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  const deleteProcess = (id: string) => {
    setProcesses(processes.filter((p) => p.id !== id))
  }

  return {
    processes,
    addProcess,
    updateProcess,
    deleteProcess,
  }
}
```

---

## ⚛️ Passo 8: Criar Componentes Básicos

### 8.1 Criar src/ErrorFallback.tsx

```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Ops! Algo deu errado
        </h2>
        <p className="text-muted-foreground mb-4">
          Ocorreu um erro inesperado na aplicação.
        </p>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm">
            Detalhes do erro
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
        <Button onClick={resetErrorBoundary}>
          Tentar novamente
        </Button>
      </Card>
    </div>
  )
}
```

### 8.2 Criar src/App.tsx

```typescript
import HarveySpecter from "@/components/Donna"

export default function App() {
  return <HarveySpecter />
}
```

### 8.3 Criar src/main.tsx

```typescript
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary"
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./index.css"
import "./main.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
```

---

## 🎯 Passo 9: Criar Componente Principal Simplificado

### 9.1 Criar src/components/Donna.tsx (Versão MVP)

```typescript
import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function HarveySpecter() {
  const [messages, setMessages] = useKV<Message[]>('harvey-messages', [])
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState('chat')

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Olá! Sou o Harvey Specter, seu assistente jurídico. Como posso ajudar?',
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, userMessage, assistantMessage])
    setInput('')
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Assistente Jurídico PJe</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="processos">Processos</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="p-4 min-h-[500px] flex flex-col">
              <div className="flex-1 space-y-4 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto max-w-md'
                        : 'bg-muted max-w-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Digite sua mensagem..."
                />
                <Button onClick={handleSend}>Enviar</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
              <p className="text-muted-foreground">
                Dashboard será implementado aqui...
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="processos">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Processos</h2>
              <p className="text-muted-foreground">
                Lista de processos será implementada aqui...
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

---

## 🚀 Passo 10: Testar a Aplicação

### 10.1 Executar em desenvolvimento

```bash
npm run dev
```

### 10.2 Verificar no navegador

Acesse: http://localhost:5173

### 10.3 Verificar funcionalidades:
- ✅ Aplicação carrega sem erros
- ✅ Chat aparece e aceita mensagens
- ✅ Navegação entre tabs funciona
- ✅ Estilos estão aplicados

---

## 📊 Próximos Passos (Expandir o MVP)

Agora que o MVP está funcionando, adicione gradualmente:

### 1. Adicionar Dashboard completo
- Copiar `src/components/Dashboard.tsx` do repositório original

### 2. Adicionar gestão de processos
- Copiar `src/components/ProcessCRM.tsx`
- Copiar `src/components/ProcessosView.tsx`

### 3. Adicionar calendário
- Copiar `src/components/Calendar.tsx`
- Copiar `src/lib/google-calendar-service.ts`

### 4. Adicionar agentes IA
- Copiar `src/components/AIAgents.tsx`
- Copiar `src/lib/agents.ts`
- Copiar `src/hooks/use-autonomous-agents.ts`

### 5. Adicionar outros módulos
- Seguir a ordem em `ARQUIVOS_PARA_SPARK.md`

---

## 🔐 Configurar Variáveis de Ambiente

### Criar arquivo .env

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui
VITE_GOOGLE_API_KEY=sua-api-key-aqui
VITE_REDIRECT_URI=http://localhost:5173
VITE_APP_ENV=development
```

**⚠️ IMPORTANTE**: Nunca commite o arquivo `.env`!

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@/...'"
**Solução**: Verifique `vite.config.ts` e `tsconfig.json` - o alias `@` deve estar configurado.

### Erro: "useKV is not defined"
**Solução**: Verifique se `@github/spark` está instalado e importado em `main.tsx`.

### Erro de componente UI
**Solução**: Instale o componente faltando:
```bash
npx shadcn@latest add [nome-do-componente]
```

### Estilos não aplicados
**Solução**: Verifique se `index.css` e `main.css` estão importados em `main.tsx`.

---

## ✅ Checklist Final

- [ ] Projeto criado no Spark
- [ ] Dependências instaladas (`npm install`)
- [ ] Componentes shadcn instalados
- [ ] Arquivos de configuração criados
- [ ] Tipos TypeScript copiados
- [ ] Utilitários criados
- [ ] Hooks básicos criados
- [ ] Componente principal (Donna) criado
- [ ] Aplicação rodando (`npm run dev`)
- [ ] Sem erros no console
- [ ] Chat funcional
- [ ] Pronto para expandir!

---

**Parabéns! 🎉** Você tem agora um MVP funcional do Assistente Jurídico PJe no GitHub Spark!

**Próximo passo**: Adicione módulos gradualmente conforme necessário.

# Códigos Principais - Referência Rápida

Este documento contém os **trechos de código mais importantes** que você precisará copiar ao reconstruir o app no GitHub Spark.

---

## 🎯 Entry Points (Arquivos de Entrada)

### 1. src/main.tsx
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

### 2. src/App.tsx
```typescript
import HarveySpecter from "@/components/Donna"

export default function App() {
  return <HarveySpecter />
}
```

---

## 🛠️ Utilidades Essenciais

### src/lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
```

### src/lib/config.ts
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

---

## 📊 Tipos Principais

### src/types.ts (Principais interfaces)

```typescript
// Processo jurídico
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
  notas?: string
  prazos: Prazo[]
  createdAt: string
  updatedAt: string
}

// Prazo processual
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
  createdAt: string
}

// Mensagem do chat
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Cliente
export interface Cliente {
  id: string
  nome: string
  cpfCnpj: string
  email: string
  telefone: string
  endereco?: string
  tipo: 'pessoa-fisica' | 'pessoa-juridica'
  processos?: string[]
  createdAt: string
}

// Minuta/Documento
export interface Minuta {
  id: string
  titulo: string
  processId?: string
  tipo: 'peticao' | 'contrato' | 'parecer' | 'recurso' | 'outro'
  conteudo: string
  status: 'rascunho' | 'em-revisao' | 'finalizada' | 'arquivada'
  criadoEm: string
  atualizadoEm: string
  autor: string
  googleDocsId?: string
  googleDocsUrl?: string
}

// Entrada financeira
export interface FinancialEntry {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

// Evento de calendário
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  type: 'prazo' | 'audiencia' | 'reuniao' | 'outro'
  processId?: string
  googleEventId?: string
}
```

---

## 🪝 Hooks Essenciais

### src/hooks/use-processes.ts
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

## ⚛️ Componente Principal MVP

### src/components/Donna.tsx (Versão Simplificada)

```typescript
import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

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

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, userMessage])
    setInput('')

    // Simular resposta da IA
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getResponse(input),
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 500)
  }

  const getResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('processo')) {
      return 'Você tem 12 processos ativos no momento. Gostaria de ver os detalhes?'
    }
    if (lowerQuery.includes('prazo')) {
      return 'Há 3 prazos urgentes nas próximas 48 horas que requerem sua atenção.'
    }
    if (lowerQuery.includes('financeiro') || lowerQuery.includes('receita')) {
      return 'Sua receita do mês está em R$ 45.000. Despesas totais: R$ 12.000.'
    }
    
    return 'Sou o Harvey Specter, seu assistente jurídico. Como posso ajudar?'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Assistente Jurídico PJe</h1>
          <p className="text-muted-foreground">
            Seu assistente inteligente para gestão jurídica
          </p>
        </div>

        {/* Navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="processos">Processos</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card className="h-[600px] flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs opacity-50">
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button onClick={handleSend}>Enviar</Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Processos Ativos
                </h3>
                <p className="text-3xl font-bold">127</p>
                <p className="text-xs text-green-600">+12% este mês</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Prazos Urgentes
                </h3>
                <p className="text-3xl font-bold">3</p>
                <p className="text-xs text-red-600">Próximas 48h</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Tarefas Pendentes
                </h3>
                <p className="text-3xl font-bold">18</p>
                <p className="text-xs text-yellow-600">5 atrasadas</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Receita Mensal
                </h3>
                <p className="text-3xl font-bold">R$ 45k</p>
                <p className="text-xs text-green-600">+8% vs mês anterior</p>
              </Card>
            </div>
          </TabsContent>

          {/* Processos Tab */}
          <TabsContent value="processos">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Processos</h2>
              <p className="text-muted-foreground">
                Gestão de processos será implementada aqui...
              </p>
            </Card>
          </TabsContent>

          {/* Calendário Tab */}
          <TabsContent value="calendario">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Calendário</h2>
              <p className="text-muted-foreground">
                Calendário será implementado aqui...
              </p>
            </Card>
          </TabsContent>

          {/* Financeiro Tab */}
          <TabsContent value="financeiro">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Gestão Financeira</h2>
              <p className="text-muted-foreground">
                Módulo financeiro será implementado aqui...
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

## 🎨 Estilos CSS

### src/index.css
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

---

## 📝 Comandos Úteis

### Iniciar projeto
```bash
npm install
npm run dev
```

### Instalar shadcn components
```bash
npx shadcn@latest add button card dialog input select tabs scroll-area separator badge avatar dropdown-menu
```

### Build para produção
```bash
npm run build
```

### Preview do build
```bash
npm run preview
```

---

## 🔐 Variáveis de Ambiente (.env)

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui
VITE_GOOGLE_API_KEY=sua-api-key-aqui
VITE_REDIRECT_URI=http://localhost:5173
VITE_APP_ENV=development
```

---

## 📦 Dependências Principais (package.json)

```json
{
  "dependencies": {
    "@github/spark": "^0.39.0",
    "@phosphor-icons/react": "^2.1.7",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.6.2",
    "lucide-react": "^0.484.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-error-boundary": "^6.0.0",
    "tailwind-merge": "^3.0.2",
    "zod": "^3.25.76"
  }
}
```

---

## ✅ Ordem de Implementação

1. ✅ Setup inicial (configuração)
2. ✅ Tipos TypeScript
3. ✅ Utilidades
4. ✅ Componentes UI (shadcn)
5. ✅ Hooks básicos
6. ✅ Componente principal MVP
7. ✅ Entry points
8. ✅ Testar aplicação
9. ⏳ Adicionar módulos gradualmente

---

## 🎯 Próximos Módulos a Adicionar

Após o MVP funcionar, adicione nesta ordem:

1. **Dashboard completo** - Métricas e gráficos
2. **ProcessCRM** - Kanban de processos
3. **Calendar** - Calendário completo
4. **FinancialManagement** - Gestão financeira
5. **AIAgents** - Agentes autônomos
6. **MinutasManager** - Gestão de documentos

---

**Dica**: Cole este documento em um arquivo de referência e consulte sempre que precisar dos códigos principais!

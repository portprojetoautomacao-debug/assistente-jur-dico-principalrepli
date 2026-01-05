# 📝 Fluxo Completo de Minutas Automáticas

> **Documentação técnica do sistema de criação automática de minutas por agentes IA**

Este documento descreve o fluxo completo desde a detecção de uma intimação no DJEN até a geração automática de uma minuta pelo agente de redação, passando por todos os componentes envolvidos.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Fluxo Detalhado](#fluxo-detalhado)
4. [Componentes do Sistema](#componentes-do-sistema)
5. [Tipos e Interfaces](#tipos-e-interfaces)
6. [Templates de Documentos](#templates-de-documentos)
7. [Editor Tiptap](#editor-tiptap)
8. [Google Docs Integration](#google-docs-integration)
9. [Exemplos de Código](#exemplos-de-código)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de minutas automáticas permite que **agentes de IA trabalhem 24/7** gerando petições, manifestações e outros documentos jurídicos **sem intervenção humana**, mas com ferramentas completas de **revisão e aprovação** para operadores.

### Filosofia: 100% Automação com Supervisão Humana

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE AUTOMAÇÃO COMPLETO                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   DJEN/DataJud    →    Mrs. Justin-e    →    Agente Redação    →    KV     │
│   (Publicação)         (Análise)              (Geração IA)        (Salva)  │
│                                                                             │
│                              ↓                                              │
│                                                                             │
│   Operador  ←  Toast   ←  use-auto-minuta  ←  Detecta Nova Minuta          │
│   (Revisa)     (Aviso)       (Hook)                                         │
│                                                                             │
│                              ↓                                              │
│                                                                             │
│   Editor Tiptap  →  Aprova/Edita  →  Google Docs  →  Protocolo PJe         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Métricas do Sistema

| Métrica | Valor |
|---------|-------|
| Agentes envolvidos | 4 (Monitor DJEN, Justin-e, Gestão Prazos, Redação) |
| Templates disponíveis | 8 tipos jurídicos |
| Tempo médio de geração | 10-30 segundos |
| Taxa de sucesso | ~95% |

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Vercel Functions)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐         │
│  │   /api/cron      │────▶│  /api/agents     │────▶│  /api/kv         │         │
│  │ (Monitora DJEN)  │     │ (Processa tasks) │     │ (Storage)        │         │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘         │
│           │                        │                        │                    │
│           ▼                        ▼                        ▼                    │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐         │
│  │  Monitor DJEN    │     │  Spark LLM       │     │  Upstash Redis   │         │
│  │  Agent           │     │  (IA Gemini)     │     │  (KV Store)      │         │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐         │
│  │ use-auto-minuta  │────▶│ MinutasManager   │────▶│  TiptapEditor    │         │
│  │     (Hook)       │     │  (Component)     │     │  (Editor)        │         │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘         │
│           │                        │                        │                    │
│           ▼                        ▼                        ▼                    │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐         │
│  │  useKV('minutas')│     │ document-templates│    │  @tiptap/react   │         │
│  │  (State)         │     │  (8 templates)   │     │  (WYSIWYG)       │         │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
1. DETECÇÃO (Backend)
   /api/cron → Monitor DJEN → Nova publicação → Cria expediente

2. ANÁLISE (Backend)
   Expediente → Mrs. Justin-e → Identifica: tipo, prazo, ação necessária
   
3. ENCADEAMENTO (Backend)  
   Análise completa → suggestedActions inclui "redigir petição"
   → Cria task DRAFT_PETITION para agente 'redacao-peticoes'

4. REDAÇÃO (Backend)
   /api/agents → Processa task → Spark LLM → Gera draft
   → Salva Minuta no KV com status 'pendente-revisao'
   → Salva task em 'completed-agent-tasks'

5. DETECÇÃO (Frontend)
   use-auto-minuta → Monitora 'completed-agent-tasks'
   → Detecta task DRAFT_PETITION com agentId 'redacao-peticoes'
   → Mostra toast "📝 Nova minuta criada!"

6. REVISÃO (Frontend)
   MinutasManager → Lista minutas com criadoPorAgente: true
   → TiptapEditor → Operador revisa/edita
   → Aprova → status: 'finalizada'

7. PROTOCOLO (Opcional)
   Google Docs sync → Download PDF/DOC → Protocolo PJe
```

---

## 🔄 Fluxo Detalhado

### Etapa 1: Monitoramento DJEN (Cron Job)

**Arquivo:** `api/cron.ts`  
**Schedule:** Diário às 11:00 BRT (`0 14 * * *` UTC)

```typescript
// Simplificado
case 'monitor-djen':
  const publications = await monitorDJEN()
  for (const pub of publications) {
    // Cria expediente
    await createExpediente(pub)
    // Enfileira análise
    await addTaskToQueue({
      type: 'ANALYZE_INTIMATION',
      agentId: 'justine',
      data: { expedienteId: pub.id }
    })
  }
```

### Etapa 2: Análise de Intimação (Mrs. Justin-e)

**Arquivo:** `api/agents.ts`  
**Agente:** `justine` (intimation-analyzer)

A Mrs. Justin-e analisa cada intimação e retorna:

```json
{
  "summary": "Intimação para manifestação sobre documentos",
  "deadline": { "days": 15, "type": "úteis", "endDate": "2024-02-20" },
  "priority": "alta",
  "nextSteps": [
    "Analisar documentos juntados",
    "Preparar manifestação",
    "Protocolar dentro do prazo"
  ],
  "suggestedAction": "redigir_manifestacao"
}
```

### Etapa 3: Encadeamento de Tarefas

Quando a análise detecta necessidade de redação, uma nova task é criada:

```typescript
// Em api/agents.ts - task chaining
if (actionStr.includes('petição') || actionStr.includes('manifestação')) {
  const nextTask = {
    id: crypto.randomUUID(),
    agentId: 'petition-writer',         // ou 'redacao-peticoes'
    type: AgentTaskType.DRAFT_PETITION,
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.QUEUED,
    data: {
      ...task.data,
      instruction: action,
      sourceTask: task.id
    }
  }
  taskQueue.push(nextTask)
}
```

### Etapa 4: Redação Automática

**Arquivo:** `api/agents.ts`  
**Agente:** `petition-writer` (writer)

O agente de redação usa o prompt:

```typescript
SYSTEM_PROMPTS[AgentType.WRITER] = `
  Você é um redator jurídico sênior especializado em peças processuais.
  Redija petições, manifestações e documentos jurídicos com linguagem 
  técnica, formal e persuasiva.
  Siga normas ABNT, formatação padrão, e fundamente juridicamente.
`

USER_PROMPTS[AgentTaskType.DRAFT_PETITION] = (data) =>
  `Redija peça processual:\n\n${data}\n\n
  Retorne JSON: draft (texto completo), confidence, needsReview, suggestions.`
```

### Etapa 5: Auto-Criação de Minuta

Quando `DRAFT_PETITION` completa, o sistema automaticamente cria uma minuta:

```typescript
// Em api/agents.ts - após processamento bem-sucedido
if (task.type === AgentTaskType.DRAFT_PETITION && result.draft) {
  const minuta = {
    id: crypto.randomUUID(),
    titulo: `[Agente] ${documentType} - ${processNumber}`,
    tipo: determineMinutaTipo(documentType), // 'peticao' | 'contrato' | etc
    conteudo: result.draft,
    status: 'pendente-revisao',
    criadoEm: new Date().toISOString(),
    autor: 'Agente IA',
    criadoPorAgente: true,
    agenteId: task.agentId,
    expedienteId: task.data.expedienteId
  }
  
  // Salvar no KV
  await saveToKV('minutas', [...existingMinutas, minuta])
}
```

### Etapa 6: Detecção no Frontend

**Arquivo:** `src/hooks/use-auto-minuta.ts`

O hook monitora tarefas completadas e notifica o usuário:

```typescript
export function useAutoMinuta() {
  const [completedTasks] = useKV<AgentTask[]>('completed-agent-tasks', [])
  const [minutas] = useKV<Minuta[]>('minutas', [])
  const [processedTaskIds, setProcessedTaskIds] = useLocalStorage<string[]>(
    'processed-petition-tasks', 
    []
  )

  useEffect(() => {
    // Filtra tarefas de redação não processadas
    const petitionTasks = completedTasks.filter(
      task => task.type === 'draft_petition' &&
              task.agentId === 'redacao-peticoes' &&
              !processedTaskIds.includes(task.id)
    )

    if (petitionTasks.length > 0) {
      // Notifica
      toast('📝 Nova minuta criada!', {
        description: `${petitionTasks.length} minuta(s) gerada(s) por agentes`
      })
      
      // Marca como processadas
      setProcessedTaskIds([...processedTaskIds, ...petitionTasks.map(t => t.id)])
    }
  }, [completedTasks])

  return {
    minutasTotal: minutas.length,
    minutasPendentesRevisao: minutas.filter(m => m.status === 'pendente-revisao').length,
    minutasCriadasPorAgente: minutas.filter(m => m.criadoPorAgente).length,
    processedTasksCount: processedTaskIds.length
  }
}
```

### Etapa 7: Revisão no Editor

**Arquivo:** `src/components/MinutasManager.tsx`

O operador pode revisar, editar e aprovar minutas:

```typescript
// Filtros disponíveis
const minutasFiltradas = minutas.filter(minuta => {
  if (filtroStatus && minuta.status !== filtroStatus) return false
  if (filtroTipo && minuta.tipo !== filtroTipo) return false
  if (mostrarApenasAgente && !minuta.criadoPorAgente) return false
  return true
})

// Ações
const aprovarMinuta = (id: string) => {
  updateMinuta(id, { status: 'finalizada', atualizadoEm: new Date().toISOString() })
}

const editarMinuta = (id: string, conteudo: string) => {
  updateMinuta(id, { conteudo, atualizadoEm: new Date().toISOString() })
}
```

---

## 🧩 Componentes do Sistema

### 1. Hook `use-auto-minuta.ts`

**Localização:** `src/hooks/use-auto-minuta.ts`  
**Propósito:** Monitorar tarefas completadas e criar minutas automaticamente

```typescript
interface UseAutoMinutaReturn {
  minutasTotal: number              // Total de minutas
  minutasPendentesRevisao: number   // Aguardando revisão
  minutasCriadasPorAgente: number   // Criadas por IA
  processedTasksCount: number       // Tasks já processadas
}
```

### 2. Componente `MinutasManager.tsx`

**Localização:** `src/components/MinutasManager.tsx`  
**Propósito:** Interface completa de gestão de minutas

**Funcionalidades:**
- ✅ Listagem com filtros (status, tipo, agente)
- ✅ Criação manual com templates
- ✅ Editor Tiptap integrado
- ✅ Geração de texto com IA
- ✅ Integração Google Docs
- ✅ Export PDF/DOC
- ✅ Vinculação a processos
- ✅ Histórico de versões

### 3. Editor `TiptapEditor.tsx`

**Localização:** `src/components/editor/TiptapEditor.tsx`  
**Propósito:** Editor WYSIWYG com IA integrada

**Features:**
- Formatação completa (negrito, itálico, sublinhado, etc.)
- Títulos H1-H3
- Listas ordenadas e não-ordenadas
- Citações e código
- Alinhamento de texto
- 19 cores de texto
- Links e imagens
- Comandos de IA (Expandir, Resumir, Formalizar, Corrigir)
- Contador de palavras/caracteres
- Sistema de variáveis `{{variavel}}`

### 4. Templates `document-templates.ts`

**Localização:** `src/lib/document-templates.ts`  
**Propósito:** Templates jurídicos com variáveis

**Templates Disponíveis:**

| ID | Nome | Tipo | Variáveis Principais |
|----|------|------|---------------------|
| `peticao-inicial` | Petição Inicial | peticao | autor, reu, processo, comarca |
| `contestacao` | Contestação | peticao | autor, reu, processo, vara |
| `manifestacao` | Manifestação Processual | peticao | autor, reu, processo |
| `contrato-honorarios` | Contrato de Honorários | contrato | advogado, cliente, valor |
| `procuracao-ad-judicia` | Procuração Ad Judicia | procuracao | outorgante, outorgado |
| `procuracao-poderes-especiais` | Procuração Poderes Especiais | procuracao | outorgante, outorgado |
| `recurso-apelacao` | Recurso de Apelação | recurso | apelante, apelado, razoes |
| `parecer-juridico` | Parecer Jurídico | parecer | consulente, materia |

---

## 📦 Tipos e Interfaces

### Minuta

```typescript
interface Minuta {
  id: string
  titulo: string
  processId?: string                    // Vínculo com processo
  tipo: 'peticao' | 'contrato' | 'parecer' | 'recurso' | 'procuracao' | 'outro'
  conteudo: string                      // HTML do Tiptap
  status: 'rascunho' | 'em-revisao' | 'pendente-revisao' | 'finalizada' | 'arquivada'
  criadoEm: string                      // ISO timestamp
  atualizadoEm: string                  // ISO timestamp
  autor: string                         // 'Agente IA' ou nome do usuário
  
  // Integração Google Docs
  googleDocsId?: string
  googleDocsUrl?: string
  
  // Campos para agentes IA
  criadoPorAgente?: boolean             // true se criada automaticamente
  agenteId?: string                     // ID do agente que criou
  templateId?: string                   // Template usado
  expedienteId?: string                 // Expediente de origem
  variaveis?: Record<string, string>    // Variáveis substituídas
}
```

### AgentTask (Backend)

```typescript
interface AgentTask {
  id: string
  agentId: string
  type: AgentTaskType                   // 'draft_petition', etc
  priority: TaskPriority                // 'low' | 'medium' | 'high' | 'critical'
  status: TaskStatus                    // 'queued' | 'processing' | 'completed' | 'failed'
  createdAt: string
  startedAt?: string
  completedAt?: string
  data: {
    documentType?: string               // 'Contestação', 'Manifestação', etc
    processNumber?: string              // Número CNJ
    processId?: string                  // ID interno do processo
    expedienteId?: string               // ID do expediente
    instruction?: string                // Instrução específica
    sourceTask?: string                 // Task que originou esta
  }
  result?: {
    draft?: string                      // Texto gerado
    confidence?: number                 // 0-1
    needsReview?: boolean
    suggestions?: string[]
  }
  error?: string
}
```

### DocumentTemplate

```typescript
interface DocumentTemplate {
  id: string
  name: string
  description: string
  tipo: 'peticao' | 'contrato' | 'parecer' | 'recurso' | 'procuracao' | 'outro'
  content: string                       // HTML com {{variáveis}}
  variables: {
    name: string                        // Nome da variável
    label: string                       // Label amigável
    type: 'text' | 'textarea' | 'date' | 'number' | 'select'
    required: boolean
    placeholder?: string
    options?: string[]                  // Para type 'select'
  }[]
  tags: string[]
  createdAt: string
  updatedAt: string
}
```

---

## 📄 Templates de Documentos

### Sistema de Variáveis

Templates usam sintaxe `{{variavel}}` ou `{{objeto.propriedade}}`:

```html
<h1>EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA {{vara}}</h1>

<p><strong>{{autor.nome}}</strong>, {{autor.qualificacao}}, vem respeitosamente 
à presença de Vossa Excelência, nos autos do processo nº <strong>{{processo.numero}}</strong>, 
em face de <strong>{{reu.nome}}</strong>, expor e requerer o que segue:</p>

<h2>DOS FATOS</h2>
{{fatos}}

<h2>DOS PEDIDOS</h2>
{{pedidos}}
```

### Funções Auxiliares

```typescript
import { 
  getTemplateById, 
  getTemplatesByTipo,
  searchTemplates,
  replaceTemplateVariables, 
  extractUnfilledVariables 
} from '@/lib/document-templates'

// Buscar template
const template = getTemplateById('peticao-inicial')

// Buscar por tipo
const peticoes = getTemplatesByTipo('peticao')

// Buscar por termo
const results = searchTemplates('honorários')

// Substituir variáveis
const content = replaceTemplateVariables(template.content, {
  'autor.nome': 'João da Silva',
  'reu.nome': 'Empresa XYZ Ltda',
  'processo.numero': '1234567-89.2024.8.26.0100',
  'vara': '1ª Vara Cível de São Paulo'
})

// Encontrar variáveis não preenchidas
const unfilled = extractUnfilledVariables(content)
// ['comarca', 'fatos', 'pedidos']
```

### Variáveis Automáticas (quando vinculado a processo)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{processo.numero}}` | Número CNJ | 1234567-89.2024.8.26.0100 |
| `{{processo.titulo}}` | Título do processo | João da Silva vs. Empresa XYZ |
| `{{autor.nome}}` | Nome do autor | João da Silva |
| `{{reu.nome}}` | Nome do réu | Empresa XYZ Ltda |
| `{{comarca}}` | Comarca | São Paulo |
| `{{vara}}` | Vara | 1ª Vara Cível |

---

## ✏️ Editor Tiptap

### Extensões Instaladas

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/pm": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/extension-highlight": "^2.x",
  "@tiptap/extension-typography": "^2.x",
  "@tiptap/extension-text-align": "^2.x",
  "@tiptap/extension-underline": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-color": "^2.x",
  "@tiptap/extension-text-style": "^2.x"
}
```

### Comandos de IA

| Comando | Atalho | Descrição |
|---------|--------|-----------|
| Expandir | - | Desenvolve texto selecionado com mais detalhes |
| Resumir | - | Condensa texto de forma concisa |
| Formalizar | - | Reescreve em linguagem jurídica formal |
| Corrigir | - | Corrige gramática e ortografia |
| Gerar | - | Cria conteúdo a partir de prompt livre |

### Uso do Editor

```tsx
import { TiptapEditor } from '@/components/editor/TiptapEditor'

function MinutaEditor() {
  const [content, setContent] = useState('<p>Conteúdo inicial</p>')
  
  const handleAIGenerate = async (prompt: string) => {
    const response = await fetch('/api/llm-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Você é um redator jurídico.' },
          { role: 'user', content: prompt }
        ]
      })
    })
    const data = await response.json()
    return data.choices[0].message.content
  }
  
  return (
    <TiptapEditor
      content={content}
      onChange={setContent}
      placeholder="Digite ou use os comandos de IA..."
      onAIGenerate={handleAIGenerate}
      variables={{ 
        'processo.numero': '1234567-89.2024',
        'autor.nome': 'João da Silva'
      }}
    />
  )
}
```

---

## 🔗 Google Docs Integration

### Fluxo de Sincronização

```
Minuta (local) → Google Docs API → Documento Google
       ↓                                    ↓
    Edição                              Edição
       ↓                                    ↓
    Sync  ←←←←←←←←←←←←←←←←←←←←←←←←←←←←  Sync
```

### Funcionalidades

| Ação | Descrição |
|------|-----------|
| Criar | Cria novo documento no Google Docs |
| Sincronizar | Atualiza minuta local com conteúdo do Docs |
| Abrir | Abre documento no Google Docs |
| Desvincular | Remove link com Google Docs |

### Código de Sincronização

```typescript
// Em MinutasManager.tsx
const sincronizarComGoogleDocs = async (minuta: Minuta) => {
  if (!minuta.googleDocsId) {
    // Criar novo documento
    const doc = await googleDocsService.createDocument({
      title: minuta.titulo,
      content: minuta.conteudo
    })
    updateMinuta(minuta.id, {
      googleDocsId: doc.documentId,
      googleDocsUrl: doc.url
    })
  } else {
    // Sincronizar existente
    const content = await googleDocsService.getDocumentContent(minuta.googleDocsId)
    updateMinuta(minuta.id, {
      conteudo: content,
      atualizadoEm: new Date().toISOString()
    })
  }
}
```

---

## 💻 Exemplos de Código

### Criar Minuta Programaticamente

```typescript
import { useKV } from '@/hooks/use-kv'
import { getTemplateById, replaceTemplateVariables } from '@/lib/document-templates'

function useCreateMinuta() {
  const [minutas, setMinutas] = useKV<Minuta[]>('minutas', [])
  
  const createMinuta = (options: {
    titulo: string
    tipo: Minuta['tipo']
    templateId?: string
    processId?: string
    variaveis?: Record<string, string>
  }) => {
    let conteudo = ''
    
    if (options.templateId) {
      const template = getTemplateById(options.templateId)
      conteudo = template 
        ? replaceTemplateVariables(template.content, options.variaveis || {})
        : ''
    }
    
    const novaMinuta: Minuta = {
      id: crypto.randomUUID(),
      titulo: options.titulo,
      tipo: options.tipo,
      conteudo,
      status: 'rascunho',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      autor: 'Usuário',
      processId: options.processId,
      templateId: options.templateId,
      variaveis: options.variaveis
    }
    
    setMinutas([...minutas, novaMinuta])
    return novaMinuta
  }
  
  return { createMinuta }
}
```

### Monitorar Minutas Pendentes

```typescript
import { useAutoMinuta } from '@/hooks/use-auto-minuta'

function DashboardWidget() {
  const { 
    minutasTotal,
    minutasPendentesRevisao,
    minutasCriadasPorAgente 
  } = useAutoMinuta()
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>Total</CardHeader>
        <CardContent>{minutasTotal}</CardContent>
      </Card>
      <Card>
        <CardHeader>Pendentes</CardHeader>
        <CardContent>
          <span className="text-yellow-600">{minutasPendentesRevisao}</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>Criadas por IA</CardHeader>
        <CardContent>
          <span className="text-blue-600">{minutasCriadasPorAgente}</span>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Aprovar Minuta

```typescript
const aprovarMinuta = async (minutaId: string) => {
  const minuta = minutas.find(m => m.id === minutaId)
  if (!minuta) return
  
  // Atualizar status
  updateMinuta(minutaId, {
    status: 'finalizada',
    atualizadoEm: new Date().toISOString()
  })
  
  // Notificar
  toast.success('Minuta aprovada!', {
    description: `"${minuta.titulo}" está pronta para protocolo`
  })
  
  // Opcional: Sincronizar com Google Docs
  if (minuta.googleDocsId) {
    await googleDocsService.updateDocument(minuta.googleDocsId, minuta.conteudo)
  }
}
```

---

## 🔧 Troubleshooting

### Problema: Minuta não aparece após criação pelo agente

**Causa:** O hook `use-auto-minuta` pode não ter detectado a tarefa completada.

**Solução:**
1. Verificar se a task está em `completed-agent-tasks` no KV
2. Verificar se `agentId` é `redacao-peticoes`
3. Verificar se a task não está em `processed-petition-tasks` (localStorage)

```typescript
// Debug
const [completedTasks] = useKV('completed-agent-tasks', [])
console.log('Completed tasks:', completedTasks.filter(t => t.type === 'draft_petition'))

const processedIds = JSON.parse(localStorage.getItem('processed-petition-tasks') || '[]')
console.log('Already processed:', processedIds)
```

### Problema: Template não substitui variáveis

**Causa:** Variáveis com formato incorreto ou não encontradas.

**Solução:**
1. Usar exatamente `{{variavel}}` (duas chaves)
2. Verificar se a variável existe no objeto passado
3. Usar `extractUnfilledVariables()` para debug

```typescript
const content = template.content
const vars = { 'autor.nome': 'João' }
const result = replaceTemplateVariables(content, vars)
const unfilled = extractUnfilledVariables(result)
console.log('Variáveis não preenchidas:', unfilled)
```

### Problema: Editor Tiptap não carrega conteúdo

**Causa:** Conteúdo HTML inválido ou problema de inicialização.

**Solução:**
1. Garantir que `content` é HTML válido
2. Verificar se todas as extensões estão instaladas
3. Usar `key` prop para forçar re-render

```tsx
<TiptapEditor
  key={minuta.id}  // Força re-render quando muda
  content={minuta.conteudo || '<p></p>'}
  onChange={setConteudo}
/>
```

### Problema: Google Docs não sincroniza

**Causa:** Permissões OAuth ou token expirado.

**Solução:**
1. Verificar se o usuário autorizou scope `drive.file`
2. Verificar se `googleDocsId` existe na minuta
3. Tentar re-autenticar

```typescript
// Verificar autenticação
const isAuthenticated = googleAuth.isSignedIn()
const hasDocScope = googleAuth.hasScope('https://www.googleapis.com/auth/drive.file')

if (!hasDocScope) {
  await googleAuth.requestAdditionalScopes(['drive.file'])
}
```

---

## 📊 Métricas e Monitoramento

### KV Keys Utilizadas

| Key | Tipo | Descrição |
|-----|------|-----------|
| `minutas` | `Minuta[]` | Lista de todas as minutas |
| `completed-agent-tasks` | `AgentTask[]` | Tarefas completadas pelos agentes |
| `agent-task-queue` | `AgentTask[]` | Fila de tarefas pendentes |
| `autonomous-agents` | `Agent[]` | Configuração dos agentes |

### LocalStorage Keys

| Key | Tipo | Descrição |
|-----|------|-----------|
| `processed-petition-tasks` | `string[]` | IDs de tasks já processadas (evita duplicatas) |

### Logs Importantes (Backend)

```
[Agents] Processing task <id> for <agent>
[Agents] Task processed successfully { taskId, tokensUsed, processingTimeMs }
[Agents] Auto-created minuta: <id> { titulo, agentId }
[Agents] Chaining task: <type> for <agentId>
```

---

## 🚀 Próximos Passos

1. **Webhooks de Notificação** - Enviar email/WhatsApp quando minuta for criada
2. **Versionamento** - Histórico de alterações em minutas
3. **Assinatura Digital** - Integração com certificado digital
4. **Protocolo Automático** - Integração direta com PJe
5. **IA Comparativa** - Comparar minutas com precedentes
6. **Templates Personalizados** - Permitir usuários criarem templates

---

## 📚 Referências

- [Tiptap Documentation](https://tiptap.dev/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Upstash Redis](https://docs.upstash.com/redis)
- [Google Docs API](https://developers.google.com/docs/api)
- [CPC/2015 - Prazos Processuais](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm)

---

*Documentação gerada em: $(date +%Y-%m-%d)*  
*Versão: 1.0.0*  
*Autor: Sistema Assistente Jurídico PJe*

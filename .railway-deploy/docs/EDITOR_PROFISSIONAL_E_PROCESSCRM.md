# 📝 Editor Profissional e ProcessCRM - Documentação Completa

## 🎯 Visão Geral

Este documento descreve os dois novos componentes criados para elevar a UI do sistema a padrões internacionais:

1. **ProfessionalEditor** - Editor de texto estilo Word/Google Docs com colaboração IA
2. **ProcessCRMMasterDetail** - Gerenciador de processos com layout master-detail estilo PJe

---

## 🖊️ ProfessionalEditor

### Objetivo

Substituir/complementar o TiptapEditorV2 com um editor profissional que oferece:
- UI moderna estilo Word/Google Docs
- Colaboração inteligente humano + IA
- Layout de página A4 realista
- Barra de ferramentas completa

### Localização

```
src/components/editor/ProfessionalEditor.tsx
src/components/editor/professional-editor.scss
```

### Props Interface

```typescript
interface ProfessionalEditorProps {
  content: string;                    // HTML content
  onChange: (content: string) => void; // Callback quando conteúdo muda
  placeholder?: string;                // Placeholder do editor
  className?: string;                  // Classes CSS adicionais
  readOnly?: boolean;                  // Modo somente leitura
  
  // Geração com IA (sem streaming)
  onAIGenerate?: (prompt: string) => Promise<string>;
  
  // Geração com IA (streaming)
  onAIStream?: (
    prompt: string,
    callbacks: {
      onChunk: (chunk: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ) => Promise<void>;
  
  // Variáveis para substituição automática
  variables?: Record<string, string>;
  
  // Mostrar indicadores de colaboração
  showCollaboration?: boolean;
}
```

### Funcionalidades

#### 1. Colaboração Humano + IA 🤝

**Como funciona:**
- Quando o usuário **digita**, a IA **pausa automaticamente**
- Após **3 segundos de inatividade**, a IA pode **retomar**
- **Indicadores visuais** mostram quem está editando:
  - Badge azul: "Você está editando"
  - Badge roxo: "IA escrevendo..."

**Implementação técnica:**
```typescript
// Detecta input do usuário
const handleUserInput = useCallback(() => {
  lastUserInputRef.current = Date.now();
  setIsUserTyping(true);
  
  // Pausar IA se estiver ativa
  if (isAIActive) {
    setIsAIActive(false);
  }
  
  // Timer de 3 segundos
  if (inactivityTimerRef.current) {
    clearTimeout(inactivityTimerRef.current);
  }
  
  inactivityTimerRef.current = setTimeout(() => {
    setIsUserTyping(false);
    // IA pode retomar aqui
  }, 3000);
}, [isAIActive]);
```

#### 2. Barra de Ferramentas Profissional 🛠️

**Grupo 1: Histórico**
- ↶ Desfazer (Undo)
- ↷ Refazer (Redo)

**Grupo 2: Fonte**
- Seletor de tamanho: 10px, 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px

**Grupo 3: Formatação**
- **B** Negrito
- *I* Itálico
- <u>U</u> Sublinhado
- ~~S~~ Tachado

**Grupo 4: Alinhamento**
- ⬅ Esquerda
- ⬛ Centro
- ➡ Direita
- ⬜ Justificar

**Grupo 5: Listas**
- • Lista com marcadores
- 1. Lista numerada

**Grupo 6: IA** 🤖
- Botão com dropdown de comandos rápidos
- Campo para prompt customizado

#### 3. Comandos Rápidos de IA ⚡

| Comando | Ícone | Função |
|---------|-------|--------|
| **Continuar** | ⚡ | Continua escrevendo o texto de forma natural |
| **Expandir** | ⤢ | Desenvolve o texto com mais detalhes |
| **Revisar** | ✨ | Melhora a redação mantendo o significado |
| **Formalizar** | 🪄 | Transforma em linguagem jurídica formal |

#### 4. Layout de Página A4 📄

**Características:**
- Largura: 21cm (A4 padrão)
- Altura mínima: 29.7cm (A4 padrão)
- Margens: 2.54cm (1 polegada) em todos os lados
- Sombra realista para dar profundidade
- Fundo branco puro (#FFFFFF)
- Fonte padrão: Times New Roman, 12pt
- Espaçamento de linha: 1.5

**CSS:**
```scss
.ProseMirror {
  width: 100%;
  max-width: 21cm;
  min-height: 29.7cm;
  background-color: white;
  padding: 2.54cm;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1),
              0 4px 16px rgba(0, 0, 0, 0.05);
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.5;
}
```

#### 5. Rodapé com Contadores 📊

Exibe em tempo real:
- **Palavras**: Contagem de palavras
- **Caracteres**: Contagem de caracteres (com espaços)

**Exemplo:**
```
127 palavras • 892 caracteres
```

#### 6. Substituição de Variáveis 🔄

Use `{{variavel}}` no texto para substituição automática:

```typescript
const variables = {
  "processo.numero": "1234567-89.2024.5.02.0999",
  "autor.nome": "João Silva",
  "reu.nome": "Empresa XYZ Ltda",
  "comarca": "São Paulo",
  "vara": "1ª Vara Cível"
};

<ProfessionalEditor
  content="Processo nº {{processo.numero}}"
  variables={variables}
/>

// Resultado: "Processo nº 1234567-89.2024.5.02.0999"
```

### Exemplo de Uso

```tsx
import { ProfessionalEditor } from "@/components/editor/ProfessionalEditor";
import { useState } from "react";

function MinhaMinuta() {
  const [content, setContent] = useState("");

  const handleAIStream = async (prompt, callbacks) => {
    const response = await fetch("/api/llm-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Você é um advogado brasileiro." },
          { role: "user", content: prompt }
        ]
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        callbacks.onComplete();
        break;
      }
      const chunk = decoder.decode(value);
      callbacks.onChunk(chunk);
    }
  };

  return (
    <ProfessionalEditor
      content={content}
      onChange={setContent}
      onAIStream={handleAIStream}
      showCollaboration={true}
      variables={{
        "processo.numero": "1234567-89.2024.5.02.0999"
      }}
    />
  );
}
```

---

## 📁 ProcessCRMMasterDetail

### Objetivo

Criar um gerenciador de processos com layout **master-detail** inspirado no PJe, oferecendo:
- Lista de processos à esquerda (painel master)
- Detalhes do processo à direita (painel detail)
- Navegação intuitiva com tabs
- Visualização de expedientes e minutas vinculados

### Localização

```
src/components/ProcessCRMMasterDetail.tsx
```

### Estrutura do Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────────┬─────────────────────────────────────┐ │
│  │              │                                     │ │
│  │   MASTER     │          DETAIL                     │ │
│  │   (Lista)    │          (Tabs)                     │ │
│  │              │                                     │ │
│  │  Processos   │  [Geral] [Partes] [Exp.] [Minutas] │ │
│  │  ┌────────┐  │                                     │ │
│  │  │ Proc 1 │  │  Informações do processo selecionado│ │
│  │  ├────────┤  │                                     │ │
│  │  │ Proc 2 │◄─┼─► Tabs com detalhes                │ │
│  │  ├────────┤  │                                     │ │
│  │  │ Proc 3 │  │  - Geral: dados básicos             │ │
│  │  └────────┘  │  - Partes: autor/réu                │ │
│  │              │  - Expedientes: intimações          │ │
│  │              │  - Minutas: documentos              │ │
│  └──────────────┴─────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Funcionalidades

#### 1. Painel Master (Lista de Processos) 📋

**Características:**
- Largura fixa: 320px (80 = 20rem)
- Busca em tempo real
- Scroll independente
- Highlight no item selecionado

**Campos exibidos:**
- 📁 Número CNJ
- 📝 Título (line-clamp-2)
- 🏷️ Badge de status (ativo, suspenso, concluído, arquivado)
- 📊 Badge de fase (Inicial, Instrução, Sentença, etc.)

**Busca funciona em:**
- Número CNJ
- Título
- Nome do autor
- Nome do réu

#### 2. Painel Detail (Detalhes do Processo) 📖

**Tab 1: Geral**
- Comarca
- Vara
- Data de distribuição
- Data da última movimentação
- Notas do processo

**Tab 2: Partes**
- 👤 Autor (com card)
- 👤 Réu (com card)

**Tab 3: Expedientes**
- Lista de expedientes vinculados
- Badge com contador: `Expedientes (5)`
- Cards com:
  - Tipo de expediente
  - Data
  - Fonte (DJEN, DataJud, etc.)
  - Teor (primeiras 3 linhas)

**Tab 4: Minutas**
- Lista de minutas vinculadas
- Badge com contador: `Minutas (3)`
- Cards com:
  - Título
  - Data de criação
  - Tipo (petição, contrato, parecer, etc.)
  - Status (rascunho, finalizada, etc.)

#### 3. Sistema de Badges 🏷️

**Status do Processo:**
| Status | Cor | Classe CSS |
|--------|-----|------------|
| Ativo | Azul | `bg-blue-100 text-blue-800 border-blue-300` |
| Suspenso | Amarelo | `bg-yellow-100 text-yellow-800 border-yellow-300` |
| Concluído | Verde | `bg-green-100 text-green-800 border-green-300` |
| Arquivado | Cinza | `bg-gray-100 text-gray-800 border-gray-300` |

**Contadores:**
```tsx
<Badge variant="secondary" className="ml-2">
  {expedienteCount}
</Badge>
```

#### 4. Integração com KV Storage 💾

O componente usa hooks para buscar dados automaticamente:

```typescript
const [processes] = useKV<Process[]>("processes", []);
const [expedientes] = useKV<Expediente[]>("expedientes", []);
const [minutas] = useKV<Minuta[]>("minutas", []);
```

**Vinculação automática:**
- Expedientes são vinculados por `processId` ou `numeroProcesso`
- Minutas são vinculadas por `processId`

### Exemplo de Uso

```tsx
import ProcessCRMMasterDetail from "@/components/ProcessCRMMasterDetail";

function PaginaProcessos() {
  return (
    <div className="h-screen">
      <ProcessCRMMasterDetail />
    </div>
  );
}
```

---

## 🎨 Design e UX

### Cores e Temas

Ambos os componentes seguem o sistema de design shadcn/ui:
- Variáveis CSS: `hsl(var(--background))`, `hsl(var(--card))`, etc.
- Suporte a tema claro e escuro
- Consistência visual com resto do app

### Responsividade

**ProfessionalEditor:**
- Desktop: Página A4 completa com margens
- Mobile: Página 100% width, margens reduzidas
- Toolbar: Scroll horizontal em mobile

**ProcessCRMMasterDetail:**
- Desktop: Master-detail lado a lado
- Mobile: Tabs para alternar entre lista e detalhes

### Acessibilidade

- Botões com `aria-label` e `title`
- Navegação por teclado
- Contrast ratio adequado (WCAG AA)
- Focus visível

---

## 🚀 Integração no App

### Opção 1: Substituir TiptapEditorV2

```tsx
// Antes
import { TiptapEditorV2 } from "@/components/editor/TiptapEditorV2";

// Depois
import { ProfessionalEditor } from "@/components/editor/ProfessionalEditor";
```

### Opção 2: Usar como alternativa

```tsx
import { ProfessionalEditor } from "@/components/editor/ProfessionalEditor";
import { TiptapEditorV2 } from "@/components/editor/TiptapEditorV2";

function MinutasManager() {
  const [useProfessional, setUseProfessional] = useState(true);
  
  return (
    <div>
      <select onChange={(e) => setUseProfessional(e.target.value === "professional")}>
        <option value="professional">Editor Profissional</option>
        <option value="tiptap">Editor Tiptap V2</option>
      </select>
      
      {useProfessional ? (
        <ProfessionalEditor {...props} />
      ) : (
        <TiptapEditorV2 {...props} />
      )}
    </div>
  );
}
```

### Opção 3: ProcessCRM no Dashboard

```tsx
import ProcessCRMMasterDetail from "@/components/ProcessCRMMasterDetail";

function Dashboard() {
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="processos">Processos</TabsTrigger>
      </TabsList>
      
      <TabsContent value="processos">
        <ProcessCRMMasterDetail />
      </TabsContent>
    </Tabs>
  );
}
```

---

## 🧪 Testes

### ProfessionalEditor

**Testar colaboração humano + IA:**
1. Abrir editor
2. Clicar em "Continuar" (comando IA)
3. Começar a digitar durante streaming
4. Verificar se IA pausa automaticamente
5. Parar de digitar por 3 segundos
6. Verificar se badge muda de "Você está editando" para "IA pode retomar"

**Testar formatação:**
1. Digitar texto
2. Selecionar texto
3. Aplicar negrito, itálico, sublinhado
4. Testar alinhamentos
5. Criar listas

**Testar variáveis:**
1. Digitar `{{processo.numero}}`
2. Verificar se substitui automaticamente

### ProcessCRMMasterDetail

**Testar navegação:**
1. Abrir componente
2. Clicar em diferentes processos
3. Verificar se painel direito atualiza
4. Navegar entre tabs
5. Verificar contadores de expedientes e minutas

**Testar busca:**
1. Digitar no campo de busca
2. Verificar filtro em tempo real
3. Testar busca por CNJ, título, autor, réu

---

## 📦 Dependências

Ambos componentes usam apenas dependências já instaladas:

```json
{
  "@tiptap/react": "^3.13.0",
  "@tiptap/starter-kit": "^3.13.0",
  "@tiptap/extension-*": "^3.13.0",
  "lucide-react": "^0.555.0",
  "sonner": "^2.0.1"
}
```

**Nenhuma nova dependência foi adicionada!** ✅

---

## 🐛 Troubleshooting

### Editor não aparece em branco?

Verifique se o container tem altura definida:
```tsx
<div className="h-screen">
  <ProfessionalEditor {...props} />
</div>
```

### Streaming de IA não funciona?

Certifique-se de que o endpoint `/api/llm-stream` existe e retorna SSE:
```typescript
// Formato esperado:
data: {"choices":[{"delta":{"content":"texto"}}]}
data: [DONE]
```

### ProcessCRM não mostra processos?

Verifique se há dados no KV:
```typescript
const [processes] = useKV<Process[]>("processes", []);
console.log("Processos:", processes);
```

---

## 📝 Conclusão

Os novos componentes elevam a UI do sistema para padrões internacionais:

✅ **ProfessionalEditor**
- Editor profissional estilo Word/Google Docs
- Colaboração inteligente humano + IA
- Layout A4 realista
- Barra de ferramentas completa

✅ **ProcessCRMMasterDetail**
- Layout master-detail estilo PJe
- Navegação intuitiva com tabs
- Integração automática com KV
- Visual profissional e consistente

**Próximos passos:**
1. Integrar no MinutasManager
2. Testar em produção
3. Coletar feedback dos usuários
4. Ajustar responsividade mobile

---

**Criado em:** Dezembro 2024  
**Versão:** 1.0.0  
**Autor:** GitHub Copilot Agent

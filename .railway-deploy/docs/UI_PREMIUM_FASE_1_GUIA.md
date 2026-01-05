# UI Premium - Fase 1: Documentação de Uso

## 📖 Guia Completo dos Novos Componentes

### 🎨 Sistema de Temas (`src/lib/themes.ts`)

#### Descrição
Sistema centralizado de cores semânticas e utilitários para a UI jurídica.

#### Uso

```typescript
import { themeConfig, getEventBadgeClass, getStatusBadgeClass } from '@/lib/themes';

// Cores semânticas
const urgentColor = themeConfig.colors.urgente; // hsl(0, 72%, 51%)
const sentencaColor = themeConfig.colors.sentenca;

// Classes de badge
const badgeClass = getEventBadgeClass('certidao');
// Retorna: "inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border bg-sky-500/10 text-sky-600 border-sky-500/30"

const statusClass = getStatusBadgeClass('ativo');
// Retorna: "inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border bg-green-500/10 text-green-600 border-green-500/30"
```

#### Cores Disponíveis

| Tipo | Cor HSL | Uso |
|------|---------|-----|
| `urgente` | hsl(0, 72%, 51%) | Processos/prazos urgentes |
| `alerta` | hsl(38, 92%, 50%) | Avisos importantes |
| `sucesso` | hsl(142, 71%, 45%) | Ações bem-sucedidas |
| `info` | hsl(221, 83%, 53%) | Informações gerais |
| `certidao` | hsl(199, 89%, 48%) | Certidões |
| `sentenca` | hsl(0, 72%, 51%) | Sentenças |
| `despacho` | hsl(262, 83%, 58%) | Despachos |
| `peticao` | hsl(160, 84%, 39%) | Petições |
| `intimacao` | hsl(280, 65%, 60%) | Intimações |

---

### ✏️ ProfessionalEditor (`src/components/editor/ProfessionalEditor.tsx`)

#### Descrição
Editor de documentos profissional com aparência de página A4 e colaboração inteligente entre humano e IA.

#### Features

- 📄 **Aparência A4**: Página com 794px × 1123px (tamanho real A4 @ 96 DPI)
- 👤 **Indicadores de Autor**: Badges mostrando se humano ou IA está escrevendo
- 🤝 **Colaboração Inteligente**: IA pausa automaticamente quando humano digita
- 📊 **Word Count**: Contagem em tempo real de palavras e páginas
- 🖨️ **Print-Ready**: Layout otimizado para impressão

#### Uso Básico

```typescript
import { ProfessionalEditor } from '@/components/editor/ProfessionalEditor';

function MyComponent() {
  const [content, setContent] = useState('<p>Conteúdo inicial</p>');

  return (
    <ProfessionalEditor
      content={content}
      onChange={setContent}
      placeholder="Digite aqui..."
    />
  );
}
```

#### Uso com IA

```typescript
import { ProfessionalEditor } from '@/components/editor/ProfessionalEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  const handleAIGenerate = async (prompt: string) => {
    const response = await fetch('/api/llm-proxy', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleAIStream = async (
    prompt: string,
    callbacks: { onChunk, onComplete, onError }
  ) => {
    // Implementar streaming de IA
    // Ver TiptapEditorV2 para exemplo completo
  };

  return (
    <ProfessionalEditor
      content={content}
      onChange={setContent}
      onAIGenerate={handleAIGenerate}
      onAIStream={handleAIStream}
      variables={{
        'processo.numero': '1234567-89.2024',
        'autor.nome': 'João Silva'
      }}
    />
  );
}
```

#### Comportamento de Colaboração

1. **Humano digita** → IA pausa automaticamente
2. **Humano para por 3s** → IA pode continuar (se tiver comando pendente)
3. **IA processando** → Badge "IA" aparece, footer mostra status
4. **IA completa** → Badge volta para "Humano" quando usuário digitar novamente

#### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `content` | string | ✅ | Conteúdo HTML do editor |
| `onChange` | (content: string) => void | ✅ | Callback quando conteúdo muda |
| `onAIGenerate` | (prompt: string) => Promise\<string\> | ❌ | Gerar texto com IA (sem streaming) |
| `onAIStream` | (prompt, callbacks) => Promise\<void\> | ❌ | Gerar texto com IA (com streaming) |
| `variables` | Record<string, string> | ❌ | Variáveis para templates |
| `readOnly` | boolean | ❌ | Modo somente leitura |
| `className` | string | ❌ | Classes CSS adicionais |

---

### 📁 GoogleDocsEmbed (`src/components/GoogleDocsEmbed.tsx`)

#### Descrição
Componente para embutir documentos do Google Docs diretamente no app, sem abrir nova aba.

#### Features

- 📺 **Iframe Integrado**: Google Docs dentro do app
- 🔄 **Tabs**: Alternar entre Visualizar e Editar
- 🔍 **Fullscreen**: Expandir para tela cheia
- 🔗 **Abrir Externo**: Botão para abrir no Google Docs
- ✅ **Validação Segura**: Valida formato do docId

#### Uso

```typescript
import { GoogleDocsEmbed } from '@/components/GoogleDocsEmbed';

function MyComponent() {
  const [showEmbed, setShowEmbed] = useState(false);

  return (
    <>
      <Button onClick={() => setShowEmbed(true)}>
        Abrir Documento
      </Button>

      {showEmbed && (
        <GoogleDocsEmbed
          docId="1abc123xyz456-VALID_DOC_ID"
          docUrl="https://docs.google.com/document/d/1abc123xyz456-VALID_DOC_ID"
          title="Petição Inicial - Processo 123"
          onClose={() => setShowEmbed(false)}
        />
      )}
    </>
  );
}
```

#### Obtendo o docId

Do URL do Google Docs:
```
https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                  ↑                                           ↑
                                  docId começa aqui e termina antes de /edit
```

O docId é: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

#### Validação de Segurança

O componente valida que o `docId` tenha:
- Entre 20-60 caracteres
- Apenas letras, números, hífens e underscores
- Regex: `/^[a-zA-Z0-9_-]{20,60}$/`

#### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `docId` | string | ✅ | ID do documento Google Docs |
| `docUrl` | string | ✅ | URL completo do documento |
| `title` | string | ✅ | Título para exibir no header |
| `onClose` | () => void | ❌ | Callback ao fechar |

---

### 📂 AcervoPJe (`src/components/AcervoPJe.tsx`)

#### Descrição
Layout master-detail profissional para gestão de processos, no estilo do PJe (Processo Judicial Eletrônico).

#### Features

- 📋 **Sidebar 320px**: Lista de processos com busca e filtros
- 🔍 **Busca**: Pesquisa por número CNJ, título, autor ou réu
- 🏷️ **Filtros**: Todos, Ativos, Urgentes
- 🔴 **Indicador de Urgência**: Bolinha vermelha pulsante
- 📊 **Badges**: Status e fase dos processos
- 📺 **Painel Principal**: ProcessTimelineViewer integrado
- 📈 **Estatísticas**: Total, Ativos, Urgentes no estado vazio

#### Uso

```typescript
import { AcervoPJe } from '@/components/AcervoPJe';

function App() {
  return (
    <div className="h-screen">
      <AcervoPJe />
    </div>
  );
}
```

O componente já está integrado com:
- `useKV('processes', [])` - Lista de processos
- `useKV('processEvents', [])` - Eventos processuais
- `ProcessTimelineViewer` - Visualizador de timeline

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  AcervoPJe                                              │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  SIDEBAR     │  PAINEL PRINCIPAL                        │
│  320px       │                                          │
│              │                                          │
│  ┌────────┐  │  ┌────────────────────────────────────┐ │
│  │ Busca  │  │  │                                    │ │
│  └────────┘  │  │  ProcessTimelineViewer             │ │
│              │  │  (se processo selecionado)         │ │
│  [Filtros]   │  │                                    │ │
│              │  │  ou                                │ │
│  ┌────────┐  │  │                                    │ │
│  │Processo│  │  │  Estado vazio                      │ │
│  │  🔴    │  │  │  (se nenhum selecionado)           │ │
│  └────────┘  │  │                                    │ │
│  ┌────────┐  │  └────────────────────────────────────┘ │
│  │Processo│  │                                          │
│  └────────┘  │                                          │
│      ...     │                                          │
└──────────────┴──────────────────────────────────────────┘
```

#### Filtros Disponíveis

| Filtro | Descrição |
|--------|-----------|
| **Todos** | Exibe todos os processos |
| **Ativos** | Apenas processos com status="ativo" |
| **Urgentes** | Processos com prazos urgentes não concluídos |

#### Integração com ProcessTimelineViewer

Quando um processo é selecionado na sidebar, o componente `ProcessTimelineViewer` é exibido automaticamente no painel principal, mostrando:
- Linha do tempo cronológica
- Eventos (certidões, intimações, despachos, etc.)
- Documentos vinculados
- Metadados do processo

---

## 🚀 Navegação no App

### Acesso via Sidebar

1. Click no item **"Acervo PJe"** na sidebar
2. Ícone: 📁 (FolderOpen)
3. Rota: `#acervo` ou `#acervo-pje`

### Rotas Configuradas

```typescript
// App.tsx
case 'acervo':
case 'acervo-pje':
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AcervoPJe />
    </Suspense>
  );
```

---

## 🎨 Padrões de Código

### TypeScript Strict

Todos os componentes usam TypeScript strict:

```typescript
interface Props {
  readonly content: string;
  readonly onChange: (value: string) => void;
}
```

### shadcn/ui Components

Todos os componentes usam a biblioteca shadcn/ui:

```typescript
import { Button, Badge, Card, Input, Tabs, ScrollArea } from '@/components/ui';
```

### Classe Condicional

Use `cn()` para classes condicionais:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)} />
```

---

## 📊 Performance

### Lazy Loading

O componente `AcervoPJe` usa lazy loading no App.tsx:

```typescript
const AcervoPJe = lazy(() => import("@/components/AcervoPJe"));
```

### Otimizações

- **useMemo**: Word count no ProfessionalEditor
- **useCallback**: Handlers otimizados
- **Code Splitting**: Bundle separado para cada componente

### Bundle Size

```
dist/assets/AcervoPJe-BE_Xf2zN.js         14.16 kB
dist/assets/TiptapEditorV2-erldnbSm.js   539.96 kB (já existente)
```

---

## 🛡️ Segurança

### Validação de Entrada

- **GoogleDocsEmbed**: Valida formato do docId
- **ProfessionalEditor**: Sanitização de HTML via DOM parser

### XSS Protection

O ProfessionalEditor usa `document.createElement` + `textContent` para extrair texto de forma segura, evitando regex-based HTML parsing que pode ter vulnerabilidades.

---

## 🧪 Testes

### Lint

```bash
npm run lint
# ✅ Passa sem erros (apenas warnings pré-existentes)
```

### Build

```bash
npm run build
# ✅ Build completo em ~15s
# ✅ 2629.00 KiB total
```

### Testes Manuais Recomendados

1. **Navegação**: Click em "Acervo PJe" na sidebar
2. **Busca**: Digite número de processo na busca
3. **Filtros**: Testar Todos/Ativos/Urgentes
4. **Seleção**: Click em um processo e ver timeline
5. **Editor**: Testar digitação e comandos de IA
6. **Google Docs**: Testar embed com docId válido

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique este documento
2. Veja os comentários nos arquivos fonte
3. Consulte a documentação do shadcn/ui
4. Revise o código dos componentes

---

**Documentação gerada em:** 08/12/2024  
**Versão:** 1.0.0  
**Fase:** UI Premium - Fase 1

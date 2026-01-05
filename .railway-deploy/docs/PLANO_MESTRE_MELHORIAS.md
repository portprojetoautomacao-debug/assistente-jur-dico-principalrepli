Bora fazer o *grande plano mestre* do Assistente Jurídico P 😄
A ideia aqui é: **nada conceitual demais**, tudo em formato que dá pra colar no VS Code, usar como backlog e até como contexto pra IA.

Vou organizar em **6 FASES**, todas 100% compatíveis com o que você já tem hoje:

1. Hardening do **Task Engine**
2. Evolução dos **Agentes de IA**
3. Camada de **Memória Jurídica & Operacional**
4. **Auto-monitoramento, filtros e failsafes**
5. **Minutas + Tiptap + fluxo jurídico** redondinho
6. **Documentação + Prompts para IA de desenvolvimento (VS Code)**

---

# 🧱 FASE 1 – Hardening do Task Engine

### 🎯 Objetivo

Deixar o cérebro de tarefas **à prova de erro**: rastreável, confiável, com retry decente e sem tarefas zumbi.

---

### 1.1. Tipar melhor `AgentTask` / `TarefaSistema`

No arquivo onde você define as tarefas (`src/lib/agents.ts` ou equivalente), evoluir para algo assim:

```ts
export type TaskCreator = 'sistema' | 'agente' | 'humano'

export type TarefaSistemaTipo =
  | 'IMPORTAR_INTIMACOES'
  | 'CRIAR_MINUTA'
  | 'ANALISAR_PRAZO'
  | 'ATUALIZAR_STATUS_PROCESSO'
  | 'ENVIAR_RESUMO_DIARIO'
  | 'CALCULATE_DEADLINE'
  | 'RESEARCH_PRECEDENTS'
  | 'CLIENT_COMMUNICATION'
  | 'CHECK_DATAJUD'
  | 'RISK_ANALYSIS'
  | 'BILLING_ANALYSIS'
  | 'ORGANIZE_FILES'
  | 'COMPLIANCE_CHECK'
  | 'LEGAL_TRANSLATION'
  | 'CONTRACT_REVIEW'
  | 'CASE_STRATEGY'

export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface TarefaSistema {
  id: string
  tipo: TarefaSistemaTipo
  status: TaskStatus
  prioridade: 'baixa' | 'normal' | 'alta' | 'critica'
  processoNumero?: string
  dados: Record<string, any>
  criadoPor: TaskCreator        // NOVO
  criadoEm: string              // ISO
  atualizadoEm: string          // ISO
  startedAt?: string | null
  completedAt?: string | null
  retryCount?: number
  maxRetries?: number
}
```

> **Ação concreta:**
>
> * Atualizar tipo em `src/lib/agents.ts`.
> * Ajustar funções que criam tarefas para preencher `criadoPor`.

---

### 1.2. Retry com backoff exponencial

Na API que processa tarefas (`api/agents.ts` / `process-agent-queue`), criar um helper:

```ts
function calcularAtrasoRetry(retryCount: number, baseMs = 10000, maxMs = 10 * 60 * 1000) {
  const expo = Math.pow(2, retryCount)
  const jitter = Math.random() * 0.3 + 0.85 // 0.85–1.15
  return Math.min(baseMs * expo * jitter, maxMs)
}
```

Ao falhar uma tarefa:

* Incrementar `retryCount`
* Atualizar `status` → `queued`
* Agendar o próximo processamento somente após `now + atraso`.

Se estiver usando KV simples, você pode guardar o campo `nextRunAt`:

```ts
interface TarefaSistema {
  // ...
  retryCount?: number
  maxRetries?: number
  nextRunAt?: string // ISO
}
```

No loop do cron:

* Buscar só tarefas com `status = 'queued'` e `nextRunAt <= agora`.

---

### 1.3. Timeout de tarefa e recuperação de “zumbi”

Adicionar um **timeout padrão**:

* Exemplo: se `status = 'processing'` e `startedAt` > 10min atrás → considerar travada.

No cron `process-agent-queue`:

```ts
function detectarTarefasTravadas(tarefas: TarefaSistema[]): TarefaSistema[] {
  const limiteMs = 10 * 60 * 1000
  const agora = Date.now()
  return tarefas.filter(t => 
    t.status === 'processing' &&
    t.startedAt &&
    (agora - new Date(t.startedAt).getTime()) > limiteMs
  )
}
```

Ação ao encontrar travadas:

* Logar erro
* Marcar `status = 'failed'` OU reenfileirar com `retryCount++` e `nextRunAt` calculado.

---

# 🤖 FASE 2 – Evolução dos Agentes de IA

### 🎯 Objetivo

Transformar seus agentes em **componentes totalmente confiáveis**: entrada e saída validadas, persona clara e restrições bem definidas – mas **sem matar a autonomia**.

---

### 2.1. Tipos centrais de agente

```ts
export type AgentId =
  | 'analise_intimacao'
  | 'classificacao_acao'
  | 'redacao_peticoes'
  | 'resumo_diario'
  | 'sugestao_andamentos'
  | 'risk_analysis'
  | 'contract_review'
  | 'case_strategy'

export interface AgentDefinition {
  id: AgentId
  nome: string
  description: string
  capabilities: string[]
  // humanReviewTypes já existe hoje
}
```

Atualizar `DEFAULT_AGENTS` para ter **descrições mais específicas**, por exemplo:

```ts
{
  id: 'redacao_peticoes',
  nome: 'Agente de Redação de Petições',
  description: 'Especialista em petições cíveis e trabalhistas em MG, focado em linguagem formal, clareza e aderência às práticas dos tribunais TJMG, TRT3 e TRF6.',
  capabilities: ['draft_petition', 'improve_text', 'formalize', 'summarize']
}
```

---

### 2.2. Schemas Zod para entrada/saída

Criar um arquivo `src/lib/agent-schemas.ts`:

```ts
import { z } from 'zod'

export const DraftPetitionInputSchema = z.object({
  processNumber: z.string(),
  court: z.string().optional(),
  type: z.enum(['peticao_inicial', 'contestacao', 'recurso', 'manifestacao']),
  summary: z.string(),
  expedienteId: z.string().optional(),
})

export const DraftPetitionOutputSchema = z.object({
  draftHtml: z.string(),
  confidence: z.number().min(0).max(1),
  templateId: z.string().optional(),
  variaveis: z.record(z.string(), z.string()).optional(),
})
```

Na chamada do agente (API):

```ts
const parsedInput = DraftPetitionInputSchema.parse(task.dados)

const llmResult = await chamarModeloIA(...)

const parsedOutput = DraftPetitionOutputSchema.parse(llmResult)

// salvar parsedOutput com segurança
```

> Isso garante que **nenhum lixo** vindo da IA quebre sua pipeline.

---

### 2.3. Filtro inteligente por agente (sem “nível de autonomia”)

Adicionar funções helpers, por exemplo:

```ts
function isOutputConfiavelPeticao(out: z.infer<typeof DraftPetitionOutputSchema>): boolean {
  if (out.confidence < 0.7) return false
  if (!out.draftHtml || out.draftHtml.length < 500) return false
  return true
}
```

No fluxo do agente:

```ts
if (!isOutputConfiavelPeticao(parsedOutput)) {
  // tentar regenerar, ajustar prompt ou marcar tarefa como "precisa revisão"
}
```

Aqui o robô **continua 100% autônomo**, mas com filtros claros.

---

# 🧠 FASE 3 – Memória Jurídica & Operacional

### 🎯 Objetivo

Transformar o sistema em algo que **aprende com a prática do escritório**: o que funciona, o que não funciona, como vocês de fato peticionam.

---

### 3.1. Modelo de “winning templates”

Nova tabela/coleção (pode ser KV, Postgres ou Firestore):

```ts
export interface WinningTemplate {
  id: string
  templateId: string        // referencia documento base
  tipo: 'peticao' | 'recurso' | 'manifestacao' | 'contrato'
  area: 'civel' | 'trabalhista' | 'previdenciario' | 'outro'
  court?: string
  vara?: string
  sucesso: boolean          // ex: decisão favorável / bom resultado
  observacoes?: string
  criadoEm: string
}
```

O objetivo não é ser perfeito no começo, mas ter **onde guardar**:
“essa combinação de modelo + tese + tribunal → foi boa”.

---

### 3.2. Banco de precedentes / jurisprudências

Outra estrutura:

```ts
export interface PrecedentRecord {
  id: string
  tribunal: string
  classeProcessual?: string
  tema: string
  ementa: string
  fundamentosPrincipais: string
  linkFonte?: string
  tags: string[]
  criadoEm: string
}
```

Os agentes de redação / pesquisa podem:

* consultar isso antes de montar a minuta
* sugerir precedentes usados em petições

---

### 3.3. Feedback loop de minutas

Quando você (ou alguém do escritório) mexer numa minuta, você pode registrar:

```ts
export type RevisaoHumana =
  | 'aprovado_sem_edicao'
  | 'ajustado'
  | 'rejeitado'

export interface MinutaFeedback {
  id: string
  minutaId: string
  agenteId?: AgentId
  templateId?: string
  processoNumero?: string
  revisaoHumana: RevisaoHumana
  comentario?: string
  criadoEm: string
}
```

Na UI (painel Tiptap / Minutas):

* Ao clicar **Aprovar**, salvar `revisaoHumana = 'aprovado_sem_edicao'`.
* Ao alterar texto, salvando e aprovando: `revisaoHumana = 'ajustado'`.
* Ao descartar: `rejeitado`.

No futuro, isso alimenta:

* Ajuste de prompts
* Escolha automática de templates melhores
* Estatísticas reais de performance da IA.

---

# 🛡️ FASE 4 – Auto-monitoramento, filtros e failsafes

### 🎯 Objetivo

Fazer o sistema **se cuidar sozinho**: detectar fila travada, agente bugado, problema de modelo, tudo com filtros, sem virar manual.

---

### 4.1. Watchdog de fila

Novo cron job (ou ampliar `process-agent-queue`):

* Ler todas as tarefas `queued` e `processing`.
* Calcular:

  * tamanho total da fila
  * tarefas com muito tempo em `processing`
  * tarefas com muitos retries.

Se algo passar de limite (ex.: fila > 200 tarefas, ou 3+ tarefas travadas):

* registrar log de alta severidade
* disparar e-mail / WhatsApp.

---

### 4.2. Contador de falhas por agente

Criar um KV/tabela:

```ts
export interface AgentFailureStats {
  agentId: AgentId
  falhasRecentes: number
  ultimaFalhaEm?: string
}
```

Sempre que uma tarefa falhar:

* incrementar contador para aquele agente
* se `falhasRecentes` passar de limiar (ex.: 5 falhas em 10min):

  * marcar agente como “degradado”
  * pausar novas tarefas desse agente temporariamente
  * enviar alerta

---

### 4.3. Fallback entre modelos de IA

Na função central que chama modelo:

```ts
async function callLLMWithFallback(payload: any) {
  try {
    return await callPrimaryModel(payload) // ex.: OpenAI
  } catch (err) {
    // checar se é erro de quota/rate/temporário
    if (isTemporaryIAError(err)) {
      return await callSecondaryModel(payload) // ex.: Gemini ou Spark
    }
    throw err
  }
}
```

E tudo isso plugado na camada de validação Zod + filtros inteligentes.

---

### 4.4. Auditoria mais rica

Expandir logs de tarefas:

```ts
export interface AgentTaskAuditLog {
  id: string
  tarefaId: string
  agenteId: AgentId
  inputResumo: string      // NÃO precisa ser o prompt bruto, pode ser resumo
  outputResumo: string
  confianca?: number
  revisaoHumana?: RevisaoHumana
  criadoEm: string
}
```

> Isso alimenta tanto análise posterior quanto ferramentas de observabilidade.

---

# ✏️ FASE 5 – Minutas + Tiptap + Fluxo Jurídico

### 🎯 Objetivo

Fechar o ciclo: **intimação → tarefa → minuta → revisão → aprovação → registro em memória**.

---

### 5.1. Modelo `Minuta`

Consolidar algo nessa linha (ajustando ao que você já tem):

```ts
export type MinutaTipo =
  | 'peticao'
  | 'contrato'
  | 'parecer'
  | 'recurso'
  | 'procuracao'
  | 'outro'

export type MinutaStatus =
  | 'rascunho'
  | 'em-revisao'
  | 'pendente-revisao'
  | 'finalizada'
  | 'arquivada'

export interface Minuta {
  id: string
  titulo: string
  processId?: string
  tipo: MinutaTipo
  conteudo: string           // HTML do Tiptap
  status: MinutaStatus
  criadoEm: string
  atualizadoEm: string
  autor: string
  googleDocsId?: string
  googleDocsUrl?: string
  criadoPorAgente?: boolean
  agenteId?: AgentId
  templateId?: string
  expedienteId?: string
  variaveis?: Record<string, string>
}
```

---

### 5.2. Fluxo padrão da minuta (automático)

1. DJEN → novo expediente.
2. Agente analisa → decide “precisa contestar / manifestar / recorrer”.
3. Cria `TarefaSistema` do tipo `CRIAR_MINUTA`.
4. Agente de redação gera minuta → salva como `Minuta` com:

   * `criadoPorAgente: true`
   * `status: 'pendente-revisao'`
5. UI exibe:

   * lista de minutas com tag `[Agente]`
   * botão **Revisar** abre Tiptap.
6. Humano ajusta (ou não) e clica **Aprovar** →

   * `status = 'finalizada'`
   * registra `MinutaFeedback` (`aprovado_sem_edicao` / `ajustado` / `rejeitado`).

---

### 5.3. Tiptap + IA + variáveis

No componente da minuta:

* Tiptap recebe `conteudo` inicial.
* Toolbar tem botões de IA:

  * Expandir
  * Resumir
  * Formalizar
  * Corrigir

As variáveis do template (`{{processo.numero}}`, `{{autor.nome}}` etc.) podem ser:

* protegidas em spans não editáveis
* ou re-injetadas no backend antes do protocolo.

---

# 📚 FASE 6 – Documentação & Prompts para IA (VS Code)

### 🎯 Objetivo

Dar para a IA do VS Code um “manifesto” claro do sistema, para que ela **não invente moda** nem quebre o app.

---

### 6.1. Criar `docs/ARQUITETURA.md`

Com seções:

* Visão geral (DJEN, tarefas, agentes, minutas, Tiptap).
* Task Engine (tipos, status, prioridades).
* Agentes (lista, personas, responsabilidades).
* Memória (onde e o quê é armazenado).
* Monitoramento (status, crons, alertas).

Você pode usar esse próprio plano como base.

---

### 6.2. Criar `docs/PROMPT_DEV.md`

Um prompt fixo para colar na IA do VS Code, algo como:

```text
Você está modificando o projeto Assistente Jurídico P.

Regras:
- NÃO remover o Task Engine nem a fila de agent-tasks.
- NÃO quebrar a tipagem de Minuta, Expediente, AgentTask.
- Manter integração com DJEN, DataJud e Tiptap.
- Toda nova funcionalidade deve:
  - usar TarefaSistema quando envolver automação,
  - respeitar os schemas Zod de entrada/saída dos agentes,
  - registrar logs estruturados.

Objetivo principal:
- Aumentar automação jurídica 24/7 com segurança,
- Usando filtros inteligentes e validação, nunca tornando o sistema manual.
```

Esse arquivo vira o “cinto de segurança” contra sugestões malucas da IA.

---

## 🔚 Fechando o plano

Se você seguir essas 6 fases, o resultado é:

* Task Engine robusto
* Agentes tipados, validados e com filtro inteligente
* Memória jurídica que aprende com a prática do escritório
* Sistema que se monitora, se corrige e te avisa quando realmente precisa
* Minutas geradas e geridas de ponta a ponta com Tiptap + IA
* Documentação e prompts que orientam qualquer futura IA (Copilot, VS Code, etc.) a **evoluir sem destruir** o que já está pronto.

Na prática, esse plano já é meio caminho andado para o “Assistente Jurídico P – Versão Robô Sênior 24/7”.

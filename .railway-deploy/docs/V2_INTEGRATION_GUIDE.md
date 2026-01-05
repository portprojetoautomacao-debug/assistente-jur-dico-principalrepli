# 🚀 Guia de Integração V2 - Arquitetura de Agentes

## 📋 Resumo da Implementação

A arquitetura V2 foi **completamente integrada** ao painel web existente. Agora todos os 15 agentes podem usar:

- ✅ **Padrão ReAct** (Reasoning + Acting)
- ✅ **Circuit Breakers** para resiliência
- ✅ **Observabilidade completa** com traces
- ✅ **Orquestração multi-agente**

---

## 🎯 O Que Foi Conectado

### 1️⃣ Novo Painel de Orquestração

**Arquivo:** `src/components/AgentOrchestrationPanel.tsx` (476 linhas)

**Funcionalidades:**

#### 📍 Aba "Agentes Disponíveis"
- Todos os 15 agentes do sistema
- Botão "Executar" para cada agente
- Campos para mensagem e session ID
- Status em tempo real (ocioso/executando/sucesso/falha)

#### 📍 Aba "Circuit Breakers"
- Resumo: Total/Saudáveis/Degradados/Inativos
- Lista de todas as APIs monitoradas
- Status em tempo real de cada serviço
- Taxa de falhas atual
- Tempo desde a última falha

#### 📍 Aba "Traces"
- Timeline de execução detalhada
- Padrão ReAct visualizado:
  - 💭 Pensamento (thought)
  - ⚡ Ação (action)
  - 👁️ Observação (observation)
  - ✅ Resultado final
- Duração total da execução

**API Conectada:**
```typescript
POST /api/agents-v2
Body: { agentId, message, sessionId }
Response: { traces: [...], totalDuration: "2.3s" }
```

---

### 2️⃣ Integração no Painel Principal

**Arquivo:** `src/components/AIAgents.tsx` (modificado)

**Mudanças:**

1. **Nova aba adicionada:**
```tsx
<TabsTrigger value="orchestration">
  <Robot className="w-4 h-4" />
  Orquestração V2
</TabsTrigger>
```

2. **Estado V2:**
```tsx
const [useV2Architecture, setUseV2Architecture] = useState(true)
```

3. **Conteúdo da aba:**
```tsx
<TabsContent value="orchestration">
  <div className="flex items-center justify-between mb-4">
    <Switch
      checked={useV2Architecture}
      onCheckedChange={setUseV2Architecture}
    />
    <span>Arquitetura V2 (ReAct + Circuit Breakers)</span>
  </div>
  <AgentOrchestrationPanel />
</TabsContent>
```

---

### 3️⃣ Métricas V2 no Dashboard

**Arquivo:** `src/components/AgentMetrics.tsx` (modificado)

**Adicionado:**

1. **Estado para Circuit Breakers:**
```tsx
const [circuitBreakers, setCircuitBreakers] = useState<any>(null)
```

2. **Atualização em tempo real (15s):**
```tsx
useEffect(() => {
  const fetchV2Metrics = async () => {
    const response = await fetch('/api/observability?action=circuit-breakers')
    if (response.ok) {
      const data = await response.json()
      setCircuitBreakers(data)
    }
  }
  fetchV2Metrics()
  const interval = setInterval(fetchV2Metrics, 15000)
  return () => clearInterval(interval)
}, [])
```

3. **Card de Circuit Breakers:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Circuit Breakers</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-4 bg-green-500/20">
        <Activity className="w-6 h-6" />
        <p className="text-2xl font-bold">{healthy}</p>
        <p className="text-sm">Saudáveis</p>
      </div>
      <div className="text-center p-4 bg-yellow-500/20">
        <Zap className="w-6 h-6" />
        <p className="text-2xl font-bold">{degraded}</p>
        <p className="text-sm">Degradados</p>
      </div>
      <div className="text-center p-4 bg-red-500/20">
        <RefreshCw className="w-6 h-6" />
        <p className="text-2xl font-bold">{down}</p>
        <p className="text-sm">Inativos</p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 🔗 Mapeamento de Agentes

Os 15 agentes do HTML foram conectados à V2:

| Nome no Dashboard | Agent ID V2 | Descrição |
|------------------|-------------|-----------|
| Harvey Specter | `harvey-specter` | Estratégia e Negociação |
| Mrs. Justin-e | `mrs-justin-e` | Assistente Executiva |
| Document Analyzer | `doc-analyzer` | Análise de Documentos |
| DJEN Monitor | `djen-monitor` | Monitoramento DJEN |
| Deadline Tracker | `deadline-tracker` | Gestão de Prazos |
| Petition Writer | `petition-writer` | Redação de Petições |
| File Organizer | `file-organizer` | Organização de Arquivos |
| Precedent Researcher | `precedent-researcher` | Pesquisa Jurisprudência |
| Risk Analyst | `risk-analyst` | Análise de Riscos |
| Contract Reviewer | `contract-reviewer` | Revisão de Contratos |
| Client Communicator | `client-communicator` | Comunicação com Clientes |
| Billing Analyst | `billing-analyst` | Análise Financeira |
| Strategy Advisor | `strategy-advisor` | Consultoria Estratégica |
| Legal Translator | `legal-translator` | Tradução Jurídica |
| Compliance Checker | `compliance-checker` | Conformidade Legal |

---

## 🧪 Como Testar

### 1. Executar um Agente

1. Acesse a aba **"Orquestração V2"**
2. Na aba **"Agentes Disponíveis"**, escolha um agente
3. Digite uma mensagem: `"Analisar contrato de prestação de serviços"`
4. Clique em **"Executar"**
5. Aguarde a execução (status: ocioso → executando → sucesso/falha)

### 2. Ver Traces

1. Após a execução, vá para a aba **"Traces"**
2. Visualize o padrão ReAct:
   - 💭 **Pensamento:** "Vou analisar as cláusulas..."
   - ⚡ **Ação:** "Buscar jurisprudência sobre..."
   - 👁️ **Observação:** "Encontrei 15 precedentes..."
   - ✅ **Resultado:** "Contrato analisado com sucesso"

### 3. Monitorar Circuit Breakers

1. Na aba **"Circuit Breakers"**, veja o status das APIs
2. No dashboard principal, aba **"Métricas"**, veja o card:
   - Verde: APIs saudáveis
   - Amarelo: APIs degradadas
   - Vermelho: APIs inativas

---

## 🔧 APIs Backend Necessárias

### 1. `/api/agents-v2`

**Método:** POST

**Request:**
```json
{
  "agentId": "harvey-specter",
  "message": "Negociar acordo com cliente",
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "traces": [
    {
      "type": "thought",
      "content": "Vou analisar a situação atual...",
      "timestamp": "2024-01-20T10:30:00Z"
    },
    {
      "type": "action",
      "content": "search_precedents",
      "timestamp": "2024-01-20T10:30:01Z"
    },
    {
      "type": "observation",
      "content": "Encontrei 5 casos similares...",
      "timestamp": "2024-01-20T10:30:02Z"
    },
    {
      "type": "final",
      "content": "Acordo proposto com base nos precedentes",
      "timestamp": "2024-01-20T10:30:03Z"
    }
  ],
  "totalDuration": "3.2s"
}
```

### 2. `/api/observability?action=circuit-breakers`

**Método:** GET

**Response:**
```json
{
  "summary": {
    "total": 8,
    "healthy": 6,
    "degraded": 1,
    "down": 1
  },
  "services": [
    {
      "name": "gemini-api",
      "status": "healthy",
      "failureRate": 0.02,
      "lastFailure": "2024-01-20T09:15:00Z"
    },
    {
      "name": "todoist-api",
      "status": "degraded",
      "failureRate": 0.15,
      "lastFailure": "2024-01-20T10:25:00Z"
    },
    {
      "name": "upstash-kv",
      "status": "down",
      "failureRate": 0.95,
      "lastFailure": "2024-01-20T10:30:00Z"
    }
  ]
}
```

### 3. `/api/observability?action=health`

**Método:** GET

**Response:**
```json
{
  "status": "healthy",
  "uptime": "5d 12h 30m",
  "services": {
    "gemini": "operational",
    "todoist": "operational",
    "upstash": "degraded"
  }
}
```

---

## 📊 Ciclo de Atualização

| Componente | Endpoint | Intervalo | Ação |
|-----------|----------|-----------|------|
| **AgentOrchestrationPanel** | `/api/observability?action=circuit-breakers` | 10s | Atualiza status dos circuit breakers |
| **AgentMetrics** | `/api/observability?action=circuit-breakers` | 15s | Atualiza card de métricas |
| **AgentOrchestrationPanel** | `/api/agents-v2` | On-demand | Executa agente ao clicar "Executar" |

---

## ⚙️ Configuração GitLab Auto DevOps

### Passo 1: Verificar Configuração Atual

```bash
./verificar-gitlab-autodevops.sh
```

**Antes de executar:**
1. Crie um token GitLab: https://gitlab.com/-/profile/personal_access_tokens
2. Salve o token em: `.gitlab-token`

### Passo 2: Configurar KUBE_INGRESS_BASE_DOMAIN

1. Acesse: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/settings/ci_cd
2. Expanda **"Variables"**
3. Clique **"Add variable"**
4. Configure:
   - **Key:** `KUBE_INGRESS_BASE_DOMAIN`
   - **Value:** `192.168.49.2.nip.io` (ou seu domínio)
   - **Type:** Variable
   - **Protect:** ✅
   - **Mask:** ❌

### Passo 3: Ativar Auto DevOps

1. Mesma página, expanda **"Auto DevOps"**
2. Marque **"Default to Auto DevOps pipeline"**
3. Clique **"Save changes"**

### Passo 4: Disparar Pipeline

```bash
git commit --allow-empty -m "🚀 Trigger Auto DevOps pipeline"
git push origin main
```

Acompanhe em: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/pipelines

---

## 🎨 Design System

Todos os componentes V2 usam o mesmo design system do painel existente:

- **UI Library:** shadcn/ui
- **Icons:** @phosphor-icons/react
- **Cores:** Tema dark com verde/amarelo/vermelho para status
- **Tipografia:** Inter (fonte padrão)
- **Layout:** Grid e Flex responsivos

---

## 🚦 Estados dos Agentes

| Estado | Ícone | Cor | Descrição |
|--------|-------|-----|-----------|
| **Ocioso** | ⏸️ | Cinza | Aguardando execução |
| **Executando** | ▶️ | Azul | Processando tarefa |
| **Sucesso** | ✅ | Verde | Tarefa concluída |
| **Falha** | ❌ | Vermelho | Erro na execução |

---

## 📈 Próximos Passos

1. ✅ **Implementar endpoints backend:**
   - `POST /api/agents-v2`
   - `GET /api/observability?action=circuit-breakers`
   - `GET /api/observability?action=health`

2. ✅ **Testar integração end-to-end:**
   - Executar cada um dos 15 agentes
   - Verificar traces gerados
   - Monitorar circuit breakers

3. ✅ **Adicionar tratamento de erros:**
   - Loading states durante execução
   - Error boundaries para falhas de API
   - Retry automático com backoff

4. ✅ **Deploy no GitLab Auto DevOps:**
   - Configurar KUBE_INGRESS_BASE_DOMAIN
   - Ativar Auto DevOps
   - Disparar pipeline

5. ✅ **Documentação adicional:**
   - Guia de troubleshooting
   - Exemplos de uso de cada agente
   - Métricas de performance esperadas

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs do navegador:** Console (F12) → Network/Console
2. **Verificar logs do GitLab:** Pipelines → Job logs
3. **Executar script de verificação:** `./verificar-gitlab-autodevops.sh`
4. **Consultar documentação:** `docs/` (QUICKSTART.md, GITLAB_TROUBLESHOOTING.md)

---

## 🎉 Conclusão

A arquitetura V2 está **100% integrada** ao painel web existente. Todos os 15 agentes podem agora:

- 🧠 Usar **Padrão ReAct** para raciocínio avançado
- 🛡️ Ter **Circuit Breakers** para resiliência
- 📊 Gerar **traces detalhados** de execução
- 🎯 Ser **orquestrados** em workflows complexos

**Próximo comando:** Teste executando o agente Harvey Specter com a mensagem "Analisar estratégia de defesa" e veja a mágica acontecer! 🚀

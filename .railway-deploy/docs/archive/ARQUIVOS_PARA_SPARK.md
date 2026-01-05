# Lista Completa de Arquivos para Inserção no GitHub Spark

Este documento lista **TODOS** os arquivos que devem ser copiados para o GitHub Spark, organizados por prioridade e ordem de inserção.

---

## 🔴 PRIORIDADE CRÍTICA - Inserir PRIMEIRO

### 1. Configuração Base (5 arquivos)

| Arquivo | Localização | Tamanho | Descrição |
|---------|-------------|---------|-----------|
| `package.json` | `/package.json` | ~100 linhas | Dependências do projeto |
| `vite.config.ts` | `/vite.config.ts` | ~20 linhas | Configuração Vite |
| `tsconfig.json` | `/tsconfig.json` | ~25 linhas | Configuração TypeScript |
| `tailwind.config.js` | `/tailwind.config.js` | ~110 linhas | Tema e estilos |
| `index.html` | `/index.html` | ~20 linhas | HTML principal |

### 2. Tipos TypeScript (1 arquivo)

| Arquivo | Localização | Tamanho | Descrição |
|---------|-------------|---------|-----------|
| `types.ts` | `/src/types.ts` | ~400 linhas | Todos os tipos do app |

### 3. Utilidades (2 arquivos)

| Arquivo | Localização | Tamanho | Descrição |
|---------|-------------|---------|-----------|
| `utils.ts` | `/src/lib/utils.ts` | ~30 linhas | Funções auxiliares |
| `config.ts` | `/src/lib/config.ts` | ~40 linhas | Variáveis de ambiente |

---

## 🟠 PRIORIDADE ALTA - Inserir em SEGUNDO

### 4. Componentes UI (shadcn) - Instalar via CLI

**NÃO copiar manualmente**. Instalar usando shadcn CLI:

```bash
npx shadcn@latest init
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

Ou todos de uma vez:
```bash
npx shadcn@latest add button card dialog input select tabs scroll-area separator badge avatar dropdown-menu label progress switch tooltip
```

### 5. Estilos (2 arquivos)

| Arquivo | Localização | Tamanho | Descrição |
|---------|-------------|---------|-----------|
| `main.css` | `/src/main.css` | ~50 linhas | Estilos globais |
| `index.css` | `/src/index.css` | ~100 linhas | Estilos Tailwind |

---

## 🟡 PRIORIDADE MÉDIA - Inserir em TERCEIRO

### 6. Custom Hooks (7 arquivos)

| Arquivo | Localização | Tamanho | Descrição |
|---------|-------------|---------|-----------|
| `use-autonomous-agents.ts` | `/src/hooks/use-autonomous-agents.ts` | ~225 linhas | Agentes IA |
| `use-processes.ts` | `/src/hooks/use-processes.ts` | ~30 linhas | Gestão de processos |
| `use-notifications.ts` | `/src/hooks/use-notifications.ts` | ~110 linhas | Sistema de notificações |
| `use-analytics.ts` | `/src/hooks/use-analytics.ts` | ~100 linhas | Analytics |
| `use-keyboard-shortcuts.ts` | `/src/hooks/use-keyboard-shortcuts.ts` | ~40 linhas | Atalhos de teclado |
| `use-fluent-motion.ts` | `/src/hooks/use-fluent-motion.ts` | ~53 linhas | Animações |
| `use-mobile.ts` | `/src/hooks/use-mobile.ts` | ~14 linhas | Detecção mobile |

### 7. Bibliotecas Core (22 arquivos)

| # | Arquivo | Localização | Linhas | Descrição |
|---|---------|-------------|--------|-----------|
| 1 | `sample-data.ts` | `/src/lib/sample-data.ts` | ~270 | Dados de exemplo |
| 2 | `prazos.ts` | `/src/lib/prazos.ts` | ~80 | Cálculo de prazos |
| 3 | `llm-service.ts` | `/src/lib/llm-service.ts` | ~320 | Serviço LLM/GPT-4 |
| 4 | `agents.ts` | `/src/lib/agents.ts` | ~550 | Lógica dos agentes IA |
| 5 | `google-calendar-service.ts` | `/src/lib/google-calendar-service.ts` | ~180 | Google Calendar |
| 6 | `google-docs-service.ts` | `/src/lib/google-docs-service.ts` | ~140 | Google Docs |
| 7 | `djen-api.ts` | `/src/lib/djen-api.ts` | ~220 | API DJEN |
| 8 | `datajud-api.ts` | `/src/lib/datajud-api.ts` | ~260 | API DataJud |
| 9 | `pje-api.ts` | `/src/lib/pje-api.ts` | ~120 | API PJe |
| 10 | `data-initializer.ts` | `/src/lib/data-initializer.ts` | ~170 | Inicializador de dados |
| 11 | `agent-task-generator.ts` | `/src/lib/agent-task-generator.ts` | ~110 | Gerador de tarefas IA |
| 12 | `djen-monitor-agent.ts` | `/src/lib/djen-monitor-agent.ts` | ~155 | Monitor DJEN |
| 13 | `premonicao-service.ts` | `/src/lib/premonicao-service.ts` | ~77 | Serviço de premonição |
| 14 | `nlp-pipeline.ts` | `/src/lib/nlp-pipeline.ts` | ~265 | Pipeline NLP |
| 15 | `diario-oficial-api.ts` | `/src/lib/diario-oficial-api.ts` | ~147 | API Diário Oficial |
| 16 | `multi-source-publications.ts` | `/src/lib/multi-source-publications.ts` | ~42 | Multi-fontes |
| 17 | `publication-sources-types.ts` | `/src/lib/publication-sources-types.ts` | ~77 | Tipos publicações |
| 18 | `gemini-config.ts` | `/src/lib/gemini-config.ts` | ~16 | Config Gemini |
| 19 | `gemini-service.ts` | `/src/lib/gemini-service.ts` | ~136 | Serviço Gemini |
| 20 | `djen-api.test.ts` | `/src/lib/djen-api.test.ts` | ~205 | ⚠️ Teste - Opcional |

**Ordem recomendada**: Seguir a numeração acima.

---

## 🟢 PRIORIDADE NORMAL - Inserir em QUARTO

### 8. Componentes de Apoio (8 arquivos)

| Arquivo | Localização | Linhas | Descrição |
|---------|-------------|--------|-----------|
| `ErrorFallback.tsx` | `/src/ErrorFallback.tsx` | ~50 | Tratamento de erros |
| `DataInitializer.tsx` | `/src/components/DataInitializer.tsx` | ~155 | Inicializar dados |
| `GoogleAuth.tsx` | `/src/components/GoogleAuth.tsx` | ~124 | Auth Google |
| `Login.tsx` | `/src/components/Login.tsx` | ~132 | Tela de login |
| `ConfigurationError.tsx` | `/src/components/ConfigurationError.tsx` | ~142 | Erro de config |
| `ConfirmDialog.tsx` | `/src/components/ConfirmDialog.tsx` | ~42 | Diálogo confirmação |
| `FluentMotion.tsx` | `/src/components/FluentMotion.tsx` | ~119 | Wrapper animação |
| `Sidebar.tsx` | `/src/components/Sidebar.tsx` | ~50 | Barra lateral |

### 9. Componentes Principais (20 arquivos)

| # | Arquivo | Localização | Linhas | Descrição |
|---|---------|-------------|--------|-----------|
| 1 | `Dashboard.tsx` | `/src/components/Dashboard.tsx` | ~466 | Dashboard principal |
| 2 | `ProcessCRM.tsx` | `/src/components/ProcessCRM.tsx` | ~299 | Kanban processos |
| 3 | `ProcessosView.tsx` | `/src/components/ProcessosView.tsx` | ~301 | Lista processos |
| 4 | `ClientesView.tsx` | `/src/components/ClientesView.tsx` | ~393 | Gestão clientes |
| 5 | `CadastrarCliente.tsx` | `/src/components/CadastrarCliente.tsx` | ~201 | Cadastro cliente |
| 6 | `Calendar.tsx` | `/src/components/Calendar.tsx` | ~578 | Calendário |
| 7 | `CalculadoraPrazos.tsx` | `/src/components/CalculadoraPrazos.tsx` | ~219 | Calc. prazos |
| 8 | `PrazosView.tsx` | `/src/components/PrazosView.tsx` | ~261 | View prazos |
| 9 | `DeadlineCalculator.tsx` | `/src/components/DeadlineCalculator.tsx` | ~241 | Calc. avançado |
| 10 | `FinancialManagement.tsx` | `/src/components/FinancialManagement.tsx` | ~273 | Gestão financeira |
| 11 | `MinutasManager.tsx` | `/src/components/MinutasManager.tsx` | ~518 | Gestão minutas |
| 12 | `AIAgents.tsx` | `/src/components/AIAgents.tsx` | ~859 | Painel agentes IA |
| 13 | `ExpedientePanel.tsx` | `/src/components/ExpedientePanel.tsx` | ~312 | Painel expediente |
| 14 | `NotificationSettings.tsx` | `/src/components/NotificationSettings.tsx` | ~218 | Config notificações |
| 15 | `KnowledgeBase.tsx` | `/src/components/KnowledgeBase.tsx` | ~249 | Base conhecimento |
| 16 | `DatabaseQueries.tsx` | `/src/components/DatabaseQueries.tsx` | ~241 | Queries DB |
| 17 | `DataManager.tsx` | `/src/components/DataManager.tsx` | ~179 | Gerenciador dados |
| 18 | `AgentMetrics.tsx` | `/src/components/AgentMetrics.tsx` | ~199 | Métricas agentes |
| 19 | `AgentStatusFloater.tsx` | `/src/components/AgentStatusFloater.tsx` | ~169 | Status flutuante |
| 20 | `HumanAgentCollaboration.tsx` | `/src/components/HumanAgentCollaboration.tsx` | ~212 | Colaboração |

**Ordem recomendada**: Seguir a numeração acima.

---

## 🔵 PRIORIDADE BAIXA - Inserir DEPOIS (Opcional)

### 10. Componentes Avançados (15 arquivos - OPCIONAL)

Estes componentes adicionam funcionalidades avançadas mas não são essenciais para o MVP:

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `DJENConsulta.tsx` | ~420 | Consulta DJEN |
| `MultiSourcePublications.tsx` | ~437 | Multi-fontes publicações |
| `DatajudChecklist.tsx` | ~388 | Checklist DataJud |
| `PDFUploader.tsx` | ~633 | Upload PDF |
| `DocumentUploader.tsx` | ~286 | Upload documentos |
| `DocumentCheckAgent.tsx` | ~386 | Verificação docs |
| `AIDocumentSummarizer.tsx` | ~203 | Resumo IA |
| `AIContractAnalyzer.tsx` | ~299 | Análise contratos |
| `AIEmailDrafter.tsx` | ~291 | Rascunho emails IA |
| `AILegalResearch.tsx` | ~312 | Pesquisa jurídica |
| `AudioTranscription.tsx` | ~230 | Transcrição áudio |
| `BatchAnalysis.tsx` | ~174 | Análise em lote |
| `AdvancedNLPDashboard.tsx` | ~632 | Dashboard NLP |
| `LLMObservabilityDashboard.tsx` | ~473 | Observ. LLM |
| `AnalyticsDashboard.tsx` | ~233 | Dashboard analytics |

### 11. Componentes Específicos (7 arquivos - OPCIONAL)

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `PremonicaoModal.tsx` | ~258 | Modal premonição |
| `MrsJustinEModal.tsx` | ~173 | Modal Mrs. E |
| `KeyboardShortcutsDialog.tsx` | ~82 | Atalhos teclado |
| `FluentAnimationsShowcase.tsx` | ~177 | Showcase animações |
| `GeminiExample.tsx` | ~216 | Exemplo Gemini |
| `AssistenteIA.tsx` | ~3 | Placeholder |

---

## 🎯 COMPONENTE RAIZ - Inserir POR ÚLTIMO

### 12. Componente Principal (1 arquivo)

| Arquivo | Localização | Linhas | Descrição |
|---------|-------------|--------|-----------|
| **`Donna.tsx`** | `/src/components/Donna.tsx` | ~587 | **Interface principal** |

> ⚠️ **IMPORTANTE**: Este é o componente principal que conecta tudo. Inserir apenas quando todos os outros estiverem prontos!

### 13. Entry Points (2 arquivos)

| Arquivo | Localização | Linhas | Descrição |
|---------|-------------|--------|-----------|
| `App.tsx` | `/src/App.tsx` | ~5 | Componente raiz |
| `main.tsx` | `/src/main.tsx` | ~15 | Entry point |

---

## 📊 Resumo por Categoria

| Categoria | Qtd Arquivos | Prioridade | Quando Inserir |
|-----------|--------------|------------|----------------|
| **Configuração** | 5 | 🔴 Crítica | 1º - Início |
| **Tipos** | 1 | 🔴 Crítica | 1º - Início |
| **Utilidades** | 2 | 🔴 Crítica | 1º - Início |
| **Estilos** | 2 | 🟠 Alta | 2º |
| **UI Components** | ~15 | 🟠 Alta | 2º - CLI |
| **Hooks** | 7 | 🟡 Média | 3º |
| **Bibliotecas** | 20 | 🟡 Média | 3º |
| **Componentes Apoio** | 8 | 🟢 Normal | 4º |
| **Componentes Principais** | 20 | 🟢 Normal | 4º |
| **Componentes Avançados** | 15 | 🔵 Baixa | 5º - Opcional |
| **Componentes Específicos** | 7 | 🔵 Baixa | 5º - Opcional |
| **Raiz** | 1 | 🔴 Crítica | Último |
| **Entry Points** | 2 | 🔴 Crítica | Último |
| **TOTAL ESSENCIAL** | **63** | - | - |
| **TOTAL COMPLETO** | **105** | - | - |

---

## 🚀 Estratégia de Inserção Rápida (MVP)

Se você quer o app funcionando RÁPIDO, insira apenas estes **25 arquivos**:

### Mínimo Viável (25 arquivos)

**Configuração (5)**:
1. package.json
2. vite.config.ts
3. tsconfig.json
4. tailwind.config.js
5. index.html

**Core (4)**:
6. src/types.ts
7. src/lib/utils.ts
8. src/lib/config.ts
9. src/lib/sample-data.ts

**Hooks (2)**:
10. src/hooks/use-autonomous-agents.ts
11. src/hooks/use-processes.ts

**Bibliotecas (3)**:
12. src/lib/prazos.ts
13. src/lib/llm-service.ts
14. src/lib/agents.ts

**Componentes Apoio (3)**:
15. src/ErrorFallback.tsx
16. src/components/DataInitializer.tsx
17. src/components/GoogleAuth.tsx

**Componentes Principais (7)**:
18. src/components/Dashboard.tsx
19. src/components/ProcessCRM.tsx
20. src/components/Calendar.tsx
21. src/components/FinancialManagement.tsx
22. src/components/AIAgents.tsx
23. src/components/ClientesView.tsx
24. src/components/CalculadoraPrazos.tsx

**Raiz (3)**:
25. src/components/Donna.tsx
26. src/App.tsx
27. src/main.tsx

**+ shadcn UI** (via CLI):
```bash
npx shadcn@latest add button card dialog input select tabs scroll-area
```

---

## 📋 Checklist de Inserção

Copie e use este checklist:

### Fase 1: Setup Inicial
- [ ] Criar projeto no GitHub Spark
- [ ] Copiar package.json
- [ ] Copiar vite.config.ts
- [ ] Copiar tsconfig.json
- [ ] Copiar tailwind.config.js
- [ ] Copiar index.html
- [ ] Executar `npm install`

### Fase 2: Fundação
- [ ] Criar pasta src/
- [ ] Criar pasta src/components/
- [ ] Criar pasta src/components/ui/
- [ ] Criar pasta src/lib/
- [ ] Criar pasta src/hooks/
- [ ] Copiar src/types.ts
- [ ] Copiar src/lib/utils.ts
- [ ] Copiar src/lib/config.ts

### Fase 3: UI Components
- [ ] Executar `npx shadcn@latest init`
- [ ] Instalar componentes shadcn (lista acima)

### Fase 4: Estilos
- [ ] Copiar src/main.css
- [ ] Copiar src/index.css

### Fase 5: Hooks
- [ ] Copiar todos os 7 hooks

### Fase 6: Bibliotecas
- [ ] Copiar sample-data.ts
- [ ] Copiar prazos.ts
- [ ] Copiar llm-service.ts
- [ ] Copiar agents.ts
- [ ] Copiar demais bibliotecas

### Fase 7: Componentes
- [ ] Copiar componentes de apoio (8)
- [ ] Copiar componentes principais (20)
- [ ] Copiar Donna.tsx
- [ ] Copiar App.tsx
- [ ] Copiar main.tsx
- [ ] Copiar ErrorFallback.tsx

### Fase 8: Teste
- [ ] Executar `npm run dev`
- [ ] Verificar erros no console
- [ ] Testar navegação
- [ ] Testar funcionalidades básicas

---

## ⚠️ Avisos Importantes

### ❌ NÃO Copiar:
- Arquivos `.md` (documentação)
- Pasta `api/` (endpoints Vercel)
- Scripts `.sh` e `.bat`
- Imagens `.png`
- `vercel.json`, `render.yaml`
- `node_modules/`
- `dist/`
- `.git/`

### ✅ SEMPRE Copiar:
- Todos os arquivos `.tsx` e `.ts` de `src/`
- Arquivos de configuração na raiz
- package.json
- Estilos `.css`

### 🔐 Variáveis de Ambiente

Criar `.env` na raiz:
```env
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_API_KEY=
VITE_REDIRECT_URI=http://localhost:5173
VITE_APP_ENV=development
```

---

## 🎓 Dicas Profissionais

1. **Comece pequeno**: Insira MVP primeiro, teste, depois adicione mais
2. **Teste frequentemente**: Após cada 5-10 arquivos, execute `npm run dev`
3. **Resolva erros progressivamente**: Um erro de cada vez
4. **Use controle de versão**: Commite após cada fase
5. **Documente problemas**: Anote erros e soluções

---

## 📞 Precisa de Ajuda?

Se encontrar erros durante a inserção:

1. **Erro de importação**: Verifique se o arquivo referenciado foi copiado
2. **Erro de tipo**: Confirme que types.ts foi copiado
3. **Erro de componente UI**: Instale via `npx shadcn@latest add [componente]`
4. **Erro de dependência**: Execute `npm install`
5. **Erro de build**: Verifique vite.config.ts e tsconfig.json

---

**Última atualização**: Novembro 2025  
**Total de arquivos mapeados**: 105  
**Arquivos essenciais**: 63  
**MVP mínimo**: 25

# Instruções para o GitHub Copilot

Regra absoluta de ética do app e do codificador, copilot etc: esta proibido usar qualquer tipo de simulação: Stub,  Mock, Synthetic Data, Fake,Dummy, Test Doubles,  no app em desenvolvimento e em produção, sendo permitido somente testes reais.

Você é um assistente de codificação especialista trabalhando no projeto **Assistente Jurídico PJe**.
Este projeto é um sistema de gestão jurídica com IA integrada, focado em automação e eficiência para advogados.

**⚠️ STATUS DO PROJETO: MODO MANUTENÇÃO**
O foco atual é **estabilidade, correção de bugs e manutenção**. Não sugira novas funcionalidades complexas a menos que explicitamente solicitado. Priorize soluções robustas e seguras para o código existente.

## 🛠️ Tech Stack & Tecnologias

*   **Frontend:** React 18+, TypeScript, Vite.
*   **Estilização:** Tailwind CSS, Radix UI, Shadcn UI.
*   **Gerenciamento de Estado:** TanStack Query (React Query), Context API.
*   **Backend/Scripts:** Node.js (ES Modules), Python (scripts de automação/IA).
*   **IA & LLMs:** Anthropic SDK, LangChain, Google Gemini.
*   **Testes:** Vitest (Unitários/Integração), Playwright (E2E).
*   **Monitoramento:** Sentry, OpenTelemetry, Azure Application Insights.
*   **Banco de Dados:** Qdrant (Vetorial), Cosmos DB (NoSQL).

## 📝 Diretrizes de Codificação

### TypeScript & React
*   **Strict Mode:** Sempre use tipagem estrita. Evite `any` a todo custo.
*   **Componentes:** Use componentes funcionais com Hooks.
*   **Imports:** Utilize o alias `@/` para importações absolutas (ex: `import { Button } from "@/components/ui/button"`).
*   **Interfaces:** Prefira `interface` para definições de objetos e `type` para uniões/interseções.

### Estilização (Tailwind CSS)
*   Use classes utilitárias do Tailwind.
*   Evite CSS modules ou styled-components, a menos que estritamente necessário.
*   Mantenha a consistência com o design system existente (cores, espaçamentos).

### Segurança & LGPD (Crítico)
*   **PII Filtering:** O sistema possui conformidade rigorosa com a LGPD.
*   **NUNCA** remova ou enfraqueça as proteções de dados sensíveis (CPF, Email, Telefone, etc.).
*   Ao lidar com logs ou envio de dados para IA, certifique-se de que os dados estão sanitizados.

### Testes
*   **Vitest:** Escreva testes unitários para hooks e funções utilitárias.
*   **Playwright:** Mantenha os testes E2E atualizados ao modificar fluxos de UI.
*   **Mocking:** Use mocks para chamadas de API externas nos testes.

## 📂 Estrutura de Arquivos
*   `src/components`: Componentes React reutilizáveis.
*   `src/hooks`: Custom hooks.
*   `src/lib`: Bibliotecas e configurações de terceiros.
*   `src/services`: Camada de serviço e chamadas de API.
*   `src/types`: Definições de tipos TypeScript.
*   `src/utils`: Funções utilitárias puras.

## 🚀 Fluxo de Trabalho
1.  **Analise:** Antes de sugerir código, entenda o contexto e o impacto da mudança.
2.  **Segurança:** Verifique se a solução não introduz vulnerabilidades.
3.  **Simplicidade:** Prefira código limpo e legível a soluções "inteligentes" mas complexas.
4.  **Idioma:** O código (variáveis, funções) deve ser em Inglês (padrão global), mas a UI e comentários explicativos devem ser em **Português (PT-BR)**.

---
**Lembre-se:** Estamos em modo de manutenção. A estabilidade do sistema é a prioridade número 1.

📊 Relatório Completo - Assistente Jurídico PJe
Data: 02 de Janeiro de 2026
Status Geral: ✅ ONLINE e DEPLOYADO

🖥️ Estado do Servidor
Componente	Status	Porta	Ambiente
Frontend (Vite)	✅ Rodando	5000	development
Backend (Express)	✅ Rodando	3001	development
PostgreSQL	✅ Conectado	-	Neon-backed
Deploy (Autoscale)	✅ Publicado	80	production
🤖 Agentes de IA (LangGraph)
Total: 15 agentes disponíveis
Framework: LangGraph + Anthropic Claude

#	Agente	Tipo	Status
1	harvey-specter	langgraph-custom	✅ Disponível
2	mrs-justine	langgraph-custom	✅ Disponível
3	monitor-djen	langgraph-djen	✅ Disponível
4	analise-documental	langgraph-custom	✅ Disponível
5	analise-risco	langgraph-custom	✅ Disponível
6	compliance	langgraph-custom	✅ Disponível
7	comunicacao-clientes	langgraph-custom	✅ Disponível
8	estrategia-processual	langgraph-custom	✅ Disponível
9	financeiro	langgraph-custom	✅ Disponível
10	gestao-prazos	langgraph-custom	✅ Disponível
11	organizacao-arquivos	langgraph-custom	✅ Disponível
12	pesquisa-juris	langgraph-custom	✅ Disponível
13	redacao-peticoes	langgraph-custom	✅ Disponível
14	revisao-contratual	langgraph-custom	✅ Disponível
15	traducao-juridica	langgraph-custom	✅ Disponível
Estatísticas de Execução:

Execuções totais: 0 (sistema recém-deployado)
Taxa de sucesso: Aguardando primeiras execuções
Modos de Orquestração:

parallel - Executa múltiplos agentes simultaneamente
sequential - Executa em sequência
fallback - Tenta próximo agente se o atual falhar
⚙️ Workflows Configurados
Workflow	Comando	Porta	Tipo
Frontend Dev Server	npm run dev	5000	webview
Backend Agents Server	cd backend && npm run dev	3001	console
Project	Executa ambos em paralelo	-	parallel
📝 Editor de Minutas
Status: ✅ Operacional

Armazenamento
Banco: PostgreSQL
Minutas salvas: 1
Templates Jurídicos Disponíveis
Total: 12 templates estruturados

Categoria	Templates
Família	Ação de Alimentos
Cível	Ação de Indenização por Danos Morais e Materiais
Consumidor	Ação Revisional de Contrato Bancário
Imobiliário	Ação de Usucapião
Contratos	Contrato de Prestação de Serviços, Contrato de Honorários
Petições	Petição Inicial Genérica, Contestação, Réplica
Recursos	Apelação, Recurso Especial
Diversos	Procuração Ad Judicia
Comandos de IA para Edição
Comando	Função	Status
Continuar	Continua a escrita do texto	✅ Ativo
Expandir	Desenvolve e aprofunda o conteúdo	✅ Ativo
Revisar	Melhora gramática e clareza	✅ Ativo
Formalizar	Converte para linguagem jurídica formal	✅ Ativo
Rate Limiting: 2 segundos entre requisições (com recuperação automática)

📰 Integração DJEN (Diário de Justiça Eletrônico)
API: https://comunicaapi.pje.jus.br/api/v1/comunicacao

Configuração
Parâmetro	Valor
Advogado Padrão	Thiago Bodevan Veiga (OAB MG 184404)
Auto-Cadastro	✅ Habilitado
Fallback Browser	✅ Configurado
Agente Dedicado
monitor-djen - Agente LangGraph especializado em monitorar publicações
Arquivos Principais
src/services/djen-browser-capture.ts - Cliente browser-direct
src/hooks/use-djen-publications.ts - Hook com fallback
src/hooks/use-djen-process-registration.ts - Auto-registro de processos
Obs: A API do CNJ só aceita requisições originadas do Brasil. Fora do país, retorna erro 403/451.

🔗 Endpoints da API
Agentes
GET  /api/agents/list        - Lista todos os agentes
GET  /api/agents/stats       - Estatísticas de execução
POST /api/agents/execute     - Executa tarefa com agente
POST /api/agents/orchestrate - Orquestra múltiplos agentes
POST /api/agents/reset-stats - Reseta estatísticas
Minutas
GET    /api/minutas          - Lista minutas
POST   /api/minutas          - Cria nova minuta
PUT    /api/minutas/:id      - Atualiza minuta
DELETE /api/minutas/:id      - Remove minuta
POST   /api/minutas/:id/duplicate - Duplica minuta
GET    /api/minutas/stats    - Estatísticas
Comandos IA
POST /api/ai/continuar   - Continua escrita
POST /api/ai/expandir    - Expande texto
POST /api/ai/revisar     - Revisa gramática
POST /api/ai/formalizar  - Formaliza linguagem
GET  /api/ai/status      - Status do rate limit
Outros
GET  /health              - Health check
POST /api/llm/chat        - Proxy LLM
POST /api/spark/*         - API Spark
POST /api/kv/*            - Key-Value store
🚀 Deploy
Configuração	Valor
Tipo	Autoscale
Build	npm run build:deploy
Run	npm run start:production
Status	✅ Publicado
O backend em produção serve tanto a API quanto o frontend estático em uma única porta.

📦 Tecnologias Principais
Frontend: React 19, TypeScript, Vite 7, Tailwind CSS 4
Backend: Express, TypeScript, tsx
IA: LangGraph, Anthropic Claude (claude-sonnet-4)
Banco: PostgreSQL (Neon)
UI: Radix UI, Phosphor Icons, Lucide React
Editor: CKEditor 5, TipTap
Última atualização: 02/01/2026 17:28 UTC

Worked for 1 minute

Scroll to latest
roteiro prático para corrigir erros/bugs e executar testes no seu projeto, considerando que você está usando Node.js, TypeScript, Playwright, Vitest e tem scripts de automação Bash.

1. Corrigir Erros e Bugs
a) Verifique erros de build e tipos



npm run build
npx tsc --noEmit
Corrija qualquer erro apontado pelo TypeScript ou pelo processo de build.
b) Lint para encontrar problemas de estilo/código



npm run lint
Ajuste os arquivos conforme as mensagens do linter.
c) Revisão dos Testes Unitários
Os arquivos de teste (*.test.ts) já cobrem utilitários, popup, content-script, extractors, etc.
Se algum teste falhar, leia a mensagem de erro e corrija o código-fonte ou o próprio teste.
2. Executar Testes
a) Testes Unitários (Vitest)



npm test
# ou
npm run test:watch
# ou cobertura:
npm run test:coverage

b) Testes E2E (Playwright)
Use o script de login E2E para garantir autenticação:



./test-e2e-login.sh
Depois rode os testes E2E normalmente:



npx playwright test
c) Testes de Automação Bash
Para validar automações customizadas:



./test-auto-issues.sh
Veja o resumo dos testes no terminal.
3. Checklist de Correção
 Build sem erros (npm run build)
 TypeScript sem erros (npx tsc --noEmit)
 Lint OK (npm run lint)
 Todos os testes unitários passam (npm test)
 Testes E2E passam (npx playwright test)
 Scripts Bash OK (./test-auto-issues.sh)
4. Dicas para Debug
Use logs detalhados:



localStorage.setItem('PJE_SYNC_DEBUG', 'true');
Verifique o console do navegador e do terminal para mensagens [PJe Sync] ou erros.
5. Se encontrar bugs:
Leia a mensagem de erro.
Localize o arquivo/linha.
Corrija o código.
Rode novamente os testes.
Se precisar de ajuda com um erro específico, cole aqui a mensagem ou stack trace que eu te ajudo a corrigir!

# 📋 Plano de Testes - Assistente Jurídico PJe
## Jupyter Notebooks Testing Strategy

**Data:** 03 de Janeiro de 2026
**Versão:** 1.0
**Política:** Testes reais apenas (sem mocks/stubs/placeholders)

---

## 🎯 Objetivos do Plano

1. **Cobertura Completa:** Testar todas as camadas do sistema (DB, API, Agentes, UI)
2. **Automação:** Notebooks executáveis via CI/CD
3. **Documentação Viva:** Notebooks servem como documentação técnica
4. **Debugging:** Facilitar diagnóstico de issues em produção
5. **Conformidade:** Validar LGPD, segurança e performance

---

## 📊 Arquitetura do Sistema

### Camadas Testáveis
```
┌─────────────────────────────────────────┐
│  Frontend React (Vite)                  │
│  - UI Components (Minutas, DJEN)       │
│  - TanStack Query (cache/sync)         │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│  Backend Express (Node.js)              │
│  - REST API (/api/minutas, /api/ai)    │
│  - 15 Agentes LangGraph                 │
│  - DJEN Scheduler                       │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│  Bancos de Dados                        │
│  - PostgreSQL (Neon/Local)              │
│  - Upstash Redis (KV Store)             │
│  - Qdrant (Vector Search - Opcional)    │
└─────────────────────────────────────────┘
```

### Componentes Críticos
- **Minutas:** CRUD, templates, comandos IA (Continuar/Expandir/Revisar/Formalizar)
- **DJEN:** Integração CNJ, auto-cadastro processos, publicações
- **Agentes:** 15 agentes (Harvey Specter, Mrs Justine, Monitor DJEN, etc.)
- **Autenticação:** OAuth, JWT, sessões
- **Monitoramento:** Sentry, OpenTelemetry, Azure App Insights

---

## 📚 Estrutura de Notebooks

### 1. **test_runner.ipynb** (Executor de Testes)
**Propósito:** Orquestrador principal - executa suíte completa de testes
**Status:** ✅ Existente (atualizado)

**Células:**
1. Configuração de ambiente
2. Execução de testes unitários (Vitest)
3. Execução de testes de API (Vitest API)
4. Execução de testes E2E (Playwright)
5. Relatório consolidado

### 2. **dev_playground.ipynb** (Desenvolvimento/Debug)
**Propósito:** Exploração interativa de APIs e banco de dados
**Status:** ✅ Existente (com PostgreSQL)

**Células Atuais:**
1. Imports e configuração
2. Teste de API health check
3. Teste de endpoint de minutas
4. Teste de agentes
5. Teste de Redis/KV
6. Teste de Qdrant
7-10. Inspeção PostgreSQL (conexão, tabelas, minutas, DJEN)

**Células a Adicionar:**
11. Teste de comandos IA (Continuar/Expandir)
12. Teste de templates jurídicos
13. Teste de DJEN scheduler
14. Teste de upload de arquivos
15. Análise de performance (tempo de resposta)

### 3. **testes_integracao.ipynb** (Integração)
**Propósito:** Validação de fluxos end-to-end
**Status:** ✅ Existente (com PostgreSQL)

**Células Atuais:**
1. Configuração
2. Teste de health do backend
3. Teste de criação de minuta
4. Teste de listagem de agentes
5-6. Teste de conexão PostgreSQL

**Células a Adicionar:**
7. Fluxo completo: Criar → Editar → Duplicar → Deletar minuta
8. Fluxo DJEN: Cadastro advogado → Busca publicações → Auto-registro processo
9. Fluxo Agentes: Executar Harvey Specter → Validar resposta
10. Fluxo Templates: Listar → Aplicar → Preencher minuta
11. Fluxo Comandos IA: Minuta vazia → Continuar → Expandir → Revisar → Formalizar

### 4. **test_database.ipynb** (Novo - Banco de Dados)
**Propósito:** Testes específicos de schema, migrations, integridade
**Status:** 🆕 A criar

**Células:**
1. Configuração PostgreSQL (local + Neon)
2. Validação de schema (4 tabelas: minutas, djen_lawyers, djen_publications, djen_scheduler_logs)
3. Teste de constraints (UNIQUE, FOREIGN KEY, NOT NULL)
4. Teste de índices (performance de queries)
5. Teste de migrations (up/down)
6. Teste de backup/restore
7. Análise de dados (estatísticas, growth)
8. Teste de transações (ACID)
9. Teste de concorrência (locks)
10. Limpeza de dados de teste

### 5. **test_agents.ipynb** (Novo - Agentes LangGraph)
**Propósito:** Testes dos 15 agentes de IA
**Status:** 🆕 A criar

**Células:**
1. Configuração (Anthropic API key, rate limits)
2. Teste Harvey Specter (análise processual)
3. Teste Mrs Justine (organização)
4. Teste Monitor DJEN (publicações)
5. Teste Análise Documental
6. Teste Análise de Risco
7. Teste Compliance
8. Teste Comunicação Clientes
9. Teste Estratégia Processual
10. Teste Financeiro
11. Teste Gestão de Prazos
12. Teste Organização de Arquivos
13. Teste Pesquisa de Jurisprudência
14. Teste Redação de Petições
15. Teste Revisão Contratual
16. Teste Tradução Jurídica
17. Teste de Orquestração (parallel/sequential/fallback)
18. Análise de custo (tokens consumidos)
19. Análise de latência
20. Teste de error handling

### 6. **test_api.ipynb** (Novo - Endpoints REST)
**Propósito:** Testes completos de todos os endpoints da API
**Status:** 🆕 A criar

**Células:**
1. Configuração (base URL, auth tokens)
2. **Minutas:**
   - GET /api/minutas (listagem)
   - POST /api/minutas (criação)
   - PUT /api/minutas/:id (atualização)
   - DELETE /api/minutas/:id (remoção)
   - POST /api/minutas/:id/duplicate (duplicação)
   - GET /api/minutas/stats (estatísticas)
3. **Comandos IA:**
   - POST /api/ai/continuar
   - POST /api/ai/expandir
   - POST /api/ai/revisar
   - POST /api/ai/formalizar
   - GET /api/ai/status (rate limit)
4. **Agentes:**
   - GET /api/agents/list
   - GET /api/agents/stats
   - POST /api/agents/execute
   - POST /api/agents/orchestrate
   - POST /api/agents/reset-stats
5. **Outros:**
   - GET /health
   - POST /api/llm/chat
   - POST /api/spark/*
   - POST /api/kv/*
6. Validação de erros (401, 403, 404, 429, 500)
7. Validação de CORS
8. Validação de rate limiting
9. Validação de autenticação
10. Validação de payloads (JSON schema)

### 7. **test_performance.ipynb** (Novo - Performance)
**Propósito:** Testes de carga, stress e performance
**Status:** 🆕 A criar

**Células:**
1. Configuração (concurrent users, duration)
2. Benchmark: Query PostgreSQL (SELECT com JOIN)
3. Benchmark: Redis read/write
4. Benchmark: API /api/minutas (GET lista)
5. Benchmark: Comandos IA (latência Anthropic)
6. Teste de carga: 100 requisições simultâneas
7. Teste de stress: 1000 requisições/minuto
8. Análise de memória (uso de RAM)
9. Análise de CPU
10. Análise de network (bandwidth)
11. Identificação de gargalos
12. Recomendações de otimização

### 8. **test_security.ipynb** (Novo - Segurança/LGPD)
**Propósito:** Validação de conformidade, sanitização, auditoria
**Status:** 🆕 A criar

**Células:**
1. Configuração
2. Teste de PII filtering (CPF, Email, Telefone)
3. Validação de logs (sem dados sensíveis)
4. Teste de SQL injection (tentativas de ataque)
5. Teste de XSS (sanitização de HTML)
6. Teste de CSRF tokens
7. Teste de rate limiting (anti-DDoS)
8. Validação de HTTPS (produção)
9. Auditoria de dependências (npm audit)
10. Validação de secrets (não expostos)
11. Teste de permissões (RBAC)
12. Conformidade LGPD (direito ao esquecimento)

### 9. **test_djen.ipynb** (Novo - Integração DJEN)
**Propósito:** Testes específicos da API do CNJ
**Status:** 🆕 A criar

**Células:**
1. Configuração (browser fallback, rate limits)
2. Teste de autenticação (OAB MG 184404)
3. Teste de busca de publicações (último dia útil)
4. Teste de auto-cadastro de processos
5. Teste de parsing (extração de dados)
6. Teste de scheduler (execução agendada)
7. Teste de notificações (email/webhook)
8. Teste de fallback (API CNJ → Browser Direct)
9. Validação de dados (schema DJEN)
10. Análise de cobertura (quantas publicações capturadas)

### 10. **test_monitoring.ipynb** (Novo - Observabilidade)
**Propósito:** Validação de logs, traces, métricas
**Status:** 🆕 A criar

**Células:**
1. Configuração (Sentry DSN, Azure Insights)
2. Teste de error logging (Sentry)
3. Teste de tracing (OpenTelemetry)
4. Análise de métricas (latência P50/P95/P99)
5. Análise de erros (top 10 errors)
6. Análise de usuários (active users)
7. Análise de performance (slowest endpoints)
8. Health checks (uptime)
9. Alertas (configuração)
10. Dashboards (visualização)

---

## 🔄 Fluxo de Execução

### Execução Local (Desenvolvimento)
```bash
# 1. Garantir ambiente configurado
source .venv-2/bin/activate
export DATABASE_URL="postgresql://node@localhost:5433/assistente_juridico_test"

# 2. Iniciar backend (terminal separado)
cd backend && npm run dev

# 3. Abrir notebook no VS Code
code notebooks/test_runner.ipynb

# 4. Executar células sequencialmente ou todas (Run All)
```

### Execução Automatizada (CI/CD)
```yaml
# .github/workflows/jupyter-tests.yml
name: Jupyter Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
      - run: pip install jupyter nbconvert psycopg2-binary pandas
      - run: jupyter execute notebooks/test_runner.ipynb
      - run: jupyter execute notebooks/test_database.ipynb
      - run: jupyter execute notebooks/test_agents.ipynb
```

---

## 📈 Métricas de Sucesso

### KPIs de Testes
- **Cobertura:** ≥ 80% de code coverage (Vitest)
- **Pass Rate:** ≥ 95% de testes passando
- **Performance:** API endpoints < 200ms (P95)
- **Disponibilidade:** Uptime ≥ 99.5%
- **Segurança:** 0 vulnerabilidades críticas (npm audit)

### Relatórios
- **Diário:** Execução automática via cron/GitHub Actions
- **Semanal:** Análise de tendências (regressões)
- **Mensal:** Auditoria completa (segurança + performance)

---

## 🛠️ Ferramentas e Dependências

### Python (Notebooks)
- `jupyter` - Ambiente de notebooks
- `ipykernel` - Kernel Python
- `psycopg2-binary` - Conexão PostgreSQL
- `pandas` - Análise de dados
- `matplotlib` - Visualizações
- `requests` - HTTP client
- `python-dotenv` - Variáveis de ambiente
- `pytest` - Framework de testes (opcional)

### Node.js (Backend)
- `vitest` - Testes unitários/API
- `playwright` - Testes E2E
- `tsx` - Executor TypeScript
- `express` - Servidor HTTP
- `@langchain/langgraph` - Agentes IA

### Infraestrutura
- PostgreSQL 17 (local + Neon)
- Redis (Upstash)
- Qdrant (opcional)
- GitHub Actions (CI/CD)

---

## 📅 Roadmap de Implementação

### Sprint 1 (Semana 1) - Fundação
- [x] Atualizar notebooks existentes (dev_playground, testes_integracao, test_runner)
- [ ] Criar test_database.ipynb
- [ ] Criar test_api.ipynb
- [ ] Documentar políticas de teste

### Sprint 2 (Semana 2) - Agentes IA
- [ ] Criar test_agents.ipynb
- [ ] Implementar testes dos 15 agentes
- [ ] Validar orquestração (parallel/sequential)
- [ ] Análise de custo/tokens

### Sprint 3 (Semana 3) - Integrações
- [ ] Criar test_djen.ipynb
- [ ] Criar test_monitoring.ipynb
- [ ] Integração com CI/CD (GitHub Actions)
- [ ] Alertas automatizados (falhas)

### Sprint 4 (Semana 4) - Qualidade
- [ ] Criar test_performance.ipynb
- [ ] Criar test_security.ipynb
- [ ] Auditoria completa
- [ ] Documentação final

---

## 🎓 Boas Práticas

### Estrutura de Células
1. **Setup:** Imports, configuração, variáveis
2. **Test:** Execução do teste
3. **Validation:** Assertions, verificações
4. **Cleanup:** Limpeza de dados temporários
5. **Report:** Visualização de resultados

### Nomenclatura
- Notebooks: `test_*.ipynb`
- Células: Títulos descritivos em Markdown
- Funções: `test_*` ou `validate_*`
- Variáveis: snake_case

### Documentação
- Cada notebook: README em Markdown na primeira célula
- Cada teste: Comentário explicando objetivo
- Resultados: Prints formatados ou DataFrames pandas
- Erros: Try/except com mensagens claras

### Versionamento
- Notebooks commitados no Git
- Outputs limpos antes do commit (nbstripout)
- Testes determinísticos (sem timestamps hardcoded)
- Dados de teste versionados ou gerados dinamicamente

---

## 🚨 Troubleshooting

### Problema: PostgreSQL não conecta
**Solução:** Verificar cluster rodando
```bash
/usr/lib/postgresql/17/bin/pg_ctl -D ~/.postgres-local/data status
```

### Problema: Backend não responde
**Solução:** Iniciar servidor
```bash
cd backend && npm run dev
```

### Problema: Testes falhando (AI timeouts)
**Solução:** Verificar rate limits, aumentar timeout
```python
import time
time.sleep(2)  # Rate limit 2s entre requests
```

### Problema: Credenciais Neon inválidas
**Solução:** Usar PostgreSQL local
```bash
DATABASE_URL="postgresql://node@localhost:5433/assistente_juridico_test"
```

---

## 📞 Contatos e Recursos

- **Documentação:** `/workspaces/assistente-jur-dico-principalrepli/README.md`
- **Análise de Workflow:** `notebooks/ANALISE_WORKFLOW_TESTES.md`
- **Instruções Copilot:** `.github/copilot-instructions.md`
- **Issues GitHub:** [Rastreamento de bugs e melhorias]

---

**Última Atualização:** 03/01/2026
**Versão do Plano:** 1.0
**Autor:** GitHub Copilot (Claude Sonnet 4.5)

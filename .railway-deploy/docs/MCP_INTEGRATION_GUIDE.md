# 🔗 Integração de MCP Servers - Assistente Jurídico PJe

## 📋 Visão Geral

O projeto utiliza **5 MCP Servers** integrados para fornecer contexto completo ao GitHub Copilot:

| MCP Server | Função Principal | Status |
|------------|------------------|--------|
| **Serena** | Busca semântica e análise de código | ✅ Ativo |
| **GitHub** | Gestão de repos, issues, PRs | ✅ Ativo |
| **Sentry** | Monitoramento de erros e performance | ✅ Ativo |
| **Playwright** | Automação de testes E2E | ✅ Ativo |
| **ChromeDevTools** | Debug e performance | ✅ Ativo |

---

## 🎯 Cenários de Integração

### Cenário 1: Investigação de Bug em Produção

**Objetivo:** Investigar erro reportado no Sentry e corrigir no código

**Workflow:**

```
1. @sentry Liste erros recentes do agente Mrs. Justin-e

   Retorna: Stack trace, frequência, usuários afetados

2. @workspace Mostre código do agente Mrs. Justin-e

   Serena retorna: src/agents/justine/*, src/lib/real-agent-client.ts

3. @workspace Como este agente calcula prazos processuais?

   Serena explica: Lógica de cálculo de prazos

4. [Identificar causa raiz e corrigir]

5. @github Criar issue: "Bug no cálculo de prazos - Mrs. Justin-e"

6. [Commitar correção]

7. @github Criar PR com a correção linkando à issue
```

**Tempo Estimado:** 15-30 minutos  
**Antes (sem MCP):** 1-2 horas

---

### Cenário 2: Implementar Nova Feature com Testes

**Objetivo:** Adicionar novo hook validated com testes E2E

**Workflow:**

```
1. @workspace Mostre estrutura de hooks validated existentes

   Serena retorna: use-processes-validated.ts, use-expedientes-validated.ts

2. @workspace Qual schema Zod usar para hook de clientes?

   Serena sugere: Baseado em src/types.ts

3. [Implementar novo hook use-clientes-validated.ts]

4. @workspace Quais componentes devem usar este hook?

   Serena identifica: ClientList.tsx, ClientForm.tsx

5. @playwright Gerar testes E2E para ClientList

   Playwright MCP cria: tests/e2e/client-list.spec.ts

6. @github Verificar se há issues relacionadas a clientes

   GitHub MCP lista: Issues abertas sobre gestão de clientes

7. [Executar testes]

8. @github Criar PR: "feat: Hook validated para gestão de clientes"
```

**Tempo Estimado:** 30-45 minutos  
**Antes (sem MCP):** 2-3 horas

---

### Cenário 3: Análise de Performance

**Objetivo:** Identificar e otimizar componentes lentos

**Workflow:**

```
1. @sentry Mostre métricas de performance da última semana

   Sentry MCP retorna: LCP, FID, CLS, transações lentas

2. @workspace Quais componentes não usam lazy loading?

   Serena identifica: Dashboard.tsx, ProcessList.tsx

3. @chrome Analisar bundle size dos componentes

   ChromeDevTools MCP mostra: Tamanho de cada chunk

4. [Implementar lazy loading nos componentes identificados]

5. @workspace Há código duplicado que posso extrair?

   Serena identifica: Duplicação em hooks de fetching

6. [Refatorar código duplicado]

7. @playwright Criar testes de performance

   Playwright MCP gera: Testes de tempo de carregamento

8. @github Criar PR: "perf: Lazy loading e redução de bundle"
```

**Tempo Estimado:** 45-60 minutos  
**Antes (sem MCP):** 3-4 horas

---

### Cenário 4: Refatoração de Agente IA

**Objetivo:** Migrar agente para usar Sentry AI Monitoring

**Workflow:**

```
1. @workspace Quais agentes ainda não usam Sentry AI Monitoring?

   Serena identifica: 6 agentes sem instrumentação

2. @workspace Mostre exemplos de agentes instrumentados

   Serena retorna: src/lib/real-agent-client.ts (Harvey, Justin-e)

3. @sentry Como configurar AI monitoring para agentes?

   Sentry MCP retorna: Documentação e exemplos

4. [Instrumentar agente selecionado]

5. @workspace Há testes para este agente?

   Serena verifica: tests/agents/

6. @playwright Atualizar testes E2E do agente

7. [Executar testes]

8. @github Criar issue: "Instrumentar agentes restantes com Sentry AI"

9. @github Criar PR: "feat: Sentry AI Monitoring no agente X"
```

**Tempo Estimado:** 30-45 minutos  
**Antes (sem MCP):** 2-3 horas

---

### Cenário 5: Documentação de Feature

**Objetivo:** Documentar nova feature implementada

**Workflow:**

```
1. @workspace Mostre código da feature de sincronização PJe

   Serena retorna: chrome-extension-pje/, api/pje-sync.ts

2. @workspace Como funciona o fluxo de sincronização?

   Serena explica: Content Script → Background → API → Redis

3. @github Liste issues e PRs relacionados a PJe Sync

   GitHub MCP retorna: Histórico de desenvolvimento

4. [Escrever documentação detalhada]

5. @workspace Há exemplos de documentação similares?

   Serena retorna: docs/FLUXO_MINUTAS_AUTOMATICAS.md

6. [Finalizar documentação seguindo padrão existente]

7. @github Criar PR: "docs: Documentação completa do PJe Sync"
```

**Tempo Estimado:** 20-30 minutos  
**Antes (sem MCP):** 1-2 horas

---

## 🔄 Fluxos de Trabalho Diários

### 🌅 Início do Dia

```
1. @sentry Há erros críticos nas últimas 24h?

2. @github Liste PRs pendentes de revisão

3. @workspace Há componentes com erros TypeScript?

4. @chrome Verificar performance do build de ontem
```

### 🔧 Durante o Desenvolvimento

```
1. @workspace [Busca semântica conforme necessidade]

2. @sentry [Monitoramento de erros ao testar]

3. @playwright [Executar testes E2E relevantes]

4. @github [Verificar issues relacionadas]
```

### 🌙 Fim do Dia

```
1. @workspace Há código duplicado nas alterações de hoje?

2. @github Criar PR com resumo das alterações

3. @sentry Verificar se introduzi novos erros

4. @chrome Validar impacto no bundle size
```

---

## 📊 Comandos de Integração Comuns

### Combinação Serena + GitHub

```
@workspace Mostre código relacionado a [feature]
  ↓
@github Liste issues abertas sobre [feature]
  ↓
[Trabalhar na correção]
  ↓
@github Criar PR com link para issue
```

### Combinação Serena + Sentry

```
@sentry Mostre erros de [componente]
  ↓
@workspace Mostre código do [componente]
  ↓
[Identificar causa raiz]
  ↓
@workspace Há testes para este componente?
  ↓
[Corrigir e testar]
```

### Combinação Serena + Playwright

```
@workspace Mostre componente [X]
  ↓
@playwright Gerar testes E2E para [X]
  ↓
[Executar testes]
  ↓
@workspace Ajustar código baseado em falhas de teste
```

### Combinação Serena + ChromeDevTools

```
@workspace Quais componentes carregam primeiro?
  ↓
@chrome Analisar ordem de carregamento
  ↓
@workspace Otimizar lazy loading
  ↓
@chrome Validar redução de tempo de carregamento
```

---

## 🛠️ Configuração da Integração

### Arquivo `.vscode/mcp.json`

Configuração atual com os 5 servidores integrados:

```json
{
  "servers": {
    "Serena": {
      "type": "stdio",
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", 
               "start-mcp-server", "serena==latest", 
               "--context", ".", "ide-assistant"]
    },
    "GitHub": {
      "type": "sse",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "${input:github_token}"
      }
    },
    "Sentry": {
      "type": "sse",
      "url": "https://mcp.sentry.dev/sse"
    },
    "Playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "ChromeDevTools": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@0.11.0"]
    }
  }
}
```

---

## 🎓 Melhores Práticas de Integração

### ✅ Faça

1. **Use Serena como ponto de partida** - Sempre comece com busca semântica de código
2. **Combine contextos** - Use múltiplos MCP servers em sequência
3. **Valide com testes** - Sempre use Playwright após alterações
4. **Monitore erros** - Check Sentry antes e depois de deploys
5. **Documente decisões** - Use GitHub para rastrear raciocínio

### ❌ Evite

1. **Pular contexto de código** - Não vá direto para GitHub sem entender o código
2. **Ignorar erros do Sentry** - Sempre verifique impacto em produção
3. **Commits sem testes** - Use Playwright antes de commitar
4. **Performance cega** - Use ChromeDevTools para validar otimizações

---

## 📈 Métricas de Eficiência

### Ganhos de Produtividade por Cenário

| Cenário | Tempo Sem MCP | Tempo Com MCP | Ganho |
|---------|---------------|---------------|-------|
| Investigação de Bug | 1-2h | 15-30min | **75%** |
| Nova Feature + Testes | 2-3h | 30-45min | **73%** |
| Análise de Performance | 3-4h | 45-60min | **75%** |
| Refatoração de Agente | 2-3h | 30-45min | **75%** |
| Documentação | 1-2h | 20-30min | **75%** |

**Ganho Médio:** **~74% de redução de tempo**

---

## 🔧 Troubleshooting da Integração

### ❌ Problema: Servidores não se comunicam

**Sintomas:**
- Comandos `@workspace` não retornam resultados
- Outros MCP servers funcionam, mas Serena não

**Solução:**
```bash
# Reiniciar todos os MCP servers
Ctrl+Shift+P → GitHub Copilot: Restart MCP Servers

# Verificar logs
Ctrl+Shift+P → Output → Selecione "GitHub Copilot Chat"

# Validar configuração
npm run serena:verify
```

### ❌ Problema: Conflito de respostas

**Sintomas:**
- Serena e GitHub retornam informações conflitantes

**Solução:**
- **Priorize Serena para código** - Mais preciso para análise semântica
- **Priorize GitHub para histórico** - Mais completo para contexto de issues/PRs
- **Use Sentry para produção** - Dados reais de erros

### ❌ Problema: Performance lenta

**Sintomas:**
- Respostas levam >30 segundos

**Solução:**
```bash
# Otimizar contexto do Serena
# Editar .vscode/mcp.json:
"args": ["--context", "src"]  # Apenas pasta src/

# Criar .sereneignore
npm run serena:verify  # Cria automaticamente se não existir
```

---

## 📚 Recursos Adicionais

- [Setup do Serena](./SERENA_MCP_SETUP.md)
- [Workflows Específicos](./SERENA_WORKFLOWS.md)
- [Melhores Práticas](./SERENA_BEST_PRACTICES.md)
- [Setup do GitHub MCP](./MCP_SETUP.md)
- [Sentry AI Monitoring](./SENTRY_AI_MONITORING.md)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0.0  
**Mantido por**: Equipe Assistente Jurídico PJe

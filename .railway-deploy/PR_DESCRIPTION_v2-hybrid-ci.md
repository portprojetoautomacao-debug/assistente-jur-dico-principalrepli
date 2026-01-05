# chore(ci): Adicionar análise de UI e requirements DSPy FastAPI

## 🎯 Objetivo

Preparar ambiente para integração DSPy FastAPI e documentar arquitetura completa da UI do aplicativo.

## 📊 Mudanças Implementadas

### ✅ Documentação da UI
- **Arquivo:** `plano ui` (1,006 linhas)
- **Conteúdo:** Análise extremamente detalhada da estrutura da UI
- **Nota:** ⚠️ Precisa ser renomeado para `docs/UI_ANALYSIS.md`

### ✅ Requirements DSPy
- **Arquivo:** `scripts/dspy-requirements.txt`
- **Dependências:**
  - `fastapi>=0.95.0`
  - `uvicorn>=0.23.0`
  - `dspy`

## 📚 Conteúdo da Análise de UI

### Componentes Principais Documentados

**Telas principais:**
- Dashboard.tsx (18.9 KB)
- ProcessCRM.tsx (20.1 KB)
- Calendar.tsx (20.2 KB)
- MinutasManager.tsx (48.6 KB)
- ExpedientePanel.tsx (48.1 KB)

**Agentes de IA:**
- HarveySpecterChat.tsx (Donna - 29 KB)
- AIAgents.tsx (15 agentes - 33.1 KB)
- AgentOrchestrationPanel.tsx
- AgentMetrics.tsx
- AgentStatusFloater.tsx

**Ferramentas:**
- CalculadoraPrazos.tsx (14.3 KB)
- FinancialManagement.tsx (11.2 KB)
- PDFUploader.tsx (25.4 KB)
- GlobalSearch.tsx (14.7 KB)

**UI Base (Shadcn/Radix):**
- 30+ componentes base reutilizáveis
- Design system completo
- Componentes imutáveis

## 💡 Benefícios

- 📚 **Documentação completa** - Mapa de 1,006 linhas de toda a UI
- 🔧 **Base DSPy FastAPI** - Requirements para servidor de otimização de prompts
- 👥 **Onboarding** - Facilita integração de novos desenvolvedores
- 🎯 **Arquitetura clara** - Entendimento da estrutura completa

## ⚠️ Pontos de Atenção

### 🔴 Correções Necessárias Antes do Merge

1. **Renomear arquivo:** `plano ui` → `docs/UI_ANALYSIS.md`
   - Nome atual tem espaço e sem extensão
   - Pode causar problemas em alguns sistemas

2. **Verificar duplicação de requirements:**
   - Projeto já tem `scripts/dspy_bridge.py`
   - Confirmar se requirements não estão duplicados

3. **Rebase com main:**
   - Branch criada antes de otimização de workflows
   - Precisa de rebase (conflitos mínimos detectados)

## 📋 Checklist de Preparação

- [ ] Fazer rebase com main
- [ ] Renomear `plano ui` → `docs/UI_ANALYSIS.md`
- [ ] Verificar duplicação de requirements
- [ ] Atualizar versões de dependências se necessário
- [ ] Criar PR para review
- [ ] Validar que análise de UI está atualizada

## 🔧 Comandos para Preparar

```bash
# 1. Rebase
git checkout feature/v2-hybrid-ci
git rebase main

# 2. Renomear arquivo
git mv "plano ui" docs/UI_ANALYSIS.md

# 3. Commit
git add -A
git commit -m "chore: reorganizar arquivos e preparar para merge"

# 4. Push
git push origin feature/v2-hybrid-ci --force-with-lease
```

## 🔍 Análise de Conflitos

✅ **SEM CONFLITOS CRÍTICOS**

Merge com main será limpo, apenas alguns auto-merges:
- `.env.example` - Adição de VITE_ENABLE_PII_FILTERING
- `.github/badges/ci.json` - Status badge
- `.github/copilot-instructions.md` - Instruções

## ✅ Decisão de Merge

**RECOMENDAÇÃO: ✅ ATUALIZAR E CRIAR PR**

- **Risco:** BAIXO (apenas docs e requirements)
- **Benefício:** ALTO (documentação valiosa)
- **Prioridade:** MÉDIA (não urgente)
- **Esforço:** MÉDIO (rebase + rename + review)

## 📊 Estatísticas

- **Arquivos adicionados:** 2
- **Linhas adicionadas:** 1,009
- **Tipo:** Documentação + Configuração
- **Categoria:** Infraestrutura CI/CD + Docs
- **Reversível:** Sim (100%)

---

**Breaking changes:** Nenhuma
**Dependências:** fastapi, uvicorn, dspy
**Relacionado a:** DSPy Bridge, Arquitetura de Agentes

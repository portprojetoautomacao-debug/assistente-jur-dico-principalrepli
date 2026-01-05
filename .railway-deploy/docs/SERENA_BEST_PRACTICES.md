# 🎯 Melhores Práticas - Serena MCP para Assistente Jurídico PJe

## 📚 Índice
1. [Comandos Semânticos Eficientes](#comandos-semânticos-eficientes)
2. [Otimização de Contexto](#otimização-de-contexto)
3. [Integração com Outros MCP Servers](#integração-com-outros-mcp-servers)
4. [Troubleshooting Comum](#troubleshooting-comum)
5. [Workflows Diários](#workflows-diários)
6. [Segurança e Privacy](#segurança-e-privacy)

---

## 1. 🗣️ Comandos Semânticos Eficientes

### ✅ BOM: Comandos Específicos e Direcionados

```
@workspace Mostre todos os agentes em src/lib/agents.ts que têm status "ativo"
```

**Por quê?** Especifica arquivo, tipo e filtro.

```
@workspace Encontre hooks que usam Zod schema e não têm .safeParse()
```

**Por quê?** Busca padrão específico com contexto de validação.

### ❌ EVITE: Comandos Muito Genéricos

```
@workspace Mostre código
```

**Problema:** Muito vago, pode retornar resultados irrelevantes.

```
@workspace O que faz esse arquivo?
```

**Melhor:** Especificar qual arquivo e qual aspecto analisar.

### 💡 Dicas para Comandos Melhores

1. **Mencione arquivos/pastas quando souber**
   ```
   Em src/hooks/use-processes-validated.ts, mostre o schema Zod
   ```

2. **Use termos técnicos do domínio**
   ```
   Encontre código que interage com API DataJud do CNJ
   ```

3. **Especifique padrões de código**
   ```
   Mostre componentes React que usam lazy loading via React.lazy()
   ```

4. **Combine contexto com ação**
   ```
   No agente Mrs. Justin-e, como ele calcula prazos processuais?
   ```

---

## 2. ⚙️ Otimização de Contexto

### Arquivo `.sereneignore`

Crie `.sereneignore` na raiz do projeto para excluir pastas irrelevantes:

```gitignore
# Dependências
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/

# Cache
.cache/
.turbo/
.vscode/.react/

# Git
.git/

# Logs
*.log
logs/

# Testes (opcional - se quiser focar em código de produção)
**/*.test.ts
**/*.test.tsx
**/*.spec.ts
**/*.spec.tsx

# Documentação (opcional - se já conhece)
docs/
*.md

# Assets estáticos
public/
assets/
```

### Ajuste de Contexto em `.vscode/mcp.json`

**Para Análise Focada em Código de Produção:**

```json
{
  "inputs": [
    {
      "id": "serena_context",
      "default": "src"  // Apenas pasta src/
    }
  ]
}
```

**Para Análise Incluindo API:**

```json
{
  "inputs": [
    {
      "id": "serena_context",
      "default": "src,api"  // src/ e api/
    }
  ]
}
```

**Para Análise Completa (exceto node_modules):**

```json
{
  "inputs": [
    {
      "id": "serena_context",
      "default": "."  // Tudo, mas use .sereneignore
    }
  ]
}
```

---

## 3. 🔗 Integração com Outros MCP Servers

### Combinando Serena + GitHub MCP

**Cenário:** Encontrar issues relacionadas a código específico

```
@workspace Mostre código relacionado a análise de intimações
```

_Serena retorna arquivos relevantes_

```
@github Liste issues abertas sobre análise de intimações
```

_GitHub MCP retorna issues do repositório_

### Combinando Serena + Sentry MCP

**Cenário:** Investigar erros relacionados a agentes

```
@workspace Mostre código do agente Mrs. Justin-e
```

_Serena retorna implementação do agente_

```
@sentry Liste erros recentes do agente Mrs. Justin-e
```

_Sentry MCP retorna erros em produção_

### Combinando Serena + SonarCloud MCP

**Cenário:** Análise de qualidade de código

```
@workspace Mostre componentes com complexidade ciclomática alta
```

_Serena identifica componentes complexos_

```
@sonarqube Liste code smells críticos desses componentes
```

_SonarCloud MCP retorna problemas de qualidade_

---

## 4. 🛠️ Troubleshooting Comum

### ❌ Problema: Serena não responde

**Sintomas:**
- Comandos `@workspace` não retornam resultados
- Timeout em buscas semânticas

**Soluções:**

1. **Verificar logs do MCP Server**
   ```
   Ctrl+Shift+P → Output → Selecione "GitHub Copilot Chat"
   ```

2. **Reiniciar MCP Servers**
   ```
   Ctrl+Shift+P → GitHub Copilot: Restart MCP Servers
   ```

3. **Verificar instalação do uvx**
   ```powershell
   uvx --version
   ```

4. **Limpar cache do uv**
   ```powershell
   uvx cache clean
   ```

### ❌ Problema: Respostas Muito Lentas

**Soluções:**

1. **Reduzir contexto em `.vscode/mcp.json`**
   ```json
   {
     "inputs": [
       { "id": "serena_context", "default": "src" }
     ]
   }
   ```

2. **Criar `.sereneignore` completo** (veja seção 2)

3. **Usar comandos mais específicos** (veja seção 1)

### ❌ Problema: Resultados Irrelevantes

**Soluções:**

1. **Especificar arquivos/pastas**
   ```
   Em src/lib/agents.ts, mostre...
   ```

2. **Usar termos técnicos precisos**
   ```
   Mostre agentes que implementam InvokeAgentSpan
   ```
   
   Em vez de:
   ```
   Mostre agentes com monitoramento
   ```

### ❌ Problema: "uvx command not found"

**Soluções:**

1. **Windows:**
   ```powershell
   # Reinstalar uv
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   
   # Adicionar ao PATH
   $env:Path += ";$env:USERPROFILE\.local\bin"
   ```

2. **Linux/macOS:**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   source $HOME/.cargo/env
   ```

3. **Recarregar VS Code:**
   ```
   Ctrl+Shift+P → Developer: Reload Window
   ```

---

## 5. 📅 Workflows Diários

### 🌅 Início do Dia

1. **Verificar status do sistema**
   ```
   @workspace Há componentes com erros TypeScript?
   ```

2. **Revisar agentes ativos**
   ```
   @workspace Liste agentes ativos com tarefas pendentes
   ```

3. **Verificar integrações**
   ```
   @workspace Mostre status das integrações DJEN, DataJud e PJe
   ```

### 🔍 Durante o Desenvolvimento

1. **Antes de editar um hook**
   ```
   @workspace Mostre o schema Zod e testes do hook use-processes
   ```

2. **Antes de modificar um agente**
   ```
   @workspace Como o agente Harvey interage com Mrs. Justin-e?
   ```

3. **Ao adicionar novo template**
   ```
   @workspace Mostre estrutura de templates existentes
   ```

### 🌙 Fim do Dia

1. **Verificar se há código duplicado**
   ```
   @workspace Há código duplicado nas alterações de hoje?
   ```

2. **Revisar testes**
   ```
   @workspace Quais novos componentes não têm testes?
   ```

3. **Validar documentação**
   ```
   @workspace Há funções públicas sem JSDoc?
   ```

---

## 6. 🔒 Segurança e Privacy

### ⚠️ NÃO Compartilhe

- ❌ Tokens de API (Google, DJEN, DataJud)
- ❌ Segredos em `.env`
- ❌ Dados sensíveis de clientes
- ❌ Credenciais de produção

### ✅ Compartilhe com Serena

- ✅ Código TypeScript/JavaScript
- ✅ Estruturas de schemas Zod
- ✅ Documentação e comentários
- ✅ Configurações públicas

### 🛡️ Proteção de Dados

**Antes de usar comandos que envolvem dados sensíveis:**

```
@workspace Mostre APENAS a estrutura do schema de processos, SEM valores
```

**Em vez de:**

```
@workspace Mostre processos com dados de clientes
```

### 🔐 Configuração de Privacy

**Adicione ao `.sereneignore`:**

```gitignore
# Dados sensíveis
.env
.env.local
.env.production

# Backups com dados
backups/
*.backup
*.dump

# Logs com dados de clientes
logs/
*.log
```

---

## 🎓 Exemplos de Workflows Completos

### Workflow 1: Adicionar Novo Agente IA

```
1. @workspace Mostre estrutura de agentes existentes em src/lib/agents.ts

2. @workspace Como agentes usam Sentry AI Monitoring?

3. [Criar novo agente baseado nos exemplos]

4. @workspace Verifique se há erros TypeScript no novo agente

5. @workspace Há testes para agentes similares que eu possa adaptar?
```

### Workflow 2: Refatorar Hook para Padrão Validated

```
1. @workspace Mostre hooks validated existentes para referência

2. @workspace Qual schema Zod devo usar para o hook use-clientes?

3. [Implementar versão validated]

4. @workspace Há componentes que usam o hook use-clientes antigo?

5. [Migrar componentes para nova versão]
```

### Workflow 3: Investigar Erro de Integração

```
1. @sentry Mostre erros recentes da API DJEN

2. @workspace Mostre código que interage com API DJEN

3. @workspace Como está implementado o tratamento de erros em djen-api.ts?

4. [Corrigir erro]

5. @workspace Há testes para djen-api.ts que devo atualizar?
```

---

## 📊 Métricas de Eficiência

### ✅ Indicadores de Uso Correto do Serena

- ⚡ Respostas em < 5 segundos
- 🎯 >80% de precisão nos resultados
- 📉 < 3 iterações por busca
- 🔄 Resultados consistentes

### ❌ Indicadores de Uso Ineficiente

- 🐌 Respostas > 30 segundos
- 🎲 Resultados aleatórios/irrelevantes
- 🔁 >5 iterações para encontrar código
- ⚠️ Timeouts frequentes

---

## 🔧 Configurações Avançadas

### Modo Debug

```json
{
  "servers": {
    "Serena": {
      "env": {
        "SERENA_LOG_LEVEL": "DEBUG",
        "SERENA_VERBOSE": "true"
      }
    }
  }
}
```

### Limitar Resultados

```json
{
  "servers": {
    "Serena": {
      "env": {
        "SERENA_MAX_RESULTS": "50"
      }
    }
  }
}
```

### Cache de Análise

```json
{
  "servers": {
    "Serena": {
      "env": {
        "SERENA_CACHE_ENABLED": "true",
        "SERENA_CACHE_TTL": "3600"
      }
    }
  }
}
```

---

## 📚 Recursos Adicionais

- [Workflows Específicos do Projeto](./SERENA_WORKFLOWS.md)
- [Setup do Serena](./SERENA_MCP_SETUP.md)
- [Documentação Oficial](https://github.com/oraios/serena)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Última Atualização**: Janeiro 2025  
**Versão**: 1.0.0  
**Mantido por**: Equipe Assistente Jurídico PJe

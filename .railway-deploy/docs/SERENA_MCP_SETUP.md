# ?? Guia de Configuração do Serena MCP Server

## ?? Visão Geral

O **Serena MCP Server** fornece busca semântica e edição inteligente de código para o GitHub Copilot e outros assistentes de IA.

---

## ?? Pré-requisitos

### 1. Instalar Python 3.9+

```sh
# Verificar versão
python --version  # ou python3 --version
```

Se não tiver Python, baixe em: https://www.python.org/downloads/

### 2. Instalar `uv` (Gerenciador de pacotes Python moderno)

```powershell
# Windows (PowerShell como Administrador)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Verifique a instalação:

```sh
uvx --version
```

---

## ?? Configuração do Serena

### Arquivo de Configuração

O arquivo `.vscode/mcp.json` já está configurado com:

```json
{
  "servers": {
    "Serena": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "start-mcp-server",
        "serena==latest",
        "--context",
        ".",
        "ide-assistant"
      ]
    }
  }
}
```

### Parâmetros Explicados

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `command` | `uvx` | Executa pacotes Python sem instalação global |
| `--from` | `git+https://github.com/oraios/serena` | Repositório fonte |
| `serena==latest` | Versão | Use a versão mais recente |
| `--context` | `.` | Diretório do workspace (raiz do projeto) |
| `ide-assistant` | Modo | Modo assistente de IDE |

---

## ?? Como Usar

### 1. Ativar o Serena no VS Code

1. Abra o **Command Palette** (`Ctrl+Shift+P` ou `Cmd+Shift+P`)
2. Digite: `GitHub Copilot: Restart MCP Servers`
3. O Serena será inicializado automaticamente

### 2. Verificar se está Funcionando

No **GitHub Copilot Chat**, teste:

```
@workspace Serena está funcionando?
```

Ou use comandos semânticos:

```
Encontre todos os hooks que usam validação com Zod
```

```
Mostre componentes que fazem chamadas à API do Sentry
```

### 3. Exemplos de Uso Prático

#### ?? Busca Semântica

**Pergunta ao Copilot:**
```
Encontre código que lida com erros de autenticação do Google
```

**Serena irá:**
- Buscar semanticamente por código relacionado
- Retornar arquivos relevantes: `src/lib/google-calendar-service.ts`, `src/hooks/use-auth.ts`, etc.

#### ?? Edição Inteligente

**Pergunta ao Copilot:**
```
Adicione logging de erros em todas as chamadas da API DJEN
```

**Serena irá:**
- Identificar todas as chamadas à API DJEN
- Sugerir onde adicionar logs
- Aplicar mudanças consistentes

#### ?? Análise de Código

**Pergunta ao Copilot:**
```
Quais componentes usam o hook use-processes-validated?
```

**Serena irá:**
- Analisar dependências
- Listar todos os componentes que importam o hook
- Mostrar contexto de uso

---

## ?? Casos de Uso Específicos para o Projeto

### 1. Análise de Agentes IA

```
Mostre todos os agentes que interagem com o serviço Gemini
```

### 2. Rastreamento de Erros

```
Encontre código que envia eventos para o Sentry
```

### 3. Validação de Schemas

```
Liste todos os schemas Zod e onde são usados
```

### 4. Análise de Hooks

```
Quais hooks usam o padrão validated (use-*-validated)?
```

### 5. Monitoramento de Performance

```
Encontre componentes que usam lazy loading
```

---

## ?? Configurações Avançadas

### Alterar Contexto do Workspace

Se quiser que o Serena analise apenas uma pasta específica:

```json
{
  "inputs": [
    {
      "id": "serena_context",
      "default": "src"  // Apenas pasta src
    }
  ]
}
```

### Usar Versão Específica do Serena

```json
{
  "inputs": [
    {
      "id": "serena_package",
      "default": "serena==0.5.0"  // Versão específica
    }
  ]
}
```

### Modo Debug

Adicione variável de ambiente para logs:

```json
{
  "servers": {
    "Serena": {
      "env": {
        "SERENA_LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

---

## ?? Troubleshooting

### Erro: "uvx command not found"

**Solução:**
```sh
# Reinstalar uv
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Adicionar ao PATH manualmente (Windows)
$env:Path += ";$env:USERPROFILE\.local\bin"
```

### Erro: "Failed to start MCP server"

**Solução 1:** Verificar Python
```sh
python --version  # Deve ser 3.9+
```

**Solução 2:** Limpar cache do uv
```sh
uvx cache clean
```

**Solução 3:** Reiniciar VS Code
```
Ctrl+Shift+P ? Developer: Reload Window
```

### Serena não responde a comandos

**Solução:**
1. Verificar logs: `Output ? GitHub Copilot Chat`
2. Reiniciar MCP servers: `Ctrl+Shift+P ? GitHub Copilot: Restart MCP Servers`
3. Verificar se o arquivo `.vscode/mcp.json` está no workspace

### Performance lenta

**Otimização 1:** Reduzir contexto
```json
{
  "inputs": [
    {
      "id": "serena_context",
      "default": "src"  // Apenas src, ignorar node_modules, dist, etc.
    }
  ]
}
```

**Otimização 2:** Criar `.sereneignore`
```
node_modules/
dist/
.git/
*.test.ts
*.test.tsx
```

---

## ?? Comparação: Serena vs Outras Ferramentas

| Feature | Serena MCP | VS Code Search | GitHub Copilot Alone |
|---------|------------|----------------|----------------------|
| **Busca Semântica** | ? Inteligente | ? Texto literal | ?? Limitado |
| **Edição Contextual** | ? Multi-arquivo | ? Manual | ?? Um arquivo |
| **Análise de Dependências** | ? Automática | ? Manual | ? Não |
| **Sugestões de Refatoração** | ? Contextual | ? Não | ?? Básico |
| **Performance** | ? Rápido | ?? Muito rápido | ? Rápido |

---

## ?? Comandos Úteis para o Projeto

### Análise de Migração (Hooks Validados)

```
Quais hooks ainda não foram migrados para o padrão validated?
```

### Análise de Monitoramento

```
Mostre todo código que envia spans para o Sentry
```

### Análise de Schemas

```
Liste todos os schemas Zod e seus campos obrigatórios
```

### Análise de Agentes IA

```
Quais agentes ainda não estão instrumentados com Sentry AI Monitoring?
```

### Análise de Performance

```
Encontre componentes sem lazy loading que deveriam ter
```

---

## ?? Recursos Adicionais

- **Repositório Serena**: https://github.com/oraios/serena
- **Documentação MCP**: https://modelcontextprotocol.io/
- **GitHub Copilot Docs**: https://docs.github.com/copilot

---

## ?? Checklist de Configuração

- [ ] Python 3.9+ instalado
- [ ] `uv` instalado e configurado
- [ ] Arquivo `.vscode/mcp.json` criado
- [ ] MCP servers reiniciados
- [ ] Teste de comando semântico executado
- [ ] Logs verificados sem erros

---

## ?? Próximos Passos

1. **Teste o Serena** com buscas semânticas
2. **Integre com GitHub MCP** para gestão de issues/PRs
3. **Use Playwright MCP** para testes automatizados
4. **Configure Sentry MCP** para análise de erros

---

**Status**: ? Configurado e pronto para uso!

**Última atualização**: Janeiro 2025

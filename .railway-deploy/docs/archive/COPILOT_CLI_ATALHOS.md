# 🚀 Copilot CLI - Atalhos e Comandos Rápidos

## Atalhos de Terminal (Bash Aliases)

Adicione ao seu `~/.bashrc` ou `~/.bash_aliases`:

```bash
# Copilot CLI Shortcuts
alias cop='copilot'
alias copr='copilot --resume'
alias copc='copilot --continue'
alias coph='copilot --help'

# Copilot com prompts rápidos
alias cop-fix='copilot --prompt "Analise e corrija os erros no projeto"'
alias cop-test='copilot --prompt "Crie testes para o código atual"'
alias cop-refactor='copilot --prompt "Sugira refatorações para melhorar o código"'
alias cop-review='copilot --prompt "Faça uma revisão de código completa"'
alias cop-docs='copilot --prompt "Adicione documentação ao código"'

# GitHub CLI úteis
alias gh-status='gh auth status'
alias gh-pr='gh pr list'
alias gh-issue='gh issue list'
```

Para ativar:
```bash
source ~/.bashrc
```

## 🎯 Comandos Mais Usados

### Sessões Interativas

```bash
# Iniciar nova sessão
copilot

# Retomar sessão anterior
copilot --resume

# Continuar última sessão
copilot --continue
```

### Prompts Diretos (Modo Não-Interativo)

```bash
# Pergunta rápida
copilot --prompt "Como implementar autenticação OAuth?"

# Analisar arquivo específico
copilot --file src/App.tsx --prompt "Explique este componente"

# Múltiplos arquivos
copilot --file src/App.tsx --file src/main.tsx --prompt "Compare estes arquivos"

# Com agente customizado
copilot --agent=refactor --prompt "Refatore o código"
```

### Comandos de Barra (Durante Sessão)

```bash
# Gerenciamento
/login          # Login no GitHub
/logout         # Logout
/exit           # Sair da sessão
/clear          # Limpar histórico

# Diretórios
/add-dir <path>     # Adicionar diretório confiável
/cwd <path>         # Mudar diretório atual

# Delegação
/delegate <prompt>  # Delegar ao coding agent

# Agentes
/agent             # Selecionar agente customizado

# MCP
/mcp add           # Adicionar servidor MCP
/mcp list          # Listar servidores MCP
/mcp remove        # Remover servidor MCP

# Informações
/usage             # Estatísticas da sessão
/help              # Ajuda completa
?                  # Ajuda rápida

# Feedback
/feedback          # Enviar feedback
```

## 💡 Prompts Inteligentes para Este Projeto

### Análise de Código

```
Analise a arquitetura do projeto e sugira melhorias
Identifique problemas de performance nos componentes React
Verifique violações das regras de segurança definidas em .github/copilot-instructions.md
Encontre código duplicado que pode ser refatorado
```

### Correção de Erros

```
Analise erros de TypeScript e sugira correções
Corrija warnings do ESLint
Resolva problemas de dependências no package.json
Identifique e corrija memory leaks nos hooks React
```

### Implementação de Features

```
Implemente autenticação OAuth seguindo o padrão do projeto
Adicione testes unitários para @src/hooks/use-autonomous-agents.ts --file
Crie um novo componente seguindo as convenções do projeto
Implemente validação de formulário com React Hook Form e Zod
```

### Otimização

```
Otimize o bundle size identificando imports desnecessários
Sugira lazy loading para componentes pesados
Melhore a performance do componente @src/components/Dashboard.tsx --file
Adicione memoization onde apropriado
```

### Documentação

```
Adicione JSDoc aos componentes principais
Crie documentação para as APIs customizadas
Gere README para cada pasta em src/components/
Documente os hooks customizados
```

### Testes

```
Crie testes unitários para todos os componentes em src/components/
Implemente testes de integração para o fluxo OAuth
Adicione testes E2E com Playwright
Configure coverage mínimo de 80%
```

## 🔥 Workflows Comuns

### 1. Corrigir Build Quebrado

```bash
copilot
> Analise os erros de build e corrija-os seguindo as convenções do projeto
```

### 2. Adicionar Nova Feature

```bash
copilot
> /delegate Implemente um sistema de notificações usando React Context e exiba notificações toast
```

### 3. Refatorar Código Legacy

```bash
copilot --file src/components/OldComponent.tsx
> Refatore este componente para usar hooks modernos e TypeScript strict
```

### 4. Revisar Pull Request

```bash
copilot
> Revise as mudanças na branch atual e sugira melhorias antes do merge
```

### 5. Otimizar Performance

```bash
copilot
> Analise a performance do app e sugira otimizações específicas
```

## 🎨 Prompts com Contexto de Arquivo

Use `@arquivo` ou `--file` para adicionar contexto:

```bash
# Opção 1: @ (mais rápido na sessão interativa)
Explique @src/App.tsx --file
Refatore @src/hooks/use-autonomous-agents.ts --file
Compare @src/components/Dashboard.tsx --file com @src/components/ProcessCRM.tsx --file

# Opção 2: --file (linha de comando)
copilot --file src/App.tsx --prompt "Explique este componente"
```

## 🛠️ Executar Comandos Shell

Dentro da sessão, use `!` para comandos diretos:

```bash
# Git
!git status
!git log --oneline -10
!git diff

# NPM
!npm run dev
!npm run build
!npm test
!npm run lint

# Verificações
!npm audit
!npm outdated
!tsc --noEmit

# Utilitários
!ls -la src/components/
!tree -L 2 src/
!wc -l src/**/*.tsx
```

## 📊 Monitoramento e Debug

### Ver Uso da Sessão

```bash
copilot
> /usage
```

**Informações retornadas:**
- Total de requisições premium
- Duração da sessão
- Linhas de código editadas
- Tokens usados por modelo
- Percentual do limite usado

### Habilitar Logs de Debug

```bash
# Definir nível de log
export COPILOT_LOG_LEVEL=debug

# Ver logs
copilot --help logging
```

**Níveis disponíveis:**
- `error` - Apenas erros
- `warn` - Avisos e erros
- `info` - Informações gerais
- `debug` - Debug detalhado
- `trace` - Trace completo

### Verificar Configuração

```bash
# Ver todas as configurações
copilot help config

# Ver arquivo de config
cat ~/.copilot/config.json

# Ver servidores MCP
cat ~/.copilot/mcp-config.json
```

## 🔐 Gerenciamento de Permissões

### Aprovar Ferramentas Temporariamente

```bash
copilot --allow-tool touch --allow-tool mkdir
```

### Negar Ferramentas Específicas

```bash
copilot --deny-tool rm --deny-tool chmod
```

### Aprovar Tudo (⚠️ Use com Cautela!)

```bash
copilot --allow-all-tools
```

**⚠️ ATENÇÃO:** Isso permite que o Copilot execute qualquer comando sem pedir aprovação!

## 📁 Gerenciamento de Diretórios

### Adicionar Diretórios Confiáveis

```bash
# Durante sessão
/add-dir /caminho/para/projeto

# Na linha de comando
copilot --add-dir /caminho/para/projeto

# Múltiplos diretórios
copilot --add-dir /projeto1 --add-dir /projeto2
```

### Mudar Diretório de Trabalho

```bash
# Durante sessão
/cwd /workspaces/outro-projeto

# Continua na mesma sessão, mas trabalha em outro local
```

### Permitir Todos os Caminhos (⚠️ Perigoso!)

```bash
copilot --allow-all-paths
```

## 🎯 Agentes Customizados

### Criar Agente Customizado

1. Crie `.github/agents/meu-agente.md`:

```markdown
# Meu Agente Customizado

Você é um especialista em [especialidade].

## Instruções
- Sempre siga [convenção X]
- Use [ferramenta Y]
- Formate código com [padrão Z]

## Ferramentas Permitidas
- read_file
- write_file
- grep_search
```

2. Use o agente:

```bash
copilot --agent=meu-agente --prompt "Faça algo específico"

# Ou na sessão interativa
/agent
# Selecione da lista
```

### Listar Agentes Disponíveis

```bash
copilot
> /agent
# Mostra todos os agentes em:
# - Sistema (built-in)
# - Repositório (.github/agents/)
# - Usuário (~/.copilot/agents/)
# - Organização (.github-private/agents/)
```

## 🔌 Servidores MCP

### Adicionar Servidor MCP

```bash
copilot
> /mcp add
```

Preencha:
- **Nome:** nome-do-servidor
- **Comando:** node /caminho/para/servidor.js
- **Args:** argumentos opcionais
- **Env:** variáveis de ambiente

### Listar Servidores MCP

```bash
copilot
> /mcp list
```

### Remover Servidor MCP

```bash
copilot
> /mcp remove
# Selecione da lista
```

### Desabilitar Servidor MCP Temporariamente

```bash
# Desabilitar servidores built-in
copilot --disable-builtin-mcps

# Desabilitar específico
copilot --disable-mcp-server github-mcp-server
```

## 📝 Exemplos Práticos para Este Projeto

### Exemplo 1: Adicionar Validação OAuth

```bash
copilot --file src/components/GoogleAuth.tsx
> Adicione validação robusta para tokens OAuth, incluindo:
> - Verificação de expiração
> - Refresh automático
> - Tratamento de erros
> - Feedback visual para o usuário
> Siga as convenções do projeto definidas em .github/copilot-instructions.md
```

### Exemplo 2: Criar Testes Completos

```bash
copilot
> /delegate Crie uma suíte completa de testes para:
> - src/hooks/use-autonomous-agents.ts
> - src/lib/utils.ts
> - src/components/Dashboard.tsx
> Use Vitest e React Testing Library
> Coverage mínimo: 80%
```

### Exemplo 3: Otimizar Performance

```bash
copilot
> Analise o bundle do Vite e sugira:
> - Code splitting estratégico
> - Lazy loading de componentes pesados
> - Tree shaking de dependências não usadas
> - Otimização de imports
> Gere um relatório com antes/depois
```

### Exemplo 4: Documentar API

```bash
copilot --file src/lib/djen-api.test.ts
> Baseado nos testes, crie documentação completa da API DJEN incluindo:
> - Endpoints disponíveis
> - Parâmetros e respostas
> - Exemplos de uso
> - Tratamento de erros
> - Limitações conhecidas
```

### Exemplo 5: Migrar para Nova Versão

```bash
copilot
> Analise package.json e sugira um plano de migração seguro para:
> - React 19
> - Vite 6
> - Tailwind CSS v4
> Identifique breaking changes e crie um checklist de migração
```

## 🚀 Dicas de Produtividade

### 1. Use Tab para Autocompletar

Ao digitar caminhos de arquivos, pressione `Tab` para autocompletar.

### 2. Interrompa com Esc

Se o Copilot estiver indo na direção errada, pressione `Esc` e refine o prompt.

### 3. Sessões Focadas

Mantenha sessões focadas em uma tarefa. Use `/exit` e inicie nova sessão para tarefas diferentes.

### 4. Contexto Incremental

Adicione contexto gradualmente:
```
Primeira mensagem: Analise o componente Dashboard
Segunda mensagem: Agora foque na parte de filtros
Terceira mensagem: Otimize apenas a busca
```

### 5. Aproveite o Histórico

```bash
# Retomar última sessão
copilot --continue

# Escolher sessão específica
copilot --resume
```

---

**🎯 Atalho Favorito do Desenvolvedor:**

```bash
# Adicione ao ~/.bashrc
copilot-quick() {
  cd /workspaces/assistente-jurdico-p && copilot --prompt "$1"
}

# Use assim:
copilot-quick "Corrija os erros de build"
```

---

Para mais informações, veja:
- `COPILOT_CLI_SETUP_COMPLETO.md` - Configuração completa
- `COPILOT_CLI_GUIA.md` - Guia detalhado
- `.github/copilot-instructions.md` - Instruções do projeto

# Guia Rápido - GitHub Copilot CLI

## ✅ Configuração Completa

O GitHub CLI e o Copilot CLI estão configurados com as seguintes permissões de administrador:

- ✅ `repo` - Acesso completo a repositórios
- ✅ `read:org` - Leitura de organizações
- ✅ `admin:repo_hook` - Administração de webhooks
- ✅ `workflow` - Gerenciamento de workflows
- ✅ `admin:public_key` - Administração de chaves SSH
- ✅ `admin:gpg_key` - Administração de chaves GPG
- ✅ `codespace` - Acesso a Codespaces
- ✅ `copilot` - Acesso ao GitHub Copilot

**Diretório confiável configurado:** `/workspaces/assistente-jurdico-p`

## 🚀 Como Usar o Copilot CLI

### Iniciar uma Sessão Interativa

```bash
copilot
```

Isso inicia uma sessão interativa onde você pode conversar com o Copilot sobre seu código.

### Comandos Úteis de Linha de Comando

```bash
# Fazer uma pergunta rápida
copilot --prompt "Como faço para corrigir este bug?"

# Usar com um arquivo específico
copilot --file src/App.tsx --prompt "Explique este componente"

# Resumir uma sessão anterior
copilot --resume

# Continuar a última sessão
copilot --continue

# Usar um agente customizado
copilot --agent=refactor-agent --prompt "Refatore este código"
```

### Comandos de Barra (Slash Commands) na Sessão Interativa

Quando estiver dentro de uma sessão interativa (`copilot`), você pode usar:

- `/login` - Fazer login no GitHub
- `/add-dir /caminho/para/diretorio` - Adicionar diretório confiável
- `/cwd /caminho/para/diretorio` - Mudar diretório de trabalho
- `/delegate <prompt>` - Delegar tarefa ao Copilot coding agent
- `/agent` - Selecionar um agente customizado
- `/mcp add` - Adicionar um servidor MCP
- `/usage` - Ver estatísticas de uso da sessão atual
- `/feedback` - Enviar feedback sobre o Copilot CLI
- `?` - Mostrar todos os comandos disponíveis

### Incluir Arquivos Específicos no Prompt

Use `@` seguido do caminho do arquivo:

```
Explique @config/ci/ci-required-checks.yml --file
Fix the bug in @src/App.tsx --file
```

### Executar Comandos Shell Diretamente

Use `!` para executar comandos sem fazer chamada ao modelo:

```
!git status
!npm run build
!ls -la
```

### Delegar Tarefas ao Copilot Coding Agent

```
/delegate complete the API integration tests and fix any failing edge cases
```

O Copilot irá:
1. Criar uma nova branch
2. Fazer commit das mudanças não staged
3. Abrir um pull request de rascunho
4. Trabalhar em segundo plano
5. Solicitar sua revisão quando terminar

## 🎯 Exemplos de Uso

### 1. Corrigir Erros de Compilação

```bash
copilot
> Analise os erros de compilação e sugira correções
```

### 2. Adicionar Nova Funcionalidade

```bash
copilot
> Adicione autenticação com Google OAuth no componente @src/components/GoogleAuth.tsx --file
```

### 3. Refatorar Código

```bash
copilot
> Refatore o componente Dashboard para melhorar a performance e separação de responsabilidades
```

### 4. Revisar Código

```bash
copilot
> Revise o código em @src/hooks/use-autonomous-agents.ts --file e sugira melhorias
```

### 5. Criar Testes

```bash
copilot
> Crie testes unitários para o arquivo @src/lib/utils.ts --file
```

## ⚙️ Configuração Avançada

### Arquivo de Configuração

Localização: `~/.copilot/config.json`

```json
{
  "trustedDirectories": [
    "/workspaces/assistente-jurdico-p"
  ],
  "autoApprove": {
    "tools": []
  }
}
```

### Instruções Customizadas

O Copilot CLI já está configurado para usar as instruções em:

- `.github/copilot-instructions.md` - Instruções globais do repositório
- `.github/copilot-instructions/**/*.instructions.md` - Instruções específicas por pasta
- `AGENTS.md` - Definições de agentes customizados

### Variáveis de Ambiente

Você pode ajustar o comportamento do Copilot CLI com variáveis de ambiente:

```bash
# Ver todas as variáveis disponíveis
copilot help environment

# Definir nível de log
export COPILOT_LOG_LEVEL=debug

# Mudar diretório de configuração
export XDG_CONFIG_HOME=/caminho/customizado
```

## 🔐 Aprovação de Ferramentas

Quando o Copilot quiser executar comandos que modificam arquivos, ele pedirá aprovação:

1. **Sim** - Aprova apenas esta vez
2. **Sim, e aprove para o restante da sessão** - Aprova para toda a sessão atual
3. **Não** - Rejeita e permite dar instruções alternativas (pressione Esc)

**⚠️ Cuidado:** Aprovar ferramentas como `rm` para toda a sessão pode ser perigoso!

## 📊 Verificar Uso e Contexto

```bash
copilot
> /usage
```

Isso mostra:
- Número de requisições premium usadas
- Duração da sessão
- Linhas de código editadas
- Uso de tokens por modelo

## 🆘 Ajuda e Suporte

```bash
# Ajuda geral
copilot help

# Ajuda sobre configuração
copilot help config

# Ajuda sobre variáveis de ambiente
copilot help environment

# Ajuda sobre níveis de log
copilot help logging

# Ajuda sobre permissões
copilot help permissions
```

## 🎨 Dicas de Uso

1. **Seja específico**: Quanto mais contexto você der, melhores serão as respostas
2. **Use @arquivo**: Sempre referencie arquivos específicos quando relevante
3. **Aprove com cuidado**: Revise os comandos antes de aprovar execução
4. **Use /delegate**: Para tarefas longas, delegue ao coding agent
5. **Interrompa quando necessário**: Pressione `Esc` para parar operações indesejadas

## 🔄 Retomar Sessões

```bash
# Retomar uma sessão anterior (mostra lista)
copilot --resume

# Continuar a última sessão
copilot --continue
```

## 🎯 Próximos Passos

1. Inicie o Copilot CLI: `copilot`
2. Faça uma pergunta ou peça ajuda sobre o código
3. Explore os comandos de barra digitando `?`
4. Configure agentes customizados se necessário
5. Use `/feedback` para enviar sugestões à equipe do GitHub

---

**Configurado em:** 20 de novembro de 2025  
**Usuário:** @thiagobodevan-a11y  
**Repositório:** assistente-jurdico-p

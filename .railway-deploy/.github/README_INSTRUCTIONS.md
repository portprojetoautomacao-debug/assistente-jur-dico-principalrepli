# 📋 Instruções do GitHub Copilot

Este diretório contém arquivos de instruções que o GitHub Copilot lê automaticamente.

## Arquivos Ativos

### 1. `copilot-instructions.md` (Principal)
- **Escopo**: Todos os arquivos do projeto (`applyTo: "**"`)
- **Conteúdo**: 
  - Regras de codificação (TypeScript, React, Tailwind)
  - Stack tecnológico do projeto
  - Modo MANUTENÇÃO ativo
  - Diretrizes LGPD e segurança
  - Estrutura de arquivos
  - Checklist de correção
- **Status**: ✅ Ativo

### 2. `instructions/sonarqube_mcp.instructions.md`
- **Escopo**: Todos os arquivos (`applyTo: "**/*"`)
- **Conteúdo**:
  - Diretrizes para usar SonarQube MCP server
  - Análise de código automática
  - Troubleshooting
- **Status**: ✅ Ativo quando SonarQube MCP está disponível

## Como Funciona

O GitHub Copilot lê automaticamente arquivos em:
- `.github/copilot-instructions.md` (lido sempre)
- `.github/instructions/*.instructions.md` (lidos via attachment system)

## Formato

Cada arquivo deve ter front matter YAML:

\`\`\`yaml
---
applyTo: "**/*"
---
\`\`\`

Seguido pelo conteúdo markdown com as instruções.

## Documentação Adicional

- `../docs/COPILOT_INSTRUCTIONS_SETUP.md` - Guia completo de configuração
- `.vscode/settings.json` - Configuração para ativar instruction files

## Última Limpeza

- **Data**: 03/01/2026
- **Ação**: Removidos arquivos duplicados/obsoletos
  - ❌ `'api.githubcopilot.com.md` (nome incorreto, alerta de segurança)
  - ❌ `.github/copilot-workspace.yml` (formato não padrão)
  - ❌ `.github/prompts/todosprompt.prompt.md` (genérico demais)

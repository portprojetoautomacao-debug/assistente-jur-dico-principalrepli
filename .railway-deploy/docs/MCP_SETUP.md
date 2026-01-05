# GitHub MCP Server - Setup rápido

Este documento descreve como configurar e executar o GitHub MCP Server localmente (via Docker) e como conectar seu host (ex.: VS Code) ao servidor.

ATENÇÃO: Não commit o token (PAT) em repositórios públicos. Use variáveis de ambiente ou `secret` do seu host.

1) Pré-requisitos
- Docker instalado e em execução
- GitHub Personal Access Token (PAT) com permissões adequadas: repos, issues, pull_requests, actions, code_security (ajuste conforme necessidade)

2) Variáveis de ambiente recomendadas
- GITHUB_MCP_PAT - GitHub PAT (obrigatório)
- GITHUB_HOST - (opcional) GitHub Enterprise host (ex.: https://ghe.example.com)
- GITHUB_TOOLSETS - toolsets separados por vírgula (ex.: repos,issues,pull_requests,actions)
- GITHUB_TOOLS - tools específicas (opcional)

3) Rodando com Docker (modo rápido)

Exemplo shell:

```bash
export GITHUB_MCP_PAT=ghp_xxx
export GITHUB_TOOLSETS="repos,issues,pull_requests,actions,code_security"
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_MCP_PAT" \
  -e GITHUB_HOST="${GITHUB_HOST:-https://github.com}" \
  -e GITHUB_TOOLSETS="$GITHUB_TOOLSETS" \
  ghcr.io/github/github-mcp-server
```

4) Opcional: iniciar via script (recomendado)

O repositório inclui um script `scripts/start-github-mcp.sh` para rodar o container de forma simples:

```bash
# Defina as variáveis de ambiente primeiro (evite commitar):
export GITHUB_MCP_PAT=ghp_xxx
export GITHUB_HOST=https://github.com # ou seu GHE
export GITHUB_TOOLSETS="repos,issues,pull_requests,actions,code_security"
./scripts/start-github-mcp.sh
```

5) Versão para integração com o VS Code (arquivo `.vscode/mcp.json`)
- O arquivo `.vscode/mcp.json` foi adicionado neste repositório com inputs para `github_mcp_pat` e `github_mcp_host`.
- Ao abrir o workspace, você pode ser solicitado a informar o token (PAT) por prompt do VS Code.
 - IMPORTANTE: por segurança, o arquivo `.vscode/mcp.json` está incluído no `.gitignore` do projeto e **não deve** ser commitado; é para configuração local do seu VS Code.
 - Use o armazenamento de segredos do seu host (ex.: VS Code Secret Storage) quando possível para guardar o PAT.

6) Modo Read-Only (segurança)
- Para rodar somente ferramentas read-only, exporte `GITHUB_READ_ONLY=1` antes de executar o container. Isso evita ações de escrita por ferramentas.

7) Configuração de toolsets e ferramentas
- Ajuste `GITHUB_TOOLSETS` e `GITHUB_TOOLS` na linha de comando ou no script conforme suas necessidades. Isso limita o conjunto de ferramentas que a LLM terá disponível.

8) Notas de segurança e produção
- Nunca commit o PAT em arquivos de repositório.
- Prefira usar OAuth e portas seguras em produção.
- Para ambiente GitHub Enterprise (GHE), especifique `GITHUB_HOST=https://ghe.yourcompany.com`.

9) Ajuda e debugging
- Logs do container aparecem no STDOUT
- Adicione `-e GITHUB_VERBOSE=1` se precisar de mais informações

10) Exemplos de uso no workspace
- Passe por: .vscode/mcp.json para usar o prompt integrado do VS Code
- Use `scripts/start-github-mcp.sh` para iniciar o servidor e conecte o VS Code pela configuração do MCP server

Se desejar, posso também adicionar um arquivo `.vscode/tasks.json` para executar automaticamente o script como uma task. Deseja que eu adicione isso? (Responda sim/não)

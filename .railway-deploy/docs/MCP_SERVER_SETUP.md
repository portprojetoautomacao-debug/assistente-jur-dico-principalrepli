# Configuração do Servidor MCP do GitHub

## O que é MCP?

O Model Context Protocol (MCP) é um protocolo que permite ao GitHub Copilot se conectar a servidores externos para obter contexto adicional. O servidor MCP do GitHub fornece acesso a dados do GitHub diretamente no Copilot Chat.

## Configuração Realizada

Foi criado o arquivo `.vscode/mcp.json` com a configuração do servidor GitHub MCP:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "seu_token_aqui"
      }
    }
  }
}
```

## Segurança

⚠️ **IMPORTANTE**: 
- O arquivo `mcp.json` contém seu token do GitHub e **NÃO deve ser commitado**
- Já foi adicionado ao `.gitignore` para prevenir commits acidentais
- Use o arquivo `mcp.json.example` como referência para outros desenvolvedores

## Como Funciona

1. O VS Code detecta automaticamente o arquivo `.vscode/mcp.json`
2. Quando você usa o Copilot Chat, ele se conecta ao servidor MCP
3. O servidor MCP usa seu token do GitHub para acessar dados do repositório
4. Você pode fazer perguntas sobre issues, PRs, commits, etc.

## Capacidades do Servidor GitHub MCP

Com este servidor configurado, você pode:
- Consultar issues e pull requests
- Buscar informações sobre commits
- Acessar metadados do repositório
- Obter contexto sobre branches e tags
- E muito mais!

## Exemplos de Uso no Copilot Chat

- "Quais são as issues abertas neste repositório?"
- "Mostre-me os últimos commits na branch main"
- "Liste os pull requests pendentes de revisão"
- "Qual é o status do CI/CD da última build?"

## Renovação do Token

Se o token expirar, você pode gerar um novo com:

```bash
gh auth token
```

E atualizar o arquivo `.vscode/mcp.json` com o novo token.

## Troubleshooting

### Servidor não conecta
1. Verifique se o token está correto no `mcp.json`
2. Certifique-se de que tem permissões necessárias no GitHub
3. Recarregue a janela do VS Code (Ctrl+Shift+P → "Reload Window")

### Token inválido
Execute `gh auth login` para fazer login novamente e depois `gh auth token` para obter um novo token.

## Referências

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [GitHub MCP Server](https://github.com/modelcontextprotocol/server-github)
- [GitHub Copilot MCP Documentation](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat)

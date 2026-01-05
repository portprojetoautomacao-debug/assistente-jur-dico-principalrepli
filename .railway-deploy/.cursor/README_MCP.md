# 🔧 Configuração do MCP (Model Context Protocol)

## ⚠️ Problema Resolvido

**Erro anterior:**
```
Estado da conexão: Erro spawn npx ENOENT
```

**Causa:**
O servidor MCP do Todoist estava configurado para usar `npx` sem caminho absoluto, e o VS Code/Cursor não conseguia encontrar o comando no PATH.

**Solução aplicada:**
Configuramos o caminho completo do `npx` e adicionamos a variável de ambiente `PATH` explicitamente.

## 📝 Arquivo: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "todoist": {
      "command": "/usr/local/share/nvm/versions/node/v22.21.1/bin/npx",
      "args": ["-y", "mcp-remote", "https://ai.todoist.net/mcp"],
      "env": {
        "PATH": "/usr/local/share/nvm/versions/node/v22.21.1/bin:${PATH}"
      }
    }
  }
}
```

## 🔍 Como Verificar se Está Funcionando

1. **Recarregue a janela do VS Code/Cursor:**
   - Pressione `Ctrl+Shift+P`
   - Digite "Reload Window"
   - Pressione Enter

2. **Verifique os logs do servidor Todoist:**
   - Procure por mensagens como "Estado da conexão: Conectado"
   - Não deve mais aparecer o erro `spawn npx ENOENT`

3. **Teste o servidor MCP:**
   - Abra o GitHub Copilot Chat
   - Tente usar comandos relacionados ao Todoist (se houver)

## 🛠️ Troubleshooting

### Se o erro persistir:

1. **Verifique a versão do Node.js:**
   ```bash
   which npx
   node --version
   ```

2. **Se a versão do Node mudou, atualize o caminho:**
   ```bash
   # Encontre o caminho do npx
   which npx
   
   # Atualize no arquivo .cursor/mcp.json
   ```

3. **Desabilite o servidor MCP temporariamente:**
   - Renomeie `.cursor/mcp.json` para `.cursor/mcp.json.disabled`
   - Recarregue a janela

## 📚 Referências

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Todoist MCP Server](https://ai.todoist.net/mcp)
- [NVM - Node Version Manager](https://github.com/nvm-sh/nvm)

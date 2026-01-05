# 🔧 Configuração SonarQube MCP para VS Code

## ✅ Configuração Completa

A extensão SonarQube foi configurada com sucesso no projeto! Aqui estão os detalhes:

### 📦 Arquivos Configurados

1. **`.cursor/mcp.json`** - Servidor MCP do SonarQube ativado
2. **`.vscode/settings.json`** - Configurações SonarLint integradas
3. **`sonar-project.properties`** - Propriedades do projeto

### 🔑 Como Configurar o Token do SonarCloud

Para ativar completamente a integração, você precisa configurar o token do SonarCloud:

#### 1. Gerar Token no SonarCloud

1. Acesse: https://sonarcloud.io/account/security
2. Faça login com sua conta
3. Clique em **"Generate Tokens"**
4. Nome do token: `vscode-assistente-juridico`
5. Tipo: **User Token**
6. Copie o token gerado

#### 2. Configurar Variável de Ambiente

**Opção A: Adicionar ao `.env` (recomendado)**

```bash
# No arquivo .env na raiz do projeto
SONARQUBE_TOKEN=seu_token_aqui
```

**Opção B: Exportar no shell**

```bash
export SONARQUBE_TOKEN=seu_token_aqui
```

**Opção C: Configurar no VS Code Settings (usuário)**

1. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
2. Digite: `Preferences: Open User Settings (JSON)`
3. Adicione:

```json
{
  "sonarlint.connectedMode.connections.sonarcloud": [
    {
      "organizationKey": "thiagobodevan-a11y-assistente-juridico-p",
      "token": "seu_token_aqui"
    }
  ]
}
```

### 🚀 Recursos Ativados

#### ✅ Análise Automática
- **On Save**: Analisa arquivos ao salvar
- **On Commit**: Analisa antes de fazer commit
- **Continuous**: Análise em tempo real

#### ✅ Connected Mode
- **Organização**: `thiagobodevan-a11y-assistente-juridico-p`
- **Projeto**: `thiagobodevan-a11y_assistente-juridico-p`
- **Sincronização**: Regras do SonarCloud aplicadas localmente

#### ✅ Regras Personalizadas
- `typescript:S1128` - Unused imports (desativado - gerenciado pelo ESLint)
- `typescript:S125` - Commented code (desativado - permitido para documentação)

#### ✅ Focus on New Code
- Foca na análise de código novo/modificado
- Reduz ruído de issues antigos

### 🔍 Como Usar

#### Analisar Arquivo Atual
1. Abra um arquivo `.ts` ou `.tsx`
2. Salve o arquivo (`Ctrl+S`)
3. Veja os issues no painel **"Problems"**

#### Ver Detalhes de um Issue
1. Clique no issue no painel **"Problems"**
2. Veja a descrição completa e sugestão de correção
3. Clique em **"Show Rule Description"** para mais detalhes

#### Conectar ao SonarCloud
1. Pressione `Ctrl+Shift+P`
2. Digite: `SonarLint: Connect to SonarCloud`
3. Selecione a organização
4. Cole o token

### 🛠️ Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `SonarLint: Analyze Current File` | Analisa o arquivo atual |
| `SonarLint: Show All Locations` | Mostra todas as localizações de um issue |
| `SonarLint: Show Rule Description` | Exibe descrição da regra |
| `SonarLint: Update All Bindings` | Atualiza regras do SonarCloud |
| `SonarLint: Clear Diagnostics` | Limpa diagnósticos |

### 📊 Painel de Problemas

Os issues do SonarLint aparecem no painel **"Problems"** do VS Code:

- 🔴 **Error**: Issues críticos de segurança ou bugs
- 🟡 **Warning**: Code smells e melhorias
- 🔵 **Info**: Sugestões de melhoria

### 🎯 Integração com Copilot Chat

O Copilot pode usar as ferramentas do SonarQube MCP:

```
@workspace analise os issues do SonarQube neste arquivo
```

```
@workspace corrija os problemas de segurança detectados pelo Sonar
```

### 🔄 Sincronização com SonarCloud

Quando você faz push para o GitHub:

1. GitHub Actions executa análise SonarCloud
2. Resultados são enviados para o SonarCloud
3. Issues são sincronizados com o VS Code
4. Você vê os mesmos issues localmente e no servidor

### 🐛 Troubleshooting

#### Token não reconhecido
```bash
# Verifique se a variável está definida
echo $SONARQUBE_TOKEN

# Se vazio, adicione ao .env
echo "SONARQUBE_TOKEN=seu_token" >> .env
source .env
```

#### Java não encontrado
```bash
# Verificar Java 21
#### Java não encontrado
```bash
# Verificar Java (mínimo: Java 11)
java -version

# Java está instalado via SDKMAN em:
# /usr/local/sdkman/candidates/java/current

# Se precisar instalar outra versão:
sdk list java
sdk install java 17.0.17-ms
sdk use java 17.0.17-ms
```

#### Node.js não encontrado
```bash
# Verificar Node.js
node -v

# Deve mostrar v22.21.1 ou superior
```

### 📚 Documentação Adicional

- **SonarCloud**: https://sonarcloud.io/organizations/thiagobodevan-a11y-assistente-juridico-p/projects
- **SonarLint**: https://www.sonarsource.com/products/sonarlint/
- **MCP SonarQube**: https://github.com/modelcontextprotocol/servers/tree/main/src/sonarqube

### ✨ Próximos Passos

1. ✅ Configurar token do SonarCloud
2. ✅ Testar análise em um arquivo TypeScript
3. ✅ Revisar issues detectados
4. ✅ Configurar regras personalizadas (se necessário)
5. ✅ Integrar com workflow de CI/CD

---

**Configurado em**: 06/12/2024
**Versão**: 1.0.0

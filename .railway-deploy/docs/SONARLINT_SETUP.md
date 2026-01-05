# SonarLint Setup (VS Code)

Este documento reúne instruções para configurar o SonarLint no VS Code, incluindo como informar o executável do Node quando você gerencia Node com `nvm`.

## Problema comum

Alguns desenvolvedores usando `nvm` percebem que SonarLint não detecta o binário do Node automaticamente, resultando em erros na análise de arquivos JavaScript/TypeScript.

## Solução

- Configure `sonarlint.pathToNodeExecutable` para apontar para o binário Node 22 (ou versão superior):

```json
"sonarlint.pathToNodeExecutable": "/usr/local/share/nvm/versions/node/v22.21.1/bin/node"
```

> Observação: Substitua o path acima pelo caminho do seu Node caso a versão ou local de `nvm` seja diferente.

## Como encontrar o caminho do Node

- **Linux / macOS**:

```bash
# Mostra o caminho absoluto do Node atualmente ativo
which node
# Exibir versão para confirmar
node --version
```

- **Windows (PowerShell)**:

```powershell
Get-Command node | Select-Object -ExpandProperty Source
node --version
```

## Verificações úteis

```bash
# Java (JRE)
ls -la /usr/lib/jvm/java-21-openjdk-amd64/bin/java
# Node (nvm)
ls -la /usr/local/share/nvm/versions/node/v22.21.1/bin/node
# Node (system)
ls -la /usr/bin/node
```

## VS Code (configuração)

Adicione ou atualize no arquivo `.vscode/settings.json` do projeto (ou no `User` settings):

```json
"sonarlint.pathToNodeExecutable": "/usr/local/share/nvm/versions/node/v22.21.1/bin/node"
```

No Windows, use a versão com barras invertidas escapadas:

```json
"sonarlint.pathToNodeExecutable": "C:\\Program Files\\nodejs\\node.exe"
```

## Reinicie o VS Code

Depois de ajustar as configurações, recarregue a janela: `Ctrl+Shift+P` → "Developer: Reload Window".

## Ver logs do SonarLint

- `View` → `Output` → Selecione `SonarLint`

## Notas

- O projeto já tem exemplos no arquivo `SONARCLOUD_SETUP.md` e em `.vscode/settings.json` que apontam para Node 22 usado via `nvm`.

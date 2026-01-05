# 🔍 SonarQube Auto Analyzer - Integração VS Code

Sistema de análise automática de código integrado ao VS Code que combina:
- **SonarLint** (análise local em tempo real)
- **SonarCloud API** (issues remotos do projeto)
- **ESLint + TypeScript** (validação local)
- **Auto-fix** (correções automáticas)

## 🚀 Como Funciona

### Tasks Automáticas (rodam ao abrir o projeto)

| Task | Descrição |
|------|-----------|
| `auto-sonar` | Roda análise a cada 5 minutos em background |
| `auto-fix` | Aplica ESLint --fix a cada 30 segundos |
| `auto-watch` | Testes em modo watch contínuo |

### Tasks Manuais (executar via Command Palette)

Pressione `Ctrl+Shift+P` > "Tasks: Run Task" > escolha:

| Task | Comando Equivalente | Descrição |
|------|---------------------|-----------|
| `sonar:analyze` | `./scripts/sonar-auto-analyze.sh` | Análise rápida (local) |
| `sonar:analyze:fix` | `./scripts/sonar-auto-analyze.sh --fix` | Análise + correções |
| `sonar:analyze:full` | `./scripts/sonar-auto-analyze.sh --full --fix` | Completa (local + SonarCloud + testes) |
| `sonar:watch` | `./scripts/sonar-auto-analyze.sh --watch --fix` | Modo contínuo (a cada 5 min) |

## ⚙️ Configuração

### 1. Token SonarCloud (Obrigatório para análise remota)

```bash
# Adicione ao seu ~/.bashrc ou ~/.zshrc
export SONAR_TOKEN="seu-token-aqui"

# Ou crie um arquivo .env.local (não commitado)
echo 'SONAR_TOKEN=seu-token-aqui' > .env.local
```

**Gerar token:** https://sonarcloud.io/account/security

### 2. SonarLint Extension (Análise em tempo real)

A extensão SonarLint já está configurada no projeto. Verifique:

1. Extensão instalada: `SonarSource.sonarlint-vscode`
2. Connected Mode ativado em `.vscode/settings.json`
3. Token configurado nas User Settings do VS Code

### 3. Verificar Configuração

```bash
# Testar script
./scripts/sonar-auto-analyze.sh --help

# Executar análise completa
SONAR_TOKEN="$SONAR_TOKEN" ./scripts/sonar-auto-analyze.sh --full
```

## 📊 Resultados

Os resultados são salvos em `.sonar-results/`:

```
.sonar-results/
├── analysis.log           # Log de todas as análises
├── local-summary.txt      # Resumo TypeScript/ESLint
├── sonar-summary.txt      # Resumo SonarCloud
├── sonar-issues.json      # Issues em JSON (programável)
├── sonar-issues.txt       # Issues legível
└── report-YYYYMMDD-HHMMSS.md  # Relatório completo
```

## 🔧 Fluxo de Correção Automática

```
┌─────────────────┐
│  Abrir Projeto  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   auto-sonar    │────▶│   ESLint --fix  │
│  (a cada 5min)  │     │  (correções)    │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  SonarCloud API │
│  (fetch issues) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Relatório .md  │
│  (resultado)    │
└─────────────────┘
```

## 📋 Severidades

| Severidade | Ação |
|------------|------|
| 🔴 BLOCKER | Corrigir IMEDIATAMENTE |
| 🟠 CRITICAL | Corrigir em até 24h |
| 🟡 MAJOR | Corrigir quando possível |
| 🟢 MINOR | Avaliar necessidade |
| ⚪ INFO | Informativo apenas |

## 🛠️ Troubleshooting

### Erro: "SONAR_TOKEN não configurado"

```bash
# Verificar se token está definido
echo $SONAR_TOKEN

# Definir temporariamente
export SONAR_TOKEN="405bd014..."
```

### Erro: "jq: command not found"

```bash
# Instalar jq (necessário para parse JSON)
sudo apt-get install jq  # Debian/Ubuntu
brew install jq          # macOS
```

### Task não aparece

1. Recarregar VS Code: `Ctrl+Shift+P` > "Developer: Reload Window"
2. Verificar `.vscode/tasks.json` para erros de sintaxe

## 📝 Regras Mais Comuns

| Regra | Descrição | Auto-fix? |
|-------|-----------|-----------|
| S1134 | FIXME/TODO comments | ❌ Manual |
| S1854 | Variáveis não usadas | ✅ ESLint |
| S3776 | Complexidade cognitiva | ❌ Refatorar |
| S7764 | Usar globalThis | ✅ ESLint |
| S7781 | Usar replaceAll | ✅ ESLint |

## 🔗 Links Úteis

- [Dashboard SonarCloud](https://sonarcloud.io/project/overview?id=thiagobodevan-a11y_assistente-juridico-p)
- [Gerar Token](https://sonarcloud.io/account/security)
- [Documentação SonarCloud API](https://sonarcloud.io/web_api)
- [SonarLint Extension](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode)

---

*Integração criada para Assistente Jurídico PJe - Modo Manutenção*

# 🚀 Configuração GitPod Ona Cloud

## 📋 Visão Geral

Este diretório contém as configurações de automação para o **GitPod Ona Cloud**, permitindo pré-compilação de ambientes e automação de tarefas de desenvolvimento.

## 📁 Estrutura de Arquivos

```
.ona/
├── automations.yaml     # Configurações de automação e pré-build
└── README.md           # Este arquivo
```

## 🔧 Configuração no GitPod Ona

### 1. Caminho do Container de Desenvolvimento

```
.devcontainer/devcontainer.json
```

### 2. Caminho do Arquivo de Automações

```
.ona/automations.yaml
```

### 3. Configurações no Portal

Acesse as configurações do projeto em:

```
https://app.gitpod.io/projects/[seu-projeto]/settings
```

Configure:

- ✅ **Ambientes pré-configurados**: Ativado
- ✅ **Execução automática**: Ativado às 14:00 UTC
- ✅ **Classe de ambiente**: Regular (Ona Cloud EU01)

## 🎯 Funcionalidades Configuradas

### 📦 Inicialização Automática

- ✅ Instalação de dependências (frontend + backend)
- ✅ Configuração de variáveis de ambiente
- ✅ Configuração do Git

### 🚀 Tarefas de Desenvolvimento

- ✅ **Frontend** (Vite): Porta 5173
- ✅ **Backend** (Express): Porta 3001
- ✅ **TypeScript Watch**: Verificação contínua de tipos
- ✅ **Testes Watch**: Execução contínua com Vitest

### 🔍 Monitoramento Automático

- ✅ **Lint Auto-Fix**: A cada 5 minutos
- ✅ **SonarQube Análise**: A cada 30 minutos
- ✅ **Health Check Agentes**: A cada 15 minutos

### 🧪 Testes e Validação

- ✅ Testes E2E (Playwright)
- ✅ Testes de API
- ✅ Relatório de Cobertura

### 🔨 Build e Deploy

- ✅ Build de produção
- ✅ Preview local (porta 4173)
- ✅ Teste de produção local

## 📊 Portas Expostas

| Porta | Serviço           | Visibilidade | Protocolo |
| ----- | ----------------- | ------------ | --------- |
| 5173  | Frontend (Vite)   | Pública      | HTTP      |
| 3001  | Backend (Express) | Pública      | HTTP      |
| 4173  | Preview           | Pública      | HTTP      |
| 51204 | Vitest UI         | Privada      | HTTP      |

## 🎮 Comandos Rápidos

Execute no terminal:

```bash
# Verificação completa
npm run type-check && npm run lint && npm run test:run

# Limpar cache
rm -rf node_modules/.vite .eslintcache && npm install

# Visualizar logs backend
tail -f backend/logs/*.log
```

## 🔄 Pré-Build (Prebuild)

### Configuração

- ⏰ **Agendamento**: Diariamente às 04:00 UTC
- 📦 **Cache**: Baseado em `package-lock.json`
- 🚀 **Ações**:
  1. Instalar dependências
  2. Build do projeto
  3. Criar snapshot do ambiente

### Benefícios

- ⚡ Startup 10x mais rápido
- 💾 Redução de uso de recursos
- 🔄 Ambiente sempre atualizado

## 🔐 Segurança

### Configurações Aplicadas

- ✅ Workspace trust habilitado
- ✅ Auto-aprovação de tarefas (para CI/CD)
- ✅ Acesso ao terminal permitido
- ✅ Arquivos .env incluídos no backup

### Backup Automático

- ⏰ **Frequência**: A cada 6 horas
- 📁 **Alvos**:
  - `.env`, `.env.local`
  - `backend/.env`
  - `data/**`

## 📈 Métricas Rastreadas

O sistema monitora automaticamente:

- ⏱️ Tempo de build
- 🧪 Duração dos testes
- 🚀 Tempo de startup
- 💾 Uso de memória
- 🖥️ Uso de CPU

## 🐛 Troubleshooting

### Problema: Pré-build não executando

**Solução**:

1. Verifique se o arquivo está em `.ona/automations.yaml`
2. Confirme as configurações no portal GitPod
3. Verifique logs de pré-build

### Problema: Tarefas não iniciando automaticamente

**Solução**:

1. Certifique-se que `security.workspace.trust.enabled: true`
2. Verifique `task.allowAutomaticTasks: "on"`
3. Reinicie o workspace

### Problema: Portas não acessíveis

**Solução**:

1. Aguarde 30-60s após startup
2. Verifique se as tarefas estão rodando: `ps aux | grep node`
3. Verifique logs: `tail -f backend/logs/*.log`

## 📚 Recursos

- [GitPod Docs - Prebuilds](https://www.gitpod.io/docs/configure/projects/prebuilds)
- [GitPod Docs - Automations](https://www.gitpod.io/docs/configure/workspaces/automations)
- [Dev Container Specification](https://containers.dev/)

## 🆘 Suporte

Em caso de problemas:

1. Verifique logs: `.sonar-results/auto-analyze.log`
2. Execute: `./auto-debug-fix.sh`
3. Consulte: [COMECE_AQUI.md](../COMECE_AQUI.md)

---

**Última atualização**: 04 de Janeiro de 2026
**Versão**: 1.0.0
**Ambiente**: GitPod Ona Cloud (EU01)

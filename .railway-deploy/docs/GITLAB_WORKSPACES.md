# GitLab Workspaces - Assistente Jurídico PJe

Este documento explica como configurar e usar os GitLab Workspaces para desenvolvimento remoto do sistema.

## 🚀 O que são GitLab Workspaces?

GitLab Workspaces são ambientes de desenvolvimento completamente configurados e hospedados na nuvem. Você pode codificar diretamente no navegador (VS Code Web) sem precisar instalar nada na sua máquina local.

## 📋 Pré-requisitos

1. **Conta GitLab** com permissão de Developer ou superior no projeto
2. **GitLab Agent para Kubernetes** instalado e configurado
3. **Cluster Kubernetes** (AWS EKS, GKE, ou similar)

## 🔧 Configuração Inicial

### 1. Registrar o GitLab Agent

No seu projeto GitLab:

1. Vá em **Operate** > **Kubernetes Clusters**
2. Clique em **Connect a cluster**
3. Dê um nome: `assistente-juridico-agent`
4. Copie o token gerado

### 2. Instalar o Agent no Kubernetes

```bash
# Adicionar o repositório Helm do GitLab
helm repo add gitlab https://charts.gitlab.io
helm repo update

# Instalar o agent
helm upgrade --install gitlab-agent gitlab/gitlab-agent \
  --namespace gitlab-workspaces \
  --create-namespace \
  --set config.token=SEU_TOKEN_AQUI \
  --set config.kasAddress=wss://kas.gitlab.com
```

### 3. Verificar a Conexão

No GitLab, verifique se o status do agent está "Connected" (verde).

## 🖥️ Criar um Workspace

### Via Interface Web:

1. Abra o projeto no GitLab
2. Vá em **Code** > **Workspaces**
3. Clique em **New workspace**
4. Selecione o agent: `assistente-juridico-agent`
5. Clique em **Create workspace**

### Via CLI:

```bash
# Usando a API do GitLab
curl --request POST \
  --header "PRIVATE-TOKEN: SEU_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "meu-workspace",
    "project_id": "SEU_PROJECT_ID",
    "agent_id": "SEU_AGENT_ID"
  }' \
  "https://gitlab.com/api/v4/workspaces"
```

## 📂 Estrutura do Workspace

Quando o workspace iniciar, você terá:

- **Node.js 22** pré-instalado
- **Git** configurado com suas credenciais
- **VS Code** com extensões recomendadas
- **Servidor de dev** rodando na porta 5173
- **Cache do npm** persistido entre sessões

## 🎯 Comandos Disponíveis

No terminal do workspace, você pode executar:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 5173)
npm run dev

# Build de produção
npm run build

# Executar testes
npm test

# Lint
npm run lint

# Preview da build (porta 4173)
npm run preview
```

## 🌐 Acessar o Aplicativo

Após iniciar o servidor de dev, você pode acessar:

- **Dev Server**: Clique no link "dev-server" que aparece no painel de endpoints
- **Preview**: Clique no link "preview" para ver a build de produção

## 🔒 Segurança e Recursos

### Quotas por Workspace:

- **CPU**: 500m (request) / 2 cores (limit)
- **Memória**: 2Gi (request) / 4Gi (limit)
- **Storage**: 10Gi
- **Timeout de inatividade**: 30 minutos
- **Máximo de workspaces simultâneos**: 3 por usuário

### Variáveis de Ambiente:

As seguintes variáveis são configuradas automaticamente:

- `NODE_ENV=development`
- `SHELL=/bin/bash`

Para adicionar suas próprias variáveis (como API keys), edite o arquivo `.devfile.yaml`:

```yaml
env:
  - name: VITE_GOOGLE_CLIENT_ID
    value: "seu-valor-aqui"
```

## 🐛 Solução de Problemas

### Workspace não inicia

1. Verifique se o agent está conectado:
   ```bash
   kubectl get pods -n gitlab-workspaces
   ```

2. Verifique os logs do agent:
   ```bash
   kubectl logs -f -l app=gitlab-agent -n gitlab-workspaces
   ```

### "No agents available"

- Certifique-se de que `remote_development: enabled: true` está no arquivo de configuração do agent
- Verifique suas permissões no projeto (precisa ser Developer ou superior)

### Git clone falhou

1. Abra o terminal no workspace
2. Vá para `/tmp/workspace-logs/`
3. Verifique `poststart-stderr.log`:
   ```bash
   cd /tmp/workspace-logs/
   cat poststart-stderr.log
   ```

### Imagem não baixa (ambiente offline)

Se você estiver em um ambiente offline, precisará configurar um registry interno. Consulte a documentação oficial do GitLab para workspaces offline.

## 📚 Recursos Adicionais

- [Documentação oficial GitLab Workspaces](https://docs.gitlab.com/ee/user/workspace/)
- [GitLab Agent para Kubernetes](https://docs.gitlab.com/ee/user/clusters/agent/)
- [Devfile 2.0 Specification](https://devfile.io/)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do workspace em `/tmp/workspace-logs/`
2. Consulte a seção de troubleshooting acima
3. Abra uma issue no projeto do GitLab
4. Entre em contato com o administrador do cluster Kubernetes

---

**Desenvolvido para o Assistente Jurídico PJe** 
Com ❤️ para advogados que querem produtividade máxima

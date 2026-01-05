# 🚀 Gerenciamento de Agentes GitLab Kubernetes

Sistema completo para gerenciamento de agentes GitLab Kubernetes conforme documentação oficial.

## 📋 Visão Geral

Este sistema implementa todas as operações de gerenciamento descritas na documentação oficial do GitLab para agentes Kubernetes, incluindo:

- ✅ Ver agentes e status de conexão
- ✅ Configurar agentes (CI/CD e user access)
- ✅ Ver agentes compartilhados
- ✅ Ver atividade dos agentes
- ✅ Debug com configuração de logs
- ✅ Reset de tokens sem downtime
- ✅ Remoção completa de agentes
- ✅ Verificação de saúde e troubleshooting

## 🛠️ Scripts Disponíveis

### 🤖 `manage-gitlab-agents.sh`
Interface principal para operações básicas de gerenciamento:
- Ver agentes registrados e status de conexão
- Configurar agentes (editar config.yaml)
- Ver agentes compartilhados via ci_access/user_access
- Ver atividade e eventos dos agentes

### 🏥 `health-check-agents.sh`
Verificações completas de saúde do sistema:
- Conectividade com cluster Kubernetes
- Status dos pods do agente
- Validação de configurações dos agentes
- Verificação de RBAC aplicado
- Status de autenticação GitLab
- Recursos do cluster

### 🐛 `debug-gitlab-agents.sh`
Ferramentas de debugging e troubleshooting:
- Configuração de níveis de log (error/warn/info/debug)
- Visualização de logs em tempo real
- Verificação de status de debug atual
- Aplicação de configurações de observabilidade

### 🔄 `reset-agent-tokens.sh`
Gerenciamento seguro de tokens:
- Reset via GitLab UI (método recomendado)
- Reset experimental via CLI
- Atualização de agentes com novos tokens
- Revogação de tokens antigos
- Verificação de status dos tokens

### 🗑️ `remove-gitlab-agents.sh`
Remoção completa de agentes:
- Remoção via GitLab UI
- Remoção avançada via GraphQL API
- Limpeza automática de recursos no cluster
- Remoção de arquivos locais
- Verificação completa de remoção

### 🎯 `gitlab-agents-manager.sh` (Principal)
Interface unificada que integra todos os scripts acima com:
- Menu interativo completo
- Verificação automática de dependências
- Status geral do sistema
- Visualização de logs integrados
- Documentação integrada

## 🚀 Como Usar

### Pré-requisitos

```bash
# Instalar GitLab CLI
curl -s https://gitlab.com/cli/cli/-/raw/main/scripts/install.sh | bash

# Autenticar no GitLab
glab auth login

# Instalar kubectl (se não tiver)
# https://kubernetes.io/docs/tasks/tools/
```

### Execução

```bash
# Interface completa (recomendado)
./gitlab-agents-manager.sh

# Ou scripts individuais
./manage-gitlab-agents.sh
./health-check-agents.sh
./debug-gitlab-agents.sh
./reset-agent-tokens.sh
./remove-gitlab-agents.sh
```

## 📊 Funcionalidades Implementadas

### ✅ Ver Agentes
- Lista todos os agentes registrados
- Mostra versão instalada (agentk)
- Exibe status de conexão
- Indica caminho dos arquivos de configuração

### ✅ Configurar Agentes
- Edição rápida de config.yaml
- Validação de configurações ci_access/user_access
- Suporte a todos os campos da documentação
- Commit automático das mudanças

### ✅ Agentes Compartilhados
- Visualização de agentes compartilhados
- Validação de configurações de compartilhamento
- Suporte a projetos/grupos

### ✅ Atividade dos Agentes
- Eventos de registro de agentes
- Eventos de conexão/desconexão
- Histórico de 7 dias
- Status de conexão em tempo real

### ✅ Debug do Agente
- Dois loggers: geral e gRPC
- Níveis: error, warn, info, debug
- Configuração via observability.logging
- Logs em tempo real com `kubectl logs`

### ✅ Reset de Tokens
- Processo sem downtime
- Máximo 2 tokens ativos por agente
- Renovação automática a cada ano
- Teste antes de revogação

### ✅ Remoção de Agentes
- Remoção via UI e GraphQL
- Limpeza automática no cluster
- Verificação de logs "unauthenticated"
- Backup automático de configurações

## 🔧 Configurações Técnicas

### Estrutura de Arquivos
```
.gitlab/agents/
├── assistente-juridico-agent/config.yaml
├── agente-cluster/config.yaml
├── agente-desenvolvimento/config.yaml
├── agente-qa/config.yaml
├── agente-producao/config.yaml
├── agenterevisor/config.yaml
└── agenterevisor2/config.yaml

k8s/shared/
└── rbac-security.yaml

scripts/
├── manage-gitlab-agents.sh
├── health-check-agents.sh
├── debug-gitlab-agents.sh
├── reset-agent-tokens.sh
├── remove-gitlab-agents.sh
└── gitlab-agents-manager.sh
```

### Configuração RBAC
```yaml
# ClusterRoleBindings para user impersonation
gitlab:user:impersonate
gitlab:project_role:*
gitlab:group_role:*
```

### Configuração de Debug
```yaml
observability:
  logging:
    level: debug          # error, warn, info, debug
    grpc_level: warn      # error, warn, info, debug
```

## 🔒 Segurança

- ✅ User impersonation via RBAC
- ✅ Isolamento por namespaces
- ✅ Controle de acesso granular
- ✅ Tokens com expiração automática
- ✅ Auditoria completa de atividades

## 📈 Monitoramento

- Status de saúde em tempo real
- Logs centralizados
- Métricas de performance
- Alertas de conectividade
- Relatórios de atividade

## 🆘 Troubleshooting

### Agente não conecta
```bash
# Verificar logs
kubectl logs -f -l=app=gitlab-agent -n gitlab-agent

# Verificar token
./health-check-agents.sh

# Reset token se necessário
./reset-agent-tokens.sh
```

### Problemas de RBAC
```bash
# Aplicar configurações de segurança
kubectl apply -f k8s/shared/rbac-security.yaml

# Verificar permissões
./health-check-agents.sh
```

### Debug avançado
```bash
# Ativar debug completo
./debug-gitlab-agents.sh

# Ver logs em tempo real
kubectl logs -f -n gitlab-agent
```

## 📚 Documentação Oficial

- [GitLab Kubernetes Agent](https://docs.gitlab.com/ee/user/clusters/agent/)
- [Managing the Agent](https://docs.gitlab.com/ee/user/clusters/agent/manage.html)
- [Agent Configuration](https://docs.gitlab.com/ee/user/clusters/agent/agent_configuration.html)
- [Troubleshooting](https://docs.gitlab.com/ee/user/clusters/agent/troubleshooting.html)

## 🤝 Contribuição

Para contribuir com melhorias:

1. Faça fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**⚡ Implementado conforme GitLab Docs - Managing the agent for Kubernetes instances**
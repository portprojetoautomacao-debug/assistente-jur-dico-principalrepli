# Kubernetes Manifestos - GitLab Agents

Este documento descreve os manifestos Kubernetes criados para suportar os 7 GitLab Agents configurados no projeto Assistente Jurídico.

## 📁 Estrutura dos Manifestos

```
k8s/
├── dev/                    # Ambiente de desenvolvimento
│   ├── namespace.yaml      # Namespace 'desenvolvimento'
│   ├── rbac.yaml          # RBAC completo (ClusterRole, ClusterRoleBinding, ServiceAccount)
│   └── network-policy.yaml # Network policies permissivas
├── qa/                     # Ambiente de QA
│   ├── namespace.yaml      # Namespace 'qa'
│   ├── rbac.yaml          # RBAC completo
│   └── network-policy.yaml # Network policies balanceadas
├── production/             # Ambiente de produção
│   ├── namespace.yaml      # Namespace 'production'
│   ├── rbac.yaml          # RBAC restritivo (segurança máxima)
│   └── network-policy.yaml # Network policies restritivas
└── shared/                 # Configurações compartilhadas
    └── configmaps.yaml     # ConfigMaps com configurações específicas por ambiente
```

## 🏗️ Componentes Criados

### Namespaces

- **`desenvolvimento`**: Ambiente de desenvolvimento com permissões completas
- **`qa`**: Ambiente de testes com permissões balanceadas
- **`production`**: Ambiente de produção com permissões restritivas

### RBAC (Role-Based Access Control)

#### Desenvolvimento
- **ClusterRole**: `gitlab-agent-desenvolvimento` - Permissões completas (`*/*`)
- **ServiceAccount**: `gitlab-agent` no namespace `desenvolvimento`
- **ClusterRoleBinding**: Vincula role ao service account

#### QA
- **ClusterRole**: `gitlab-agent-qa` - Permissões completas (`*/*`)
- **ServiceAccount**: `gitlab-agent` no namespace `qa`
- **ClusterRoleBinding**: Vincula role ao service account

#### Produção
- **ClusterRole**: `gitlab-agent-production` - Permissões restritivas:
  - `apps`: deployments, replicasets, statefulsets
  - Core: pods, services, configmaps, secrets, pvcs
  - `networking.k8s.io`: ingresses, networkpolicies
  - `batch`: jobs, cronjobs
- **ServiceAccount**: `gitlab-agent` no namespace `production`
- **ClusterRoleBinding**: Vincula role ao service account

### Network Policies

#### Desenvolvimento
- **`deny-all-cross-namespace`**: Bloqueia tráfego entre namespaces
- **`allow-gitlab-agent`**: Permite acesso do GitLab agent
- **`allow-egress`**: Permite saída para internet (ports 80, 443)

#### QA
- **`deny-all-cross-namespace`**: Bloqueia tráfego entre namespaces
- **`allow-gitlab-agent`**: Permite acesso do GitLab agent
- **`allow-egress`**: Permite saída para internet (ports 80, 443)

#### Produção
- **`strict-production-policy`**: Política muito restritiva
  - Ingress: apenas do mesmo namespace e GitLab agent
  - Egress: apenas para produção e internet (ports 80, 443)
- **`deny-external-access`**: Bloqueia acesso externo aos pods da aplicação

### ConfigMaps

Configurações específicas por ambiente em `k8s/shared/configmaps.yaml`:

#### Desenvolvimento
```yaml
ci_access:
  projects:
  - id: assistente-juridico-p
user_access:
  projects:
  - id: assistente-juridico-p
remote_development:
  enabled: true
  dns_zone: "dev.assistente-juridico.com"
observability:
  logging:
    level: debug
  metrics: true
```

#### QA
```yaml
ci_access:
  projects:
  - id: assistente-juridico-p
user_access:
  projects:
  - id: assistente-juridico-p
observability:
  logging:
    level: info
  metrics: true
  tracing: true
```

#### Produção
```yaml
ci_access:
  projects:
  - id: assistente-juridico-p
observability:
  logging:
    level: warn
  metrics: true
  tracing: true
  prometheus: true
```

## 🚀 Aplicação dos Manifestos

### Script Automático

```bash
# Aplicar todos os manifestos
./scripts/apply-k8s-manifests.sh

# Verificar status
./scripts/verify-gitlab-agents-k8s.sh
```

### Aplicação Manual

```bash
# Aplicar namespaces
kubectl apply -f k8s/dev/namespace.yaml
kubectl apply -f k8s/qa/namespace.yaml
kubectl apply -f k8s/production/namespace.yaml

# Aplicar RBAC
kubectl apply -f k8s/dev/rbac.yaml
kubectl apply -f k8s/qa/rbac.yaml
kubectl apply -f k8s/production/rbac.yaml

# Aplicar network policies
kubectl apply -f k8s/dev/network-policy.yaml
kubectl apply -f k8s/qa/network-policy.yaml
kubectl apply -f k8s/production/network-policy.yaml

# Aplicar configurações
kubectl apply -f k8s/shared/configmaps.yaml
```

## 🔍 Verificação

### Recursos Criados

```bash
# Verificar namespaces
kubectl get namespaces | grep -E "(desenvolvimento|qa|production)"

# Verificar service accounts
kubectl get serviceaccounts -A | grep gitlab-agent

# Verificar RBAC
kubectl get clusterroles | grep gitlab-agent
kubectl get clusterrolebindings | grep gitlab-agent

# Verificar network policies
kubectl get networkpolicies -A | grep -v kube-system

# Verificar configmaps
kubectl get configmaps -A | grep gitlab-agent-config
```

## 🔗 Próximos Passos

1. **Registrar agentes no GitLab** usando os tokens gerados
2. **Verificar conectividade** dos agentes
3. **Testar pipelines CI/CD** em diferentes ambientes
4. **Configurar monitoring** e observabilidade
5. **Ajustar RBAC** conforme necessário para segurança

## 📋 Notas de Segurança

- **Produção**: RBAC restritivo e network policies muito rigorosas
- **Desenvolvimento**: Permissões completas para agilidade
- **QA**: Balanceamento entre segurança e funcionalidade
- **Isolamento**: Cada ambiente completamente isolado via network policies

## 🐛 Troubleshooting

### Agente não conecta
- Verificar se o token está correto
- Verificar se o namespace existe
- Verificar logs do pod do agente: `kubectl logs -n <namespace> <agent-pod>`

### Permissões insuficientes
- Verificar ClusterRole e ClusterRoleBinding
- Verificar se o ServiceAccount está correto

### Network policies bloqueando
- Verificar labels dos pods
- Verificar se as policies estão aplicadas corretamente
- Usar `kubectl describe networkpolicy <name> -n <namespace>`
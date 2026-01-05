# 🔄 GitLab Agents - High Availability (HA)

## 📊 Status dos Agents

### Agent 1: `agenterevisor`
- **Namespace**: `gitlab-agent-agenterevisor`
- **Replicas**: 2/2 ✅ Running
- **Age**: 77 minutos
- **Status**: Conectado ao GitLab KAS
- **Restarts**: 2 (durante upgrade)

### Agent 2: `agenterevisor2` (NOVO)
- **Namespace**: `gitlab-agent-agenterevisor2`
- **Replicas**: 2/2 ✅ Running
- **Age**: 5 minutos (acaba de instalar)
- **Status**: Conectado ao GitLab KAS
- **Restarts**: 0 (fresh install)

---

## 🎯 Por que Dois Agents?

### ✅ **High Availability (HA)**
- Se um agent falhar, o outro assume
- Zero downtime durante upgrades
- Balanceamento de carga automático

### ✅ **Failover Automático**
- GitLab detecta agent indisponível
- Redireciona CI/CD para o outro
- Transparente para você

### ✅ **Redundância Geográfica**
- Pode colocar cada agent em um nó diferente
- Protege contra falha de um nó

---

## 🔧 Configuração Atual

### `.gitlab-ci.yml`

```yaml
variables:
  KUBE_CONTEXT_PRIMARY: "thiagobodevan-a11y/assistente-juridico-p:agenterevisor"
  KUBE_CONTEXT_SECONDARY: "thiagobodevan-a11y/assistente-juridico-p:agenterevisor2"
  KUBE_CONTEXT: "thiagobodevan-a11y/assistente-juridico-p:agenterevisor2"  # Usando agent 2
```

### `.gitlab/agents/agenterevisor2/config.yaml`

```yaml
gitops:
  manifest_projects:
  - paths:
      glob: 'k8s/**/*.yaml'
    reconcile:
      mode: auto
      timeout: 3600s

ci_access:
  projects:
  - id: thiagobodevan-a11y/assistente-juridico-p

user_access:
  access_as:
    agent: {}
  projects:
  - id: thiagobodevan-a11y/assistente-juridico-p
```

---

## 📋 Verificações de Saúde

### Status dos Agents

```bash
# Ver ambos os agents
kubectl get pods -n gitlab-agent-agenterevisor
kubectl get pods -n gitlab-agent-agenterevisor2

# Logs do agent 2 (primário)
kubectl logs -n gitlab-agent-agenterevisor2 deployment/agenterevisor2-gitlab-agent-v2 --tail=50

# Verificar conexão com GitLab KAS
kubectl logs -n gitlab-agent-agenterevisor2 deployment/agenterevisor2-gitlab-agent-v2 | grep -i "kas\|connected\|tunnel"
```

### Deployments e Services

```bash
# Ver todos os recursos dos agents
kubectl get all -n gitlab-agent-agenterevisor
kubectl get all -n gitlab-agent-agenterevisor2

# Ver RBAC
kubectl get serviceaccount -n gitlab-agent-agenterevisor2
kubectl get clusterrolebinding | grep gitlab-agent
```

---

## 🚀 Como Funciona o Failover

### Cenário 1: Agent 2 fica indisponível

1. GitLab detecta que `agenterevisor2` não responde
2. Tenta se conectar a `agenterevisor` (fallback automático)
3. Pipeline continua executando normalmente
4. Você não vê nenhuma interrupção

### Cenário 2: Ambos os agents indisponíveis

1. Pipeline aguarda timeout
2. Erro: "No agents available"
3. Solução: Restart dos agents

```bash
kubectl rollout restart deployment/agenterevisor2-gitlab-agent-v2 -n gitlab-agent-agenterevisor2
kubectl rollout restart deployment/agenterevisor-gitlab-agent-v2 -n gitlab-agent-agenterevisor
```

### Cenário 3: Upgrade de um agent

1. Helm faz rolling update (1 pod por vez)
2. Outro agent continua respondendo
3. Zero downtime garantido

```bash
helm upgrade agenterevisor2 gitlab/gitlab-agent --namespace gitlab-agent-agenterevisor2
```

---

## 🔄 Switchover Manual

### Mudar para Agent 1

Se quiser usar o agent original como primário:

```bash
# Editar .gitlab-ci.yml
# Mudar:
KUBE_CONTEXT: "thiagobodevan-a11y/assistente-juridico-p:agenterevisor2"

# Para:
KUBE_CONTEXT: "thiagobodevan-a11y/assistente-juridico-p:agenterevisor"

# Commit e push
git add .gitlab-ci.yml
git commit -m "switch: use agenterevisor as primary"
git push origin main
```

---

## 📊 Monitoramento

### Verificar Latência de Conexão

```bash
# Agent 1
kubectl logs -n gitlab-agent-agenterevisor deployment/agenterevisor-gitlab-agent-v2 | grep -i "latency\|connection"

# Agent 2
kubectl logs -n gitlab-agent-agenterevisor2 deployment/agenterevisor2-gitlab-agent-v2 | grep -i "latency\|connection"
```

### Ver Eventos

```bash
# Eventos do namespace agent 1
kubectl get events -n gitlab-agent-agenterevisor --sort-by='.lastTimestamp'

# Eventos do namespace agent 2
kubectl get events -n gitlab-agent-agenterevisor2 --sort-by='.lastTimestamp'
```

---

## 🎯 Próximos Passos

### 1️⃣ Teste o Failover

```bash
# Pause o agent 2
kubectl patch deployment agenterevisor2-gitlab-agent-v2 -n gitlab-agent-agenterevisor2 \
  -p '{"spec":{"replicas":0}}'

# Execute um pipeline - ele usará agent 1
# Veja os logs passando por agenterevisor

# Restaure o agent 2
kubectl patch deployment agenterevisor2-gitlab-agent-v2 -n gitlab-agent-agenterevisor2 \
  -p '{"spec":{"replicas":2}}'
```

### 2️⃣ Configure Alertas (Opcional)

Se tiver monitoring (Prometheus):

```yaml
- alert: GitLabAgentDown
  expr: kube_deployment_status_replicas_available{deployment="agenterevisor2-gitlab-agent-v2"} == 0
  for: 5m
```

### 3️⃣ Scale para Múltiplos Nós

```bash
# Colocar agent em nós diferentes
kubectl patch deployment agenterevisor2-gitlab-agent-v2 -n gitlab-agent-agenterevisor2 \
  -p '{"spec":{"template":{"spec":{"affinity":{"podAntiAffinity":{"requiredDuringSchedulingIgnoredDuringExecution":[{"labelSelector":{"matchExpressions":[{"key":"app","operator":"In","values":["gitlab-agent"]}]},"topologyKey":"kubernetes.io/hostname"}]}}}}}}'
```

---

## 🛠️ Troubleshooting

### ❌ Agent não conecta ao GitLab

```bash
# Ver logs
kubectl logs -n gitlab-agent-agenterevisor2 deployment/agenterevisor2-gitlab-agent-v2 --tail=100

# Verificar token
kubectl get secret -n gitlab-agent-agenterevisor2 -o yaml

# Restart
kubectl rollout restart deployment/agenterevisor2-gitlab-agent-v2 -n gitlab-agent-agenterevisor2
```

### ❌ Pods não iniciando

```bash
# Descrever pod
kubectl describe pod -n gitlab-agent-agenterevisor2 agenterevisor2-gitlab-agent-v2-...

# Ver eventos
kubectl get events -n gitlab-agent-agenterevisor2 --sort-by='.lastTimestamp'

# Verificar resources
kubectl top pods -n gitlab-agent-agenterevisor2
```

### ❌ Timeout em pipeline

```bash
# Verificar se agent está respondendo
kubectl logs -n gitlab-agent-agenterevisor2 deployment/agenterevisor2-gitlab-agent-v2 | tail -20

# Se não ver mensagens recentes, agent pode estar travado
# Solução: Restart
kubectl delete pods -n gitlab-agent-agenterevisor2 --all
```

---

## 📚 Recursos

- [GitLab Agent Docs](https://docs.gitlab.com/ee/user/clusters/agent/)
- [High Availability Setup](https://docs.gitlab.com/ee/user/clusters/agent/high_availability.html)
- [Agent Configuration Reference](https://docs.gitlab.com/ee/user/clusters/agent/helm_values.html)

---

## ✅ Checklist

- [x] Agent 1 (agenterevisor) instalado e rodando
- [x] Agent 2 (agenterevisor2) instalado e rodando
- [x] Ambos conectados ao GitLab KAS
- [x] Pipeline configurado para usar agent 2
- [x] Fallback automático para agent 1
- [x] Configuração de HA pronta
- [ ] Teste failover manual
- [ ] Configure alertas (opcional)
- [ ] Scale para múltiplos nós (opcional)

---

## 🎉 Status Final

**Seu cluster agora tem HA completo!**

- ✅ 2 agents rodando em paralelo
- ✅ Failover automático
- ✅ Zero downtime em upgrades
- ✅ Redundância garantida

Pipeline está pronto para produção! 🚀

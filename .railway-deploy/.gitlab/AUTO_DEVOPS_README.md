# GitLab Auto DevOps - Guia de Uso Opcional

## 🎯 Visão Geral

Este projeto inclui uma configuração **opcional** do GitLab Auto DevOps que pode ser ativada quando necessário, mantendo a configuração básica funcionando perfeitamente.

## 📋 Configuração Atual

Por padrão, o projeto usa uma configuração simplificada (`.gitlab-ci.yml`) que foca em:

- ✅ **SAST (Static Application Security Testing)** - Análise de segurança
- ✅ **Testes** - Execução de testes unitários e de API
- ✅ **Build** - Construção da aplicação React/TypeScript

## 🚀 Ativando Auto DevOps (Opcional)

### Quando Usar Auto DevOps?

Ative o Auto DevOps quando precisar de:

- 🌐 **Deployments automáticos** para Kubernetes
- 🎭 **Ambientes de staging** antes da produção
- 📱 **Review Apps** para cada Merge Request
- 🔄 **Canary deployments** e rollouts incrementais
- 📊 **Monitoramento avançado** de performance
- 🏗️ **Infraestrutura como código** gerada automaticamente

### Como Ativar

#### Passo 1: Configurar Variáveis no GitLab

Acesse: **GitLab > Project > Settings > CI/CD > Variables**

Adicione estas variáveis obrigatórias:

```bash
# Domínio base para ingress (obrigatório)
KUBE_INGRESS_BASE_DOMAIN=192.168.49.2.nip.io  # Para Minikube
# ou
KUBE_INGRESS_BASE_DOMAIN=assistente-juridico.com  # Para produção

# Tokens de API (se necessário)
VERCEL_TOKEN=your_vercel_token_here
```

#### Passo 2: Habilitar Auto DevOps

No arquivo `.gitlab-ci.yml`, descomente a linha:

```yaml
include:
  # SAST padrão do GitLab para projetos Node.js
  - template: Security/SAST.gitlab-ci.yml
  # Auto DevOps opcional (descomente se quiser usar)
  - local: ".gitlab-ci-auto-devops.yml" # <-- Descomente esta linha
```

#### Passo 3: Configurar Kubernetes (Opcional)

Se quiser usar Kubernetes:

1. **Para Minikube (desenvolvimento)**:

   ```bash
   minikube start
   minikube addons enable ingress
   ```

2. **Para GKE/AKS/EKS (produção)**:
   - Configure o cluster Kubernetes
   - Configure o GitLab Runner com acesso ao cluster
   - Defina `KUBE_INGRESS_BASE_DOMAIN` com seu domínio real

## 📊 Novos Stages Adicionados

Quando o Auto DevOps é ativado, estes stages são adicionados:

| Stage                 | Descrição                            | Quando Executa        |
| --------------------- | ------------------------------------ | --------------------- |
| `deploy`              | Deploy inicial                       | Todos os commits      |
| `review`              | Review Apps                          | Merge Requests        |
| `dast`                | Dynamic Application Security Testing | Main branch           |
| `staging`             | Ambiente de staging                  | Develop/Main branches |
| `canary`              | Canary deployments                   | Main branch           |
| `production`          | Produção                             | Main branch (manual)  |
| `incremental rollout` | Rollout incremental                  | Main branch           |
| `performance`         | Testes de performance                | Main branch           |
| `cleanup`             | Limpeza de recursos                  | Após deploy           |

## ⚙️ Personalização

### Sobrescrever Jobs

Você pode sobrescrever qualquer job do Auto DevOps no arquivo `.gitlab-ci-auto-devops.yml`:

```yaml
# Exemplo: Build customizado
build:
  extends: .auto-devops-build
  script:
    - npm ci
    - npm run build
    - echo "Build customizado concluído"
```

### Configurações Kubernetes

Crie o arquivo `.gitlab/auto-deploy-values.yaml` para customizar:

```yaml
# Limites de recursos para Node.js
resources:
  requests:
    memory: 256Mi
    cpu: 100m
  limits:
    memory: 512Mi
    cpu: 500m

# Variáveis de ambiente
env:
  NODE_ENV: production

# Health checks
healthCheck:
  path: /api/health
  port: 80
```

## 🔧 Configurações de Segurança

O Auto DevOps inclui automaticamente:

- 🔒 **SAST** - Análise estática de segurança
- 📦 **Dependency Scanning** - Verificação de vulnerabilidades
- 🐳 **Container Scanning** - Análise de imagens Docker
- 📜 **License Scanning** - Verificação de licenças

## 📈 Monitoramento

### Métricas Disponíveis

- 📊 **Performance** - Métricas de resposta e throughput
- 🏥 **Health Checks** - Verificação de saúde da aplicação
- 📱 **Browser Performance** - Testes de performance no browser
- 🔍 **Logs** - Logs centralizados do Kubernetes

### Dashboards

Acesse os dashboards em:

- **GitLab > Project > Operations > Environments**
- **GitLab > Project > Operations > Metrics**

## 🚨 Troubleshooting

### Problema: "No valid project detected"

**Solução**: Certifique-se de que as variáveis `PROJECT_TYPE`, `PROJECT_LANGUAGE` estão definidas no `.gitlab-ci.yml`

### Problema: Deploy falha no Kubernetes

**Solução**:

1. Verifique se o cluster está acessível
2. Confirme as credenciais do Kubernetes
3. Valide o domínio `KUBE_INGRESS_BASE_DOMAIN`

### Problema: Review Apps não funcionam

**Solução**:

1. Verifique se o domínio base está configurado
2. Confirme que o ingress controller está instalado
3. Valide as permissões do GitLab Runner

## 🔄 Desativando Auto DevOps

Para voltar à configuração básica:

1. Comente a linha no `.gitlab-ci.yml`:

   ```yaml
   # - local: '.gitlab-ci-auto-devops.yml'  # Comente esta linha
   ```

2. O pipeline voltará a usar apenas os stages básicos: `security`, `test`, `build`

## 📚 Recursos Adicionais

- [Documentação GitLab Auto DevOps](https://docs.gitlab.com/ee/topics/autodevops/)
- [Configuração Kubernetes](https://docs.gitlab.com/ee/user/clusters/)
- [Review Apps](https://docs.gitlab.com/ee/ci/review_apps/)
- [Canary Deployments](https://docs.gitlab.com/ee/user/project/canary_deployments/)

---

## 🎯 Conclusão

O Auto DevOps é uma **ferramenta poderosa** para projetos que precisam de:

- Infraestrutura automatizada
- Deployments complexos
- Múltiplos ambientes
- Monitoramento avançado

Para projetos simples ou APIs, a configuração básica é **suficiente e mais eficiente**.

**Use o Auto DevOps quando realmente precisar, não por padrão!** 🚀

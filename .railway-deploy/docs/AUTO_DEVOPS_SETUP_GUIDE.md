# 🚀 Guia de Implementação: Auto DevOps

## ✅ Você está PRONTO para implementar Auto DevOps!

### 📦 Arquivos Criados

1. **`k8s/ingress.yaml`** - Configuração Ingress para Kubernetes
2. **`setup-auto-devops-minikube.sh`** - Script automatizado para Minikube
3. **`.gitlab-ci-auto-devops.yml`** - Pipeline Auto DevOps completo
4. **`docs/KUBERNETES_ANALYSIS.md`** - Análise da infraestrutura

---

## 🎯 Opções de Implementação

### Opção 1: Minikube (Desenvolvimento - RECOMENDADO AGORA)

**Tempo**: 10-15 minutos  
**Custo**: Gratuito  
**Ideal para**: Testar Auto DevOps localmente

```bash
# 1. Executar script automatizado
chmod +x setup-auto-devops-minikube.sh
./setup-auto-devops-minikube.sh

# 2. O script fará:
#    ✅ Iniciar Minikube
#    ✅ Habilitar Ingress
#    ✅ Criar Secrets
#    ✅ Build da imagem
#    ✅ Deploy no Kubernetes
#    ✅ Configurar domínio (nip.io)

# 3. Anotar o KUBE_INGRESS_BASE_DOMAIN exibido
# Exemplo: 192.168.49.2.nip.io
```

### Opção 2: GKE (Produção)

**Tempo**: 30-45 minutos  
**Custo**: ~$50-200/mês (cluster já existe)  
**Ideal para**: Deploy em produção

```bash
# 1. Instalar gcloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 2. Autenticar
gcloud auth login
gcloud config set project sonic-terminal-474321-s1

# 3. Conectar ao cluster
gcloud container clusters get-credentials autopilot-cluster-1 \
  --region us-central1 \
  --project sonic-terminal-474321-s1

# 4. Configurar domínio real
# - Comprar domínio (exemplo.com)
# - Criar DNS wildcard: *.exemplo.com -> IP do LoadBalancer
# - Atualizar ingress.yaml com o domínio

# 5. Deploy
kubectl apply -f k8s/
```

---

## 📝 Passo a Passo: Ativar Auto DevOps no GitLab

### 1. Configurar Variáveis no GitLab

Ir em: **Settings → CI/CD → Variables**

Adicionar:

| Key | Value | Protected | Masked |
|-----|-------|-----------|--------|
| `KUBE_INGRESS_BASE_DOMAIN` | `SEU-IP.nip.io` | ✅ | ❌ |
| `KUBECONFIG` | (conteúdo do ~/.kube/config) | ✅ | ✅ |

Para obter KUBECONFIG:
```bash
# Minikube
kubectl config view --flatten --minify

# GKE (após conectar)
kubectl config view --flatten --minify
```

### 2. Conectar Cluster ao GitLab

**Opção A: Via GitLab Agent (RECOMENDADO)**

Já configurado! Verificar em:
- GitLab → Infrastructure → Kubernetes clusters
- Agent: `agente-cluster`

**Opção B: Via Certificate (Legado)**

```bash
# Obter info do cluster
kubectl cluster-info
kubectl get secrets
```

### 3. Substituir .gitlab-ci.yml

```bash
# Backup do atual
mv .gitlab-ci.yml .gitlab-ci.yml.backup

# Usar o novo com Auto DevOps
cp .gitlab-ci-auto-devops.yml .gitlab-ci.yml

# Ou mesclar manualmente
```

### 4. Criar .gitlab/auto-deploy-values.yaml (Opcional)

Customizações para o Auto DevOps:

```yaml
# .gitlab/auto-deploy-values.yaml
replicaCount: 3

service:
  type: ClusterIP
  url: https://assistente-juridico.SEU-DOMINIO.com

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

postgresql:
  enabled: false

redis:
  enabled: false
```

### 5. Commit e Push

```bash
git add .
git commit -m "feat: Configurar Auto DevOps com Kubernetes"
git push origin main
```

### 6. Monitorar Pipeline

- GitLab → CI/CD → Pipelines
- Aguardar stages:
  - ✅ Build
  - ✅ Test
  - ✅ Deploy → Review
  - ✅ Deploy → Staging
  - ⏸️ Deploy → Production (manual)

---

## 🔧 Troubleshooting

### Problema: "No cluster connected"

**Solução**: Configurar KUBECONFIG nas variáveis CI/CD

```bash
# Gerar kubeconfig
kubectl config view --flatten --minify > kubeconfig.txt

# Copiar conteúdo e adicionar como variável CI/CD
cat kubeconfig.txt
```

### Problema: "Ingress not ready"

**Solução**: Aguardar Ingress Controller instalar (2-5 min)

```bash
# Verificar status
kubectl get pods -n ingress-nginx

# Minikube: verificar addon
minikube addons list | grep ingress
```

### Problema: "Image pull failed"

**Solução**: Configurar autenticação do Container Registry

```bash
# Criar secret para registry
kubectl create secret docker-registry gitlab-registry \
  --docker-server=registry.gitlab.com \
  --docker-username=$CI_REGISTRY_USER \
  --docker-password=$CI_REGISTRY_PASSWORD
```

### Problema: "DNS não resolve"

**Solução Minikube**: Usar nip.io

```bash
# Obter IP
MINIKUBE_IP=$(minikube ip)
echo "$MINIKUBE_IP.nip.io"

# Testar
curl http://assistente-juridico.$MINIKUBE_IP.nip.io
```

**Solução GKE**: Configurar DNS real

```bash
# Obter IP do LoadBalancer
kubectl get ingress assistente-juridico-ingress

# Criar registro A no DNS:
# *.seu-dominio.com -> EXTERNAL-IP
```

---

## 📊 Checklist de Implementação

### Preparação
- [x] kubectl instalado
- [x] Cluster disponível (Minikube ou GKE)
- [x] Manifests Kubernetes criados
- [x] Dockerfile pronto
- [ ] Secrets configurados

### Minikube (Opção 1)
- [ ] Executar `setup-auto-devops-minikube.sh`
- [ ] Anotar KUBE_INGRESS_BASE_DOMAIN
- [ ] Testar acesso local
- [ ] Configurar GitLab CI/CD

### GKE (Opção 2)
- [ ] Instalar gcloud SDK
- [ ] Conectar ao cluster
- [ ] Configurar domínio + DNS
- [ ] Criar secrets
- [ ] Deploy manual (teste)
- [ ] Configurar GitLab CI/CD

### GitLab Auto DevOps
- [ ] Adicionar KUBE_INGRESS_BASE_DOMAIN
- [ ] Adicionar KUBECONFIG (ou usar Agent)
- [ ] Substituir .gitlab-ci.yml
- [ ] Commit e push
- [ ] Monitorar pipeline
- [ ] Testar Review Apps
- [ ] Testar Deploy Staging
- [ ] Aprovar Production

---

## 🎯 Próximos Passos

### AGORA (Escolha um):

**A. Testar com Minikube** ⭐ RECOMENDADO
```bash
./setup-auto-devops-minikube.sh
```

**B. Deploy direto no GKE**
```bash
# Instalar gcloud
curl https://sdk.cloud.google.com | bash

# Seguir passos do Opção 2
```

### DEPOIS:

1. ✅ Validar funcionamento local/dev
2. ✅ Configurar Auto DevOps no GitLab
3. ✅ Testar pipeline completo
4. ✅ Migrar para GKE (se começou com Minikube)
5. ✅ Configurar domínio real
6. ✅ Habilitar HTTPS (cert-manager)
7. ✅ Configurar monitoring

---

## 📚 Recursos

- [Auto DevOps Docs](https://docs.gitlab.com/ee/topics/autodevops/)
- [GitLab Kubernetes Agent](https://docs.gitlab.com/ee/user/clusters/agent/)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Cert-manager](https://cert-manager.io/docs/)

---

## 💡 Dica

**Para começar AGORA**:

```bash
# 1. Tornar script executável e rodar
chmod +x setup-auto-devops-minikube.sh
./setup-auto-devops-minikube.sh

# 2. Copiar o KUBE_INGRESS_BASE_DOMAIN exibido

# 3. Adicionar no GitLab (Settings > CI/CD > Variables)

# 4. Substituir .gitlab-ci.yml
cp .gitlab-ci-auto-devops.yml .gitlab-ci.yml

# 5. Commit e push
git add .
git commit -m "feat: Habilitar Auto DevOps"
git push

# 6. Ir em GitLab > CI/CD > Pipelines e acompanhar! 🚀
```

Boa sorte! 🎉

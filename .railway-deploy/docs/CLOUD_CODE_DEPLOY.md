# Guia de Deploy com Cloud Code

Este guia mostra como fazer deploy do Assistente Jurídico PJe no Google Kubernetes Engine usando o Cloud Code.

## Pré-requisitos

- ✅ Extensão Cloud Code instalada no VS Code
- ✅ Google Cloud SDK (`gcloud`) configurado
- ✅ Cluster GKE criado (`autopilot-cluster-1`)
- ✅ Arquivo `.env` com as credenciais necessárias

## Configuração Inicial

### 1. Configurar Secrets

Execute o script para criar os secrets no Google Secret Manager e no Kubernetes:

```bash
chmod +x setup-secrets.sh
./setup-secrets.sh
```

Este script:
- Cria secrets no Google Secret Manager
- Configura secrets no cluster Kubernetes
- Valida as conexões necessárias

### 2. Autenticar no Google Cloud

Se ainda não estiver autenticado:

```bash
gcloud auth login
gcloud config set project sonic-terminal-474321-s1
```

## Deploy com Cloud Code (Método Recomendado)

### Opção 1: Usando a Interface do Cloud Code

1. **Abrir Command Palette** (`Ctrl+Shift+P` ou `Cmd+Shift+P`)
2. Digitar: `Cloud Code: Deploy to Kubernetes`
3. Selecionar:
   - **Cluster**: `autopilot-cluster-1` (us-central1)
   - **Context**: `gke_sonic-terminal-474321-s1_us-central1_autopilot-cluster-1`
4. Cloud Code irá:
   - Build da imagem Docker
   - Push para o Google Container Registry
   - Deploy no cluster
   - Configurar port-forwarding automático

### Opção 2: Usando Skaffold (Linha de Comando)

```bash
# Build e deploy
skaffold run --default-repo=gcr.io/sonic-terminal-474321-s1

# Modo desenvolvimento (hot-reload)
skaffold dev --default-repo=gcr.io/sonic-terminal-474321-s1
```

## Estrutura dos Arquivos

```
.
├── Dockerfile              # Multi-stage build otimizado
├── nginx.conf             # Configuração Nginx para SPA
├── skaffold.yaml          # Configuração Skaffold/Cloud Code
├── setup-secrets.sh       # Script de configuração de secrets
└── k8s/
    └── deployment.yaml    # Deployment + Service Kubernetes
```

## Recursos Configurados

### Deployment
- **Replicas**: 3 (alta disponibilidade)
- **Resources**:
  - Requests: 256Mi RAM, 250m CPU
  - Limits: 512Mi RAM, 500m CPU
- **Health Checks**: Liveness e Readiness probes
- **Secrets**: Integração com Google Secret Manager

### Service
- **Type**: LoadBalancer
- **Port**: 80 (HTTP)
- **Exposição**: IP externo automático

## Verificar Status do Deploy

### Usando Cloud Code

1. Abrir **Cloud Code - Kubernetes** na barra lateral
2. Visualizar recursos:
   - Deployments
   - Pods
   - Services
   - Logs em tempo real

### Usando kubectl

```bash
# Ver pods
kubectl get pods -l app=assistente-juridico

# Ver service e IP externo
kubectl get service assistente-juridico-service

# Ver logs
kubectl logs -l app=assistente-juridico --tail=100 -f

# Verificar status do deployment
kubectl rollout status deployment/assistente-juridico-deployment
```

## Acessar a Aplicação

### IP Externo

Após o deploy, obtenha o IP externo:

```bash
kubectl get service assistente-juridico-service
```

Aguarde até que `EXTERNAL-IP` não esteja mais como `<pending>`, então acesse:

```
http://<EXTERNAL-IP>
```

### Port Forwarding (Desenvolvimento)

```bash
kubectl port-forward service/assistente-juridico-service 8080:80
```

Acesse: `http://localhost:8080`

## Desenvolvimento Contínuo

### Hot Reload com Skaffold Dev

```bash
skaffold dev --default-repo=gcr.io/sonic-terminal-474321-s1
```

Benefícios:
- 🔥 Hot reload automático ao salvar arquivos
- 📊 Logs em tempo real
- 🔍 Debugging remoto habilitado
- ⚡ Sincronização rápida de arquivos

### Debugging com Cloud Code

1. Configurar breakpoints no código
2. `Ctrl+Shift+P` → `Cloud Code: Debug on Kubernetes`
3. Cloud Code irá:
   - Deploy da aplicação em modo debug
   - Anexar o debugger
   - Permitir step-through debugging

## Atualizar a Aplicação

### Novo Deploy

```bash
# Build e deploy da nova versão
skaffold run --default-repo=gcr.io/sonic-terminal-474321-s1

# Ou via Cloud Code UI (botão Deploy)
```

### Rollback

```bash
# Ver histórico de revisões
kubectl rollout history deployment/assistente-juridico-deployment

# Rollback para versão anterior
kubectl rollout undo deployment/assistente-juridico-deployment

# Rollback para revisão específica
kubectl rollout undo deployment/assistente-juridico-deployment --to-revision=2
```

## Monitoramento e Logs

### Cloud Code Log Viewer

- Abrir **Cloud Code - Kubernetes** → Expandir **Pods**
- Clicar com botão direito → **View Logs**
- Filtrar por severidade, timestamp, etc.

### Google Cloud Console

1. Acessar [Cloud Logging](https://console.cloud.google.com/logs)
2. Filtrar por:
   ```
   resource.type="k8s_container"
   resource.labels.cluster_name="autopilot-cluster-1"
   resource.labels.namespace_name="default"
   labels.k8s-pod/app="assistente-juridico"
   ```

## Integração com GitLab CI/CD

Após configurar o GitLab Agent, o pipeline pode fazer deploy automaticamente:

```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  image: google/cloud-sdk:alpine
  script:
    - gcloud container clusters get-credentials autopilot-cluster-1 --region us-central1
    - kubectl apply -f k8s/
  only:
    - main
```

## Troubleshooting

### Pods não iniciam

```bash
# Ver eventos
kubectl describe pod <pod-name>

# Ver logs
kubectl logs <pod-name>
```

### Secrets não encontrados

```bash
# Verificar secrets
kubectl get secrets

# Recriar secrets
./setup-secrets.sh
```

### Imagem não encontrada

Verificar permissões do GCR:

```bash
gcloud projects add-iam-policy-binding sonic-terminal-474321-s1 \
    --member=serviceAccount:$(gcloud iam service-accounts list --format='value(email)' --filter='name:default') \
    --role=roles/storage.objectViewer
```

## Recursos Adicionais

- [Cloud Code Documentation](https://cloud.google.com/code/docs)
- [Skaffold Documentation](https://skaffold.dev/docs/)
- [GKE Autopilot Best Practices](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)

## Segurança

⚠️ **Importante:**
- Nunca commitar arquivos `.env` ou secrets no repositório
- Usar Google Secret Manager para gerenciar credenciais
- Habilitar Workload Identity para acesso seguro a recursos GCP
- Implementar Network Policies para isolar pods

## Custos

O cluster Autopilot cobra por recursos usados:
- **vCPU**: ~$0.05/hora por vCPU
- **Memory**: ~$0.006/GB/hora
- **LoadBalancer**: ~$0.025/hora

Estimativa mensal (3 replicas): ~$50-100 USD

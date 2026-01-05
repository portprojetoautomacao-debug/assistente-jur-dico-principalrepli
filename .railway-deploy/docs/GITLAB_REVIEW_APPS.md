# 🚀 GitLab Review Apps - Ambientes de Preview

## 🎯 O que são Review Apps?

Review Apps são ambientes temporários criados automaticamente para cada merge request, permitindo:
- **Preview visual** das mudanças antes do merge
- **Testes funcionais** em ambiente real
- **Feedback colaborativo** da equipe
- **Validação de UX/UI** por stakeholders

## 📋 Pré-requisitos

### **1. Infraestrutura**
- Kubernetes cluster ou Docker
- Domínio wildcard configurado (ex: `*.review.example.com`)
- Certificado SSL para subdomínios
- Recursos suficientes para múltiplos ambientes

### **2. Configuração DNS**
```
# Exemplo de configuração DNS
*.review.assistente-juridico.com  A  1.2.3.4
```

### **3. Certificado SSL**
```bash
# Gerar certificado wildcard
certbot certonly --manual --preferred-challenges=dns \
  --email admin@assistente-juridico.com \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --agree-tos \
  -d "*.review.assistente-juridico.com"
```

## ⚙️ Configuração no .gitlab-ci.yml

### **Job de Deploy Review**
```yaml
review:
  stage: deploy
  script:
    - echo "Deploying review app"
    - ./scripts/deploy-review.sh
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.review.assistente-juridico.com
    on_stop: stop_review
  only:
    - merge_requests
  dependencies:
    - build

stop_review:
  stage: deploy
  script:
    - echo "Removing review app"
    - ./scripts/stop-review.sh
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  only:
    - merge_requests
  when: manual
```

### **Script de Deploy**
```bash
#!/bin/bash
# scripts/deploy-review.sh

# Configurações
APP_NAME="assistente-juridico-$CI_COMMIT_REF_SLUG"
NAMESPACE="review-apps"
DOMAIN="review.assistente-juridico.com"

# Criar namespace se não existir
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Deploy da aplicação
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $APP_NAME
  namespace: $NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $APP_NAME
  template:
    metadata:
      labels:
        app: $APP_NAME
    spec:
      containers:
      - name: app
        image: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "review"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: review-db-secret
              key: database_url
---
apiVersion: v1
kind: Service
metadata:
  name: $APP_NAME
  namespace: $NAMESPACE
spec:
  selector:
    app: $APP_NAME
  ports:
  - port: 80
    targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: $APP_NAME
  namespace: $NAMESPACE
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - $CI_COMMIT_REF_SLUG.$DOMAIN
    secretName: $APP_NAME-tls
  rules:
  - host: $CI_COMMIT_REF_SLUG.$DOMAIN
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: $APP_NAME
            port:
              number: 80
EOF

echo "Review app deployed: https://$CI_COMMIT_REF_SLUG.$DOMAIN"
```

### **Script de Cleanup**
```bash
#!/bin/bash
# scripts/stop-review.sh

APP_NAME="assistente-juridico-$CI_COMMIT_REF_SLUG"
NAMESPACE="review-apps"

# Remover recursos
kubectl delete deployment $APP_NAME -n $NAMESPACE --ignore-not-found=true
kubectl delete service $APP_NAME -n $NAMESPACE --ignore-not-found=true
kubectl delete ingress $APP_NAME -n $NAMESPACE --ignore-not-found=true

echo "Review app removed: $APP_NAME"
```

## 🎨 Personalização do Ambiente

### **1. Banco de Dados Isolado**
```yaml
# review-db-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: review-db-secret
  namespace: review-apps
type: Opaque
data:
  database_url: <base64-encoded-connection-string>
```

### **2. Variáveis de Ambiente**
```yaml
# Configurações específicas para review
environment:
  NODE_ENV: review
  FEATURE_FLAGS_ENABLED: true
  LOG_LEVEL: debug
  REVIEW_MODE: true
```

### **3. Dados de Teste**
```typescript
// src/config/review-data.ts
export const REVIEW_CONFIG = {
  // Dados de teste para review
  mockUsers: [...],
  sampleCases: [...],
  testDocuments: [...]
};
```

## 🔍 Funcionalidades do Review App

### **1. Badge no Merge Request**
```markdown
<!-- Automaticamente adicionado pelo GitLab -->
[![Review App](https://img.shields.io/badge/Review%20App-Deployed-green)](https://branch-name.review.assistente-juridico.com)
```

### **2. Comentário Automático**
```yaml
review_comment:
  stage: deploy
  script:
    - |
      curl -X POST \
        -H "PRIVATE-TOKEN: $GITLAB_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
          "body": "## 🚀 Review App Deployed\n\n**URL:** https://'$CI_COMMIT_REF_SLUG'.review.assistente-juridico.com\n\n**Branch:** '$CI_COMMIT_REF_NAME'\n\n**Commit:** '$CI_COMMIT_SHA'\n\n---\n\n✅ **Ready for review**\n\n📋 **Testing Checklist:**\n- [ ] Login funciona\n- [ ] Navegação ok\n- [ ] Funcionalidades testadas\n- [ ] Performance aceitável"
        }' \
        $CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$CI_MERGE_REQUEST_IID/notes
  only:
    - merge_requests
  dependencies:
    - review
```

### **3. Status Checks**
```yaml
review_health_check:
  stage: test
  script:
    - |
      # Health check da review app
      URL="https://$CI_COMMIT_REF_SLUG.review.assistente-juridico.com/health"
      for i in {1..30}; do
        if curl -f -s $URL > /dev/null; then
          echo "✅ Review app is healthy"
          exit 0
        fi
        echo "⏳ Waiting for review app to be ready... ($i/30)"
        sleep 10
      done
      echo "❌ Review app failed health check"
      exit 1
  only:
    - merge_requests
  dependencies:
    - review
```

## 📊 Monitoramento

### **1. Logs Centralizados**
```yaml
# Configurar Fluentd para coletar logs
fluentd-config:
  stage: .pre
  script:
    - kubectl apply -f k8s/fluentd-config.yaml
  only:
    - merge_requests
```

### **2. Métricas de Uso**
- Tempo de deploy
- Taxa de sucesso dos deploys
- Recursos utilizados por app
- Tempo de vida médio das review apps

### **3. Alertas**
```yaml
# Alerta se review app ficar offline
review_monitoring:
  stage: deploy
  script:
    - |
      # Monitorar saúde da app
      if ! curl -f -s https://$CI_COMMIT_REF_SLUG.review.assistente-juridico.com/health; then
        # Notificar equipe
        curl -X POST -H 'Content-type: application/json' \
          --data '{"text":"🚨 Review app offline: '$CI_COMMIT_REF_SLUG'"}' \
          $SLACK_WEBHOOK_URL
      fi
  only:
    - merge_requests
  when: delayed
  start_in: 5 minutes
```

## 🔒 Segurança

### **1. Acesso Restrito**
- Autenticação obrigatória
- IPs whitelist para acesso externo
- Tokens temporários para stakeholders

### **2. Limpeza Automática**
```yaml
cleanup_old_reviews:
  stage: cleanup
  script:
    - |
      # Remover review apps antigas (7+ dias)
      kubectl get deployments -n review-apps \
        --field-selector metadata.creationTimestamp.lt=$(date -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ) \
        -o name | xargs kubectl delete -n review-apps
  only:
    schedules:
      - "0 2 * * *"
```

### **3. Rate Limiting**
- Limitar número de review apps simultâneas
- Controle de recursos por usuário/equipe
- Quotas de uso

## 🎯 Benefícios

### **Para Desenvolvedores**
- **Feedback Rápido**: Teste mudanças imediatamente
- **Debugging**: Ambiente isolado para troubleshooting
- **Colaboração**: Compartilhar previews facilmente

### **Para Product Owners**
- **Validação Visual**: Ver mudanças antes do deploy
- **User Testing**: Stakeholders testam funcionalidades
- **Redução de Bugs**: Issues descobertos antes do merge

### **Para a Equipe**
- **Qualidade**: Menos bugs em produção
- **Velocidade**: Deploy mais rápido e confiante
- **Transparência**: Visibilidade total do progresso

## 📈 Próximos Passos

1. **Configurar Infraestrutura**: Kubernetes + DNS wildcard
2. **Implementar Scripts**: Deploy e cleanup automatizados
3. **Configurar CI/CD**: Jobs no .gitlab-ci.yml
4. **Testar Integração**: Primeiro merge request com review app
5. **Otimizar Performance**: Cache, CDN, otimização de recursos
6. **Expandir Funcionalidades**: Integração com ferramentas externas</content>
<parameter name="filePath">/workspaces/assistente-juridico-p/docs/GITLAB_REVIEW_APPS.md
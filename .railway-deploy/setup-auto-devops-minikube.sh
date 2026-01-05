#!/bin/bash
# Setup Auto DevOps com Minikube (Desenvolvimento)

set -e

echo "🚀 Configurando Auto DevOps com Minikube..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() {
    echo -e "${BLUE}▶ $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar se minikube está instalado
if ! command -v minikube &> /dev/null; then
    echo "❌ minikube não encontrado!"
    exit 1
fi

# Verificar se kubectl está instalado
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl não encontrado!"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  INICIANDO MINIKUBE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se já está rodando
if minikube status &> /dev/null; then
    success "Minikube já está rodando"
else
    step "Iniciando Minikube..."
    minikube start --driver=docker --memory=4096 --cpus=2
    success "Minikube iniciado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  HABILITANDO ADDONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

step "Habilitando Ingress..."
minikube addons enable ingress
success "Ingress habilitado"

step "Habilitando Metrics Server..."
minikube addons enable metrics-server
success "Metrics Server habilitado"

step "Habilitando Dashboard..."
minikube addons enable dashboard
success "Dashboard habilitado"

step "Habilitando Registry..."
minikube addons enable registry
success "Registry habilitado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  CRIANDO SECRETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Criar namespace se não existir
kubectl create namespace default 2>/dev/null || true

# Verificar se secrets já existem
if kubectl get secret assistente-juridico-secrets 2>/dev/null; then
    warn "Secrets já existem. Pulando..."
else
    step "Criando secrets..."

    # Obter valores do .env se existir
    if [[ -f .env ]]; then
        source .env
        kubectl create secret generic assistente-juridico-secrets \
            --from-literal=app-env="${VITE_APP_ENV:-production}" \
            --from-literal=google-client-id="${VITE_GOOGLE_CLIENT_ID:-}" \
            --from-literal=google-api-key="${VITE_GOOGLE_API_KEY:-}" \
            --from-literal=gemini-api-key="${VITE_GEMINI_API_KEY:-}" \
            --from-literal=todoist-api-key="${VITE_TODOIST_API_KEY:-}"
    else
        # Valores padrão para desenvolvimento
        kubectl create secret generic assistente-juridico-secrets \
            --from-literal=app-env=development \
            --from-literal=google-client-id=YOUR_GOOGLE_CLIENT_ID \
            --from-literal=google-api-key=YOUR_GOOGLE_API_KEY \
            --from-literal=gemini-api-key=YOUR_GEMINI_API_KEY \
            --from-literal=todoist-api-key=YOUR_TODOIST_API_KEY

        warn "Usando valores padrão. Configure os secrets depois!"
    fi

    success "Secrets criados"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  OBTENDO IP DO MINIKUBE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MINIKUBE_IP=$(minikube ip)
success "IP do Minikube: $MINIKUBE_IP"

# Criar domínio com nip.io
BASE_DOMAIN="$MINIKUBE_IP.nip.io"
success "Domínio base: $BASE_DOMAIN"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  ATUALIZANDO INGRESS COM DOMÍNIO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

step "Criando Ingress com domínio $BASE_DOMAIN..."

cat > /tmp/ingress-minikube.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: assistente-juridico-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/enable-cors: "true"
spec:
  rules:
    - host: assistente-juridico.$BASE_DOMAIN
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: assistente-juridico-service
                port:
                  number: 80
EOF

success "Ingress configurado para: assistente-juridico.$BASE_DOMAIN"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  FAZENDO BUILD DA IMAGEM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

step "Configurando Docker para usar o Minikube..."
eval $(minikube docker-env)

step "Fazendo build da imagem..."
docker build -t assistente-juridico-p:latest .
success "Imagem construída"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  FAZENDO DEPLOY NO KUBERNETES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

step "Aplicando deployment..."
kubectl apply -f k8s/deployment.yaml
success "Deployment aplicado"

step "Aplicando ingress..."
kubectl apply -f /tmp/ingress-minikube.yaml
success "Ingress aplicado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  AGUARDANDO PODS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

step "Aguardando pods ficarem prontos..."
kubectl wait --for=condition=ready pod -l app=assistente-juridico --timeout=180s || warn "Timeout aguardando pods"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📊 Status dos Recursos:"
kubectl get deployments,services,ingress -l app=assistente-juridico

echo ""
echo "🌐 URLs de Acesso:"
echo "   Application: http://assistente-juridico.$BASE_DOMAIN"
echo "   Service:     http://$MINIKUBE_IP"
echo ""

echo "📝 Variáveis para .gitlab-ci.yml:"
echo "   KUBE_INGRESS_BASE_DOMAIN: \"$BASE_DOMAIN\""
echo ""

echo "🔧 Comandos Úteis:"
echo "   Ver pods:       kubectl get pods -l app=assistente-juridico"
echo "   Ver logs:       kubectl logs -l app=assistente-juridico --tail=50 -f"
echo "   Dashboard:      minikube dashboard"
echo "   Port-forward:   kubectl port-forward svc/assistente-juridico-service 8080:80"
echo "   Tunnel:         minikube tunnel  # Para LoadBalancer funcionar"
echo ""

echo "🚀 Próximos Passos:"
echo "   1. Testar acesso: curl http://assistente-juridico.$BASE_DOMAIN"
echo "   2. Configurar Auto DevOps no GitLab"
echo "   3. Adicionar KUBE_INGRESS_BASE_DOMAIN=$BASE_DOMAIN às variáveis CI/CD"
echo ""

#!/bin/bash
# Verificação de Requisitos Auto DevOps do GitLab

set -e

echo "🔍 Verificando requisitos do Auto DevOps..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
SUCCESS=0

# Função para verificar
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((SUCCESS++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

check_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  VERIFICANDO VARIÁVEIS DE AMBIENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar KUBE_INGRESS_BASE_DOMAIN
if grep -q "KUBE_INGRESS_BASE_DOMAIN" .gitlab-ci.yml 2>/dev/null; then
    DOMAIN=$(grep "KUBE_INGRESS_BASE_DOMAIN" .gitlab-ci.yml | cut -d':' -f2 | tr -d ' "')
    check_pass "KUBE_INGRESS_BASE_DOMAIN configurado: $DOMAIN"
else
    check_fail "KUBE_INGRESS_BASE_DOMAIN NÃO configurado"
    check_info "   Necessário para Auto Review Apps e Auto Deploy"
    check_info "   Adicione: KUBE_INGRESS_BASE_DOMAIN: 'seu-dominio.com'"
fi

# Verificar STAGING_ENABLED
if grep -q "STAGING_ENABLED" .gitlab-ci.yml 2>/dev/null; then
    check_pass "STAGING_ENABLED configurado"
else
    check_warn "STAGING_ENABLED não configurado"
    check_info "   Recomendado para ambiente de staging"
fi

# Verificar INCREMENTAL_ROLLOUT_MODE
if grep -q "INCREMENTAL_ROLLOUT_MODE" .gitlab-ci.yml 2>/dev/null; then
    MODE=$(grep "INCREMENTAL_ROLLOUT_MODE" .gitlab-ci.yml | cut -d':' -f2 | tr -d ' "')
    check_pass "INCREMENTAL_ROLLOUT_MODE: $MODE"
else
    check_warn "INCREMENTAL_ROLLOUT_MODE não configurado"
    check_info "   Valores possíveis: 'manual' ou 'timed'"
fi

# Verificar AUTO_DEVOPS_PLATFORM_TARGET
if grep -q "AUTO_DEVOPS_PLATFORM_TARGET" .gitlab-ci.yml 2>/dev/null; then
    check_pass "AUTO_DEVOPS_PLATFORM_TARGET configurado"
else
    check_fail "AUTO_DEVOPS_PLATFORM_TARGET não configurado"
    check_info "   Deveria ser: AUTO_DEVOPS_PLATFORM_TARGET: 'KUBERNETES'"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  VERIFICANDO TEMPLATE AUTO DEVOPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "Auto-DevOps.gitlab-ci.yml" .gitlab-ci.yml 2>/dev/null; then
    check_pass "Template Auto DevOps incluído"
else
    check_fail "Template Auto DevOps NÃO incluído"
    check_info "   Adicione:"
    check_info "   include:"
    check_info "     - template: Auto-DevOps.gitlab-ci.yml"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  VERIFICANDO ARQUIVOS KUBERNETES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ -d "k8s" ]]; then
    check_pass "Diretório k8s/ existe"
    
    if [[ -f "k8s/deployment.yaml" ]]; then
        check_pass "k8s/deployment.yaml encontrado"
    else
        check_warn "k8s/deployment.yaml não encontrado"
    fi
    
    if [[ -f "k8s/service.yaml" ]]; then
        check_pass "k8s/service.yaml encontrado"
    else
        check_info "k8s/service.yaml não encontrado (pode estar em deployment.yaml)"
    fi
else
    check_warn "Diretório k8s/ não existe"
fi

# Verificar se k8s está integrado ao CI
if grep -q "kubectl" .gitlab-ci.yml 2>/dev/null; then
    check_pass "kubectl usado no pipeline"
else
    check_fail "kubectl NÃO usado no pipeline"
    check_info "   Kubernetes não está integrado ao CI/CD"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  VERIFICANDO DOCKER/CONTAINER REGISTRY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ -f "Dockerfile" ]]; then
    check_pass "Dockerfile encontrado"
else
    check_fail "Dockerfile NÃO encontrado"
fi

if grep -q "docker build" .gitlab-ci.yml 2>/dev/null; then
    check_pass "Build de imagem Docker no pipeline"
else
    check_fail "Nenhum build de Docker no pipeline"
    check_info "   Auto DevOps requer build de imagens"
fi

if grep -q "docker push\|CI_REGISTRY" .gitlab-ci.yml 2>/dev/null; then
    check_pass "Push para Container Registry configurado"
else
    check_fail "Push para registry NÃO configurado"
    check_info "   Use: docker push \$CI_REGISTRY_IMAGE:\$CI_COMMIT_SHA"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  VERIFICANDO JOBS DE DEPLOY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar deploy_production
if grep -q "deploy_production:" .gitlab-ci.yml 2>/dev/null; then
    check_pass "Job deploy_production existe"
    
    # Verificar se é apenas mock
    if grep -A 5 "deploy_production:" .gitlab-ci.yml | grep -q "echo.*Deploying"; then
        check_fail "Deploy é apenas mock (echo)"
        check_info "   Implemente deploy real (kubectl, vercel, etc.)"
    else
        check_pass "Deploy parece ser real"
    fi
else
    check_warn "Job deploy_production não encontrado"
fi

# Verificar deploy_preview/staging
if grep -q "deploy_preview:\|deploy_staging:" .gitlab-ci.yml 2>/dev/null; then
    check_pass "Job de preview/staging existe"
else
    check_warn "Nenhum job de preview/staging"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  VERIFICANDO RECURSOS OPCIONAIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar cert-manager
if grep -q "cert-manager" .gitlab-ci.yml k8s/*.yaml 2>/dev/null; then
    check_pass "Cert-manager mencionado"
else
    check_info "Cert-manager não configurado (opcional para HTTPS)"
fi

# Verificar Ingress
if grep -q "kind: Ingress" k8s/*.yaml 2>/dev/null; then
    check_pass "Ingress configurado"
else
    check_warn "Ingress não encontrado"
    check_info "   Necessário para exposição externa"
fi

# Verificar PostgreSQL
if grep -q "POSTGRES" .gitlab-ci.yml 2>/dev/null; then
    check_info "PostgreSQL mencionado"
else
    check_info "PostgreSQL não configurado (use se necessário)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}✅ Sucessos: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avisos:   $WARNINGS${NC}"
echo -e "${RED}❌ Erros:    $ERRORS${NC}"

echo ""

if [[ $ERRORS -gt 5 ]]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ AUTO DEVOPS NÃO ESTÁ CONFIGURADO${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📖 Leia o guia completo em: docs/ANALISE_AUTO_DEVOPS.md"
    echo ""
    echo "🚀 Passos para habilitar:"
    echo "   1. Configure KUBE_INGRESS_BASE_DOMAIN"
    echo "   2. Adicione template Auto-DevOps.gitlab-ci.yml"
    echo "   3. Configure cluster Kubernetes"
    echo "   4. Adicione build e push de Docker"
    echo ""
elif [[ $ERRORS -gt 0 ]]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  AUTO DEVOPS PARCIALMENTE CONFIGURADO${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📖 Veja: docs/ANALISE_AUTO_DEVOPS.md"
else
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ AUTO DEVOPS CONFIGURADO CORRETAMENTE!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

echo ""
exit $ERRORS

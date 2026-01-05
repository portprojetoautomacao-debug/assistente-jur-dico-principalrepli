#!/bin/bash
set -e

# Configurações
CLUSTER_NAME="autopilot-cluster-1"
REGION="us-central1"
PROJECT_ID="sonic-terminal-474321-s1"
AGENT_TOKEN="glagent-vVkeKg1E00kVh9S0F_QnkW86MQpwOjE5ZjN4dww.01.131inxgy0"
KAS_ADDRESS="wss://kas.gitlab.com"

echo "🚀 Iniciando configuração do GitLab Agent..."

# 1. Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Erro: gcloud CLI não encontrado. Por favor, instale o Google Cloud SDK."
    exit 1
fi

# 2. Verificar se helm está instalado
if ! command -v helm &> /dev/null; then
    echo "❌ Erro: helm não encontrado. Por favor, instale o Helm."
    exit 1
fi

# 3. Conectar ao cluster
echo "🔌 Conectando ao cluster GKE ($CLUSTER_NAME)..."
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID

# 4. Adicionar repo do GitLab Helm
echo "📦 Configurando repositório Helm..."
helm repo add gitlab https://charts.gitlab.io
helm repo update

# 5. Instalar o Agente
echo "🤖 Instalando/Atualizando o Agente GitLab..."
helm upgrade --install agente-cluster gitlab/gitlab-agent \
    --namespace gitlab-agent-agente-cluster \
    --create-namespace \
    --set config.token=$AGENT_TOKEN \
    --set config.kasAddress=$KAS_ADDRESS

echo "✅ Configuração concluída com sucesso!"

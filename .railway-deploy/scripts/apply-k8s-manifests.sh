#!/bin/bash

# Script para aplicar manifestos Kubernetes para GitLab Agents
# Este script configura namespaces, RBAC, network policies e configurações para todos os ambientes

set -e

echo "🚀 Aplicando manifestos Kubernetes para GitLab Agents..."

# Aplicar namespaces
echo "📁 Criando namespaces..."
kubectl apply -f k8s/dev/namespace.yaml
kubectl apply -f k8s/qa/namespace.yaml
kubectl apply -f k8s/production/namespace.yaml

# Aplicar RBAC
echo "🔐 Configurando RBAC..."
kubectl apply -f k8s/dev/rbac.yaml
kubectl apply -f k8s/qa/rbac.yaml
kubectl apply -f k8s/production/rbac.yaml

# Aplicar network policies
echo "🌐 Configurando network policies..."
kubectl apply -f k8s/dev/network-policy.yaml
kubectl apply -f k8s/qa/network-policy.yaml
kubectl apply -f k8s/production/network-policy.yaml

# Aplicar configurações compartilhadas
echo "⚙️ Aplicando configurações compartilhadas..."
kubectl apply -f k8s/shared/configmaps.yaml

echo "✅ Todos os manifestos foram aplicados com sucesso!"
echo ""
echo "📋 Verificação dos recursos criados:"
echo "Namespaces:"
kubectl get namespaces | grep -E "(desenvolvimento|qa|production)"
echo ""
echo "ServiceAccounts:"
kubectl get serviceaccounts -A | grep gitlab-agent
echo ""
echo "ClusterRoles:"
kubectl get clusterroles | grep gitlab-agent
echo ""
echo "NetworkPolicies:"
kubectl get networkpolicies -A | grep -v kube-system
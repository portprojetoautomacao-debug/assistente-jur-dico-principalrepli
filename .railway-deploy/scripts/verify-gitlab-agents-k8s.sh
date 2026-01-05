#!/bin/bash

# Script para verificar o status dos GitLab Agents e recursos Kubernetes
# Este script verifica conectividade dos agentes e status dos recursos criados

set -e

echo "🔍 Verificando status dos GitLab Agents..."

# Verificar namespaces
echo "📁 Verificando namespaces:"
kubectl get namespaces | grep -E "(desenvolvimento|qa|production)" || echo "❌ Namespaces não encontrados"

# Verificar ServiceAccounts
echo ""
echo "👤 Verificando ServiceAccounts:"
kubectl get serviceaccounts -A | grep gitlab-agent || echo "❌ ServiceAccounts não encontrados"

# Verificar ClusterRoles e ClusterRoleBindings
echo ""
echo "🔐 Verificando RBAC:"
kubectl get clusterroles | grep gitlab-agent || echo "❌ ClusterRoles não encontrados"
kubectl get clusterrolebindings | grep gitlab-agent || echo "❌ ClusterRoleBindings não encontrados"

# Verificar NetworkPolicies
echo ""
echo "🌐 Verificando NetworkPolicies:"
kubectl get networkpolicies -A | grep -v kube-system | grep -E "(gitlab|production|qa|desenvolvimento)" || echo "❌ NetworkPolicies não encontradas"

# Verificar ConfigMaps
echo ""
echo "⚙️ Verificando ConfigMaps:"
kubectl get configmaps -A | grep gitlab-agent-config || echo "❌ ConfigMaps não encontrados"

# Verificar status dos agentes GitLab (se houver pods rodando)
echo ""
echo "🤖 Verificando pods dos agentes:"
kubectl get pods -A | grep gitlab-agent || echo "ℹ️ Nenhum pod do agente encontrado (normal se agentes ainda não estiverem conectados)"

# Verificar conectividade com GitLab (se kubectl estiver configurado)
echo ""
echo "🔗 Verificando conectividade com cluster:"
kubectl cluster-info || echo "❌ Problemas de conectividade com o cluster"

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Registrar os agentes no GitLab usando os tokens gerados"
echo "2. Verificar se os agentes aparecem como conectados no GitLab"
echo "3. Testar pipelines CI/CD usando os diferentes agentes"
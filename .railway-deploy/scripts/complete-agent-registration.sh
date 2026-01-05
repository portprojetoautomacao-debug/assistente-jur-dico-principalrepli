#!/bin/bash

# Script para completar o registro dos agentes restantes
# Execute os comandos de registro gerados pelo GitLab

set -e

echo "🎯 Completando Registro dos Agentes GitLab"
echo "=========================================="
echo ""

echo "📋 AGENTES PARA REGISTRAR:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. agente-desenvolvimento (desenvolvimento)"
echo "2. agente-qa (qa)"
echo "3. agente-producao (production)"
echo ""

echo "🌐 INSTRUÇÕES PARA REGISTRO NO GITLAB:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para cada agente, siga estes passos na interface do GitLab:"
echo ""
echo "1. Vá para: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/clusters"
echo "2. Clique: 'Connect a cluster'"
echo "3. Selecione: 'GitLab agent'"
echo "4. Digite o nome do agente"
echo "5. Clique: 'Register agent'"
echo "6. COPIE o comando gerado (será algo como: gitlab-agent register --token <TOKEN> --agent <NAME>)"
echo "7. Execute o comando aqui no terminal"
echo ""

echo "🔑 COMANDOS PARA EXECUTAR (um por agente):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Aguardar os comandos do usuário
echo "❓ Cole aqui o primeiro comando (agente-desenvolvimento):"
read -r cmd1
echo "Executando: $cmd1"
eval "$cmd1"

echo ""
echo "❓ Cole aqui o segundo comando (agente-qa):"
read -r cmd2
echo "Executando: $cmd2"
eval "$cmd2"

echo ""
echo "❓ Cole aqui o terceiro comando (agente-producao):"
read -r cmd3
echo "Executando: $cmd3"
eval "$cmd3"

echo ""
echo "⏳ Aguardando agentes se conectarem (30 segundos)..."
sleep 30

echo ""
echo "🔍 VERIFICANDO CONECTIVIDADE..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Executar verificações
echo "📊 Verificando status dos agentes..."
./verify-gitlab-agents.sh

echo ""
echo "🧪 Testando conectividade..."
./scripts/test-gitlab-agents.sh

echo ""
echo "📦 Verificando recursos Kubernetes..."
./scripts/verify-gitlab-agents-k8s.sh

echo ""
echo "🎉 REGISTRO COMPLETO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Todos os 7 agentes GitLab estão conectados!"
echo "✅ CI/CD com isolamento por ambiente funcionando!"
echo ""
echo "🚀 Pronto para usar pipelines automatizados!"
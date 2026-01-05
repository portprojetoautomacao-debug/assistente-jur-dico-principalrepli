#!/bin/bash

# Script para configurar proteção de branches no GitHub
# Requer gh CLI instalado e autenticado
# Uso: ./scripts/configure-branch-protection.sh

set -e

REPO_OWNER="thiagobodevanadv-alt"
REPO_NAME="assistente-jur-dico-principal"
BRANCH="main"

echo "🔐 Configurando proteção de branch para $BRANCH..."
echo ""

# Verificar se gh está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não está instalado."
    echo "📦 Instale com: https://cli.github.com/"
    exit 1
fi

# Verificar autenticação
if ! gh auth status &> /dev/null; then
    echo "❌ Você não está autenticado no GitHub CLI."
    echo "🔑 Execute: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI configurado corretamente"
echo ""

# Criar configuração de proteção via API
echo "📝 Aplicando regras de proteção..."

# Regras de proteção
PROTECTION_RULES=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Build and Test",
      "test"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false,
    "bypass_pull_request_allowances": {
      "users": [],
      "teams": []
    }
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF
)

# Aplicar proteção usando gh api
if gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" \
  --input - <<< "$PROTECTION_RULES" > /dev/null 2>&1; then
  echo "✅ Proteção de branch aplicada com sucesso!"
else
  echo "⚠️  Aviso: Não foi possível aplicar todas as regras (pode requerer permissões de admin)"
  echo "📖 Você pode configurar manualmente em:"
  echo "   https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
fi

echo ""
echo "📋 Regras aplicadas:"
echo "  ✅ Requer CI passar (Build and Test, E2E tests)"
echo "  ✅ Requer 1 aprovação em PR"
echo "  ✅ Descarta aprovações em novos commits"
echo "  ✅ Requer conversas resolvidas"
echo "  ✅ Não permite force push"
echo "  ✅ Não permite deleção da branch"
echo ""

# Configurar rulesets adicionais para Dependabot
echo "🤖 Configurando regras especiais para Dependabot..."

DEPENDABOT_RULESET=$(cat <<EOF
{
  "name": "Dependabot Auto-Merge Rules",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "exclude": [],
      "include": ["refs/heads/main"]
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": [
          {
            "context": "Build and Test",
            "integration_id": null
          },
          {
            "context": "test",
            "integration_id": null
          }
        ],
        "strict_required_status_checks_policy": true
      }
    }
  ],
  "bypass_actors": [
    {
      "actor_id": 27856297,
      "actor_type": "Integration",
      "bypass_mode": "pull_request"
    }
  ]
}
EOF
)

# Nota: actor_id 27856297 é o ID do Dependabot (GitHub-native)

if gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO_OWNER/$REPO_NAME/rulesets" \
  --input - <<< "$DEPENDABOT_RULESET" > /dev/null 2>&1; then
  echo "✅ Regras especiais do Dependabot configuradas!"
else
  echo "ℹ️  Rulesets podem requerer repositório em organização ou permissões especiais"
fi

echo ""
echo "🎯 Configuração concluída!"
echo ""
echo "📖 Próximos passos:"
echo "  1. Verifique as regras em: https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
echo "  2. Adicione lista de aprovadores confiáveis (opcional)"
echo "  3. Configure ambientes com revisores para segredos sensíveis"
echo "  4. Teste com um PR do Dependabot"
echo ""
echo "🔍 Para ver a configuração atual:"
echo "   gh api /repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection"
echo ""

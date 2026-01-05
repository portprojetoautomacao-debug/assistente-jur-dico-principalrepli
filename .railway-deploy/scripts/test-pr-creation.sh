#!/usr/bin/env bash
set -euo pipefail

# Test script to validate PR creation permissions using GitHub CLI (gh)
# Usage: GITHUB_MCP_PAT=<token> ./scripts/test-pr-creation.sh

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install it: https://cli.github.com/"
  exit 1
fi

if [[ -z "${GITHUB_MCP_PAT:-}" ]]; then
  echo "Please provide GITHUB_MCP_PAT as environment variable or SECRET."
  echo "Example: export GITHUB_MCP_PAT=ghp_xxx"
  exit 1
fi

REPO="${REPO:-$(git config --get remote.origin.url | sed -e 's|.*github.com[:/]||' -e 's|.git$||') }"
BRANCH="test/copilot-pr-$(date +%s)"

echo "Repository: $REPO"
echo "Authenticating gh with provided token..."
echo "$GITHUB_MCP_PAT" | gh auth login --with-token >/dev/null

echo "Creating branch: $BRANCH"
git checkout -b "$BRANCH"

echo "Creating empty commit to test push..."
git commit --allow-empty -m "chore: test PR creation from Codespace/Agent" || true

echo "Pushing branch to origin..."
git push -u origin "$BRANCH"

echo "Creating Pull Request..."
PR_URL=$(gh pr create --title "Test PR: criação por Copilot" --body "Este PR foi criado para validar permissões do agente." --base main --head "$BRANCH" --assignee @me --repo "$REPO" --json url -q .url)

if [[ -n "$PR_URL" ]]; then
  echo "Pull Request criado com sucesso: $PR_URL"
  exit 0
else
  echo "Falha ao criar Pull Request. Verifique permissões e branch protections."
  exit 2
fi

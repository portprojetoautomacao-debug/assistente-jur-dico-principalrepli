#!/bin/bash

# Script para validar configuração do CI/CD Catalog no GitLab
# Assistente Jurídico PJe - Validação Pós-Configuração

set -e

echo "🔍 Validando configuração do CI/CD Catalog..."
echo "============================================="

# Verificar se estamos em um repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este script deve ser executado dentro de um repositório Git"
    exit 1
fi

# Obter informações do repositório
REPO_URL=$(git config --get remote.origin.url)
if [[ $REPO_URL == https://github.com/* ]]; then
    echo "⚠️  Repositório está no GitHub. Para usar CI/CD Catalog, migre para GitLab."
    echo ""
    echo "📋 Instruções para migração:"
    echo "1. Crie um novo projeto no GitLab"
    echo "2. Configure o CI/CD Catalog conforme instruções anteriores"
    echo "3. Push o código para o repositório GitLab"
    echo ""
    echo "🔗 URL do GitLab: https://gitlab.com"
    exit 1
elif [[ $REPO_URL == https://gitlab.com/* ]]; then
    echo "✅ Repositório identificado como GitLab"
    # Extrair dinamicamente o caminho do projeto da URL
    PROJECT_PATH="${REPO_URL#https://gitlab.com/}"
    PROJECT_PATH="${PROJECT_PATH%.git}"
    echo "📍 Caminho do projeto: $PROJECT_PATH"
else
    echo "❌ URL do repositório não reconhecida. Deve ser GitHub ou GitLab."
    exit 1
fi

echo ""
echo "📋 Checklist de Validação do CI/CD Catalog:"
echo "=========================================="

# 1. Verificar se os componentes existem localmente
echo ""
echo "1️⃣ Verificando componentes locais..."
COMPONENTS=(
    ".gitlab/templates/security/security-component.yml"
    ".gitlab/templates/testing/testing-component.yml"
    ".gitlab/templates/deployment/deployment-component.yml"
    ".gitlab/templates/monitoring/monitoring-component.yml"
    ".gitlab/templates/api-testing/api-testing-component.yml"
    ".gitlab/templates/backup/backup-component.yml"
    ".gitlab/templates/container-deploy/container-deploy-component.yml"
    ".gitlab/templates/notifications/notifications-component.yml"
)

ALL_COMPONENTS_EXIST=true
for component in "${COMPONENTS[@]}"; do
    if [[ -f "$component" ]]; then
        echo "✅ $component"
    else
        echo "❌ $component - COMPONENTE AUSENTE"
        ALL_COMPONENTS_EXIST=false
    fi
done

if [[ "$ALL_COMPONENTS_EXIST" = true ]]; then
    echo ""
    echo "🎉 Todos os componentes locais estão presentes!"
else
    echo ""
    echo "❌ Alguns componentes estão faltando. Execute o script de criação primeiro."
    exit 1
fi

# 2. Verificar sintaxe YAML
echo ""
echo "2️⃣ Validando sintaxe YAML..."
python3 - <<'PY'
import importlib
import os
import sys

try:
    yaml = importlib.import_module('yaml')
except ModuleNotFoundError:
    print("❌ Módulo PyYAML não encontrado. Instale com 'pip install pyyaml'.")
    sys.exit(1)

yaml_files = [
    '.gitlab/templates/security/security-component.yml',
    '.gitlab/templates/testing/testing-component.yml',
    '.gitlab/templates/deployment/deployment-component.yml',
    '.gitlab/templates/monitoring/monitoring-component.yml',
    '.gitlab/templates/api-testing/api-testing-component.yml',
    '.gitlab/templates/backup/backup-component.yml',
    '.gitlab/templates/container-deploy/container-deploy-component.yml',
    '.gitlab/templates/notifications/notifications-component.yml',
    '.gitlab-ci.yml',
]

all_valid = True
for filepath in yaml_files:
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as handle:
                yaml.safe_load(handle.read())
            print(f'✅ {filepath}')
        except Exception as exc:
            print(f'❌ {filepath}: {exc}')
            all_valid = False
    else:
        print(f'⚠️  {filepath}: ARQUIVO NÃO ENCONTRADO')
        all_valid = False

if all_valid:
    print('\n🎉 Todos os arquivos YAML são válidos!')
else:
    print('\n❌ Alguns arquivos têm erros de sintaxe.')
    sys.exit(1)
PY

# 3. Verificar se o .gitlab-ci.yml usa os componentes
echo ""
echo "3️⃣ Verificando uso de componentes no pipeline..."
if grep -q "include:" .gitlab-ci.yml && grep -q "component:" .gitlab-ci.yml; then
    echo "✅ .gitlab-ci.yml inclui componentes"
else
    echo "❌ .gitlab-ci.yml não inclui componentes corretamente"
    exit 1
fi

# 4. Verificar se há tags criadas
echo ""
echo "4️⃣ Verificando tags do repositório..."
if git tag -l | grep -q "1\.1\.0"; then
    echo "✅ Tag 1.1.0 existe"
else
    echo "⚠️  Tag 1.1.0 não encontrada. Criando..."
    git tag -a 1.1.0 -m "Release 1.1.0 - Componentes CI/CD Expandidos"
    git push origin 1.1.0
    echo "✅ Tag 1.1.0 criada e enviada"
fi

echo ""
echo "🎯 Instruções para Configuração Manual no GitLab:"
echo "================================================"
echo ""
echo "🔗 Acesse: https://gitlab.com/$PROJECT_PATH/-/settings/ci_cd"
echo ""
echo "1. 📍 Vá para a seção 'Components'"
echo ""
echo "2. ✅ Marque 'Enable components'"
echo ""
echo "3. 📁 Configure o 'Base path' como: templates/"
echo ""
echo "4. 🏷️ Configure as tags dos componentes:"
echo "   - security-component: 1.1.0"
echo "   - testing-component: 1.1.0"
echo "   - deployment-component: 1.1.0"
echo "   - monitoring-component: 1.1.0"
echo "   - api-testing-component: 1.1.0"
echo "   - backup-component: 1.1.0"
echo "   - container-deploy-component: 1.1.0"
echo "   - notifications-component: 1.1.0"
echo ""
echo "5. 💾 Clique em 'Save changes'"
echo ""
echo "6. 🧪 Teste criando um Merge Request:"
echo "   - Crie uma branch: git checkout -b test-catalog"
echo "   - Faça uma pequena mudança em qualquer arquivo"
echo "   - Commit e push: git add . && git commit -m 'test: validar CI/CD Catalog' && git push origin test-catalog"
echo "   - Crie um Merge Request no GitLab"
echo "   - Verifique se o pipeline executa todos os componentes"
echo ""
echo "7. 📊 Monitore os resultados:"
echo "   - Vá para CI/CD > Pipelines"
echo "   - Clique no pipeline mais recente"
echo "   - Verifique os jobs: security, test, build, deploy, monitor"
echo "   - Baixe os artefatos gerados"
echo ""
echo "8. 🔍 Valide os artefatos:"
echo "   - security-report.html (relatório de segurança)"
echo "   - test-results/ (resultados dos testes)"
echo "   - lighthouse-report.html (análise de performance)"
echo "   - deployment-log.txt (log de deploy)"
echo ""
echo "✅ Após configurar, execute este script novamente para validar!"
echo ""
echo "📞 Suporte:"
echo "==========="
echo ""
echo "• Documentação: .gitlab/templates/README.md"
echo "• Logs do pipeline: CI/CD > Pipelines > [pipeline] > Jobs"
echo "• Artefatos: CI/CD > Pipelines > [pipeline] > Download artifacts"
echo ""
echo "🎉 Configuração validada localmente! Agora configure no GitLab."
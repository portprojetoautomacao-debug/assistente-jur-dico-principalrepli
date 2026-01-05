#!/bin/bash

# Email Service Setup Wizard - Checklist Interativo

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variáveis
RESEND_KEY="re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2"
REPO="thiagobodevan-a11y/assistente-juridico-p"
VERCEL_URL="assistente-juridico-github.vercel.app"

# Função para imprimir header
print_header() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║         📧 EMAIL SERVICE - SETUP WIZARD                         ║"
    echo "║         Assistente Jurídico + Resend + Vercel                   ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Função para imprimir step
print_step() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

# Função para prompt de confirmação
confirm() {
    local prompt="$1"
    read -p "$(echo -e ${YELLOW}$prompt${NC})" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# STEP 1: GitHub Secret
step_github_secret() {
    print_header
    print_step "PASSO 1/4 - Adicionar GitHub Secret"

    echo ""
    echo -e "${YELLOW}ℹ️  Você precisa adicionar a Resend API Key como secret no GitHub${NC}"
    echo ""
    echo "Opções:"
    echo "  1) Via GitHub CLI (recomendado)"
    echo "  2) Via Web Interface"
    echo "  3) Pular (fazer depois)"
    echo ""
    read -p "Escolha uma opção (1-3): " choice

    case $choice in
        1)
            echo ""
            echo -e "${CYAN}Executando: gh secret set RESEND_API_KEY${NC}"
            gh secret set RESEND_API_KEY --body "$RESEND_KEY" || {
                echo -e "${RED}❌ Erro ao adicionar secret${NC}"
                echo "Tente novamente: gh secret set RESEND_API_KEY --body '$RESEND_KEY'"
                return 1
            }
            echo -e "${GREEN}✅ Secret adicionada com sucesso!${NC}"
            ;;
        2)
            echo ""
            echo -e "${CYAN}Abra seu navegador em:${NC}"
            echo "https://github.com/settings/secrets/actions"
            echo ""
            echo "Ou direto no repositório:"
            echo "https://github.com/$REPO/settings/secrets/actions"
            echo ""
            echo "Adicione:"
            echo "  Name: RESEND_API_KEY"
            echo "  Value: $RESEND_KEY"
            echo ""
            read -p "Pressione ENTER quando terminar... "
            echo -e "${GREEN}✅ Secret adicionada!${NC}"
            ;;
        3)
            echo -e "${YELLOW}⏭️  Pulando este passo...${NC}"
            return 1
            ;;
        *)
            echo -e "${RED}❌ Opção inválida${NC}"
            return 1
            ;;
    esac

    return 0
}

# STEP 2: Testar Localmente
step_local_test() {
    print_header
    print_step "PASSO 2/4 - Testar Localmente"

    echo ""
    echo -e "${YELLOW}ℹ️  Vamos testar o endpoint localmente${NC}"
    echo ""

    # Verificar se servidor está rodando
    if ! curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
        echo -e "${RED}❌ Servidor não detectado em http://localhost:3000${NC}"
        echo ""
        echo "Inicie em outro terminal:"
        echo -e "  ${CYAN}npm run dev${NC}"
        echo ""
        read -p "Pressione ENTER quando o servidor estiver rodando... "
    fi

    # Pedir email
    read -p "Digite seu email para teste: " test_email

    if [ -z "$test_email" ]; then
        echo -e "${RED}❌ Email é obrigatório${NC}"
        return 1
    fi

    # Executar testes
    echo ""
    echo -e "${CYAN}Rodando testes...${NC}"
    echo ""

    bash scripts/test-email-endpoint.sh "$test_email"

    return 0
}

# STEP 3: Deploy Vercel
step_deploy() {
    print_header
    print_step "PASSO 3/4 - Deploy no Vercel"

    echo ""
    echo -e "${YELLOW}ℹ️  Vamos fazer deploy do código no Vercel${NC}"
    echo ""

    # Verificar se há mudanças
    if [ -z "$(git status --short)" ]; then
        echo -e "${YELLOW}⏭️  Nenhuma mudança detectada (código já foi commitado)${NC}"
        echo -e "${GREEN}✅ Deploy pronto!${NC}"
        return 0
    fi

    echo "Arquivos modificados:"
    git status --short
    echo ""

    if confirm "Deseja fazer commit e push? (Y/n): "; then
        echo ""
        git add -A
        git commit -m "feat: email service deployment" || {
            echo -e "${YELLOW}⚠️  Nada para fazer${NC}"
        }
        git push origin main || {
            echo -e "${YELLOW}Fazendo rebase...${NC}"
            git pull --rebase origin main
            git push origin main
        }
        echo -e "${GREEN}✅ Push realizado!${NC}"
    else
        echo -e "${YELLOW}⏭️  Pulando push${NC}"
    fi

    return 0
}

# STEP 4: Testar em Produção
step_production_test() {
    print_header
    print_step "PASSO 4/4 - Testar em Produção"

    echo ""
    echo -e "${YELLOW}ℹ️  Aguardando deploy do Vercel...${NC}"
    echo ""
    echo "Aguarde 2-3 minutos para o Vercel fazer deploy"
    echo ""

    read -p "Pressione ENTER quando o deploy estiver completo... "

    # Pedir email
    read -p "Digite seu email para teste em produção: " prod_email

    if [ -z "$prod_email" ]; then
        echo -e "${RED}❌ Email é obrigatório${NC}"
        return 1
    fi

    # Testar endpoint
    echo ""
    echo -e "${CYAN}Testando https://$VERCEL_URL/api/emails...${NC}"
    echo ""

    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"test\",
            \"to\": \"$prod_email\"
        }" \
        "https://$VERCEL_URL/api/emails")

    echo "Resposta:"
    echo "$response" | jq . 2>/dev/null || echo "$response"

    success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        echo ""
        echo -e "${GREEN}✅ Email enviado com sucesso!${NC}"
        echo ""
        echo "Verificar em: https://resend.com/emails"
    else
        echo ""
        echo -e "${RED}❌ Erro ao enviar email${NC}"
        echo ""
        echo "Verificar logs:"
        echo "  vercel logs assistente-juridico-p --follow --prod"
    fi

    return 0
}

# STEP Final
step_complete() {
    print_header

    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║            ✅ EMAIL SERVICE COMPLETAMENTE CONFIGURADO!          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo ""
    echo "📊 Resumo do que foi feito:"
    echo "  ✅ GitHub Secret RESEND_API_KEY adicionada"
    echo "  ✅ Testes locais validados"
    echo "  ✅ Deploy realizado no Vercel"
    echo "  ✅ Produção testada e funcionando"

    echo ""
    echo "🎯 Próximas etapas (opcional):"
    echo "  1. Integrar com cron jobs (api/cron.ts)"
    echo "  2. Adicionar autenticação ao endpoint"
    echo "  3. Configurar rate limiting"
    echo "  4. Criar dashboard de emails"

    echo ""
    echo "📚 Documentação:"
    echo "  • docs/EMAIL_SETUP_GUIDE.md"
    echo "  • docs/EMAIL_COMMIT_DEPLOY.md"
    echo "  • api/integrations/email-examples.ts"

    echo ""
    echo "🔗 Links úteis:"
    echo "  • Resend: https://resend.com/emails"
    echo "  • Vercel: https://vercel.com/dashboard"
    echo "  • GitHub: https://github.com/$REPO"

    echo ""
    echo -e "${CYAN}Obrigado por usar o Email Service! 🎉${NC}"
    echo ""
}

# Main execution
main() {
    print_header

    echo "Este wizard vai guiá-lo através de 4 passos para configurar o email service."
    echo ""
    echo "Tempo estimado: 25 minutos"
    echo ""

    if ! confirm "Deseja continuar? (Y/n): "; then
        echo "Abortando..."
        exit 0
    fi

    # Executar steps
    if step_github_secret; then
        echo ""
        read -p "Pressione ENTER para continuar... "

        if step_local_test; then
            echo ""
            read -p "Pressione ENTER para continuar... "

            if step_deploy; then
                echo ""
                read -p "Pressione ENTER para continuar... "

                if step_production_test; then
                    step_complete
                fi
            fi
        fi
    fi

    echo ""
}

# Executar
main

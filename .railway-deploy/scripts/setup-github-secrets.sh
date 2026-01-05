#!/bin/bash

# Script Interativo para Configurar GitHub Secrets
# Configura todos os secrets necessários para os agentes em nuvem

set -e

REPO="thiagobodevan-a11y/assistente-juridico-p"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Array de secrets necessários
declare -A SECRETS_CONFIG=(
    [UPSTASH_REDIS_REST_URL]="URL da API REST do Upstash Redis"
    [UPSTASH_REDIS_REST_TOKEN]="Token de autenticação do Upstash"
    [GEMINI_API_KEY]="Chave API do Google Gemini"
    [VITE_GOOGLE_CLIENT_ID]="Client ID do Google OAuth"
    [VITE_GOOGLE_API_KEY]="Google API Key"
    [SENTRY_DSN]="DSN do Sentry (erro tracking)"
    [RESEND_API_KEY]="Chave API do Resend (email)"
)

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🔐 CONFIGURADOR DE GITHUB SECRETS                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Repositório: ${NC}$REPO"
echo -e "${YELLOW}Conta: ${NC}thiagobodevan-a11y"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "• Os secrets serão armazenados de forma criptografada no GitHub"
echo "• Você nunca mais precisará inserir estes valores manualmente"
echo "• Os agentes em nuvem acessarão automaticamente"
echo ""

# Verificar secrets existentes
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Verificando secrets existentes..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Tentar listar secrets (pode falhar por permissão, mas tentamos)
EXISTING_SECRETS=$(gh secret list -R "$REPO" --json name 2>/dev/null | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$EXISTING_SECRETS" ]; then
    echo -e "${YELLOW}⚠️  Não foi possível verificar secrets existentes${NC}"
    echo "   (Isso é normal se você não tem permissão nesta conta)"
    echo ""
else
    echo -e "${GREEN}✅ Secrets encontrados:${NC}"
    echo "$EXISTING_SECRETS"
    echo ""
fi

# Menu de opções
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "O que você deseja fazer?"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1) Adicionar TODOS os secrets (modo interativo)"
echo "2) Adicionar um secret específico"
echo "3) Ver instruções de como adicionar manualmente"
echo "4) Cancelar"
echo ""

read -p "Digite sua opção (1-4): " OPTION

case $OPTION in
    1)
        echo ""
        echo -e "${BLUE}Modo: Adicionar TODOS os secrets${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        for SECRET_NAME in "${!SECRETS_CONFIG[@]}"; do
            DESCRIPTION="${SECRETS_CONFIG[$SECRET_NAME]}"
            echo -e "${YELLOW}$SECRET_NAME${NC}"
            echo "  📝 $DESCRIPTION"
            read -p "  Valor: " SECRET_VALUE
            
            if [ -z "$SECRET_VALUE" ]; then
                echo -e "${RED}  ❌ Campo vazio, pulando...${NC}"
                echo ""
                continue
            fi
            
            # Adicionar secret
            if echo "$SECRET_VALUE" | gh secret set "$SECRET_NAME" -R "$REPO" 2>/dev/null; then
                echo -e "${GREEN}  ✅ Adicionado com sucesso!${NC}"
            else
                echo -e "${RED}  ❌ Erro ao adicionar secret${NC}"
            fi
            echo ""
        done
        
        echo -e "${GREEN}✅ Configuração de secrets concluída!${NC}"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}Qual secret você deseja adicionar?${NC}"
        echo ""
        i=1
        for SECRET_NAME in "${!SECRETS_CONFIG[@]}"; do
            echo "$i) $SECRET_NAME"
            ((i++))
        done
        echo ""
        read -p "Digite o número (1-${#SECRETS_CONFIG[@]}): " SECRET_NUM
        
        # Converter número para nome do secret
        i=1
        for SECRET_NAME in "${!SECRETS_CONFIG[@]}"; do
            if [ "$i" -eq "$SECRET_NUM" ]; then
                DESCRIPTION="${SECRETS_CONFIG[$SECRET_NAME]}"
                echo ""
                echo -e "${YELLOW}$SECRET_NAME${NC}"
                echo "  📝 $DESCRIPTION"
                read -p "  Valor: " SECRET_VALUE
                
                if [ -z "$SECRET_VALUE" ]; then
                    echo -e "${RED}❌ Campo vazio, cancelando...${NC}"
                    exit 1
                fi
                
                if echo "$SECRET_VALUE" | gh secret set "$SECRET_NAME" -R "$REPO" 2>/dev/null; then
                    echo -e "${GREEN}✅ Secret '$SECRET_NAME' adicionado com sucesso!${NC}"
                else
                    echo -e "${RED}❌ Erro ao adicionar secret${NC}"
                    exit 1
                fi
                break
            fi
            ((i++))
        done
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}Instruções para adicionar secrets manualmente:${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "1. Acesse: https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions"
        echo ""
        echo "2. Clique em 'New repository secret'"
        echo ""
        echo "3. Para cada secret, preencha:"
        echo ""
        for SECRET_NAME in "${!SECRETS_CONFIG[@]}"; do
            DESCRIPTION="${SECRETS_CONFIG[$SECRET_NAME]}"
            echo "   Nome: $SECRET_NAME"
            echo "   Descrição: $DESCRIPTION"
            echo "   Valor: (cole seu valor aqui)"
            echo ""
        done
        echo "4. Clique 'Add secret' para cada um"
        echo ""
        echo "Após adicionar, os agentes em nuvem terão acesso automaticamente!"
        ;;
        
    4)
        echo -e "${YELLOW}Cancelado.${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Opção inválida!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Próximos passos:"
echo "1. Os secrets agora estão disponíveis para GitHub Actions"
echo "2. Os secrets sincronizam automaticamente com Vercel"
echo "3. Os agentes em nuvem podem acessar via GITHUB_ACTIONS ou vercel env"
echo ""
echo "🔍 Para verificar os secrets:"
echo "   gh secret list -R thiagobodevan-a11y/assistente-juridico-p"
echo ""
echo "🚀 Para testar os agentes:"
echo "   bash scripts/sync-cloud-permissions.sh"
echo ""

#!/bin/bash

# 🚀 Script de Validação Rápida - Correções Lighthouse
# Data: 22/11/2025
# Uso: bash validacao-rapida.sh

echo "🔍 VALIDAÇÃO RÁPIDA - CORREÇÕES LIGHTHOUSE"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL do projeto
URL="https://assistente-jurdico-p.vercel.app"

echo "📦 1. VERIFICANDO BUILD LOCAL..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build executado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro no build${NC}"
    exit 1
fi
echo ""

echo "🔒 2. VERIFICANDO ARQUIVOS DE SEGURANÇA..."
if [[ -f "vercel.json" ]]; then
    if grep -q "Strict-Transport-Security" vercel.json; then
        echo -e "${GREEN}✅ HSTS configurado${NC}"
    else
        echo -e "${RED}❌ HSTS não encontrado${NC}"
    fi
    
    if grep -q "Content-Security-Policy" vercel.json; then
        echo -e "${GREEN}✅ CSP configurado${NC}"
    else
        echo -e "${RED}❌ CSP não encontrado${NC}"
    fi
else
    echo -e "${RED}❌ vercel.json não encontrado${NC}"
fi
echo ""

echo "♿ 3. VERIFICANDO ACESSIBILIDADE..."
if [[ -f "index.html" ]]; then
    if grep -q "skip-link" index.html; then
        echo -e "${GREEN}✅ Skip link presente${NC}"
    else
        echo -e "${YELLOW}⚠️  Skip link não encontrado${NC}"
    fi
    
    if grep -q 'lang="pt-BR"' index.html; then
        echo -e "${GREEN}✅ Atributo lang configurado${NC}"
    else
        echo -e "${RED}❌ Atributo lang ausente${NC}"
    fi
fi

if [[ -f "src/index.css" ]]; then
    if grep -q "focus-visible" src/index.css; then
        echo -e "${GREEN}✅ Indicadores de foco configurados${NC}"
    else
        echo -e "${YELLOW}⚠️  Indicadores de foco não encontrados${NC}"
    fi
fi

if [[ -f "src/App.tsx" ]]; then
    if grep -q 'id="main-content"' src/App.tsx; then
        echo -e "${GREEN}✅ Landmark main presente${NC}"
    else
        echo -e "${YELLOW}⚠️  Landmark main não encontrado${NC}"
    fi
fi
echo ""

echo "🔍 4. VERIFICANDO SEO..."
if [[ -f "public/robots.txt" ]]; then
    echo -e "${GREEN}✅ robots.txt presente${NC}"
else
    echo -e "${RED}❌ robots.txt ausente${NC}"
fi

if [[ -f "public/sitemap.xml" ]]; then
    echo -e "${GREEN}✅ sitemap.xml presente${NC}"
else
    echo -e "${RED}❌ sitemap.xml ausente${NC}"
fi

if [[ -f "index.html" ]]; then
    if grep -q "<title>" index.html; then
        echo -e "${GREEN}✅ Tag <title> presente${NC}"
    else
        echo -e "${RED}❌ Tag <title> ausente${NC}"
    fi
    
    if grep -q 'name="description"' index.html; then
        echo -e "${GREEN}✅ Meta description presente${NC}"
    else
        echo -e "${RED}❌ Meta description ausente${NC}"
    fi
fi
echo ""

echo "📱 5. VERIFICANDO VIEWPORT MOBILE..."
if [[ -f "index.html" ]]; then
    if grep -q 'name="viewport"' index.html; then
        if grep -q 'maximum-scale=5.0' index.html; then
            echo -e "${GREEN}✅ Viewport otimizada (permite zoom)${NC}"
        else
            echo -e "${YELLOW}⚠️  Viewport sem maximum-scale${NC}"
        fi
    else
        echo -e "${RED}❌ Meta viewport ausente${NC}"
    fi
fi
echo ""

echo "⚙️  6. VERIFICANDO OTIMIZAÇÕES DE BUILD..."
if [[ -f "vite.config.ts" ]]; then
    if grep -q "minify: 'terser'" vite.config.ts; then
        echo -e "${GREEN}✅ Terser configurado${NC}"
    else
        echo -e "${YELLOW}⚠️  Minificação não otimizada${NC}"
    fi
    
    if grep -q "drop_console: true" vite.config.ts; then
        echo -e "${GREEN}✅ Console.log removido em produção${NC}"
    else
        echo -e "${YELLOW}⚠️  Console.log não removido${NC}"
    fi
fi
echo ""

echo "📊 7. ANÁLISE DE TAMANHO DOS ASSETS..."
if [[ -d "dist/assets" ]]; then
    echo "Maiores arquivos JavaScript:"
    du -h dist/assets/*.js | sort -rh | head -5
    echo ""
    echo "CSS minificado:"
    du -h dist/assets/*.css
else
    echo -e "${YELLOW}⚠️  Pasta dist não encontrada. Rode 'npm run build' primeiro${NC}"
fi
echo ""

echo "=========================================="
echo "✅ VALIDAÇÃO LOCAL CONCLUÍDA"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "1. git add ."
echo "2. git commit -m 'fix(lighthouse): correções críticas aplicadas'"
echo "3. git push origin main"
echo ""
echo "📈 VALIDAÇÃO PÓS-DEPLOY:"
echo "4. Aguardar deploy Vercel (1-2 min)"
echo "5. Rodar: npx lighthouse $URL --view"
echo "6. Verificar: https://securityheaders.com/?q=$URL"
echo "=========================================="

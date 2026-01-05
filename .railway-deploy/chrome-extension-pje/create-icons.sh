#!/bin/bash
# Script para criar ícones da extensão PJe Sync usando ImageMagick

set -e

echo "🎨 Criando ícones da extensão PJe Sync..."

# Cores do gradiente (roxo/azul do Assistente Jurídico)
COLOR1="#667eea"
COLOR2="#764ba2"

# Verifica se ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick não encontrado. Instalando..."
    sudo apt-get update -qq
    sudo apt-get install -y imagemagick
fi

# Diretório de saída
ASSETS_DIR="src/assets"
mkdir -p "$ASSETS_DIR"

# Função para criar ícone com gradiente
create_icon() {
    local size=$1
    local output="$ASSETS_DIR/icon-${size}.png"
    
    echo "  Criando icon-${size}.png..."
    
    # Criar ícone com gradiente radial e símbolo de justiça
    convert -size ${size}x${size} \
        radial-gradient:"$COLOR1"-"$COLOR2" \
        \( -size $((size-20))x$((size-20)) xc:none \
           -gravity center \
           -fill white \
           -font DejaVu-Sans-Bold \
           -pointsize $((size/3)) \
           -annotate +0+0 "⚖" \
        \) \
        -gravity center -composite \
        -define png:compression-level=9 \
        "$output"
    
    echo "  ✅ $output criado"
}

# Criar os 3 tamanhos
create_icon 16
create_icon 48
create_icon 128

echo ""
echo "✅ Todos os ícones criados com sucesso!"
echo ""
ls -lh "$ASSETS_DIR"/*.png

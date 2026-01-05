#!/bin/bash

# Script de Validação das Configurações Avançadas do GitLab Duo
# Valida Agent Platform, Knowledge Graph e MCP

set -e

echo "🤖 Validando configurações avançadas do GitLab Duo..."
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se arquivo existe
check_file() {
    local file=$1
    local description=$2

    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✅ $description encontrado: $file${NC}"
        return 0
    else
        echo -e "${RED}❌ $description não encontrado: $file${NC}"
        return 1
    fi
}

# Função para validar TOML
validate_toml() {
    local file=$1
    local description=$2

    if command -v python3 &> /dev/null && python3 -c "import tomllib; tomllib.load(open('$file', 'rb'))" 2>/dev/null; then
        echo -e "${GREEN}✅ $description válido${NC}"
        return 0
    else
        echo -e "${RED}❌ $description inválido ou python3/tomllib não disponível${NC}"
        return 1
    fi
}

# Verificar arquivos de configuração
echo ""
echo "📁 Verificando arquivos de configuração..."

check_file ".gitlab/duo-config.yml" "Arquivo de configuração principal"
check_file ".gitlab/duo-agent-platform.toml" "Configuração do Agent Platform"
check_file ".gitlab/duo-knowledge-graph.toml" "Configuração do Knowledge Graph"
check_file ".gitlab/duo-mcp.toml" "Configuração do Model Context Protocol"

# Validar arquivos TOML
echo ""
echo "🔍 Validando sintaxe dos arquivos TOML..."

validate_toml ".gitlab/duo-agent-platform.toml" "Agent Platform config"
validate_toml ".gitlab/duo-knowledge-graph.toml" "Knowledge Graph config"
validate_toml ".gitlab/duo-mcp.toml" "MCP config"

# Verificar configurações específicas
echo ""
echo "⚙️  Verificando configurações específicas..."

# Verificar se o Agent Platform está habilitado
if grep -q "agent_platform:" ".gitlab/duo-config.yml" && grep -q "enabled: true" ".gitlab/duo-config.yml"; then
    echo -e "${GREEN}✅ Agent Platform habilitado na configuração principal${NC}"
else
    echo -e "${RED}❌ Agent Platform não habilitado na configuração principal${NC}"
fi

# Verificar se Knowledge Graph está habilitado
if grep -q "knowledge_graph:" ".gitlab/duo-config.yml" && grep -q "enabled: true" ".gitlab/duo-config.yml"; then
    echo -e "${GREEN}✅ Knowledge Graph habilitado na configuração principal${NC}"
else
    echo -e "${RED}❌ Knowledge Graph não habilitado na configuração principal${NC}"
fi

# Verificar se MCP está habilitado
if grep -q "mcp:" ".gitlab/duo-config.yml" && grep -q "enabled: true" ".gitlab/duo-config.yml"; then
    echo -e "${GREEN}✅ Model Context Protocol habilitado na configuração principal${NC}"
else
    echo -e "${RED}❌ Model Context Protocol não habilitado na configuração principal${NC}"
fi

# Verificar agentes configurados
echo ""
echo "🤖 Verificando agentes configurados..."

if grep -q "assistente-juridico-reviewer" ".gitlab/duo-agent-platform.toml"; then
    echo -e "${GREEN}✅ Agente assistente-juridico-reviewer configurado${NC}"
else
    echo -e "${RED}❌ Agente assistente-juridico-reviewer não encontrado${NC}"
fi

if grep -q "assistente-juridico-generator" ".gitlab/duo-agent-platform.toml"; then
    echo -e "${GREEN}✅ Agente assistente-juridico-generator configurado${NC}"
else
    echo -e "${RED}❌ Agente assistente-juridico-generator não encontrado${NC}"
fi

if grep -q "assistente-juridico-optimizer" ".gitlab/duo-agent-platform.toml"; then
    echo -e "${GREEN}✅ Agente assistente-juridico-optimizer configurado${NC}"
else
    echo -e "${RED}❌ Agente assistente-juridico-optimizer não encontrado${NC}"
fi

# Verificar integração com ferramentas jurídicas
echo ""
echo "⚖️  Verificando integrações jurídicas..."

if grep -q "djen-integration" ".gitlab/duo-mcp.toml"; then
    echo -e "${GREEN}✅ Integração DJEN/DataJud configurada${NC}"
else
    echo -e "${RED}❌ Integração DJEN/DataJud não encontrada${NC}"
fi

if grep -q "google-calendar-integration" ".gitlab/duo-mcp.toml"; then
    echo -e "${GREEN}✅ Integração Google Calendar configurada${NC}"
else
    echo -e "${RED}❌ Integração Google Calendar não encontrada${NC}"
fi

if grep -q "todoist-integration" ".gitlab/duo-mcp.toml"; then
    echo -e "${GREEN}✅ Integração Todoist configurada${NC}"
else
    echo -e "${RED}❌ Integração Todoist não encontrada${NC}"
fi

# Verificar comandos disponíveis
echo ""
echo "💬 Verificando comandos disponíveis..."

commands=("legal-review" "generate-docs" "optimize-performance")
for cmd in "${commands[@]}"; do
    if grep -q "$cmd" ".gitlab/duo-config.yml"; then
        echo -e "${GREEN}✅ Comando /$cmd disponível${NC}"
    else
        echo -e "${RED}❌ Comando /$cmd não encontrado${NC}"
    fi
done

# Teste de conectividade (simulado)
echo ""
echo "🌐 Testando conectividade (simulado)..."

# Simular teste de conectividade com GitLab Duo
echo -e "${YELLOW}⚠️  Nota: Testes reais de conectividade requerem acesso ao GitLab${NC}"
echo -e "${YELLOW}💡 Para testar: faça um commit e push para acionar o pipeline${NC}"

echo ""
echo "🎉 Validação concluída!"
echo "=========================="
echo "Para aplicar as configurações:"
echo "1. Faça commit e push dos arquivos .gitlab/"
echo "2. Acesse o GitLab e verifique se o Duo Chat reconhece os novos agentes"
echo "3. Teste os comandos /legal-review, /generate-docs, /optimize-performance"
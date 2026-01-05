#!/bin/bash

# ==============================================================================
# 🧪 Ferramenta de Identificação de Testes
# ==============================================================================
# Identifica e lista todos os testes disponíveis no projeto
# 
# Uso:
#   bash scripts/list-all-tests.sh [opções]
#
# Opções:
#   --summary    Mostra apenas resumo por categoria
#   --detailed   Mostra lista detalhada de todos os testes
#   --json       Exporta resultado em JSON
#   --run        Executa análise e salva em arquivo
# ==============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Diretório base do projeto (resolução dinâmica)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# Arquivo de saída
OUTPUT_FILE="docs/TODOS_OS_TESTES.md"
JSON_FILE="docs/tests-inventory.json"

# ==============================================================================
# Funções Auxiliares
# ==============================================================================

print_header() {
    echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${BOLD}${GREEN}▶ $1${NC}"
    echo -e "${YELLOW}───────────────────────────────────────────────────${NC}"
}

count_files() {
    local pattern=$1
    find . -type f -name "$pattern" 2>/dev/null | wc -l | tr -d ' '
}

# ==============================================================================
# Análise de Testes
# ==============================================================================

analyze_unit_tests() {
    print_section "1. Testes Unitários (Frontend)"
    
    local count=$(count_files "*.test.ts")
    local tsx_count=$(count_files "*.test.tsx")
    local total=$((count + tsx_count))
    
    echo -e "${CYAN}Total de arquivos:${NC} $total"
    echo -e "${CYAN}├─ TypeScript (.test.ts):${NC} $count"
    echo -e "${CYAN}└─ TypeScript JSX (.test.tsx):${NC} $tsx_count"
    
    if [ "$1" = "detailed" ]; then
        echo -e "\n${YELLOW}Arquivos encontrados:${NC}"
        find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" \) \
            -not -path "*/node_modules/*" \
            -not -path "*/dist/*" \
            -not -path "*/.next/*" | sort | sed 's|^\./||' | nl -w2 -s'. '
    fi
}

analyze_api_tests() {
    print_section "2. Testes de API (Backend)"
    
    local count=$(find api -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    echo -e "${CYAN}Total de arquivos:${NC} $count"
    
    if [ "$1" = "detailed" ]; then
        echo -e "\n${YELLOW}Arquivos encontrados:${NC}"
        find api -type f -name "*.test.ts" 2>/dev/null | sort | sed 's|^\./||' | nl -w2 -s'. '
    fi
}

analyze_e2e_tests() {
    print_section "3. Testes E2E (Playwright)"
    
    local spec_count=$(count_files "*.spec.ts")
    local e2e_count=$(find tests -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local total=$((spec_count + e2e_count))
    
    echo -e "${CYAN}Total de arquivos:${NC} $total"
    echo -e "${CYAN}├─ Spec files (.spec.ts):${NC} $spec_count"
    echo -e "${CYAN}└─ Test files (tests/*.test.ts):${NC} $e2e_count"
    
    if [ "$1" = "detailed" ]; then
        echo -e "\n${YELLOW}Arquivos encontrados:${NC}"
        find . -type f \( -name "*.spec.ts" -o -path "*/tests/*.test.ts" \) \
            -not -path "*/node_modules/*" \
            -not -path "*/dist/*" | sort | sed 's|^\./||' | nl -w2 -s'. '
    fi
}

analyze_integration_tests() {
    print_section "4. Testes de Integração"
    
    local count=$(find tests/integration -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    echo -e "${CYAN}Total de arquivos:${NC} $count"
    
    if [ "$1" = "detailed" ] && [ $count -gt 0 ]; then
        echo -e "\n${YELLOW}Arquivos encontrados:${NC}"
        find tests/integration -type f -name "*.test.ts" 2>/dev/null | sort | sed 's|^\./||' | nl -w2 -s'. '
    fi
}

analyze_chrome_extension_tests() {
    print_section "5. Testes da Extensão Chrome PJe"
    
    local count=$(find chrome-extension-pje -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    echo -e "${CYAN}Total de arquivos:${NC} $count"
    
    if [ "$1" = "detailed" ] && [ $count -gt 0 ]; then
        echo -e "\n${YELLOW}Arquivos encontrados:${NC}"
        find chrome-extension-pje -type f -name "*.test.ts" 2>/dev/null | sort | sed 's|^\./||' | nl -w2 -s'. '
    fi
}

analyze_test_configs() {
    print_section "6. Arquivos de Configuração de Testes"
    
    echo -e "${CYAN}Arquivos encontrados:${NC}"
    
    [ -f "vitest.config.ts" ] && echo -e "${GREEN}✓${NC} vitest.config.ts (Unit Tests)"
    [ -f "playwright.config.ts" ] && echo -e "${GREEN}✓${NC} playwright.config.ts (E2E Tests)"
    [ -f "jest.config.js" ] && echo -e "${GREEN}✓${NC} jest.config.js (Jest - se existir)"
    [ -f ".mocharc.json" ] && echo -e "${GREEN}✓${NC} .mocharc.json (Mocha - se existir)"
    
    echo ""
    [ -f "src/test/setup.ts" ] && echo -e "${GREEN}✓${NC} src/test/setup.ts (Setup global)"
    [ -f "tests/setup.ts" ] && echo -e "${GREEN}✓${NC} tests/setup.ts (Setup E2E)"
}

analyze_test_utilities() {
    print_section "7. Utilitários de Teste"
    
    local helpers_count=$(find . -type f \( -name "*helpers.ts" -o -name "*utils.ts" \) -path "*/test/*" 2>/dev/null | wc -l | tr -d ' ')
    local mocks_count=$(find . -type f -name "*mock*.ts" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
    local fixtures_count=$(find . -type f -name "*fixture*.ts" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
    
    echo -e "${CYAN}Helpers de teste:${NC} $helpers_count"
    echo -e "${CYAN}Mock files:${NC} $mocks_count"
    echo -e "${CYAN}Fixtures:${NC} $fixtures_count"
}

# ==============================================================================
# Gerar Resumo Total
# ==============================================================================

generate_summary() {
    local unit_ts=$(count_files "*.test.ts")
    local unit_tsx=$(count_files "*.test.tsx")
    local unit_total=$((unit_ts + unit_tsx))
    
    local api_tests=$(find api -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    local spec_tests=$(count_files "*.spec.ts")
    local e2e_tests=$(find tests -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local e2e_total=$((spec_tests + e2e_tests))
    
    local integration_tests=$(find tests/integration -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local chrome_tests=$(find chrome-extension-pje -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    
    local grand_total=$((unit_total + api_tests + e2e_total + integration_tests + chrome_tests))
    
    print_header "📊 RESUMO GERAL"
    
    echo -e "${BOLD}Total de Arquivos de Teste: ${GREEN}$grand_total${NC}\n"
    
    echo -e "${CYAN}Distribuição por Categoria:${NC}"
    echo -e "├─ ${YELLOW}Testes Unitários (Frontend):${NC} $unit_total"
    echo -e "│  ├─ .test.ts: $unit_ts"
    echo -e "│  └─ .test.tsx: $unit_tsx"
    echo -e "├─ ${YELLOW}Testes de API (Backend):${NC} $api_tests"
    echo -e "├─ ${YELLOW}Testes E2E (Playwright):${NC} $e2e_total"
    echo -e "│  ├─ .spec.ts: $spec_tests"
    echo -e "│  └─ tests/*.test.ts: $e2e_tests"
    echo -e "├─ ${YELLOW}Testes de Integração:${NC} $integration_tests"
    echo -e "└─ ${YELLOW}Testes Chrome Extension:${NC} $chrome_tests"
    
    echo -e "\n${CYAN}Comandos Disponíveis:${NC}"
    echo -e "├─ ${GREEN}npm run test${NC}          - Todos os testes (watch mode)"
    echo -e "├─ ${GREEN}npm run test:run${NC}      - Todos os testes (run once)"
    echo -e "├─ ${GREEN}npm run test:unit${NC}     - Apenas testes unitários"
    echo -e "├─ ${GREEN}npm run test:api${NC}      - Apenas testes de API"
    echo -e "├─ ${GREEN}npm run test:e2e${NC}      - Apenas testes E2E"
    echo -e "├─ ${GREEN}npm run test:coverage${NC} - Testes com cobertura"
    echo -e "└─ ${GREEN}npm run test:ui${NC}       - Interface visual de testes"
}

# ==============================================================================
# Exportar para Markdown
# ==============================================================================

export_to_markdown() {
    echo "Gerando documentação em $OUTPUT_FILE..."
    
    local current_date=$(date '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "2024-12-09")
    
    cat > "$OUTPUT_FILE" << EOF
# 🧪 Inventário Completo de Testes

**Gerado automaticamente em:** $current_date  
**Ferramenta:** \`scripts/list-all-tests.sh\`

---

## 📊 Resumo Executivo

EOF

    # Calcular totais
    local unit_total=$(($(count_files "*.test.ts") + $(count_files "*.test.tsx")))
    local api_total=$(find api -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local e2e_total=$(($(count_files "*.spec.ts") + $(find tests -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')))
    local integration_total=$(find tests/integration -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local chrome_total=$(find chrome-extension-pje -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local grand_total=$((unit_total + api_total + e2e_total + integration_total + chrome_total))
    
    cat >> "$OUTPUT_FILE" << EOF
| Categoria | Total | Porcentagem |
|-----------|-------|-------------|
| **Testes Unitários** | $unit_total | $(awk "BEGIN {printf \"%.1f\", ($unit_total/$grand_total)*100}")% |
| **Testes de API** | $api_total | $(awk "BEGIN {printf \"%.1f\", ($api_total/$grand_total)*100}")% |
| **Testes E2E** | $e2e_total | $(awk "BEGIN {printf \"%.1f\", ($e2e_total/$grand_total)*100}")% |
| **Testes de Integração** | $integration_total | $(awk "BEGIN {printf \"%.1f\", ($integration_total/$grand_total)*100}")% |
| **Testes Chrome Extension** | $chrome_total | $(awk "BEGIN {printf \"%.1f\", ($chrome_total/$grand_total)*100}")% |
| **TOTAL** | **$grand_total** | **100%** |

---

## 📁 Testes Unitários (Frontend)

EOF

    find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/dist/*" \
        -not -path "*/api/*" \
        -not -path "*/tests/*" \
        -not -path "*/.next/*" 2>/dev/null | sort | while read -r file; do
        echo "- \`${file#./}\`" >> "$OUTPUT_FILE"
    done
    
    cat >> "$OUTPUT_FILE" << EOF

---

## 🌐 Testes de API (Backend)

EOF

    find api -type f -name "*.test.ts" 2>/dev/null | sort | while read -r file; do
        echo "- \`${file#./}\`" >> "$OUTPUT_FILE"
    done
    
    cat >> "$OUTPUT_FILE" << EOF

---

## 🎭 Testes E2E (Playwright)

EOF

    find . -type f \( -name "*.spec.ts" -o -path "*/tests/*.test.ts" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/dist/*" 2>/dev/null | sort | while read -r file; do
        echo "- \`${file#./}\`" >> "$OUTPUT_FILE"
    done
    
    cat >> "$OUTPUT_FILE" << EOF

---

## 🔗 Testes de Integração

EOF

    find tests/integration -type f -name "*.test.ts" 2>/dev/null | sort | while read -r file; do
        echo "- \`${file#./}\`" >> "$OUTPUT_FILE"
    done || echo "*Nenhum teste de integração encontrado*" >> "$OUTPUT_FILE"
    
    cat >> "$OUTPUT_FILE" << EOF

---

## 🌐 Testes Chrome Extension PJe

EOF

    find chrome-extension-pje -type f -name "*.test.ts" 2>/dev/null | sort | while read -r file; do
        echo "- \`${file#./}\`" >> "$OUTPUT_FILE"
    done || echo "*Nenhum teste da extensão encontrado*" >> "$OUTPUT_FILE"
    
    cat >> "$OUTPUT_FILE" << 'EOF'

---

## 🛠️ Comandos de Execução

### Executar Todos os Testes
```bash
npm run test              # Watch mode (desenvolvimento)
npm run test:run          # Run once (CI/CD)
```

### Por Categoria
```bash
npm run test:unit         # Apenas unitários
npm run test:api          # Apenas API
npm run test:e2e          # Apenas E2E
npm run test:integration  # Apenas integração
```

### Com Cobertura
```bash
npm run test:coverage     # Gerar relatório de cobertura
npm run test:ui           # Interface visual
```

### Executar Arquivo Específico
```bash
npm test -- <caminho-do-arquivo>
npm test -- src/lib/config.test.ts
```

---

## 📋 Arquivos de Configuração

- `vitest.config.ts` - Configuração do Vitest (unit tests)
- `playwright.config.ts` - Configuração do Playwright (E2E)
- `src/test/setup.ts` - Setup global de testes
- `.github/workflows/tests.yml` - CI/CD pipeline

---

**Última atualização:** $current_date  
**Gerado por:** scripts/list-all-tests.sh
EOF

    echo -e "${GREEN}✓${NC} Documentação salva em: $OUTPUT_FILE"
}

# ==============================================================================
# Exportar para JSON
# ==============================================================================

export_to_json() {
    echo "Gerando inventário JSON em $JSON_FILE..."
    
    local current_date=$(date '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "2024-12-09 00:00:00")
    
    # Calcular totais
    local unit_total=$(($(count_files "*.test.ts") + $(count_files "*.test.tsx")))
    local api_total=$(find api -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local e2e_total=$(count_files "*.spec.ts")
    local integration_total=$(find tests/integration -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local chrome_total=$(find chrome-extension-pje -type f -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    local grand_total=$((unit_total + api_total + e2e_total + integration_total + chrome_total))
    
    cat > "$JSON_FILE" << EOF
{
  "generated": "$current_date",
  "project": "assistente-juridico-p",
  "summary": {
    "total": $grand_total,
    "unit": $unit_total,
    "api": $api_total,
    "e2e": $e2e_total,
    "integration": $integration_total,
    "chrome_extension": $chrome_total
  }
}
EOF

    echo -e "${GREEN}✓${NC} JSON salvo em: $JSON_FILE"
}

# ==============================================================================
# Main
# ==============================================================================

main() {
    local mode="summary"
    
    # Parse argumentos
    for arg in "$@"; do
        case $arg in
            --summary)
                mode="summary"
                ;;
            --detailed)
                mode="detailed"
                ;;
            --json)
                mode="json"
                ;;
            --run)
                mode="run"
                ;;
            --help)
                echo "Uso: $0 [opções]"
                echo ""
                echo "Opções:"
                echo "  --summary    Mostra apenas resumo (padrão)"
                echo "  --detailed   Mostra lista detalhada"
                echo "  --json       Exporta para JSON"
                echo "  --run        Gera documentação completa"
                exit 0
                ;;
        esac
    done
    
    print_header "🧪 IDENTIFICADOR DE TESTES - Assistente Jurídico PJe"
    
    case $mode in
        summary)
            analyze_unit_tests
            analyze_api_tests
            analyze_e2e_tests
            analyze_integration_tests
            analyze_chrome_extension_tests
            analyze_test_configs
            analyze_test_utilities
            generate_summary
            ;;
        detailed)
            analyze_unit_tests "detailed"
            analyze_api_tests "detailed"
            analyze_e2e_tests "detailed"
            analyze_integration_tests "detailed"
            analyze_chrome_extension_tests "detailed"
            analyze_test_configs
            analyze_test_utilities
            generate_summary
            ;;
        json)
            export_to_json
            ;;
        run)
            analyze_unit_tests "detailed"
            analyze_api_tests "detailed"
            analyze_e2e_tests "detailed"
            analyze_integration_tests "detailed"
            analyze_chrome_extension_tests "detailed"
            analyze_test_configs
            analyze_test_utilities
            generate_summary
            export_to_markdown
            export_to_json
            echo -e "\n${GREEN}✓ Documentação completa gerada!${NC}"
            ;;
    esac
    
    echo ""
}

main "$@"

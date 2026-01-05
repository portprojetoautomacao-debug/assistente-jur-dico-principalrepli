#!/bin/bash
# Script para verificar cobertura de testes e gerar relatório completo
# Uso: ./scripts/check-coverage.sh [--detailed] [--upload]

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICAÇÃO DE COBERTURA DE TESTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DETAILED_MODE=false
UPLOAD_MODE=false

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --detailed)
            DETAILED_MODE=true
            shift
            ;;
        --upload)
            UPLOAD_MODE=true
            shift
            ;;
        *)
            echo "❌ Argumento desconhecido: $1"
            echo "Uso: $0 [--detailed] [--upload]"
            exit 1
            ;;
    esac
done

# 1. Executar testes com cobertura
echo ""
echo "🧪 Executando testes com cobertura..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

export NODE_OPTIONS="--max-old-space-size=8192 --expose-gc"
npm run test:coverage 2>&1 | tee coverage-output.log

# 2. Verificar se cobertura foi gerada
if [[ -f "coverage/coverage-summary.json" ]]; then
  COVERAGE_SUMMARY="coverage/coverage-summary.json"
elif [[ -f "coverage/coverage-final.json" ]]; then
  COVERAGE_SUMMARY="coverage/coverage-final.json"
elif [[ -f "coverage-api/coverage-summary.json" ]]; then
  COVERAGE_SUMMARY="coverage-api/coverage-summary.json"
elif [[ -f "coverage-api/coverage-final.json" ]]; then
  COVERAGE_SUMMARY="coverage-api/coverage-final.json"
else
  echo "❌ Arquivo de cobertura não encontrado! (procurei coverage/coverage-summary.json, coverage/coverage-final.json and coverage-api/coverage-summary.json, coverage-api/coverage-final.json)"
  exit 1
fi
echo "✅ Usando ${COVERAGE_SUMMARY} para análise"
# 3. Extrair métricas de cobertura
echo ""
echo "📈 Analisando métricas de cobertura..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Usar Node.js para extrair dados do JSON
cat > parse-coverage.mjs << 'EOF'
import fs from 'fs';

const SUMMARY_PATH = process.env.SUMMARY_PATH || 'coverage/coverage-summary.json';
if (!fs.existsSync(SUMMARY_PATH)) {
  console.error(`Arquivo de resumo não encontrado: ${SUMMARY_PATH}`);
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
let total = null;
let summary = raw;
// If this is a coverage-final.json from v8, we need to compute totals
if (!raw.total) {
  // raw is a map of filePath -> coverage info
  let statementsTotal = 0;
  let statementsCovered = 0;
  let functionsTotal = 0;
  let functionsCovered = 0;
  let branchesTotal = 0;
  let branchesCovered = 0;
  for (const filePath of Object.keys(raw)) {
    const info = raw[filePath];
    const s = info.s || {};
    const f = info.f || {};
    const b = info.b || {};
    // statements
    statementsTotal += Object.keys(s).length;
    statementsCovered += Object.values(s).filter(v => v > 0).length;
    // functions
    functionsTotal += Object.keys(f).length;
    functionsCovered += Object.values(f).filter(v => v > 0).length;
    // branches (b is an object where each key maps to an array of counts)
    for (const key of Object.keys(b)) {
      const arr = b[key];
      branchesTotal += arr.length;
      branchesCovered += arr.filter(v => v > 0).length;
    }
  }
  total = {
    lines: {
      total: statementsTotal,
      covered: statementsCovered,
      pct: statementsTotal === 0 ? 100 : (statementsCovered / statementsTotal) * 100
    },
    statements: {
      total: statementsTotal,
      covered: statementsCovered,
      pct: statementsTotal === 0 ? 100 : (statementsCovered / statementsTotal) * 100
    },
    functions: {
      total: functionsTotal,
      covered: functionsCovered,
      pct: functionsTotal === 0 ? 100 : (functionsCovered / functionsTotal) * 100
    },
    branches: {
      total: branchesTotal,
      covered: branchesCovered,
      pct: branchesTotal === 0 ? 100 : (branchesCovered / branchesTotal) * 100
    }
  };
  // Create a summary object for compatibility
  summary = { total };
}

console.log('\n📊 COBERTURA GERAL:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Linhas:       ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})`);
console.log(`Statements:   ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})`);
console.log(`Funções:      ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})`);
console.log(`Branches:     ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})`);

// Verificar thresholds
const thresholds = {
  lines: 80,
  statements: 80,
  functions: 75,
  branches: 70
};

let failed = false;
console.log('\n🎯 VERIFICAÇÃO DE THRESHOLDS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

Object.keys(thresholds).forEach(key => {
  const actual = total[key].pct;
  const threshold = thresholds[key];
  const status = actual >= threshold ? '✅' : '❌';
  console.log(`${status} ${key.padEnd(12)}: ${actual.toFixed(2)}% (threshold: ${threshold}%)`);
  if (actual < threshold) failed = true;
});

// Identificar arquivos com baixa cobertura
console.log('\n⚠️  ARQUIVOS COM BAIXA COBERTURA (<60%):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const lowCoverage = [];
Object.keys(summary).forEach(file => {
  if (file === 'total') return;
  const fileCov = summary[file];
  if (fileCov.lines.pct < 60) {
    lowCoverage.push({
      file,
      lines: fileCov.lines.pct,
      statements: fileCov.statements.pct,
      functions: fileCov.functions.pct,
      branches: fileCov.branches.pct
    });
  }
});

if (lowCoverage.length === 0) {
  console.log('✅ Nenhum arquivo com cobertura abaixo de 60%');
} else {
  lowCoverage.sort((a, b) => a.lines - b.lines).forEach(item => {
    console.log(`📄 ${item.file}`);
    console.log(`   Linhas: ${item.lines.toFixed(2)}%, Funções: ${item.functions.toFixed(2)}%`);
  });
  console.log(`\nTotal: ${lowCoverage.length} arquivo(s) com baixa cobertura`);
}

// Identificar arquivos sem testes
console.log('\n🔴 ARQUIVOS SEM TESTES (0% cobertura):');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const untested = [];
Object.keys(summary).forEach(file => {
  if (file === 'total') return;
  const fileCov = summary[file];
  if (fileCov.lines.pct === 0 && fileCov.statements.total > 0) {
    untested.push(file);
  }
});

if (untested.length === 0) {
  console.log('✅ Todos os arquivos têm alguma cobertura');
} else {
  untested.forEach(file => console.log(`📄 ${file}`));
  console.log(`\nTotal: ${untested.length} arquivo(s) sem testes`);
}

process.exit(failed ? 1 : 0);
EOF

COVERAGE_STATUS=0
SUMMARY_PATH=${COVERAGE_SUMMARY} node parse-coverage.mjs
COVERAGE_STATUS=$?
COVERAGE_STATUS=$?

# 4. Gerar relatório detalhado se solicitado
if [[ "$DETAILED_MODE" == true ]]; then
    echo ""
    echo "📋 Gerando relatório detalhado..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Gerar relatório HTML
    if [[ -d "coverage/lcov-report" ]]; then
        echo "✅ Relatório HTML disponível em: coverage/lcov-report/index.html"

        # Tentar abrir no navegador (se disponível)
        if command -v xdg-open &> /dev/null; then
            xdg-open coverage/lcov-report/index.html &
        elif command -v open &> /dev/null; then
            open coverage/lcov-report/index.html &
        fi
    fi

    # Listar top 10 arquivos mais testados
    cat > top-coverage.mjs << 'EOF'
import fs from 'fs';

const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));

const files = Object.keys(summary)
  .filter(f => f !== 'total')
  .map(file => ({
    file,
    coverage: summary[file].lines.pct
  }))
  .sort((a, b) => b.coverage - a.coverage)
  .slice(0, 10);

console.log('\n🏆 TOP 10 ARQUIVOS COM MELHOR COBERTURA:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
files.forEach((item, idx) => {
  console.log(`${idx + 1}. ${item.coverage.toFixed(2)}% - ${item.file}`);
});
EOF

    node top-coverage.mjs
    rm -f top-coverage.mjs
fi

# 5. Upload para Codecov se solicitado
if [[ "$UPLOAD_MODE" == true ]]; then
    echo ""
    echo "☁️  Fazendo upload para Codecov..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ -z "$CODECOV_TOKEN" ]]; then
        echo "⚠️  CODECOV_TOKEN não configurado. Pulando upload."
    else
        if command -v codecov &> /dev/null; then
            codecov
            echo "✅ Upload para Codecov concluído"
        else
            echo "⚠️  Codecov CLI não instalado. Instale com: npm install -g codecov"
        fi
    fi
fi

# 6. Salvar resumo em arquivo
echo ""
echo "💾 Salvando resumo da cobertura..."

cat > coverage-summary.txt << EOF
RESUMO DE COBERTURA DE TESTES
Data: $(date '+%Y-%m-%d %H:%M:%S')

EOF

grep -A 10 "COBERTURA GERAL" coverage-output.log >> coverage-summary.txt || true
echo "✅ Resumo salvo em: coverage-summary.txt"

# 7. Limpar arquivos temporários
rm -f parse-coverage.mjs

# 8. Resultado final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $COVERAGE_STATUS -eq 0 ]]; then
    echo "✅ COBERTURA ADEQUADA - Todos os thresholds atingidos!"
else
    echo "⚠️  COBERTURA ABAIXO DO ESPERADO - Alguns thresholds não foram atingidos"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Recursos disponíveis:"
echo "   • Relatório HTML: coverage/lcov-report/index.html"
echo "   • Resumo JSON: coverage/coverage-summary.json"
echo "   • Resumo TXT: coverage-summary.txt"
echo ""

exit $COVERAGE_STATUS

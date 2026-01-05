import fs from 'node:fs';

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

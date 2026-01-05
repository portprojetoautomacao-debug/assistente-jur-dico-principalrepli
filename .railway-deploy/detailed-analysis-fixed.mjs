#!/usr/bin/env node
/**
 * Análise Detalhada - Duplicação + 89 Violações
 */

const SONAR_CONFIG = {
  url: 'https://sonarcloud.io',
  token: '405bd014cbac226c756dcff6e201e0fdfde36e23',
  projectKey: 'thiagobodevan-a11y_assistente-juridico-p',
};

async function fetch(url, options = {}) {
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch(url, options);
}

function createAuthHeader() {
  return 'Basic ' + Buffer.from(`${SONAR_CONFIG.token}:`).toString('base64');
}

async function apiCall(endpoint, params = {}) {
  const url = new URL(`${SONAR_CONFIG.url}/api/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': createAuthHeader() }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

console.log('╭────────────────────────────────────────────────────────╮');
console.log('│   📊 ANÁLISE DETALHADA - DUPLICAÇÃO + VIOLAÇÕES       │');
console.log('╰────────────────────────────────────────────────────────╯\n');

// 1. ANÁLISE DE DUPLICAÇÃO
async function analyzeDuplication() {
  console.log('📝 1. ANÁLISE DE DUPLICAÇÃO DE CÓDIGO');
  console.log('─'.repeat(60) + '\n');

  try {
    const measures = await apiCall('measures/component', {
      component: SONAR_CONFIG.projectKey,
      metricKeys: 'duplicated_lines_density,duplicated_lines,duplicated_blocks,duplicated_files'
    });

    if (!measures.component || !measures.component.measures) {
      console.log('⚠️ Dados de duplicação não disponíveis\n');
      return;
    }

    console.log('📊 Métricas de Duplicação:\n');
    measures.component.measures.forEach(measure => {
      const labels = {
        'duplicated_lines_density': '📈 Densidade de duplicação',
        'duplicated_lines': '📏 Linhas duplicadas',
        'duplicated_blocks': '🔲 Blocos duplicados',
        'duplicated_files': '📁 Arquivos duplicados'
      };
      console.log(`   ${labels[measure.metric]}: ${measure.value}${measure.metric.includes('density') ? '%' : ''}`);
    });
    console.log();
  } catch (error) {
    console.log(`⚠️ Análise de duplicação: ${error.message}\n`);
  }
}

// 2. RELATÓRIO DAS 89 VIOLAÇÕES
async function analyzeViolations() {
  console.log('🚨 2. RELATÓRIO DAS NOVAS VIOLAÇÕES');
  console.log('─'.repeat(60) + '\n');

  const issues = await apiCall('issues/search', {
    componentKeys: SONAR_CONFIG.projectKey,
    sinceLeakPeriod: 'true',
    ps: 100
  });

  console.log(`📊 Total de novas violações: ${issues.total}\n`);

  const bySeverity = {};
  issues.issues.forEach(issue => {
    if (!bySeverity[issue.severity]) {
      bySeverity[issue.severity] = [];
    }
    bySeverity[issue.severity].push(issue);
  });

  ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO'].forEach(severity => {
    if (!bySeverity[severity]) return;
    
    const emoji = {
      'BLOCKER': '🛑',
      'CRITICAL': '⚠️',
      'MAJOR': '🟠',
      'MINOR': '🔵',
      'INFO': 'ℹ️'
    }[severity];

    console.log(`${emoji} ${severity} (${bySeverity[severity].length} issues):`);
    console.log();

    const byRule = {};
    bySeverity[severity].forEach(issue => {
      if (!byRule[issue.rule]) {
        byRule[issue.rule] = [];
      }
      byRule[issue.rule].push(issue);
    });

    Object.entries(byRule).slice(0, 5).forEach(([rule, ruleIssues]) => {
      console.log(`  📄 ${rule} (${ruleIssues.length}x)`);
      console.log(`     ${ruleIssues[0].message}`);
      
      ruleIssues.slice(0, 3).forEach(issue => {
        const file = issue.component.split(':')[1];
        console.log(`     • ${file}:${issue.line || 'N/A'}`);
      });
      
      if (ruleIssues.length > 3) {
        console.log(`     ... e mais ${ruleIssues.length - 3} ocorrências`);
      }
      console.log();
    });

    if (Object.keys(byRule).length > 5) {
      console.log(`  ... e mais ${Object.keys(byRule).length - 5} regras diferentes\n`);
    }
  });
}

// 3. TOP 10 REGRAS MAIS VIOLADAS
async function analyzeTopRules() {
  console.log('🏆 3. TOP 10 REGRAS MAIS VIOLADAS');
  console.log('─'.repeat(60) + '\n');

  const issues = await apiCall('issues/search', {
    componentKeys: SONAR_CONFIG.projectKey,
    ps: 500
  });

  const ruleCount = {};
  issues.issues.forEach(issue => {
    ruleCount[issue.rule] = (ruleCount[issue.rule] || 0) + 1;
  });

  const sortedRules = Object.entries(ruleCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedRules.forEach(([rule, count], idx) => {
    console.log(`${idx + 1}. ${rule}: ${count} ocorrências`);
  });
  console.log();
}

// 4. ARQUIVOS COM MAIS PROBLEMAS
async function analyzeProblematicFiles() {
  console.log('📁 4. ARQUIVOS COM MAIS PROBLEMAS');
  console.log('─'.repeat(60) + '\n');

  const issues = await apiCall('issues/search', {
    componentKeys: SONAR_CONFIG.projectKey,
    ps: 500
  });

  const fileCount = {};
  issues.issues.forEach(issue => {
    const file = issue.component.split(':')[1];
    fileCount[file] = (fileCount[file] || 0) + 1;
  });

  const sortedFiles = Object.entries(fileCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedFiles.forEach(([file, count], idx) => {
    console.log(`${idx + 1}. ${file}: ${count} issues`);
  });
  console.log();
}

async function run() {
  try {
    await analyzeDuplication();
    await analyzeViolations();
    await analyzeTopRules();
    await analyzeProblematicFiles();

    console.log('─'.repeat(60));
    console.log('✅ Análise detalhada finalizada!');
    console.log('─'.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Erro na análise:', error.message);
    process.exit(1);
  }
}

run();

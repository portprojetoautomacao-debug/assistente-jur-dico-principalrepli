#!/usr/bin/env node
/**
 * 🧪 E2E Test 01: Validação de Ambiente
 * 
 * Valida:
 * - Node.js, npm, TypeScript
 * - Variáveis de ambiente
 * - Conexões Redis/Upstash
 * - APIs externas (DJEN, DataJud, Gemini)
 */

import { config } from 'dotenv';
import { Redis } from '@upstash/redis';

// Carregar .env
config();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ name, status, message, details });
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${name}: ${message}`);
  if (details) console.log('   Details:', details);
}

// ============================================================================
// 1. VALIDAR NODE.JS E DEPENDÊNCIAS
// ============================================================================

async function validateNodeEnvironment() {
  console.log('\n📦 Validando Ambiente Node.js...\n');

  // Node.js version
  const nodeVersion = process.version;
  const [major] = nodeVersion.slice(1).split('.').map(Number);
  
  if (major >= 18) {
    addResult('Node.js Version', 'PASS', `${nodeVersion} (>=18 required)`);
  } else {
    addResult('Node.js Version', 'FAIL', `${nodeVersion} (>=18 required)`, { current: nodeVersion, required: '>=18' });
  }

  // TypeScript
  try {
    const { execSync } = await import('child_process');
    const tsVersion = execSync('npx tsc --version', { encoding: 'utf-8' }).trim();
    addResult('TypeScript', 'PASS', tsVersion);
  } catch (error) {
    addResult('TypeScript', 'FAIL', 'TypeScript não encontrado', error);
  }

  // npm
  try {
    const { execSync } = await import('child_process');
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    addResult('npm', 'PASS', `v${npmVersion}`);
  } catch (error) {
    addResult('npm', 'FAIL', 'npm não encontrado', error);
  }
}

// ============================================================================
// 2. VALIDAR VARIÁVEIS DE AMBIENTE
// ============================================================================

function validateEnvironmentVariables() {
  console.log('\n🔐 Validando Variáveis de Ambiente...\n');

  const required = [
    'VITE_GEMINI_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  const optional = [
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'DSPY_BRIDGE_URL',
    'TODOIST_API_TOKEN',
    'EVOLUTION_API_URL',
    'EVOLUTION_API_KEY',
    'RESEND_API_KEY',
  ];

  // Validar obrigatórias
  for (const key of required) {
    if (process.env[key]) {
      addResult(`ENV: ${key}`, 'PASS', `Configurada (${process.env[key]?.substring(0, 10)}...)`);
    } else {
      addResult(`ENV: ${key}`, 'FAIL', 'Variável obrigatória não configurada');
    }
  }

  // Validar opcionais
  for (const key of optional) {
    if (process.env[key]) {
      addResult(`ENV: ${key}`, 'PASS', `Configurada (opcional)`);
    } else {
      addResult(`ENV: ${key}`, 'WARN', 'Variável opcional não configurada (funcionalidade pode estar desabilitada)');
    }
  }
}

// ============================================================================
// 3. VALIDAR CONEXÃO REDIS/UPSTASH
// ============================================================================

async function validateRedisConnection() {
  console.log('\n🗄️ Validando Conexão Redis/Upstash...\n');

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    addResult('Redis Connection', 'FAIL', 'Credenciais Redis não configuradas');
    return;
  }

  try {
    const redis = new Redis({ url, token });
    
    // Teste de escrita
    const testKey = 'e2e-test-key';
    const testValue = { timestamp: Date.now(), test: true };
    await redis.set(testKey, testValue, { ex: 60 }); // TTL 60s
    
    // Teste de leitura
    const retrieved = await redis.get(testKey);
    
    if (retrieved && typeof retrieved === 'object' && 'test' in retrieved) {
      addResult('Redis Write/Read', 'PASS', 'Conexão Redis funcionando corretamente');
    } else {
      addResult('Redis Write/Read', 'FAIL', 'Falha ao verificar dados escritos', { retrieved });
    }

    // Limpeza
    await redis.del(testKey);

  } catch (error) {
    addResult('Redis Connection', 'FAIL', 'Erro ao conectar com Redis', error instanceof Error ? error.message : error);
  }
}

// ============================================================================
// 4. VALIDAR APIS EXTERNAS
// ============================================================================

async function validateExternalAPIs() {
  console.log('\n🌐 Validando APIs Externas...\n');

  // Gemini API
  const geminiKey = process.env.VITE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
      if (response.ok) {
        addResult('Gemini API', 'PASS', 'API key válida e funcional');
      } else {
        addResult('Gemini API', 'FAIL', `HTTP ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      addResult('Gemini API', 'FAIL', 'Erro ao conectar com Gemini', error instanceof Error ? error.message : error);
    }
  } else {
    addResult('Gemini API', 'FAIL', 'VITE_GEMINI_API_KEY não configurada');
  }

  // DJEN API (sem auth, apenas health check)
  try {
    const response = await fetch('https://comunicaapi.pje.jus.br/api/v1/comunicacao?siglaTribunal=TJMG&itensPorPagina=1', {
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok || response.status === 422) {
      // 422 é esperado sem parâmetros corretos
      addResult('DJEN API', 'PASS', 'API DJEN acessível');
    } else {
      addResult('DJEN API', 'WARN', `HTTP ${response.status} - API pode estar indisponível`);
    }
  } catch (error) {
    addResult('DJEN API', 'WARN', 'Timeout ou erro de rede (normal se API estiver offline)', error instanceof Error ? error.message : error);
  }

  // Qdrant (se configurado)
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantKey = process.env.QDRANT_API_KEY;
  if (qdrantUrl && qdrantKey) {
    try {
      const response = await fetch(`${qdrantUrl}/collections`, {
        headers: { 'api-key': qdrantKey },
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        const data = await response.json();
        addResult('Qdrant API', 'PASS', `Conectado - ${data.result?.collections?.length || 0} collections`);
      } else {
        addResult('Qdrant API', 'FAIL', `HTTP ${response.status}`);
      }
    } catch (error) {
      addResult('Qdrant API', 'FAIL', 'Erro ao conectar com Qdrant', error instanceof Error ? error.message : error);
    }
  } else {
    addResult('Qdrant API', 'WARN', 'Qdrant não configurado (opcional)');
  }
}

// ============================================================================
// 5. VALIDAR BUILD E LINT
// ============================================================================

async function validateBuildAndLint() {
  console.log('\n🔨 Validando Build e Lint...\n');

  try {
    const { execSync } = await import('child_process');
    
    // Type check
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
      addResult('TypeScript Type Check', 'PASS', 'Sem erros de tipagem');
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      const errorCount = (output.match(/error TS\d+:/g) || []).length;
      addResult('TypeScript Type Check', 'FAIL', `${errorCount} erros de tipagem encontrados`, output.substring(0, 500));
    }

    // ESLint
    try {
      execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
      addResult('ESLint', 'PASS', 'Sem problemas de lint');
    } catch (error: any) {
      const output = error.stdout || error.stderr || '';
      addResult('ESLint', 'WARN', 'Warnings de lint encontrados (não bloqueante)', output.substring(0, 500));
    }

  } catch (error) {
    addResult('Build Validation', 'FAIL', 'Erro ao validar build', error);
  }
}

// ============================================================================
// 6. GERAR RELATÓRIO
// ============================================================================

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO DE AMBIENTE');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const total = results.length;

  console.log(`✅ PASS:  ${passed}/${total}`);
  console.log(`❌ FAIL:  ${failed}/${total}`);
  console.log(`⚠️  WARN:  ${warned}/${total}\n`);

  if (failed === 0) {
    console.log('🎉 AMBIENTE VALIDADO COM SUCESSO!\n');
    console.log('O sistema está pronto para testes end-to-end.\n');
  } else {
    console.log('🚨 ATENÇÃO: Existem falhas críticas que precisam ser corrigidas!\n');
    console.log('Revise os itens marcados como FAIL acima.\n');
  }

  // Salvar relatório em JSON
  const reportPath = 'scripts/e2e-tests/reports/01-env-validation.json';
  try {
    const fs = require('fs');
    const path = require('path');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { passed, failed, warned, total },
      results
    }, null, 2));
    console.log(`📄 Relatório salvo em: ${reportPath}\n`);
  } catch (error) {
    console.warn('⚠️  Não foi possível salvar relatório em arquivo\n');
  }

  return failed === 0;
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================

async function runAllValidations() {
  console.log('🧪 E2E TEST 01: VALIDAÇÃO DE AMBIENTE\n');
  console.log('Iniciado em:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  await validateNodeEnvironment();
  validateEnvironmentVariables();
  await validateRedisConnection();
  await validateExternalAPIs();
  await validateBuildAndLint();

  const success = generateReport();
  process.exit(success ? 0 : 1);
}

// Executar
runAllValidations().catch(error => {
  console.error('❌ Erro fatal durante validação:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Verificador de Variáveis de Ambiente
 * Verifica quais variáveis de ambiente são usadas no código
 */

import { execSync } from 'node:child_process';

console.log('🔍 Verificando variáveis de ambiente usadas no projeto...\n');

// Lista de variáveis esperadas (lado cliente e servidor)
const expectedVars = [
  // Lado cliente (VITE_)
  'VITE_GEMINI_API_KEY',
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_REDIRECT_URI',
  'VITE_DATAJUD_API_KEY',
  'VITE_TODOIST_API_KEY',
  'VITE_APP_ENV',

  // Lado servidor (process.env)
  'GEMINI_API_KEY',
  'TODOIST_TOKEN',
  'DJEN_API_KEY',
  'EVOLUTION_API_KEY',
  'EVOLUTION_INSTANCE_ID',
  'EVOLUTION_API_URL',
  'TODOIST_WEBHOOK_SECRET',
  'TODOIST_API_KEY'
];

console.log('📋 Variáveis esperadas:');
expectedVars.forEach(v => console.log(`  - ${v}`));
console.log();

// Buscar usos no código
console.log('🔎 Procurando usos no código...\n');

try {
  const result = execSync('find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -H "import\.meta\.env\\|process\.env\." 2>/dev/null || true', { encoding: 'utf8' });

  const foundVars = new Set();
  const lines = result.split('\n').filter(line => line.trim());

  console.log('📊 Variáveis encontradas no código:');
  lines.forEach(line => {
    // Buscar por import.meta.env.VARIAVEL
    let match = line.match(/import\.meta\.env\.([A-Z_]+)/);
    if (match) {
      const varName = match[1];
      if (expectedVars.includes(varName)) {
        foundVars.add(varName);
        console.log(`  ✅ ${varName} (cliente) - ${line.split(':')[0]}`);
      }
    }

    // Buscar por process.env.VARIAVEL
    match = line.match(/process\.env\.([A-Z_]+)/);
    if (match) {
      const varName = match[1];
      if (expectedVars.includes(varName)) {
        foundVars.add(varName);
        console.log(`  ✅ ${varName} (servidor) - ${line.split(':')[0]}`);
      }
    }
  });

  console.log(`\n📈 Resumo:`);
  console.log(`  - Variáveis esperadas: ${expectedVars.length}`);
  console.log(`  - Variáveis encontradas: ${foundVars.size}`);

  const missing = expectedVars.filter(v => !foundVars.has(v));
  if (missing.length > 0) {
    console.log(`  ⚠️  Variáveis não encontradas: ${missing.join(', ')}`);
  } else {
    console.log(`  ✅ Todas as variáveis esperadas são usadas no código`);
  }

} catch (error) {
  console.log('❌ Erro ao buscar variáveis no código');
}

console.log('\n💡 Para verificar no Vercel:');
console.log('1. Acesse https://vercel.com/dashboard');
console.log('2. Selecione o projeto assistente-juridico-p');
console.log('3. Vá em Settings > Environment Variables');
console.log('4. Verifique se todas as variáveis acima estão configuradas');
console.log('5. Certifique-se de que estão marcadas como Production');
console.log('6. Redeploy o projeto após configurar');
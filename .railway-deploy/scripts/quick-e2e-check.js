#!/usr/bin/env node
/**
 * 🧪 Quick E2E Validation
 * 
 * Testa rapidamente os componentes principais do sistema
 */

console.log('🧪 VALIDAÇÃO RÁPIDA E2E - Assistente Jurídico PJe\n');

// 1. Check Node.js
console.log('✅ Node.js:', process.version);

// 2. Check dependencies
try {
  require('@upstash/redis');
  console.log('✅ @upstash/redis: instalado');
} catch {
  console.log('❌ @upstash/redis: NÃO instalado');
}

try {
  require('dotenv');
  console.log('✅ dotenv: instalado');
} catch {
  console.log('❌ dotenv: NÃO instalado');
}

// 3. Check .env
require('dotenv').config();

const envVars = [
  'VITE_GEMINI_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

console.log('\n📋 Variáveis de Ambiente:');
envVars.forEach(key => {
  if (process.env[key]) {
    const value = process.env[key];
    const masked = value.substring(0, 10) + '...';
    console.log(`✅ ${key}: ${masked}`);
  } else {
    console.log(`❌ ${key}: NÃO configurada`);
  }
});

console.log('\n✨ Validação concluída!\n');

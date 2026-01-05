#!/usr/bin/env node

/**
 * Script de Backup do Redis (Upstash KV)
 * 
 * Este script realiza backup completo dos dados do Redis/Upstash KV
 * Usado pelo workflow backup-recovery.yml
 * 
 * Uso:
 *   node scripts/backup-redis.js
 * 
 * Variáveis de Ambiente Requeridas:
 *   - UPSTASH_REDIS_REST_URL: URL do Redis Upstash
 *   - UPSTASH_REDIS_REST_TOKEN: Token de autenticação
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuração
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `redis-backup-${Date.now()}.json`);

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Fazer requisição HTTP para o Upstash Redis
 */
function makeRequest(url, token, command) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(command);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (err) {
          reject(new Error(`Erro ao parsear resposta: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Obter todas as chaves do Redis
 */
async function getAllKeys(url, token) {
  log('\n🔍 Buscando todas as chaves do Redis...', colors.cyan);
  
  try {
    const response = await makeRequest(url, token, ['KEYS', '*']);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    const keys = response.result || [];
    log(`✅ Encontradas ${keys.length} chaves`, colors.green);
    return keys;
  } catch (error) {
    log(`❌ Erro ao buscar chaves: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Obter valor de uma chave
 */
async function getKeyValue(url, token, key) {
  try {
    const response = await makeRequest(url, token, ['GET', key]);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.result;
  } catch (error) {
    log(`⚠️ Erro ao obter valor da chave "${key}": ${error.message}`, colors.yellow);
    return null;
  }
}

/**
 * Realizar backup completo
 */
async function performBackup() {
  log('🚀 Iniciando backup do Redis...', colors.bright);
  
  // Validar variáveis de ambiente
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    log('❌ Variáveis de ambiente não configuradas:', colors.red);
    log('   - UPSTASH_REDIS_REST_URL', colors.red);
    log('   - UPSTASH_REDIS_REST_TOKEN', colors.red);
    process.exit(1);
  }
  
  try {
    // Criar diretório de backup se não existir
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      log(`📁 Diretório de backup criado: ${BACKUP_DIR}`, colors.green);
    }
    
    // Obter todas as chaves
    const keys = await getAllKeys(url, token);
    
    if (keys.length === 0) {
      log('⚠️ Nenhuma chave encontrada no Redis', colors.yellow);
      return;
    }
    
    // Obter valores de todas as chaves
    log('\n📥 Baixando valores...', colors.cyan);
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'upstash-redis',
      totalKeys: keys.length,
      data: {},
    };
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      process.stdout.write(`\r   Progresso: ${i + 1}/${keys.length} (${Math.round((i + 1) / keys.length * 100)}%)`);
      
      const value = await getKeyValue(url, token, key);
      backup.data[key] = value;
    }
    
    process.stdout.write('\n');
    
    // Salvar backup em arquivo
    log('\n💾 Salvando backup...', colors.cyan);
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf8');
    
    const fileSize = (fs.statSync(BACKUP_FILE).size / 1024).toFixed(2);
    
    log('\n' + '═'.repeat(60), colors.green);
    log('✅ BACKUP CONCLUÍDO COM SUCESSO!', colors.bright + colors.green);
    log('═'.repeat(60), colors.green);
    log(`📁 Arquivo: ${BACKUP_FILE}`, colors.cyan);
    log(`📊 Tamanho: ${fileSize} KB`, colors.cyan);
    log(`🔑 Total de chaves: ${keys.length}`, colors.cyan);
    log(`⏰ Timestamp: ${backup.timestamp}`, colors.cyan);
    log('═'.repeat(60) + '\n', colors.green);
    
    // Exportar path do backup para uso em workflows
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `backup_file=${BACKUP_FILE}\nbackup_size=${fileSize}\nkeys_count=${keys.length}\n`
      );
    }
    
  } catch (error) {
    log('\n❌ ERRO NO BACKUP:', colors.red);
    log(`   ${error.message}`, colors.red);
    log(`   ${error.stack}`, colors.yellow);
    process.exit(1);
  }
}

/**
 * Testar conexão com Redis
 */
async function testConnection() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    return false;
  }
  
  try {
    const response = await makeRequest(url, token, ['PING']);
    return response.result === 'PONG';
  } catch (error) {
    return false;
  }
}

// Executar script
(async () => {
  log('\n🔐 Verificando conexão com Redis...', colors.cyan);
  
  const connected = await testConnection();
  if (!connected) {
    log('❌ Falha ao conectar com Redis', colors.red);
    log('   Verifique as variáveis de ambiente:', colors.yellow);
    log('   - UPSTASH_REDIS_REST_URL', colors.yellow);
    log('   - UPSTASH_REDIS_REST_TOKEN', colors.yellow);
    process.exit(1);
  }
  
  log('✅ Conexão estabelecida\n', colors.green);
  
  await performBackup();
})();

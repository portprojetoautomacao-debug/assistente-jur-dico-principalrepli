import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

async function verifyUpstashConnection() {
  console.log('🔍 Verificando conexão com Upstash Redis...');

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('❌ Erro: Variáveis de ambiente UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN não encontradas.');
    console.log('   Certifique-se de criar um arquivo .env na raiz do projeto com essas variáveis.');
    process.exit(1);
  }

  try {
    const redis = new Redis({
      url,
      token,
    });

    console.log('📡 Tentando conectar...');
    const pong = await redis.ping();
    
    if (pong === 'PONG') {
      console.log('✅ Conexão bem-sucedida! O Redis respondeu com PONG.');
      
      // Teste de escrita/leitura
      const testKey = 'test-connection-' + Date.now();
      await redis.set(testKey, 'ok');
      const value = await redis.get(testKey);
      
      if (value === 'ok') {
        console.log('✅ Teste de escrita e leitura bem-sucedido.');
        await redis.del(testKey);
      } else {
        console.warn('⚠️ Aviso: Teste de escrita/leitura falhou. Valor retornado:', value);
      }

    } else {
      console.error('❌ Erro: Resposta inesperada do Redis:', pong);
    }

  } catch (error) {
    console.error('❌ Falha na conexão:', error);
  }
}

verifyUpstashConnection();

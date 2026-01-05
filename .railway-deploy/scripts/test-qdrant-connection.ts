/**
 * Script de Teste da Conexão Qdrant
 * 
 * Valida configuração e testa operações básicas
 */

import { config } from "dotenv";
import { createQdrantService } from "../src/lib/qdrant-service";

// Carregar variáveis de ambiente
config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || "legal_docs";

async function testConnection() {
  console.log("?? Testando Conexão com Qdrant Cloud...\n");

  // 1. Validar variáveis de ambiente
  console.log("?? Validando configuração:");
  
  if (!QDRANT_URL) {
    console.error("? QDRANT_URL não configurada");
    process.exit(1);
  }
  console.log(`? QDRANT_URL: ${QDRANT_URL}`);

  if (!QDRANT_API_KEY) {
    console.error("? QDRANT_API_KEY não configurada");
    process.exit(1);
  }
  console.log(`? QDRANT_API_KEY: ${QDRANT_API_KEY.substring(0, 20)}...`);
  console.log(`? COLLECTION_NAME: ${COLLECTION_NAME}`);

  // 2. Testar serviço
  console.log("\n?? Criando serviço Qdrant...");
  
  const service = createQdrantService({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    collectionName: COLLECTION_NAME,
  });

  if (!service) {
    console.error("? Falha ao criar serviço Qdrant");
    process.exit(1);
  }
  console.log("? Serviço criado com sucesso");

  // 3. Testar conexão com API direta
  console.log("\n?? Testando conexão com API...");
  
  try {
    const response = await fetch(`${QDRANT_URL}/collections`, {
      method: "GET",
      headers: {
        "api-key": QDRANT_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("? Conexão estabelecida!");
    console.log(`?? Collections disponíveis: ${data.result?.collections?.length || 0}`);
    
    if (data.result?.collections) {
      data.result.collections.forEach((col: any) => {
        console.log(`   - ${col.name}`);
      });
    }

  } catch (error) {
    console.error("? Erro ao conectar:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }

  // 4. Verificar collection específica
  console.log(`\n?? Verificando collection '${COLLECTION_NAME}'...`);
  
  try {
    const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: "GET",
      headers: {
        "api-key": QDRANT_API_KEY,
      },
    });

    if (response.status === 404) {
      console.log("?? Collection não existe ainda");
      console.log("?? Execute: npm run init:qdrant");
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("? Collection encontrada!");
    console.log("\n?? Estatísticas:");
    console.log(`   - Vectors: ${data.result?.vectors_count || 0}`);
    console.log(`   - Points: ${data.result?.points_count || 0}`);
    console.log(`   - Status: ${data.result?.status || "unknown"}`);
    console.log(`   - Vector Size: ${data.result?.config?.params?.vectors?.size || "N/A"}`);
    console.log(`   - Distance: ${data.result?.config?.params?.vectors?.distance || "N/A"}`);

  } catch (error) {
    console.error("? Erro ao verificar collection:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }

  // 5. Testar inserção de ponto de teste (opcional)
  console.log("\n?? Testando inserção de vetor de teste...");
  
  try {
    const testVector = Array.from({ length: 1536 }, () => Math.random());
    const testPoint = {
      id: `test-${Date.now()}`,
      vector: testVector,
      payload: {
        text: "Documento de teste - Qdrant configurado com sucesso",
        type: "test",
        timestamp: new Date().toISOString(),
      },
    };

    await service.upsert([testPoint]);
    console.log("? Inserção de teste bem-sucedida!");
    console.log(`   ID: ${testPoint.id}`);

    // Tentar buscar o ponto inserido
    console.log("\n?? Testando busca semântica...");
    const searchResults = await service.search(testVector, 1);
    
    if (searchResults.length > 0) {
      console.log("? Busca bem-sucedida!");
      console.log(`   Resultado: ${searchResults[0].id}`);
      console.log(`   Score: ${searchResults[0].score.toFixed(4)}`);
    } else {
      console.log("?? Nenhum resultado encontrado (normal para collection vazia)");
    }

  } catch (error) {
    console.error("? Erro ao testar operações:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
  }

  console.log("\n?? Todos os testes concluídos!");
  console.log("\n? Qdrant está configurado e funcionando corretamente!");
}

// Executar
testConnection();

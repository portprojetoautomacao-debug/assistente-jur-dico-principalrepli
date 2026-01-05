/**
 * Script de Inicializa��o do Qdrant
 *
 * Cria a collection 'legal_docs' com configura��es otimizadas
 * para armazenamento de documentos jur�dicos
 */

import { config } from "dotenv";

// Carregar vari�veis de ambiente
config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || "legal_docs";

interface QdrantCollectionConfig {
  vectors: {
    size: number;
    distance: "Cosine" | "Euclid" | "Dot";
  };
  optimizers_config?: {
    indexing_threshold: number;
  };
}

async function createCollection() {
  if (!QDRANT_URL || !QDRANT_API_KEY) {
    console.error("? ERRO: Vari�veis QDRANT_URL e QDRANT_API_KEY n�o configuradas no .env");
    process.exit(1);
  }

  console.log("?? Iniciando cria��o da collection Qdrant...");
  console.log(`?? URL: ${QDRANT_URL}`);
  console.log(`?? Collection: ${COLLECTION_NAME}`);

  const collectionConfig: QdrantCollectionConfig = {
    vectors: {
      size: 768, // text-embedding-004 / text-embedding-3-large dims
      distance: "Cosine",
    },
    optimizers_config: {
      indexing_threshold: 20000, // Otimizado para produ��o
    },
  };

  try {
    // 1. Verificar se collection j� existe
    console.log("\n?? Verificando se collection j� existe...");

    const checkResponse = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: "GET",
      headers: {
        "api-key": QDRANT_API_KEY,
      },
    });

    if (checkResponse.ok) {
      console.log("? Collection j� existe!");
      const data = await checkResponse.json();
      console.log("\n?? Status da Collection:");
      console.log(`   - Vectors: ${data.result?.vectors_count || 0}`);
      console.log(`   - Points: ${data.result?.points_count || 0}`);
      console.log(`   - Status: ${data.result?.status || "unknown"}`);
      return;
    }

    // 2. Criar nova collection
    console.log("\n??? Criando nova collection...");

    const createResponse = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "api-key": QDRANT_API_KEY,
      },
      body: JSON.stringify(collectionConfig),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`HTTP ${createResponse.status}: ${errorText}`);
    }

    const result = await createResponse.json();
    console.log("? Collection criada com sucesso!");
    console.log(JSON.stringify(result, null, 2));

    // 3. Verificar cria��o
    console.log("\n?? Verificando cria��o...");

    const verifyResponse = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: "GET",
      headers: {
        "api-key": QDRANT_API_KEY,
      },
    });

    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      console.log("? Collection verificada!");
      console.log("\n?? Configura��o Final:");
      console.log(`   - Vector Size: ${data.result?.config?.params?.vectors?.size || 1536}`);
      console.log(`   - Distance: ${data.result?.config?.params?.vectors?.distance || "Cosine"}`);
      console.log(`   - Status: ${data.result?.status || "green"}`);
    }

    console.log("\n?? Inicializa��o conclu�da com sucesso!");
    console.log("\n?? Pr�ximos passos:");
    console.log("   1. Popule a collection com documentos jur�dicos");
    console.log("   2. Configure o agente de Pesquisa Jurisprudencial");
    console.log("   3. Teste a busca sem�ntica");
  } catch (error) {
    console.error("\n? ERRO ao criar collection:");

    if (error instanceof Error) {
      console.error(`   Mensagem: ${error.message}`);

      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        console.error("\n?? Dica: Verifique se a QDRANT_API_KEY est� correta no .env");
      }

      if (error.message.includes("404")) {
        console.error("\n?? Dica: Verifique se a QDRANT_URL est� correta no .env");
      }

      if (error.message.includes("timeout") || error.message.includes("ECONNREFUSED")) {
        console.error("\n?? Dica: Verifique sua conex�o com a internet e se o cluster est� online");
      }
    }

    process.exit(1);
  }
}

// Executar
createCollection();

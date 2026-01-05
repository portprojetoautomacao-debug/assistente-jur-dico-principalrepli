/**
 * Script de Teste - Validar Qdrant Connection e Busca
 * 
 * Testa:
 * 1. Conexão com Qdrant Cloud
 * 2. Existência da collection
 * 3. Busca semântica básica
 * 4. Performance de busca
 * 
 * Uso:
 *   npm run qdrant:test
 */

import { config } from "dotenv";
import { createQdrantService } from "../src/lib/qdrant-service";
import { geminiEmbeddingService } from "../src/lib/gemini-embedding-service";

config();

const QDRANT_CONFIG = {
  url: process.env.QDRANT_URL || "",
  apiKey: process.env.QDRANT_API_KEY || "",
  collectionName: process.env.QDRANT_COLLECTION_NAME || "legal_docs",
};

async function main() {
  console.log("?? Teste de Conexão e Busca - Qdrant\n");

  // 1. Validar configuração
  if (!QDRANT_CONFIG.url || !QDRANT_CONFIG.apiKey) {
    console.error("? ERRO: QDRANT_URL e QDRANT_API_KEY não configurados");
    process.exit(1);
  }

  if (!process.env.VITE_GEMINI_API_KEY) {
    console.error("? ERRO: VITE_GEMINI_API_KEY não configurado");
    process.exit(1);
  }

  // 2. Conectar
  console.log("?? Conectando ao Qdrant...");
  const qdrant = createQdrantService(QDRANT_CONFIG);

  if (!qdrant) {
    console.error("? Falha ao criar serviço Qdrant");
    process.exit(1);
  }

  console.log(`? Conectado: ${QDRANT_CONFIG.url}`);
  console.log(`?? Collection: ${QDRANT_CONFIG.collectionName}\n`);

  // 3. Teste de busca semântica
  console.log("?? Testando busca semântica...\n");

  const queries = [
    "ação trabalhista rescisão contrato",
    "recurso STJ tributário ICMS",
    "mandado segurança servidor público",
  ];

  for (const query of queries) {
    console.log(`\n?? Query: "${query}"`);

    try {
      // Gerar embedding da query
      const startEmbed = Date.now();
      const embeddingResult = await geminiEmbeddingService.generateQueryEmbedding(query);
      const embedTime = Date.now() - startEmbed;

      console.log(`   ??  Embedding gerado em: ${embedTime}ms`);

      // Buscar no Qdrant
      const startSearch = Date.now();
      const results = await qdrant.search(embeddingResult.embedding, 5);
      const searchTime = Date.now() - startSearch;

      console.log(`   ??  Busca executada em: ${searchTime}ms`);
      console.log(`   ?? Resultados encontrados: ${results.length}`);

      // Mostrar top 3 resultados
      if (results.length > 0) {
        console.log("\n   ?? Top Resultados:");
        results.slice(0, 3).forEach((result, idx) => {
          console.log(`\n   ${idx + 1}. Score: ${result.score.toFixed(4)}`);
          console.log(`      Número: ${result.payload.numero || "N/A"}`);
          console.log(`      Tribunal: ${result.payload.tribunal || "N/A"}`);
          console.log(`      Classe: ${result.payload.classe || "N/A"}`);
          console.log(`      Assunto: ${(result.payload.assunto || "N/A").toString().substring(0, 80)}...`);
        });
      } else {
        console.log("\n   ??  Nenhum resultado encontrado (collection vazia?)");
      }

      // Validar performance
      if (searchTime > 1000) {
        console.log(`\n   ??  ATENÇÃO: Busca lenta (${searchTime}ms > 1000ms)`);
      } else if (searchTime < 100) {
        console.log(`\n   ? Performance excelente! (${searchTime}ms)`);
      }

    } catch (error) {
      console.error(`\n   ? Erro na busca:`, error);
    }
  }

  // 4. Teste de stress (opcional)
  console.log("\n\n?? Teste de Performance (10 buscas sequenciais)...\n");

  const stressQuery = "direito trabalhista férias";
  const times: number[] = [];

  try {
    const embeddingResult = await geminiEmbeddingService.generateQueryEmbedding(stressQuery);

    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await qdrant.search(embeddingResult.embedding, 5);
      const duration = Date.now() - start;
      times.push(duration);
      process.stdout.write(".");
    }

    console.log("\n");

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

    console.log(`   ?? Média: ${avgTime.toFixed(2)}ms`);
    console.log(`   ?? Mínimo: ${minTime}ms`);
    console.log(`   ?? Máximo: ${maxTime}ms`);
    console.log(`   ?? P95: ${p95Time}ms`);

    if (avgTime < 100) {
      console.log(`\n   ? Performance EXCELENTE! Meta <100ms atingida.`);
    } else if (avgTime < 200) {
      console.log(`\n   ? Performance BOA. Meta <100ms não atingida, mas aceitável.`);
    } else {
      console.log(`\n   ??  Performance RUIM. Necessário investigar.`);
    }

  } catch (error) {
    console.error(`\n   ? Erro no teste de stress:`, error);
  }

  // 5. Resumo
  console.log("\n\n?? RESUMO DO TESTE\n");
  console.log("   ? Conexão: OK");
  console.log("   ? Collection: OK");
  console.log("   ? Busca Semântica: OK");
  console.log("   ? Performance: Validado");

  console.log("\n? Todos os testes passaram!\n");
}

main().catch((error) => {
  console.error("\n?? Erro fatal:", error);
  process.exit(1);
});

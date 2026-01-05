/**
 * Script Automatizado - Popular Qdrant com Dados do DataJud
 * 
 * Este script:
 * 1. Conecta na API DataJud do CNJ
 * 2. Busca processos/precedentes jurídicos
 * 3. Gera embeddings com Gemini
 * 4. Envia para Qdrant Cloud
 * 5. Valida embeddings e qualidade dos dados
 * 
 * Uso:
 *   npm run qdrant:populate-datajud
 * 
 * Opções:
 *   --dry-run: Simula população sem inserir no Qdrant
 *   --validate: Valida embeddings antes de inserir
 *   --max-docs=N: Limita a N documentos (padrão: ilimitado)
 */

import { config } from "dotenv";
import { createQdrantService } from "../src/lib/qdrant-service";
import { dataJudService } from "../src/lib/datajud-service";
import { geminiEmbeddingService } from "../src/lib/gemini-embedding-service";

config();

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const QDRANT_CONFIG = {
  url: process.env.QDRANT_URL || "",
  apiKey: process.env.QDRANT_API_KEY || "",
  collectionName: process.env.QDRANT_COLLECTION_NAME || "legal_docs",
};

const TRIBUNAIS_PRIORITARIOS = ["TST", "TRT3", "TJMG", "TRF1", "TRF6", "STJ", "STF"];

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const shouldValidate = args.includes("--validate");
const maxDocsArg = args.find((arg) => arg.startsWith("--max-docs="));
const maxDocs = maxDocsArg ? parseInt(maxDocsArg.split("=")[1]) : Infinity;

// ============================================================================
// VALIDAÇÃO DE EMBEDDINGS
// ============================================================================

function validateEmbedding(
  embedding: number[],
  expectedDims: number
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // 1. Validar dimensões
  if (embedding.length !== expectedDims) {
    issues.push(`Dimensões incorretas: ${embedding.length} != ${expectedDims}`);
  }

  // 2. Validar valores NaN/Infinity
  const hasInvalidValues = embedding.some((v) => !isFinite(v));
  if (hasInvalidValues) {
    issues.push("Contém valores NaN ou Infinity");
  }

  // 3. Validar magnitude (embeddings devem estar normalizados)
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (Math.abs(magnitude - 1.0) > 0.01) {
    issues.push(`Magnitude anormal: ${magnitude.toFixed(4)} (esperado ~1.0)`);
  }

  // 4. Validar que não é zero vector
  const isZeroVector = embedding.every((v) => v === 0);
  if (isZeroVector) {
    issues.push("Zero vector detectado");
  }

  return { valid: issues.length === 0, issues };
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

interface PopulationStats {
  totalProcessed: number;
  totalInserted: number;
  totalErrors: number;
  totalSkipped: number;
  totalValidationFailures: number;
  startTime: number;
  errorsByType: Map<string, number>;
}

function createStats(): PopulationStats {
  return {
    totalProcessed: 0,
    totalInserted: 0,
    totalErrors: 0,
    totalSkipped: 0,
    totalValidationFailures: 0,
    startTime: Date.now(),
    errorsByType: new Map(),
  };
}

function recordError(stats: PopulationStats, errorType: string): void {
  stats.totalErrors++;
  stats.errorsByType.set(errorType, (stats.errorsByType.get(errorType) || 0) + 1);
}

function printStats(stats: PopulationStats): void {
  const durationMs = Date.now() - stats.startTime;
  const durationSec = (durationMs / 1000).toFixed(1);

  console.log("\n\n?? RESUMO DA POPULAÇÃO\n");
  console.log(`   Total Processado:      ${stats.totalProcessed}`);
  console.log(`   Total Inserido:        ${stats.totalInserted} ?`);
  console.log(`   Total Pulado:          ${stats.totalSkipped}`);
  console.log(`   Total Erros:           ${stats.totalErrors} ${stats.totalErrors > 0 ? "??" : ""}`);
  console.log(`   Falhas de Validação:   ${stats.totalValidationFailures}`);
  console.log(`   Duração:               ${durationSec}s`);
  console.log(
    `   Taxa de Sucesso:       ${
      stats.totalProcessed > 0
        ? ((stats.totalInserted / stats.totalProcessed) * 100).toFixed(1)
        : 0
    }%`
  );

  if (stats.errorsByType.size > 0) {
    console.log("\n   ?? Erros por Tipo:");
    for (const [type, count] of stats.errorsByType.entries()) {
      console.log(`      - ${type}: ${count}`);
    }
  }

  if (isDryRun) {
    console.log("\n   ?? MODO DRY-RUN: Nenhum dado foi inserido no Qdrant");
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  console.log("?? Iniciando população automatizada do Qdrant com DataJud\n");

  if (isDryRun) {
    console.log("?? MODO DRY-RUN ATIVADO (sem inserções reais)\n");
  }

  if (shouldValidate) {
    console.log("? VALIDAÇÃO DE EMBEDDINGS ATIVADA\n");
  }

  if (maxDocs < Infinity) {
    console.log(`?? LIMITE: ${maxDocs} documentos\n`);
  }

  // 1. Validar configuração
  if (!QDRANT_CONFIG.url || !QDRANT_CONFIG.apiKey) {
    console.error("? ERRO: QDRANT_URL e QDRANT_API_KEY não configurados no .env");
    process.exit(1);
  }

  if (!process.env.VITE_GEMINI_API_KEY) {
    console.error("? ERRO: VITE_GEMINI_API_KEY não configurado no .env");
    process.exit(1);
  }

  // 2. Conectar ao Qdrant
  console.log("?? Conectando ao Qdrant Cloud...");
  const qdrant = createQdrantService(QDRANT_CONFIG);

  if (!qdrant) {
    console.error("? Falha ao criar serviço Qdrant");
    process.exit(1);
  }

  console.log(`? Conectado: ${QDRANT_CONFIG.url}`);
  console.log(`?? Collection: ${QDRANT_CONFIG.collectionName}\n`);

  // 3. Verificar/Criar collection com dimensões corretas
  const embeddingDimensions = geminiEmbeddingService.getDimensions();
  console.log(`?? Modelo Gemini: text-embedding-004 (${embeddingDimensions} dimensões)`);

  if (!isDryRun) {
    try {
      await qdrant.createCollection(embeddingDimensions, "Cosine");
      console.log("? Collection verificada/criada\n");
    } catch (error) {
      console.error("? Erro ao criar collection:", error);
      process.exit(1);
    }
  }

  // 4. Buscar dados do DataJud
  console.log("?? Buscando dados do DataJud (CNJ)...\n");

  const stats = createStats();

  try {
    // Estratégia 1: Buscar temas curados (mais relevantes)
    console.log("?? Estratégia: Temas Jurídicos Curados\n");
    const temasCurados = await dataJudService.searchTemasCurados();

    for (const { tema, tribunal, processos } of temasCurados) {
      if (stats.totalInserted >= maxDocs) break;

      console.log(`\n??  Processando: ${tema} (${tribunal})`);
      console.log(`   ${processos.length} processos encontrados`);

      if (processos.length === 0) {
        console.log("   ??  Pulando (sem dados)");
        continue;
      }

      // Processar em lotes de 5 para não sobrecarregar
      const batchSize = 5;
      for (let i = 0; i < processos.length; i += batchSize) {
        if (stats.totalInserted >= maxDocs) break;

        const batch = processos.slice(i, i + batchSize);

        console.log(
          `   ?? Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            processos.length / batchSize
          )} (${batch.length} itens)`
        );

        for (const processo of batch) {
          if (stats.totalInserted >= maxDocs) break;

          stats.totalProcessed++;

          try {
            // Gerar embedding
            const embeddingResult = await geminiEmbeddingService.generateDocumentEmbedding({
              numero: processo.numero,
              tribunal: processo.tribunal,
              classe: processo.classe,
              assunto: processo.assunto,
              movimentacoes: processo.movimentacoes?.map((m) => m.descricao).join("; "),
            });

            // Validar embedding se solicitado
            if (shouldValidate) {
              const validation = validateEmbedding(
                embeddingResult.embedding,
                embeddingDimensions
              );

              if (!validation.valid) {
                stats.totalValidationFailures++;
                console.error(
                  `\n   ??  Validação falhou para ${processo.numero}:`,
                  validation.issues
                );
                recordError(stats, "validation_failure");
                continue;
              }
            }

            // Inserir no Qdrant (ou simular em dry-run)
            if (!isDryRun) {
              await qdrant.upsert([
                {
                  id: processo.id,
                  vector: embeddingResult.embedding,
                  payload: {
                    numero: processo.numero,
                    tribunal: processo.tribunal,
                    classe: processo.classe,
                    assunto: processo.assunto,
                    tema,
                    dataAjuizamento: processo.dataAjuizamento,
                    orgaoJulgador: processo.orgaoJulgador,
                    totalMovimentacoes: processo.movimentacoes?.length || 0,
                    partes: processo.partes?.map((p) => p.nome).join("; ") || "",
                    embedModel: embeddingResult.model,
                    createdAt: new Date().toISOString(),
                  },
                },
              ]);
            }

            stats.totalInserted++;
            process.stdout.write(".");
          } catch (error) {
            recordError(stats, error instanceof Error ? error.message : "unknown_error");
            console.error(`\n   ? Erro ao processar ${processo.numero}:`, error);
          }
        }

        // Delay entre lotes
        await delay(2000);
      }

      console.log(`\n   ? ${tema} concluído`);
    }

    // Estratégia 2: Buscar por tribunais prioritários (complementar)
    if (stats.totalInserted < maxDocs) {
      console.log("\n\n??  Estratégia: Tribunais Prioritários\n");

      for (const tribunal of TRIBUNAIS_PRIORITARIOS) {
        if (stats.totalInserted >= maxDocs) break;

        console.log(`\n?? Tribunal: ${tribunal}`);

        try {
          const processos = await dataJudService.searchProcessos({
            tribunal,
            limit: Math.min(20, maxDocs - stats.totalInserted),
            dataInicio: "2023-01-01",
          });

          console.log(`   ${processos.length} processos encontrados`);

          for (const processo of processos) {
            if (stats.totalInserted >= maxDocs) break;

            stats.totalProcessed++;

            try {
              const embeddingResult = await geminiEmbeddingService.generateDocumentEmbedding({
                numero: processo.numero,
                tribunal: processo.tribunal,
                classe: processo.classe,
                assunto: processo.assunto,
              });

              // Validar embedding
              if (shouldValidate) {
                const validation = validateEmbedding(
                  embeddingResult.embedding,
                  embeddingDimensions
                );

                if (!validation.valid) {
                  stats.totalValidationFailures++;
                  recordError(stats, "validation_failure");
                  continue;
                }
              }

              // Inserir no Qdrant
              if (!isDryRun) {
                await qdrant.upsert([
                  {
                    id: `${tribunal}-${processo.id}`,
                    vector: embeddingResult.embedding,
                    payload: {
                      numero: processo.numero,
                      tribunal: processo.tribunal,
                      classe: processo.classe,
                      assunto: processo.assunto,
                      dataAjuizamento: processo.dataAjuizamento,
                      embedModel: embeddingResult.model,
                      createdAt: new Date().toISOString(),
                    },
                  },
                ]);
              }

              stats.totalInserted++;
              process.stdout.write(".");
            } catch (error) {
              recordError(stats, error instanceof Error ? error.message : "unknown_error");
              console.error(`\n   ? Erro ao processar ${processo.numero}:`, error);
            }
          }

          console.log(`\n   ? ${tribunal} concluído`);

          // Delay entre tribunais
          await delay(3000);
        } catch (error) {
          console.error(`   ? Erro ao buscar ${tribunal}:`, error);
          recordError(stats, `tribunal_fetch_${tribunal}`);
        }
      }
    }
  } catch (error) {
    console.error("\n?? Erro fatal durante processamento:", error);
    recordError(stats, "fatal_error");
  }

  // 5. Resumo final
  printStats(stats);

  console.log("\n? População concluída!");

  if (!isDryRun) {
    console.log(`\n?? Acesse o dashboard: https://cloud.qdrant.io/clusters`);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// EXECUTE
// ============================================================================

main().catch((error) => {
  console.error("\n?? Erro fatal:", error);
  process.exit(1);
});

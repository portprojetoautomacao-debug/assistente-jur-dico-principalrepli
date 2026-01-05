/**
 * Exemplo de Tracing Customizado para Agentes
 *
 * Este arquivo demonstra como adicionar spans customizados aos agentes
 * para visualização detalhada no AI Toolkit Trace Viewer.
 *
 * Endpoint OTLP: http://localhost:4319/v1/traces
 */

import { createAgentSpan } from "@/lib/agent-tracing";
import { tracingService } from "@/lib/tracing";
import type { Expediente, TarefaSistema } from "@/types";

/**
 * Exemplo 1: Agente Mrs. Justin-e com Tracing Completo
 */
export async function analyzeIntimationWithTracing(expediente: Expediente) {
  // Criar span principal do agente
  const agentSpan = createAgentSpan("justine", expediente.id, "analyze-intimation");

  try {
    // Adicionar atributos do expediente
    agentSpan.setAttribute("expediente.processoCNJ", expediente.processoCNJ);
    agentSpan.setAttribute("expediente.tipo", expediente.tipo);
    agentSpan.setAttribute("expediente.status", expediente.status);

    // Event: Início da análise
    agentSpan.addEvent("analysis-started", {
      timestamp: new Date().toISOString(),
    });

    // Span filho: Extração de texto
    const extractSpan = tracingService.startSpan("document.extract-text", {
      parent: agentSpan,
      "document.type": "intimacao",
      "document.size": expediente.conteudoHTML?.length || 0,
    });

    const extractedText = await extractTextFromExpediente(expediente);
    extractSpan.addEvent("text-extracted", {
      "text.length": extractedText.length,
      "text.language": "pt-BR",
    });
    extractSpan.end();

    // Span filho: Chamada Gemini
    const geminiSpan = tracingService.startSpan("gemini.chat.completion", {
      parent: agentSpan,
      "llm.model": "gemini-2.5-pro",
      "llm.provider": "google",
      "llm.request.temperature": 0.3,
    });

    const analysisResult = await callGeminiForAnalysis(extractedText);

    geminiSpan.setAttribute("llm.response.tokens", analysisResult.usage?.totalTokens || 0);
    geminiSpan.setAttribute("llm.response.confidence", analysisResult.confidence);
    geminiSpan.end();

    // Span filho: Cálculo de prazo
    const deadlineSpan = tracingService.startSpan("deadline.calculate", {
      parent: agentSpan,
      "deadline.type": analysisResult.prazoTipo,
      "deadline.days": analysisResult.prazoDias,
    });

    const calculatedDeadline = await calculateDeadline(
      analysisResult.prazoDias,
      analysisResult.prazoTipo
    );

    deadlineSpan.setAttribute("deadline.result", calculatedDeadline.toISOString());
    deadlineSpan.setAttribute("deadline.businessDays", analysisResult.prazoDias);
    deadlineSpan.end();

    // Span filho: Criação de tarefa
    const taskSpan = tracingService.startSpan("task.create", {
      parent: agentSpan,
      "task.type": "ANALYZE_INTIMATION",
      "task.priority": analysisResult.urgente ? "high" : "normal",
    });

    const task = await createTaskFromAnalysis(analysisResult, calculatedDeadline);

    taskSpan.setAttribute("task.id", task.id);
    taskSpan.setAttribute("task.agentId", "justine");
    taskSpan.end();

    // Event: Análise concluída
    agentSpan.addEvent("analysis-completed", {
      "result.confidence": analysisResult.confidence,
      "result.deadline": calculatedDeadline.toISOString(),
      "result.taskId": task.id,
    });

    // Marcar span como sucesso
    agentSpan.setStatus({ code: 1 }); // OK

    return {
      success: true,
      analysis: analysisResult,
      deadline: calculatedDeadline,
      task,
    };
  } catch (error) {
    // Registrar erro no span
    agentSpan.recordException(error as Error);
    agentSpan.setStatus({
      code: 2, // ERROR
      message: (error as Error).message,
    });

    throw error;
  } finally {
    // SEMPRE finalizar o span
    agentSpan.end();
  }
}

/**
 * Exemplo 2: Agente Redação de Petições com Streaming
 */
export async function draftPetitionWithTracing(
  processoCNJ: string,
  templateId: string,
  context: Record<string, unknown>
) {
  const agentSpan = createAgentSpan("redacao-peticoes", processoCNJ, "draft-document");

  try {
    agentSpan.setAttribute("template.id", templateId);
    agentSpan.setAttribute("template.type", "peticao");

    // Span: Carregar template
    const templateSpan = tracingService.startSpan("template.load", {
      parent: agentSpan,
      "template.id": templateId,
    });

    const template = await loadTemplate(templateId);
    templateSpan.setAttribute("template.size", template.content.length);
    templateSpan.end();

    // Span: Gerar conteúdo com Gemini (streaming)
    const geminiSpan = tracingService.startSpan("gemini.generateContent", {
      parent: agentSpan,
      "llm.model": "gemini-2.5-pro",
      "llm.streaming": true,
    });

    let totalTokens = 0;
    const generatedContent: string[] = [];

    // Simular streaming
    const stream = await generateContentStream(template, context);

    for await (const chunk of stream) {
      generatedContent.push(chunk.text);
      totalTokens += chunk.usage?.tokens || 0;

      // Event a cada chunk (útil para debugging)
      geminiSpan.addEvent("chunk-received", {
        "chunk.index": generatedContent.length,
        "chunk.size": chunk.text.length,
      });
    }

    geminiSpan.setAttribute("llm.response.tokens", totalTokens);
    geminiSpan.setAttribute("llm.response.chunks", generatedContent.length);
    geminiSpan.end();

    const fullContent = generatedContent.join("");

    // Span: Substituir variáveis
    const replaceSpan = tracingService.startSpan("template.replace-variables", {
      parent: agentSpan,
      "template.variables": Object.keys(context).length,
    });

    const finalContent = await replaceTemplateVariables(fullContent, context);
    replaceSpan.setAttribute("content.size", finalContent.length);
    replaceSpan.end();

    // Span: Salvar documento
    const saveSpan = tracingService.startSpan("document.save", {
      parent: agentSpan,
      "document.type": "minuta",
      "document.format": "html",
    });

    const minutaId = await saveMinuta({
      titulo: `Petição - ${processoCNJ}`,
      conteudo: finalContent,
      processoCNJ,
      templateId,
      criadoPorAgente: true,
      agenteId: "redacao-peticoes",
    });

    saveSpan.setAttribute("minuta.id", minutaId);
    saveSpan.end();

    agentSpan.addEvent("draft-completed", {
      "minuta.id": minutaId,
      "content.tokens": totalTokens,
      "content.size": finalContent.length,
    });

    agentSpan.setStatus({ code: 1 });

    return { minutaId, content: finalContent };
  } catch (error) {
    agentSpan.recordException(error as Error);
    agentSpan.setStatus({ code: 2, message: (error as Error).message });
    throw error;
  } finally {
    agentSpan.end();
  }
}

/**
 * Exemplo 3: Pesquisa Jurisprudencial com Qdrant
 */
export async function searchJurisprudenceWithTracing(query: string) {
  const agentSpan = createAgentSpan("pesquisa-juris", query, "vector-search");

  try {
    agentSpan.setAttribute("query.text", query);
    agentSpan.setAttribute("query.language", "pt-BR");

    // Span: Gerar embedding
    const embeddingSpan = tracingService.startSpan("gemini.embedding.generate", {
      parent: agentSpan,
      "llm.model": "text-embedding-004",
      "embedding.dimensions": 768,
    });

    const embedding = await generateEmbedding(query);
    embeddingSpan.setAttribute("embedding.vector.size", embedding.length);
    embeddingSpan.end();

    // Span: Busca no Qdrant
    const qdrantSpan = tracingService.startSpan("qdrant.vector-search", {
      parent: agentSpan,
      "qdrant.collection": "legal_docs",
      "qdrant.limit": 10,
    });

    const searchResults = await searchQdrant({
      collection: "legal_docs",
      vector: embedding,
      limit: 10,
    });

    qdrantSpan.setAttribute("search.results.count", searchResults.length);
    qdrantSpan.setAttribute("search.results.topScore", searchResults[0]?.score || 0);
    qdrantSpan.end();

    // Span: Ranking de precedentes
    const rankSpan = tracingService.startSpan("precedent.rank", {
      parent: agentSpan,
      "ranking.algorithm": "score-weighted",
    });

    const rankedResults = await rankPrecedents(searchResults, query);
    rankSpan.setAttribute("ranking.output.count", rankedResults.length);
    rankSpan.end();

    agentSpan.addEvent("search-completed", {
      "results.count": rankedResults.length,
      "results.avgScore": rankedResults.reduce((sum, r) => sum + r.score, 0) / rankedResults.length,
    });

    agentSpan.setStatus({ code: 1 });

    return rankedResults;
  } catch (error) {
    agentSpan.recordException(error as Error);
    agentSpan.setStatus({ code: 2, message: (error as Error).message });
    throw error;
  } finally {
    agentSpan.end();
  }
}

/**
 * Exemplo 4: Workflow Complexo - Monitor DJEN
 */
export async function monitorDJENWithTracing(date: string) {
  const agentSpan = createAgentSpan("monitor-djen", date, "daily-monitoring");

  try {
    agentSpan.setAttribute("monitoring.date", date);

    // Span: Buscar publicações
    const fetchSpan = tracingService.startSpan("djen.fetch-publications", {
      parent: agentSpan,
      "djen.date": date,
    });

    const publications = await fetchDJENPublications(date);
    fetchSpan.setAttribute("publications.count", publications.length);
    fetchSpan.end();

    // Processar cada publicação (child spans)
    const processedCount = 0;
    const intimationsDetected = 0;

    for (const pub of publications) {
      const pubSpan = tracingService.startSpan("djen.process-publication", {
        parent: agentSpan,
        "publication.id": pub.id,
        "publication.type": pub.type,
      });

      try {
        const isIntimation = await detectIntimation(pub);

        if (isIntimation) {
          intimationsDetected++;

          // Criar expediente (child span)
          const expSpan = tracingService.startSpan("expediente.create", {
            parent: pubSpan,
          });

          await createExpedienteFromPublication(pub);
          expSpan.end();

          // Notificar (child span)
          const notifySpan = tracingService.startSpan("notification.send", {
            parent: pubSpan,
            "notification.type": "intimation",
          });

          await sendIntimationNotification(pub);
          notifySpan.end();
        }

        processedCount++;
        pubSpan.setStatus({ code: 1 });
      } catch (error) {
        pubSpan.recordException(error as Error);
        pubSpan.setStatus({ code: 2 });
      } finally {
        pubSpan.end();
      }
    }

    agentSpan.addEvent("monitoring-completed", {
      "publications.total": publications.length,
      "publications.processed": processedCount,
      "intimations.detected": intimationsDetected,
    });

    agentSpan.setStatus({ code: 1 });

    return {
      total: publications.length,
      processed: processedCount,
      intimations: intimationsDetected,
    };
  } catch (error) {
    agentSpan.recordException(error as Error);
    agentSpan.setStatus({ code: 2, message: (error as Error).message });
    throw error;
  } finally {
    agentSpan.end();
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES (Stub - implemente conforme necessário)
// ============================================================================

async function extractTextFromExpediente(exp: Expediente): Promise<string> {
  return exp.conteudoHTML || "";
}

async function callGeminiForAnalysis(text: string): Promise<any> {
  // Implementar chamada Gemini
  return {
    confidence: 0.95,
    prazoDias: 15,
    prazoTipo: "contestacao",
    urgente: false,
    usage: { totalTokens: 1500 },
  };
}

async function calculateDeadline(days: number, type: string): Promise<Date> {
  // Implementar cálculo de prazo
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function createTaskFromAnalysis(analysis: any, deadline: Date): Promise<TarefaSistema> {
  // Implementar criação de tarefa
  return {
    id: "task_" + Date.now(),
    agentId: "justine",
    type: "ANALYZE_INTIMATION",
    priority: "high",
    status: "queued",
    createdBy: "sistema",
    createdAt: new Date().toISOString(),
    data: { analysis, deadline },
  };
}

async function loadTemplate(id: string): Promise<any> {
  return { id, content: "Template content..." };
}

async function generateContentStream(template: any, context: any): Promise<AsyncIterable<any>> {
  // Implementar streaming
  return (async function* () {
    yield { text: "Chunk 1...", usage: { tokens: 100 } };
    yield { text: "Chunk 2...", usage: { tokens: 150 } };
  })();
}

async function replaceTemplateVariables(content: string, context: any): Promise<string> {
  return content;
}

async function saveMinuta(data: any): Promise<string> {
  return "min_" + Date.now();
}

async function generateEmbedding(text: string): Promise<number[]> {
  return Array(768).fill(0);
}

async function searchQdrant(params: any): Promise<any[]> {
  return [];
}

async function rankPrecedents(results: any[], query: string): Promise<any[]> {
  return results;
}

async function fetchDJENPublications(date: string): Promise<any[]> {
  return [];
}

async function detectIntimation(pub: any): Promise<boolean> {
  return Math.random() > 0.5;
}

async function createExpedienteFromPublication(pub: any): Promise<void> {}
async function sendIntimationNotification(pub: any): Promise<void> {}

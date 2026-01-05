/**
 * Hook de População Automática do Qdrant
 * Integração com QdrantAutoPopulator para popular automaticamente
 * o banco vetorial quando novas intimações são recebidas
 */

import { DataJudService } from "@/lib/datajud-service";
import { GeminiEmbeddingService } from "@/lib/gemini-embedding-service";
import { QdrantAutoPopulator } from "@/lib/qdrant-auto-populator";
import { QdrantService } from "@/lib/qdrant-service";
import { TemaExtractorService } from "@/lib/tema-extractor";
import type { Expediente } from "@/types";
import { useState } from "react";

export type PopulationStatus = "idle" | "processing" | "success" | "error";

export interface UseQdrantAutoPopulateState {
  status: PopulationStatus;
  result: any | null;
  error: string | null;
  isProcessing: boolean;
}

export interface UseQdrantAutoPopulateOptions {
  autoPopulate?: boolean;
  enablePrecedents?: boolean;
  minConfidence?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export function useQdrantAutoPopulate(options: UseQdrantAutoPopulateOptions = {}) {
  const [state, setState] = useState<UseQdrantAutoPopulateState>({
    status: "idle",
    result: null,
    error: null,
    isProcessing: false,
  });

  const populate = async (expediente: Expediente) => {
    try {
      setState((prev) => ({ ...prev, status: "processing", isProcessing: true, error: null }));

      // Inicializa serviços
      const qdrantUrl = import.meta.env.VITE_QDRANT_URL;
      const qdrantApiKey = import.meta.env.VITE_QDRANT_API_KEY;
      const qdrant = new QdrantService({
        url: typeof qdrantUrl === "string" ? qdrantUrl : "",
        apiKey: typeof qdrantApiKey === "string" ? qdrantApiKey : "",
        collectionName: "legal_docs",
      });
      const dataJud = new DataJudService();
      const temaExtractor = new TemaExtractorService();
      const embeddings = new GeminiEmbeddingService();

      // Cria populator
      const populator = new QdrantAutoPopulator(qdrant, dataJud, temaExtractor, embeddings, {
        enablePrecedentSearch: options.enablePrecedents ?? true,
        minConfidence: options.minConfidence ?? 0.7,
      });

      // Popula
      const result = await populator.populateFromIntimacao(expediente);

      if (result.success) {
        setState({
          status: "success",
          result,
          error: null,
          isProcessing: false,
        });
      } else {
        setState({
          status: "error",
          result: null,
          error: result.error || "Erro desconhecido",
          isProcessing: false,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setState({
        status: "error",
        result: null,
        error: errorMessage,
        isProcessing: false,
      });
      return null;
    }
  };

  const reset = () => {
    setState({
      status: "idle",
      result: null,
      error: null,
      isProcessing: false,
    });
  };

  return {
    state,
    populate,
    reset,
  };
}

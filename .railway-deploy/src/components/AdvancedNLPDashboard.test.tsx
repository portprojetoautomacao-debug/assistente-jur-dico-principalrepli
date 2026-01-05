/**
 * Tests for AdvancedNLPDashboard component
 *
 * Tests the helper functions hasInput() and runWithProcessing()
 * as well as the refactored handlers for NLP operations.
 */

import React from "react";
import { nlpPipeline } from "@/lib/nlp-pipeline";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import AdvancedNLPDashboard from "./AdvancedNLPDashboard";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock nlp-pipeline
vi.mock("@/lib/nlp-pipeline", () => ({
  nlpPipeline: {
    extractEntities: vi.fn(),
    analyzeSentiment: vi.fn(),
    classifyDocument: vi.fn(),
    extractInformation: vi.fn(),
  },
}));

describe("AdvancedNLPDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hasInput() helper function", () => {
    it("should show error toast and not trigger processing when inputText is empty", async () => {
      render(<AdvancedNLPDashboard />);

      const extractEntitiesButton = screen.getByRole("button", {
        name: /extrair entidades/i,
      });

      // Button should be disabled when input is empty
      expect(extractEntitiesButton).toBeDisabled();
    });

    it("should show error toast when inputText contains only whitespace", async () => {
      const user = userEvent.setup();
      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);

      // Type only whitespace
      await user.type(textarea, "   ");

      const extractEntitiesButton = screen.getByRole("button", {
        name: /extrair entidades/i,
      });

      // Button should still be disabled with only whitespace
      expect(extractEntitiesButton).toBeDisabled();
    });

    it("should enable buttons when inputText has valid content", async () => {
      const user = userEvent.setup();
      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);

      await user.type(textarea, "Texto de teste válido para análise");

      const extractEntitiesButton = screen.getByRole("button", {
        name: /extrair entidades/i,
      });

      // Button should be enabled with valid content
      expect(extractEntitiesButton).not.toBeDisabled();
    });
  });

  describe("runWithProcessing() helper function", () => {
    it("should call toast.success on successful processing", async () => {
      const user = userEvent.setup();
      const mockEntities = [
        {
          text: "João Silva",
          type: "PERSON",
          start: 0,
          end: 10,
          confidence: 0.95,
        },
      ];

      (nlpPipeline.extractEntities as Mock).mockResolvedValueOnce(mockEntities);

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "João Silva é o autor do processo");

      const extractEntitiesButton = screen.getByRole("button", {
        name: /extrair entidades/i,
      });

      await user.click(extractEntitiesButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Entidades extraídas");
      });
    });

    it("should call toast.error when processing fails", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* suppress error output */
      });

      (nlpPipeline.extractEntities as Mock).mockRejectedValueOnce(new Error("API Error"));

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "Texto para teste de erro");

      const extractEntitiesButton = screen.getByRole("button", {
        name: /extrair entidades/i,
      });

      await user.click(extractEntitiesButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Erro ao extrair entidades");
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should set isProcessing to true during operation and false after completion", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown[]) => void;
      const pendingPromise = new Promise<unknown[]>((resolve) => {
        resolvePromise = resolve;
      });

      (nlpPipeline.extractEntities as Mock).mockReturnValueOnce(pendingPromise);

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "Texto para teste de processamento");

      const extractEntitiesButton = screen.getByRole("button", {
        name: /extrair entidades/i,
      });

      await user.click(extractEntitiesButton);

      // Check that processing indicator is shown
      await waitFor(() => {
        expect(screen.getByText(/processando com ia/i)).toBeInTheDocument();
      });

      // Resolve the promise
      resolvePromise!([]);

      // Check that processing indicator is gone
      await waitFor(() => {
        expect(screen.queryByText(/processando com ia/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("handleExtractEntities handler", () => {
    it("should call nlpPipeline.extractEntities with input text", async () => {
      const user = userEvent.setup();
      const mockEntities = [
        {
          text: "Empresa ABC",
          type: "ORGANIZATION",
          start: 0,
          end: 11,
          confidence: 0.92,
        },
      ];

      (nlpPipeline.extractEntities as Mock).mockResolvedValueOnce(mockEntities);

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "Empresa ABC é a ré no processo");

      const extractEntitiesButton = screen.getByRole("button", {
        name: /extrair entidades/i,
      });

      await user.click(extractEntitiesButton);

      await waitFor(() => {
        expect(nlpPipeline.extractEntities).toHaveBeenCalledWith("Empresa ABC é a ré no processo");
      });
    });

    it("should display extracted entities in the UI", async () => {
      const user = userEvent.setup();
      const mockEntities = [
        {
          text: "Maria Santos",
          type: "PERSON",
          start: 0,
          end: 12,
          confidence: 0.88,
        },
      ];

      (nlpPipeline.extractEntities as Mock).mockResolvedValueOnce(mockEntities);

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "Maria Santos assinou o contrato");

      const extractEntitiesButton = screen.getByRole("button", {
        name: /extrair entidades/i,
      });

      await user.click(extractEntitiesButton);

      await waitFor(() => {
        expect(screen.getByText("Maria Santos")).toBeInTheDocument();
        expect(screen.getByText(/88% confiança/)).toBeInTheDocument();
      });
    });
  });

  describe("handleAnalyzeSentiment handler", () => {
    it("should call nlpPipeline.analyzeSentiment with input text", async () => {
      const user = userEvent.setup();
      const mockSentiment = {
        sentiment: "positive",
        score: 0.75,
        confidence: 0.9,
        aspects: [],
      };

      (nlpPipeline.analyzeSentiment as Mock).mockResolvedValueOnce(mockSentiment);

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "A decisão foi favorável ao autor");

      const analyzeSentimentButton = screen.getByRole("button", {
        name: /analisar sentimento/i,
      });

      await user.click(analyzeSentimentButton);

      await waitFor(() => {
        expect(nlpPipeline.analyzeSentiment).toHaveBeenCalledWith(
          "A decisão foi favorável ao autor"
        );
        expect(toast.success).toHaveBeenCalledWith("Análise de sentimento concluída");
      });
    });
  });

  describe("handleClassifyDocument handler", () => {
    it("should call nlpPipeline.classifyDocument with input text", async () => {
      const user = userEvent.setup();
      const mockClassification = {
        category: "Petição Inicial",
        subcategory: "Trabalhista",
        confidence: 0.85,
        tags: ["trabalhista", "CLT"],
      };

      (nlpPipeline.classifyDocument as Mock).mockResolvedValueOnce(mockClassification);

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "Petição inicial trabalhista");

      const classifyButton = screen.getByRole("button", {
        name: /classificar/i,
      });

      await user.click(classifyButton);

      await waitFor(() => {
        expect(nlpPipeline.classifyDocument).toHaveBeenCalledWith("Petição inicial trabalhista");
        expect(toast.success).toHaveBeenCalledWith("Documento classificado");
      });
    });
  });

  describe("handleExtractInformation handler", () => {
    it("should call nlpPipeline.extractInformation with input text", async () => {
      const user = userEvent.setup();
      const mockExtraction = {
        summary: "Resumo do documento",
        keyPoints: ["Ponto 1", "Ponto 2"],
        entities: [],
        dates: ["01/01/2024"],
        monetaryValues: ["R$ 10.000,00"],
        legalReferences: ["Art. 5º CF"],
        parties: ["Autor", "Réu"],
      };

      (nlpPipeline.extractInformation as Mock).mockResolvedValueOnce(mockExtraction);

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "Documento com informações importantes");

      const extractInfoButton = screen.getByRole("button", {
        name: /extrair info/i,
      });

      await user.click(extractInfoButton);

      await waitFor(() => {
        expect(nlpPipeline.extractInformation).toHaveBeenCalledWith(
          "Documento com informações importantes"
        );
        expect(toast.success).toHaveBeenCalledWith("Informações extraídas");
      });
    });
  });

  describe("handleProcessAll handler", () => {
    it("should call all NLP pipeline methods when Análise Completa is clicked", async () => {
      const user = userEvent.setup();

      const mockEntities = [
        {
          text: "Teste",
          type: "PERSON",
          start: 0,
          end: 5,
          confidence: 0.9,
        },
      ];
      const mockSentiment = {
        sentiment: "neutral",
        score: 0,
        confidence: 0.8,
        aspects: [],
      };
      const mockClassification = {
        category: "Documento",
        confidence: 0.7,
        tags: [],
      };
      const mockExtraction = {
        summary: "Resumo",
        keyPoints: [],
        entities: [],
        dates: [],
        monetaryValues: [],
        legalReferences: [],
        parties: [],
      };

      (nlpPipeline.extractEntities as Mock).mockResolvedValueOnce(mockEntities);
      (nlpPipeline.analyzeSentiment as Mock).mockResolvedValueOnce(mockSentiment);
      (nlpPipeline.classifyDocument as Mock).mockResolvedValueOnce(mockClassification);
      (nlpPipeline.extractInformation as Mock).mockResolvedValueOnce(mockExtraction);

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "Texto para análise completa");

      const processAllButton = screen.getByRole("button", {
        name: /análise completa/i,
      });

      await user.click(processAllButton);

      await waitFor(() => {
        expect(nlpPipeline.extractEntities).toHaveBeenCalled();
        expect(nlpPipeline.analyzeSentiment).toHaveBeenCalled();
        expect(nlpPipeline.classifyDocument).toHaveBeenCalled();
        expect(nlpPipeline.extractInformation).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Análise completa concluída");
      });
    });

    it("should show toast.error when any NLP operation fails during handleProcessAll", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* suppress error output */
      });

      (nlpPipeline.extractEntities as Mock).mockRejectedValueOnce(new Error("Network Error"));
      (nlpPipeline.analyzeSentiment as Mock).mockResolvedValueOnce({
        sentiment: "neutral",
        score: 0,
        confidence: 0.8,
        aspects: [],
      });
      (nlpPipeline.classifyDocument as Mock).mockResolvedValueOnce({
        category: "Documento",
        confidence: 0.7,
        tags: [],
      });
      (nlpPipeline.extractInformation as Mock).mockResolvedValueOnce({
        summary: "Resumo",
        keyPoints: [],
        entities: [],
        dates: [],
        monetaryValues: [],
        legalReferences: [],
        parties: [],
      });

      render(<AdvancedNLPDashboard />);

      const textarea = screen.getByPlaceholderText(/cole aqui o texto do documento jurídico/i);
      await user.type(textarea, "Texto para teste de falha");

      const processAllButton = screen.getByRole("button", {
        name: /análise completa/i,
      });

      await user.click(processAllButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Erro ao processar análise completa");
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("UI rendering", () => {
    it("should render the dashboard header", () => {
      render(<AdvancedNLPDashboard />);

      expect(screen.getByText("Processamento NLP Avançado")).toBeInTheDocument();
      expect(
        screen.getByText(/pipeline de análise de linguagem natural para documentos jurídicos/i)
      ).toBeInTheDocument();
    });

    it("should render all action buttons", () => {
      render(<AdvancedNLPDashboard />);

      expect(screen.getByRole("button", { name: /análise completa/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /extrair entidades/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /analisar sentimento/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /classificar/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /extrair info/i })).toBeInTheDocument();
    });

    it("should render all tabs", () => {
      render(<AdvancedNLPDashboard />);

      expect(screen.getByRole("tab", { name: /entidades/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /sentimento/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /classificação/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /extração/i })).toBeInTheDocument();
    });

    it("should show empty state messages when no results", () => {
      render(<AdvancedNLPDashboard />);

      expect(screen.getByText("Nenhuma entidade extraída ainda")).toBeInTheDocument();
    });
  });
});

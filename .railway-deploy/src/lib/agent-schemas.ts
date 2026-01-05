/**
 * Agent Schemas - Validação Zod para entrada/saída dos agentes IA
 *
 * ============================================================================
 * PLANO MESTRE - FASE 2: Evolução dos Agentes de IA
 * ============================================================================
 * - Schemas Zod para validação de entrada/saída
 * - Filtros inteligentes para confiabilidade
 * - Validação rigorosa sem perder autonomia
 */

import { z } from "zod";

// ============================================================================
// SCHEMAS DE ENTRADA (INPUT)
// ============================================================================

/**
 * Schema para análise de intimação (Mrs. Justin-e)
 */
export const AnalyzeIntimationInputSchema = z.object({
  text: z.string().min(10, "Texto da intimação muito curto"),
  processNumber: z.string().optional(),
  tribunal: z.string().optional(),
  publicationId: z.string().optional(),
  expedienteId: z.string().optional(),
  source: z.enum(["DJEN", "DataJud", "PJe", "manual"]).optional().default("manual"),
});

/**
 * Schema para redação de petição
 */
export const DraftPetitionInputSchema = z.object({
  processNumber: z.string().optional(),
  court: z.string().optional(),
  type: z.enum([
    "peticao_inicial",
    "contestacao",
    "recurso",
    "manifestacao",
    "embargos",
    "agravo",
    "apelacao",
    "replica",
    "impugnacao",
    "outro",
  ]),
  summary: z.string().min(20, "Resumo muito curto para gerar petição"),
  expedienteId: z.string().optional(),
  processId: z.string().optional(),
  templateId: z.string().optional(),
  precedents: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

/**
 * Schema para cálculo de prazo
 */
export const CalculateDeadlineInputSchema = z.object({
  startDate: z.coerce.date().optional(),
  businessDays: z.number().int().positive().max(365),
  tipoPrazo: z.enum(["cpc", "clt", "trabalhista", "penal", "administrativo"]).default("cpc"),
  comarca: z.string().optional(),
  tribunal: z.string().optional(),
  incluirFeriados: z.boolean().default(true),
});

/**
 * Schema para pesquisa de jurisprudência
 */
export const ResearchPrecedentsInputSchema = z.object({
  tema: z.string().min(5, "Tema muito curto"),
  tribunais: z.array(z.string()).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  tipoDecisao: z.enum(["sentenca", "acordao", "sumula", "todos"]).default("todos"),
  maxResults: z.number().int().min(1).max(50).default(10),
});

/**
 * Schema para análise de risco
 */
export const RiskAnalysisInputSchema = z.object({
  processNumber: z.string().optional(),
  description: z.string().min(20),
  area: z
    .enum(["civel", "trabalhista", "previdenciario", "penal", "tributario", "outro"])
    .default("civel"),
  valorCausa: z.number().optional(),
  precedents: z.array(z.string()).optional(),
});

/**
 * Schema para comunicação com cliente
 */
export const ClientCommunicationInputSchema = z.object({
  clientName: z.string().min(2),
  processNumber: z.string().optional(),
  tipo: z.enum(["atualizacao", "urgente", "informativo", "cobranca", "felicitacao"]),
  conteudo: z.string().min(10),
  canal: z.enum(["email", "whatsapp", "sms", "carta"]).default("email"),
});

/**
 * Schema para revisão contratual
 */
export const ContractReviewInputSchema = z.object({
  contractText: z.string().min(100, "Contrato muito curto"),
  tipo: z.enum([
    "prestacao_servicos",
    "compra_venda",
    "locacao",
    "trabalhista",
    "societario",
    "outro",
  ]),
  focusAreas: z
    .array(
      z.enum([
        "clausulas_abusivas",
        "prazos",
        "valores",
        "penalidades",
        "rescisao",
        "lgpd",
        "compliance",
      ])
    )
    .optional(),
});

/**
 * Schema para análise de documento genérico
 */
export const AnalyzeDocumentInputSchema = z.object({
  content: z.string().min(50, "Documento muito curto"),
  tipo: z.enum(["intimacao", "sentenca", "acordao", "peticao", "contrato", "outro"]).optional(),
  extractEntities: z.boolean().default(true),
  summarize: z.boolean().default(true),
});

// ============================================================================
// SCHEMAS DE SAÍDA (OUTPUT)
// ============================================================================

/**
 * Schema de saída para análise de intimação
 */
export const AnalyzeIntimationOutputSchema = z.object({
  summary: z.string().min(20),
  deadline: z
    .object({
      days: z.number().int().nonnegative(),
      type: z.enum(["úteis", "corridos"]),
      startDate: z.string().optional(),
      endDate: z.string(),
      description: z.string().optional(),
    })
    .optional(),
  priority: z.enum(["baixa", "média", "alta", "crítica"]),
  nextSteps: z.array(z.string()).min(1),
  suggestedAction: z.string(),
  processNumber: z.string().optional(),
  court: z.string().optional(),
  parties: z
    .object({
      author: z.string().optional(),
      defendant: z.string().optional(),
    })
    .optional(),
  documentType: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

/**
 * Schema de saída para redação de petição
 */
export const DraftPetitionOutputSchema = z.object({
  draftHtml: z.string().min(500, "Petição muito curta"),
  confidence: z.number().min(0).max(1),
  templateId: z.string().optional(),
  variaveis: z.record(z.string(), z.string()).optional(),
  needsReview: z.boolean().default(true),
  suggestions: z.array(z.string()).optional(),
  wordCount: z.number().optional(),
  metadata: z
    .object({
      tipo: z.string().optional(),
      tribunal: z.string().optional(),
      fundamentosUsados: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Schema de saída para cálculo de prazo
 */
export const CalculateDeadlineOutputSchema = z.object({
  deadline: z.coerce.date(),
  businessDays: z.number().int(),
  calendarDays: z.number().int(),
  holidays: z.array(
    z.object({
      date: z.string(),
      name: z.string(),
      type: z.enum(["nacional", "estadual", "municipal", "forense"]),
    })
  ),
  reasoning: z.array(z.string()),
  urgency: z.enum(["normal", "atenção", "urgente", "crítico"]),
  alerts: z.array(z.string()).optional(),
});

/**
 * Schema de saída para pesquisa de jurisprudência
 */
export const ResearchPrecedentsOutputSchema = z.object({
  precedentsFound: z.number().int(),
  relevantCases: z.array(
    z.object({
      id: z.string(),
      tribunal: z.string(),
      numero: z.string(),
      tema: z.string(),
      ementa: z.string(),
      relevanceScore: z.number().min(0).max(1),
      link: z.string().optional(),
    })
  ),
  thematicAnalysis: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(1),
});

/**
 * Schema de saída para análise de risco
 */
export const RiskAnalysisOutputSchema = z.object({
  riskLevel: z.enum(["muito_baixo", "baixo", "médio", "alto", "muito_alto"]),
  riskScore: z.number().min(0).max(100),
  successProbability: z.number().min(0).max(100),
  factors: z.array(
    z.object({
      factor: z.string(),
      impact: z.enum(["positivo", "negativo", "neutro"]),
      weight: z.number().min(0).max(1),
      description: z.string(),
    })
  ),
  recommendations: z.array(z.string()),
  financialImpact: z
    .object({
      bestCase: z.number().optional(),
      worstCase: z.number().optional(),
      expected: z.number().optional(),
    })
    .optional(),
  confidence: z.number().min(0).max(1),
});

/**
 * Schema genérico de saída com metadados
 */
export const GenericOutputSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.unknown()).optional(),
  message: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  processingTimeMs: z.number().optional(),
  tokensUsed: z.number().optional(),
});

// ============================================================================
// FILTROS INTELIGENTES (FASE 2)
// ============================================================================

/**
 * Verifica se a saída de redação de petição é confiável
 */
export function isOutputConfiavelPeticao(output: z.infer<typeof DraftPetitionOutputSchema>): {
  confiavel: boolean;
  motivos: string[];
} {
  const motivos: string[] = [];

  // Confiança mínima de 70%
  if (output.confidence < 0.7) {
    motivos.push(`Confiança baixa: ${(output.confidence * 100).toFixed(0)}%`);
  }

  // Petição muito curta
  if (!output.draftHtml || output.draftHtml.length < 500) {
    motivos.push("Petição muito curta (< 500 caracteres)");
  }

  // Variáveis não preenchidas
  if (output.draftHtml.includes("{{") && output.draftHtml.includes("}}")) {
    motivos.push("Contém variáveis não preenchidas");
  }

  return {
    confiavel: motivos.length === 0,
    motivos,
  };
}

/**
 * Verifica se a análise de intimação é confiável
 */
export function isOutputConfiavelIntimacao(output: z.infer<typeof AnalyzeIntimationOutputSchema>): {
  confiavel: boolean;
  motivos: string[];
} {
  const motivos: string[] = [];

  // Confiança mínima de 75%
  if (output.confidence < 0.75) {
    motivos.push(`Confiança baixa: ${(output.confidence * 100).toFixed(0)}%`);
  }

  // Sem próximos passos definidos
  if (!output.nextSteps || output.nextSteps.length === 0) {
    motivos.push("Nenhum próximo passo identificado");
  }

  // Resumo muito curto
  if (output.summary.length < 50) {
    motivos.push("Resumo muito curto");
  }

  // Prazo crítico sem deadline
  if (output.priority === "crítica" && !output.deadline) {
    motivos.push("Prioridade crítica mas sem prazo definido");
  }

  return {
    confiavel: motivos.length === 0,
    motivos,
  };
}

/**
 * Verifica se a análise de risco é confiável
 */
export function isOutputConfiavelRisco(output: z.infer<typeof RiskAnalysisOutputSchema>): {
  confiavel: boolean;
  motivos: string[];
} {
  const motivos: string[] = [];

  // Confiança mínima de 65%
  if (output.confidence < 0.65) {
    motivos.push(`Confiança baixa: ${(output.confidence * 100).toFixed(0)}%`);
  }

  // Sem fatores de análise
  if (!output.factors || output.factors.length < 2) {
    motivos.push("Poucos fatores de análise identificados");
  }

  // Sem recomendações
  if (!output.recommendations || output.recommendations.length === 0) {
    motivos.push("Nenhuma recomendação fornecida");
  }

  return {
    confiavel: motivos.length === 0,
    motivos,
  };
}

// ============================================================================
// VALIDADORES UTILITÁRIOS
// ============================================================================

/**
 * Valida entrada de tarefa com schema apropriado
 */
export function validarEntradaTarefa<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
  };
}

/**
 * Valida saída de agente com schema apropriado
 * Reutiliza a mesma lógica de validarEntradaTarefa
 */
export const validarSaidaAgente = validarEntradaTarefa;

/**
 * Tenta extrair JSON de resposta de LLM
 * @returns O JSON parseado ou null se não for possível extrair
 */
export function extrairJSONDeResposta(content: string): unknown {
  // Tenta extrair JSON entre ```json e ``` sem regex greedy
  const jsonStart = content.indexOf("```json");
  const jsonEnd = content.indexOf("```", jsonStart + 7);
  if (jsonStart !== -1 && jsonEnd !== -1) {
    try {
      const jsonContent = content.substring(jsonStart + 7, jsonEnd).trim();
      return JSON.parse(jsonContent);
    } catch {
      // Continua tentando outros métodos
    }
  }

  // Tenta extrair primeiro objeto JSON sem regex greedy
  const startIdx = content.indexOf("{");
  const endIdx = content.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      const jsonStr = content.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    } catch {
      // Continua tentando outros métodos
    }
  }

  // Tenta parsear conteúdo direto
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export type AnalyzeIntimationInput = z.infer<typeof AnalyzeIntimationInputSchema>;
export type AnalyzeIntimationOutput = z.infer<typeof AnalyzeIntimationOutputSchema>;

export type DraftPetitionInput = z.infer<typeof DraftPetitionInputSchema>;
export type DraftPetitionOutput = z.infer<typeof DraftPetitionOutputSchema>;

export type CalculateDeadlineInput = z.infer<typeof CalculateDeadlineInputSchema>;
export type CalculateDeadlineOutput = z.infer<typeof CalculateDeadlineOutputSchema>;

export type ResearchPrecedentsInput = z.infer<typeof ResearchPrecedentsInputSchema>;
export type ResearchPrecedentsOutput = z.infer<typeof ResearchPrecedentsOutputSchema>;

export type RiskAnalysisInput = z.infer<typeof RiskAnalysisInputSchema>;
export type RiskAnalysisOutput = z.infer<typeof RiskAnalysisOutputSchema>;

export type ClientCommunicationInput = z.infer<typeof ClientCommunicationInputSchema>;
export type ContractReviewInput = z.infer<typeof ContractReviewInputSchema>;
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

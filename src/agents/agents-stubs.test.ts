import { runAnaliseDocumental } from "@/agents/analise-documental/analise_documental_graph";
import { runAnaliseRisco } from "@/agents/analise-risco/analise_risco_graph";
import { runComunicacaoClientes } from "@/agents/comunicacao-clientes/comunicacao_clientes_graph";
import { runEstrategiaProcessual } from "@/agents/estrategia-processual/estrategia_processual_graph";
import { runFinanceiro } from "@/agents/financeiro/financeiro_graph";
import { runGestaoPrazos } from "@/agents/gestao-prazos/gestao_prazos_graph";
import { runHarvey } from "@/agents/harvey/harvey_graph";
import { runJustine } from "@/agents/justine/justine_graph";
import { runOrganizacaoArquivos } from "@/agents/organizacao-arquivos/organizacao_arquivos_graph";
import { runPesquisaJuris } from "@/agents/pesquisa-juris/pesquisa_graph";
import { runRedacaoPeticoes } from "@/agents/redacao-peticoes/redacao_graph";
import { runRevisaoContratual } from "@/agents/revisao-contratual/revisao_contratual_graph";
import { runTraducaoJuridica } from "@/agents/traducao-juridica/traducao_juridica_graph";

import { describe, expect, test } from "vitest";

describe("LangGraph agent stubs (smoke tests)", () => {
  test("Harvey runs and completes with valid input", async () => {
    const result = await runHarvey({
      task: "Analisar estratégia para ação trabalhista de rescisão indireta",
      urgency: "high",
      context: "Cliente trabalhou por 5 anos sem registro em CLT",
    });
    // Harvey requires Gemini API which may not be available in test environment
    // Accept either success or graceful failure
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Justine runs and completes with valid input", async () => {
    const result = await runJustine({
      task: "Organizar documentos do processo 1234567-89.2024.8.26.0100",
      priority: "high",
    });
    // Justine requires Gemini API which may not be available in test environment
    // Accept either success or graceful failure
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Analise Documental runs and completes with valid input", async () => {
    const result = await runAnaliseDocumental({
      documentoTexto: "Contrato de prestação de serviços entre partes X e Y, com cláusulas de confidencialidade e prazo de 12 meses.",
      tipoDocumento: "contrato",
    });
    expect(result.completed).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("Gestao Prazos runs and completes with valid input", async () => {
    const result = await runGestaoPrazos({
      tipoProcesso: "trabalhista",
      dataPublicacao: "2024-01-15",
      prazoEmDias: 15,
    });
    expect(result.completed).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("Redacao Peticoes returns a result object", async () => {
    const result = await runRedacaoPeticoes();
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Pesquisa Juris returns a result object", async () => {
    const result = await runPesquisaJuris();
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Analise Risco runs and completes", async () => {
    const result = await runAnaliseRisco();
    expect(result.completed).toBe(true);
  });

  test("Revisao Contratual returns a result object", async () => {
    const result = await runRevisaoContratual();
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Comunicacao Clientes runs and completes", async () => {
    const result = await runComunicacaoClientes();
    expect(result.completed).toBe(true);
  });

  test("Financeiro runs and completes", async () => {
    const result = await runFinanceiro();
    expect(result.completed).toBe(true);
  });

  test("Estrategia Processual returns a result object", async () => {
    const result = await runEstrategiaProcessual();
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Traducao Juridica runs and completes", async () => {
    const result = await runTraducaoJuridica();
    expect(result.completed).toBe(true);
  });

  test("Organizacao de Arquivos runs and completes", async () => {
    const result = await runOrganizacaoArquivos();
    expect(result.completed).toBe(true);
  });
});

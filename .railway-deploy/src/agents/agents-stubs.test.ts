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
  test("Harvey runs and completes", async () => {
    const result = await runHarvey({ task: "Teste rápido" });
    expect(result.completed).toBe(true);
  });

  test("Justine runs and completes", async () => {
    const result = await runJustine({ task: "Teste rápido" });
    expect(result.completed).toBe(true);
  });

  test("Analise Documental runs and completes", async () => {
    const documentoTexto =
      "Documento de exemplo com conteúdo suficiente para validar o agente. ".repeat(2);
    const result = await runAnaliseDocumental({
      documentoTexto,
      tipoDocumento: "genérico",
    });
    expect(result.completed).toBe(true);
  });

  test("Gestao Prazos runs and completes", async () => {
    const result = await runGestaoPrazos({
      tipoProcesso: "cível",
      dataPublicacao: "2024-01-10",
      prazoEmDias: 15,
    });
    expect(result.completed).toBe(true);
  });

  test("Redacao Peticoes returns a result object", async () => {
    const result = await runRedacaoPeticoes({
      detalhes: "Petição resumida para teste automatizado.",
    });
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Pesquisa Juris returns a result object", async () => {
    const result = await runPesquisaJuris({ tema: "prescrição intercorrente" });
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Analise Risco runs and completes", async () => {
    const result = await runAnaliseRisco({
      contextoProcesso: "Teste de análise de risco para validação do agente",
    });
    expect(result.completed).toBe(true);
  });

  test("Revisao Contratual returns a result object", async () => {
    const contratoTexto =
      "Cláusula contratual exemplo para validação do agente de revisão com texto suficientemente extenso " +
      "para passar pela validação de tamanho mínimo exigido pelo agente de revisão contratual, evitando falhas.";
    const result = await runRevisaoContratual({
      contratoTexto,
    });
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Comunicacao Clientes runs and completes", async () => {
    const result = await runComunicacaoClientes({
      mensagem: "Teste de comunicação com cliente",
    });
    expect(result.completed).toBe(true);
  });

  test("Financeiro runs and completes", async () => {
    const result = await runFinanceiro({
      operacao: "consulta",
    });
    expect(result.completed).toBe(true);
  });

  test("Estrategia Processual returns a result object", async () => {
    const result = await runEstrategiaProcessual({
      contextoProcesso: "Teste de estratégia processual",
    });
    expect(result).toBeDefined();
    expect(typeof result.completed).toBe("boolean");
  });

  test("Traducao Juridica runs and completes", async () => {
    const result = await runTraducaoJuridica({
      textoOriginal: "Sample legal text for translation",
      idiomaOrigem: "en",
      idiomaDestino: "pt-BR",
    });
    expect(result.completed).toBe(true);
  });

  test("Organizacao de Arquivos runs and completes", async () => {
    const result = await runOrganizacaoArquivos({
      operacao: "organizar",
    });
    expect(result.completed).toBe(true);
  });
});

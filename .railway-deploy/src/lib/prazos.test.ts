/**
 * Testes para funções de cálculo de prazos jurídicos
 *
 * Testa o cálculo de prazos processuais conforme CPC
 */

import { describe, it, expect } from "vitest";
import { calcularPrazoCPC } from "./prazos";

describe("calcularPrazoCPC", () => {
  it("deve calcular prazo de 5 dias úteis corretamente", () => {
    // Início: Segunda-feira, 06/01/2025
    const dataInicio = new Date("2025-01-06");
    const diasCorridos = 5;

    // Esperado: 5 dias úteis = 13/01/2025 (segunda-feira seguinte)
    // 06/01 (seg) -> 07/01 (ter) -> 08/01 (qua) -> 09/01 (qui) -> 10/01 (sex)
    // Pula fim de semana (11-12/01)
    // Resultado: 13/01 (seg)
    const resultado = calcularPrazoCPC(dataInicio, diasCorridos);

    expect(resultado.getDate()).toBe(13);
    expect(resultado.getMonth()).toBe(0); // Janeiro = 0
    expect(resultado.getFullYear()).toBe(2025);
  });

  it("deve pular feriados nacionais no cálculo", () => {
    // Início: 17/04/2025 (quinta-feira antes da Sexta-feira Santa)
    const dataInicio = new Date("2025-04-17");
    const diasCorridos = 2;

    // Esperado: 2 dias úteis pulando 18/04 (Sexta-feira Santa)
    // 17/04 (qui) -> pula 18/04 (feriado) -> pula 19-20/04 (fim de semana)
    // -> pula 21/04 (Tiradentes, feriado) -> 22/04 (ter, dia 1) -> 23/04 (qua, dia 2)
    const resultado = calcularPrazoCPC(dataInicio, diasCorridos);

    expect(resultado.getDate()).toBe(23);
    expect(resultado.getMonth()).toBe(3); // Abril = 3
    expect(resultado.getFullYear()).toBe(2025);
  });

  it("deve pular fins de semana no cálculo", () => {
    // Início: Sexta-feira, 10/01/2025
    const dataInicio = new Date("2025-01-10");
    const diasCorridos = 3;

    // Esperado: 3 dias úteis pulando o fim de semana
    // 10/01 (sex) -> pula 11-12/01 (fim de semana) -> 13/01 (seg) -> 14/01 (ter) -> 15/01 (qua)
    const resultado = calcularPrazoCPC(dataInicio, diasCorridos);

    expect(resultado.getDate()).toBe(15);
    expect(resultado.getMonth()).toBe(0);
    expect(resultado.getFullYear()).toBe(2025);
  });

  it("deve garantir que o prazo final caia em dia útil", () => {
    // Início: Quarta-feira, 08/01/2025
    const dataInicio = new Date("2025-01-08");
    const diasCorridos = 2;

    // Esperado: 2 dias úteis = 10/01 (sexta-feira)
    // 08/01 (qua) -> 09/01 (qui) -> 10/01 (sex)
    const resultado = calcularPrazoCPC(dataInicio, diasCorridos);

    // Verifica que é sexta-feira (dia útil)
    expect(resultado.getDay()).toBe(5); // 5 = sexta-feira
    expect(resultado.getDate()).toBe(10);
  });
});

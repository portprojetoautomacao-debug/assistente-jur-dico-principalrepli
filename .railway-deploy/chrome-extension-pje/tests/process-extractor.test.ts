import { beforeEach, describe, expect, it } from "vitest";
import { ProcessExtractor } from "../src/content/extractors/process-extractor";

describe("ProcessExtractor", () => {
  let extractor: ProcessExtractor;

  beforeEach(() => {
    extractor = new ProcessExtractor();
    // Limpa DOM
    document.body.innerHTML = "";
  });

  it("deve extrair processo com todos os campos", () => {
    // Mock DOM do PJe
    document.body.innerHTML = `
      <div class="processo-row">
        <span class="numero-processo">5000576-46.2021.8.13.0223</span>
        <span class="classe-processo">Guarda</span>
        <span class="assunto">Guarda de Menor</span>
        <span class="parte-autor">FRANCISLENE EMILIANO DE SOUSA</span>
        <span class="parte-reu">EVERSON RODRIGO DA SILVA</span>
        <span class="vara">2ª Vara de Família da Comarca de Divinópolis</span>
        <span class="ultimo-movimento">Expedição de Certidão.</span>
        <span class="data-movimento">05/12/2025 14:03</span>
        <span class="situacao">Ativo</span>
      </div>
    `;

    const processos = extractor.extractProcessos();

    expect(processos).toHaveLength(1);
    expect(processos[0]).toMatchObject({
      numero: "50005764620218130223",
      numeroFormatado: "5000576-46.2021.8.13.0223",
      classe: "Guarda",
      assunto: "Guarda de Menor",
      parteAutor: "FRANCISLENE EMILIANO DE SOUSA",
      parteReu: "EVERSON RODRIGO DA SILVA",
      comarca: "Divinópolis",
      situacao: "ativo",
    });
  });

  it("deve ignorar processos com número inválido", () => {
    document.body.innerHTML = `
      <div class="processo-row">
        <span class="numero-processo">123-45</span>
        <span class="classe-processo">Teste</span>
      </div>
    `;

    const processos = extractor.extractProcessos();
    expect(processos).toHaveLength(0);
  });

  it("deve extrair múltiplos processos", () => {
    document.body.innerHTML = `
      <div class="processo-row">
        <span class="numero-processo">5000576-46.2021.8.13.0223</span>
        <span class="classe-processo">Guarda</span>
        <span class="ultimo-movimento">Movimento 1</span>
        <span class="data-movimento">05/12/2025 14:03</span>
      </div>
      <div class="processo-row">
        <span class="numero-processo">5005758-71.2025.8.13.0223</span>
        <span class="classe-processo">Alimentos</span>
        <span class="ultimo-movimento">Movimento 2</span>
        <span class="data-movimento">05/12/2025 13:42</span>
      </div>
    `;

    const processos = extractor.extractProcessos();
    expect(processos).toHaveLength(2);
  });

  it('deve detectar situação "baixado"', () => {
    document.body.innerHTML = `
      <div class="processo-row">
        <span class="numero-processo">5000576-46.2021.8.13.0223</span>
        <span class="situacao">Baixado</span>
        <span class="ultimo-movimento">Arquivado</span>
        <span class="data-movimento">05/12/2025 14:03</span>
      </div>
    `;

    const processos = extractor.extractProcessos();
    expect(processos[0].situacao).toBe("baixado");
  });

  it('deve extrair partes do formato "AUTOR X RÉU"', () => {
    document.body.innerHTML = `
      <div class="processo-row">
        <span class="numero-processo">5000576-46.2021.8.13.0223</span>
        <div class="partes">JOAO SILVA X MARIA SANTOS</div>
        <span class="ultimo-movimento">Movimento</span>
        <span class="data-movimento">05/12/2025 14:03</span>
      </div>
    `;

    const processos = extractor.extractProcessos();
    expect(processos[0].parteAutor).toBe("JOAO SILVA");
    expect(processos[0].parteReu).toContain("MARIA SANTOS"); // Usa toContain para lidar com whitespace
  });
});

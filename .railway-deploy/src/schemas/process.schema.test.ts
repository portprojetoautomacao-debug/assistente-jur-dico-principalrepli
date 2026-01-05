/**
 * Testes unitários para schemas de validação Zod
 */

import { describe, expect, it } from "vitest";
import {
  isValidCNPJ,
  isValidCPF,
  numeroCNJSchema,
  validateCliente,
  validateFinancialEntry,
  validateMinuta,
  validateProcess,
} from "./process.schema";

describe("Validação de Processo", () => {
  it("deve validar processo completo válido", () => {
    const validProcess = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      numeroCNJ: "1234567-89.2024.5.02.0999",
      titulo: "Ação Trabalhista - João Silva",
      autor: "João Silva",
      reu: "Empresa XYZ Ltda",
      status: "ativo" as const,
      valorCausa: 50000,
      comarca: "Belo Horizonte",
      vara: "1ª Vara do Trabalho",
      prazos: [],
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = validateProcess(validProcess);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data.numeroCNJ).toBe("1234567-89.2024.5.02.0999");
    }
  });

  it("deve rejeitar número CNJ inválido", () => {
    const invalidProcess = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      numeroCNJ: "123-45.6789", // Formato errado
      titulo: "Teste",
      autor: "João",
      reu: "Empresa",
      status: "ativo" as const,
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = validateProcess(invalidProcess);
    expect(result.isValid).toBe(false);
  });

  it("deve validar formato de número CNJ", () => {
    expect(numeroCNJSchema.safeParse("1234567-89.2024.5.02.0999").success).toBe(true);
    expect(numeroCNJSchema.safeParse("0000000-00.0000.0.00.0000").success).toBe(true);
    expect(numeroCNJSchema.safeParse("123-45").success).toBe(false);
  });
});

describe("Validação de Cliente", () => {
  it("deve validar cliente com CPF válido", () => {
    const validCliente = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      nome: "João Silva Santos",
      cpfCnpj: "123.456.789-00",
      email: "joao@email.com",
      telefone: "(11) 91234-5678",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateCliente(validCliente);
    expect(result.isValid).toBe(true);
  });

  it("deve validar cliente com CNPJ válido", () => {
    const validCliente = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      nome: "Empresa XYZ Ltda",
      cpfCnpj: "12.345.678/0001-90",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateCliente(validCliente);
    expect(result.isValid).toBe(true);
  });

  it("deve rejeitar email inválido", () => {
    const invalidCliente = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      nome: "João Silva",
      cpfCnpj: "123.456.789-00",
      email: "email-invalido", // Sem @
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateCliente(invalidCliente);
    expect(result.isValid).toBe(false);
  });
});

describe("Validação de CPF", () => {
  it("deve validar CPF com dígitos verificadores corretos", () => {
    expect(isValidCPF("111.444.777-35")).toBe(true); // CPF válido de exemplo
  });

  it("deve rejeitar CPF com dígitos verificadores incorretos", () => {
    expect(isValidCPF("123.456.789-00")).toBe(false); // Dígitos errados
  });

  it("deve rejeitar CPF com todos os dígitos iguais", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("000.000.000-00")).toBe(false);
  });

  it("deve aceitar CPF sem formatação", () => {
    expect(isValidCPF("11144477735")).toBe(true);
  });
});

describe("Validação de CNPJ", () => {
  it("deve validar CNPJ com dígitos verificadores corretos", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true); // CNPJ válido de exemplo
  });

  it("deve rejeitar CNPJ com dígitos verificadores incorretos", () => {
    expect(isValidCNPJ("12.345.678/0001-90")).toBe(false);
  });

  it("deve rejeitar CNPJ com todos os dígitos iguais", () => {
    expect(isValidCNPJ("11.111.111/1111-11")).toBe(false);
  });

  it("deve aceitar CNPJ sem formatação", () => {
    expect(isValidCNPJ("11222333000181")).toBe(true);
  });
});

describe("Validação de Minuta", () => {
  it("deve validar minuta completa", () => {
    const validMinuta = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      titulo: "Petição Inicial - Ação Trabalhista",
      tipo: "peticao" as const,
      conteudo: "<p>Conteúdo da petição...</p>",
      status: "rascunho" as const,
      autor: "Dr. João Silva",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateMinuta(validMinuta);
    expect(result.isValid).toBe(true);
  });

  it("deve rejeitar minuta com conteúdo muito curto", () => {
    const invalidMinuta = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      titulo: "Teste",
      tipo: "peticao" as const,
      conteudo: "abc", // Menos de 10 caracteres
      status: "rascunho" as const,
      autor: "Teste",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateMinuta(invalidMinuta);
    expect(result.isValid).toBe(false);
  });

  it("deve validar URL do Google Docs", () => {
    const minutaComDocs = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      titulo: "Petição com Google Docs",
      tipo: "peticao" as const,
      conteudo: "Conteúdo da petição",
      status: "finalizada" as const,
      autor: "Dr. João",
      googleDocsUrl: "https://docs.google.com/document/d/abc123/edit",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateMinuta(minutaComDocs);
    expect(result.isValid).toBe(true);
  });
});

describe("Validação de FinancialEntry", () => {
  it("deve validar entrada de receita", () => {
    const validIncome = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "income" as const,
      amount: 5000,
      category: "Honorários",
      description: "Pagamento processo 123",
      date: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateFinancialEntry(validIncome);
    expect(result.isValid).toBe(true);
  });

  it("deve rejeitar valor negativo", () => {
    const invalidEntry = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "expense" as const,
      amount: -100, // Negativo
      category: "Despesas",
      date: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateFinancialEntry(invalidEntry);
    expect(result.isValid).toBe(false);
  });

  it("deve rejeitar valor zero", () => {
    const invalidEntry = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "income" as const,
      amount: 0,
      category: "Teste",
      date: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const result = validateFinancialEntry(invalidEntry);
    expect(result.isValid).toBe(false);
  });
});

/**
 * Testes Unitários - PII Filtering Service (LGPD Compliance)
 *
 * Testa sanitização de dados pessoais conforme Lei 13.709/2018
 *
 * @see src/services/pii-filtering.ts
 * @see docs/LGPD_COMPLIANCE.md
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizePII,
  sanitizeObject,
  detectPII,
  isValidCPF,
  getPIIStats,
  resetPIIStats,
  recordPIISanitization,
  PIIType,
  type PIIFilterConfig,
  DEFAULT_PII_CONFIG,
} from "@/services/pii-filtering";

describe("PII Filtering Service - LGPD Compliance", () => {
  beforeEach(() => {
    resetPIIStats();
  });

  // ============================================
  // TESTES DE DETECÇÃO (detectPII)
  // ============================================

  describe("detectPII - Detecção de Dados Sensíveis", () => {
    it("deve detectar CPF válido", () => {
      const texto = "Cliente João Silva, CPF 123.456.789-09";
      const detected = detectPII(texto);

      expect(detected).toContain(PIIType.CPF);
    });

    it("deve detectar email", () => {
      const texto = "Contato: joao.silva@example.com";
      const detected = detectPII(texto);

      expect(detected).toContain(PIIType.EMAIL);
    });

    it("deve detectar telefone (vários formatos)", () => {
      const casos = [
        "(11) 98765-4321",
        "11 98765-4321",
        "11987654321",
        "+55 11 98765-4321",
        "+5511987654321",
      ];

      casos.forEach((telefone) => {
        const detected = detectPII(`Tel: ${telefone}`);
        expect(detected).toContain(PIIType.TELEFONE);
      });
    });

    it("deve detectar endereço", () => {
      const texto = "Rua das Flores, 123";
      const detected = detectPII(texto);

      expect(detected).toContain(PIIType.ENDERECO);
    });

    it("deve detectar múltiplos tipos de PII", () => {
      const texto = `
        Cliente: João Silva
        CPF: 123.456.789-09
        Email: joao@example.com
        Tel: (11) 98765-4321
      `;

      const detected = detectPII(texto);

      expect(detected).toContain(PIIType.CPF);
      expect(detected).toContain(PIIType.EMAIL);
      expect(detected).toContain(PIIType.TELEFONE);
      expect(detected.length).toBeGreaterThan(2);
    });

    it("não deve detectar PII em texto sem dados sensíveis", () => {
      const texto = "Processo 1234567-89.2024.5.02.0999 em andamento";
      const detected = detectPII(texto);

      expect(detected).toEqual([]);
    });
  });

  // ============================================
  // TESTES DE VALIDAÇÃO DE CPF
  // ============================================

  describe("isValidCPF - Validação de CPF", () => {
    it("deve validar CPF correto (com pontuação)", () => {
      expect(isValidCPF("123.456.789-09")).toBe(true);
    });

    it("deve validar CPF correto (sem pontuação)", () => {
      expect(isValidCPF("12345678909")).toBe(true);
    });

    it("deve rejeitar CPF inválido (dígito verificador errado)", () => {
      expect(isValidCPF("123.456.789-00")).toBe(false);
    });

    it("deve rejeitar CPF com todos dígitos iguais", () => {
      expect(isValidCPF("111.111.111-11")).toBe(false);
      expect(isValidCPF("000.000.000-00")).toBe(false);
      expect(isValidCPF("999.999.999-99")).toBe(false);
    });

    it("deve rejeitar CPF com menos de 11 dígitos", () => {
      expect(isValidCPF("123.456.789")).toBe(false);
    });

    it("deve rejeitar CPF com mais de 11 dígitos", () => {
      expect(isValidCPF("123.456.789-091")).toBe(false);
    });
  });

  // ============================================
  // TESTES DE SANITIZAÇÃO (sanitizePII)
  // ============================================

  describe("sanitizePII - Sanitização de Texto", () => {
    it("deve sanitizar CPF com redação padrão", () => {
      const texto = "Cliente João Silva, CPF 123.456.789-09";
      const sanitizado = sanitizePII(texto);

      expect(sanitizado).toContain("[CPF_REDACTED]");
      expect(sanitizado).not.toContain("123.456.789-09");
    });

    it("deve sanitizar email com redação padrão", () => {
      const texto = "Contato: joao.silva@example.com";
      const sanitizado = sanitizePII(texto);

      expect(sanitizado).toContain("[EMAIL_REDACTED]");
      expect(sanitizado).not.toContain("joao.silva@example.com");
    });

    it("deve sanitizar telefone com redação padrão", () => {
      const texto = "Tel: (11) 98765-4321";
      const sanitizado = sanitizePII(texto);

      expect(sanitizado).toContain("[PHONE_REDACTED]");
      expect(sanitizado).not.toContain("(11) 98765-4321");
    });

    it("deve sanitizar múltiplos tipos de PII", () => {
      const texto = `
        Cliente: João Silva
        CPF: 123.456.789-09
        Email: joao@example.com
        Tel: (11) 98765-4321
      `;

      const sanitizado = sanitizePII(texto);

      expect(sanitizado).toContain("[CPF_REDACTED]");
      expect(sanitizado).toContain("[EMAIL_REDACTED]");
      expect(sanitizado).toContain("[PHONE_REDACTED]");
    });

    it("deve preservar texto sem PII", () => {
      const texto = "Processo 1234567-89.2024.5.02.0999 em andamento";
      const sanitizado = sanitizePII(texto);

      expect(sanitizado).toBe(texto);
    });

    it("deve respeitar configuração customizada de mascaramento", () => {
      const config: PIIFilterConfig = {
        ...DEFAULT_PII_CONFIG,
        maskChar: "#",
        keepFirst: 3,
        keepLast: 3,
        customReplacements: undefined,
      };

      const texto = "CPF: 123.456.789-09";
      const sanitizado = sanitizePII(texto, config);

      expect(sanitizado).toMatch(/123.*###.*-09/);
    });

    it("não deve sanitizar quando disabled", () => {
      const config: PIIFilterConfig = {
        ...DEFAULT_PII_CONFIG,
        enabled: false,
      };

      const texto = "CPF: 123.456.789-09, Email: joao@example.com";
      const sanitizado = sanitizePII(texto, config);

      expect(sanitizado).toBe(texto);
    });
  });

  // ============================================
  // TESTES DE SANITIZAÇÃO DE OBJETOS
  // ============================================

  describe("sanitizeObject - Sanitização de JSON", () => {
    it("deve sanitizar strings em objeto", () => {
      const obj = {
        nome: "João Silva",
        cpf: "123.456.789-09",
        email: "joao@example.com",
      };

      const sanitizado = sanitizeObject(obj);

      expect(sanitizado.cpf).toBe("[CPF_REDACTED]");
      expect(sanitizado.email).toBe("[EMAIL_REDACTED]");
      expect(sanitizado.nome).toBe("João Silva"); // Nome não é sanitizado (heurística não ativada)
    });

    it("deve sanitizar arrays em objeto", () => {
      const obj = {
        contatos: ["joao@example.com", "maria@example.com"],
      };

      const sanitizado = sanitizeObject(obj);

      expect(sanitizado.contatos).toEqual(["[EMAIL_REDACTED]", "[EMAIL_REDACTED]"]);
    });

    it("deve sanitizar objetos aninhados", () => {
      const obj = {
        cliente: {
          nome: "João Silva",
          dados: {
            cpf: "123.456.789-09",
            telefone: "(11) 98765-4321",
          },
        },
      };

      const sanitizado = sanitizeObject(obj);

      expect(sanitizado.cliente.dados.cpf).toBe("[CPF_REDACTED]");
      expect(sanitizado.cliente.dados.telefone).toBe("[PHONE_REDACTED]");
    });

    it("deve redactar chaves sensíveis", () => {
      const obj = {
        username: "joao",
        password: "senha123",
        apiKey: "abc123xyz",
        token: "bearer xyz",
        secret: "s3cr3t",
      };

      const sanitizado = sanitizeObject(obj);

      expect(sanitizado.password).toBe("[REDACTED]");
      expect(sanitizado.apiKey).toBe("[REDACTED]");
      expect(sanitizado.token).toBe("[REDACTED]");
      expect(sanitizado.secret).toBe("[REDACTED]");
      expect(sanitizado.username).toBe("joao"); // Username não é sensível
    });

    it("deve preservar tipos primitivos", () => {
      const obj = {
        numero: 42,
        ativo: true,
        nulo: null,
        indefinido: undefined,
      };

      const sanitizado = sanitizeObject(obj);

      expect(sanitizado.numero).toBe(42);
      expect(sanitizado.ativo).toBe(true);
      expect(sanitizado.nulo).toBe(null);
      expect(sanitizado.indefinido).toBe(undefined);
    });
  });

  // ============================================
  // TESTES DE ESTATÍSTICAS (Auditoria LGPD)
  // ============================================

  describe("Estatísticas de Sanitização - Auditoria LGPD", () => {
    it("deve registrar estatísticas de sanitização", () => {
      resetPIIStats();

      const detected1 = [PIIType.CPF, PIIType.EMAIL];
      const detected2 = [PIIType.TELEFONE];

      recordPIISanitization(detected1);
      recordPIISanitization(detected2);

      const stats = getPIIStats();

      expect(stats.totalProcessed).toBe(2);
      expect(stats.totalSanitized).toBe(2);
      expect(stats.byType[PIIType.CPF]).toBe(1);
      expect(stats.byType[PIIType.EMAIL]).toBe(1);
      expect(stats.byType[PIIType.TELEFONE]).toBe(1);
    });

    it("deve registrar timestamp da última sanitização", () => {
      resetPIIStats();

      const beforeTimestamp = new Date().toISOString();
      recordPIISanitization([PIIType.CPF]);
      const afterTimestamp = new Date().toISOString();

      const stats = getPIIStats();

      expect(stats.lastSanitized).toBeDefined();
      expect(stats.lastSanitized).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(stats.lastSanitized >= beforeTimestamp).toBe(true);
      expect(stats.lastSanitized <= afterTimestamp).toBe(true);
    });

    it("não deve incrementar totalSanitized se nenhum PII detectado", () => {
      resetPIIStats();

      recordPIISanitization([]);

      const stats = getPIIStats();

      expect(stats.totalProcessed).toBe(1);
      expect(stats.totalSanitized).toBe(0);
    });

    it("deve resetar estatísticas corretamente", () => {
      recordPIISanitization([PIIType.CPF]);
      recordPIISanitization([PIIType.EMAIL]);

      resetPIIStats();

      const stats = getPIIStats();

      expect(stats.totalProcessed).toBe(0);
      expect(stats.totalSanitized).toBe(0);
      expect(stats.lastSanitized).toBe("");
      expect(Object.keys(stats.byType).length).toBe(0);
    });
  });

  // ============================================
  // TESTES DE CASOS REAIS (Integração)
  // ============================================

  describe("Casos Reais de Uso - LGPD", () => {
    it("deve sanitizar mensagem de erro com CPF", () => {
      const errorMsg = "Erro ao processar CPF 123.456.789-09 do cliente";
      const sanitizado = sanitizePII(errorMsg);

      expect(sanitizado).toBe("Erro ao processar CPF [CPF_REDACTED] do cliente");
    });

    it("deve sanitizar log de aplicação com múltiplos dados", () => {
      const logMsg = `
        [2024-12-08] Usuário: joao@example.com
        Ação: Atualizar cadastro
        CPF: 123.456.789-09
        Telefone: (11) 98765-4321
        Status: Sucesso
      `;

      const sanitizado = sanitizePII(logMsg);

      expect(sanitizado).toContain("[EMAIL_REDACTED]");
      expect(sanitizado).toContain("[CPF_REDACTED]");
      expect(sanitizado).toContain("[PHONE_REDACTED]");
      expect(sanitizado).toContain("Status: Sucesso"); // Preservado
    });

    it("deve sanitizar JSON de API response", () => {
      const apiResponse = {
        cliente: {
          id: 123,
          nome: "João Silva",
          cpf: "123.456.789-09",
          email: "joao@example.com",
          telefone: "(11) 98765-4321",
        },
        processo: {
          numero: "1234567-89.2024.5.02.0999",
          status: "ativo",
        },
      };

      const sanitizado = sanitizeObject(apiResponse);

      expect(sanitizado.cliente.cpf).toBe("[CPF_REDACTED]");
      expect(sanitizado.cliente.email).toBe("[EMAIL_REDACTED]");
      expect(sanitizado.cliente.telefone).toBe("[PHONE_REDACTED]");
      expect(sanitizado.processo.numero).toBe("1234567-89.2024.5.02.0999"); // Número de processo é público
    });

    it("deve sanitizar Sentry breadcrumb", () => {
      const breadcrumb = {
        category: "navigation",
        message: "Navegou para /clientes/joao@example.com",
        data: {
          url: "/clientes/joao@example.com",
          cpf: "123.456.789-09",
        },
      };

      const sanitizado = sanitizeObject(breadcrumb);

      expect(sanitizado.message).toContain("[EMAIL_REDACTED]");
      expect(sanitizado.data.url).toContain("[EMAIL_REDACTED]");
      expect(sanitizado.data.cpf).toBe("[CPF_REDACTED]");
    });
  });

  // ============================================
  // TESTES DE PERFORMANCE
  // ============================================

  describe("Performance e Edge Cases", () => {
    it("deve processar texto grande em tempo razoável", { timeout: 60000 }, () => {
      const textoGrande = `
        Cliente: João Silva
        CPF: 123.456.789-09
        Email: joao@example.com
      `.repeat(1000); // 3000 linhas

      const startTime = performance.now();
      const sanitizado = sanitizePII(textoGrande);
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Aumentar timeout para 500ms em ambientes mais lentos
      expect(duration).toBeLessThan(500);
      expect(sanitizado).toContain("[CPF_REDACTED]");
    });

    it("deve lidar com string vazia", () => {
      expect(sanitizePII("")).toBe("");
    });

    it("deve lidar com objeto vazio", () => {
      expect(sanitizeObject({})).toEqual({});
    });

    it("deve lidar com array vazio", () => {
      expect(sanitizeObject([])).toEqual([]);
    });

    it("deve lidar com null/undefined", () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });
  });
});

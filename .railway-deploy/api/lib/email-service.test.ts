import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock completo do email-service para testes
vi.mock("./email-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./email-service")>();

  return {
    ...actual,
    sendEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "mock-email-id-123",
      error: null,
    }),
    sendNotificationEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "mock-notification-id-456",
      error: null,
    }),
    sendUrgentDeadlineAlert: vi.fn().mockResolvedValue({
      success: true,
      messageId: "mock-alert-id-789",
      error: null,
    }),
    sendDailySummaryEmail: vi.fn().mockResolvedValue({
      success: true,
      messageId: "mock-summary-id-012",
      error: null,
    }),
  };
});

import {
  sendDailySummaryEmail,
  sendEmail,
  sendNotificationEmail,
  sendUrgentDeadlineAlert,
} from "./email-service";

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simular variável de ambiente
    process.env.RESEND_API_KEY = "test-api-key";
  });

  describe("sendEmail", () => {
    it("deve enviar email com sucesso", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("mock-email-id-123");
      expect(result.error).toBe(null);
      expect(sendEmail).toHaveBeenCalledWith({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
      });
    });

    it("deve aceitar múltiplos destinatários", async () => {
      const result = await sendEmail({
        to: ["test1@example.com", "test2@example.com"],
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(true);
      expect(sendEmail).toHaveBeenCalled();
    });

    it("deve aceitar tags opcionais", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        tags: [{ name: "tipo", value: "teste" }],
      });

      expect(result.success).toBe(true);
      expect(sendEmail).toHaveBeenCalled();
    });
  });

  describe("sendNotificationEmail", () => {
    it("deve enviar email de notificação com actionUrl", async () => {
      const result = await sendNotificationEmail(
        "operator@example.com",
        "Nova Intimação",
        "Você recebeu uma nova intimação no processo 123",
        "https://app.example.com/process/123"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(sendNotificationEmail).toHaveBeenCalledWith(
        "operator@example.com",
        "Nova Intimação",
        "Você recebeu uma nova intimação no processo 123",
        "https://app.example.com/process/123"
      );
    });

    it("deve enviar email de notificação sem actionUrl", async () => {
      const result = await sendNotificationEmail(
        "operator@example.com",
        "Atualização",
        "Atualização do sistema"
      );

      expect(result.success).toBe(true);
      expect(sendNotificationEmail).toHaveBeenCalled();
    });
  });

  describe("sendUrgentDeadlineAlert", () => {
    it("deve enviar alerta urgente de prazo", async () => {
      const result = await sendUrgentDeadlineAlert(
        "lawyer@example.com",
        "1234567-89.2025.8.26.0100",
        "2025-12-15 17:00",
        "Contestação"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(sendUrgentDeadlineAlert).toHaveBeenCalled();
    });

    it("deve incluir número do processo no email", async () => {
      const result = await sendUrgentDeadlineAlert(
        "lawyer@example.com",
        "0001234-56.2025.5.02.0999",
        "Amanhã 17:00",
        "Manifestação"
      );

      expect(result.success).toBe(true);
      expect(sendUrgentDeadlineAlert).toHaveBeenCalled();
    });
  });

  describe("sendDailySummaryEmail", () => {
    it("deve enviar resumo diário com métricas", async () => {
      const summary = {
        processesMonitored: 150,
        deadlinesFound: 8,
        documentsGenerated: 12,
        errorsCount: 2,
      };

      const result = await sendDailySummaryEmail("manager@example.com", summary);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(sendDailySummaryEmail).toHaveBeenCalledWith("manager@example.com", summary);
    });

    it("deve aceitar métricas zeradas", async () => {
      const summary = {
        processesMonitored: 0,
        deadlinesFound: 0,
        documentsGenerated: 0,
        errorsCount: 0,
      };

      const result = await sendDailySummaryEmail("manager@example.com", summary);

      expect(result.success).toBe(true);
      expect(sendDailySummaryEmail).toHaveBeenCalled();
    });
  });
});

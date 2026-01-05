import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireApiKey } from "./lib/auth.js";
import {
  sendDailySummaryEmail,
  sendEmail,
  sendNotificationEmail,
  sendUrgentDeadlineAlert,
} from "./lib/email-service.js";
import { rateLimitMiddleware } from "./lib/rate-limit.js";
import { retryWithBackoff } from "./lib/retry.js";
import { escapeHtml } from "./lib/sanitize.js";
import { withTimeout } from "./lib/timeout.js";
import { EmailRequest, EmailUnion } from "./lib/validation.js";

/**
 * API Endpoint para enviar emails
 * POST /api/emails
 *
 * Tipos de email:
 * - "test": Email de teste
 * - "notification": Email de notificação
 * - "urgent": Alerta de prazo urgente
 * - "daily_summary": Resumo diário
 */
// Helper: Obter IP do cliente
function getClientIP(req: VercelRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string | undefined) ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown"
  );
}

// Helper: Aplicar rate limiting
async function applyEmailRateLimit(clientIP: string, res: VercelResponse): Promise<boolean> {
  const rl = await rateLimitMiddleware(clientIP);
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.allowed) {
    res.setHeader(
      "Retry-After",
      Math.max(
        1,
        Math.ceil((Number(rl.headers["X-RateLimit-Reset"]) - Date.now()) / 1000)
      ).toString()
    );
    res.status(429).json({ error: rl.error || "Rate limit exceeded" });
    return false;
  }

  return true;
}

// Helper: Enviar email de teste
async function sendTestEmail(to: string | string[], subject?: string) {
  const recipient = Array.isArray(to) ? to[0] : to;
  return retryWithBackoff(
    () =>
      withTimeout(
        30000,
        sendEmail({
          to: recipient,
          subject: subject || "Email de Teste - Assistente Jurídico",
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
                <h1 style="color: #1e88e5;">✅ Email de Teste Enviado com Sucesso!</h1>
                <p style="font-size: 16px; color: #666;">
                  Resend está configurado corretamente no Vercel.
                </p>
                <p style="margin-top: 20px; font-size: 14px; color: #999;">
                  Timestamp: ${new Date().toISOString()}
                </p>
              </body>
            </html>
          `,
          tags: [{ name: "tipo", value: "teste" }],
        })
      ),
    3,
    200
  );
}

// Helper: Validar campos de notificação
function validateNotificationFields(body: EmailRequest): { error?: string } {
  if (!body.to || !body.subject || !body.message) {
    return { error: 'Campos "to", "subject" e "message" são obrigatórios' };
  }
  return {};
}

type EmailSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

async function sendWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(() => withTimeout(30000, fn), 3, 200);
}

function badRequest(res: VercelResponse, error: string) {
  return res.status(400).json({ error });
}

function serverError(res: VercelResponse, error: string) {
  return res.status(500).json({ success: false, error, message: "Erro ao enviar email" });
}

async function handleTestEmail(body: EmailRequest, res: VercelResponse): Promise<EmailSendResult> {
  if (!body.to) {
    badRequest(res, 'Campo "to" é obrigatório');
    return { success: false, error: 'Campo "to" é obrigatório' };
  }
  return sendWithRetry(() => sendTestEmail(body.to, body.subject)) as unknown as EmailSendResult;
}

async function handleNotificationEmail(
  body: EmailRequest,
  res: VercelResponse
): Promise<EmailSendResult> {
  const validation = validateNotificationFields(body);
  if (validation.error) {
    badRequest(res, validation.error);
    return { success: false, error: validation.error };
  }

  const subject = escapeHtml(body.subject!);
  const message = escapeHtml(body.message!);
  const actionUrl = body.actionUrl;

  return sendWithRetry(() =>
    sendNotificationEmail(body.to as string, subject, message, actionUrl)
  ) as unknown as EmailSendResult;
}

async function handleUrgentEmail(
  body: EmailRequest,
  res: VercelResponse
): Promise<EmailSendResult> {
  if (!body.to || !body.processNumber || !body.deadline) {
    badRequest(res, 'Campos "to", "processNumber" e "deadline" são obrigatórios');
    return { success: false, error: 'Campos "to", "processNumber" e "deadline" são obrigatórios' };
  }

  return sendWithRetry(() =>
    sendUrgentDeadlineAlert(
      body.to as string,
      escapeHtml(body.processNumber),
      escapeHtml(body.deadline),
      "Manifestação Processual"
    )
  ) as unknown as EmailSendResult;
}

async function handleDailySummaryEmail(
  body: EmailRequest,
  res: VercelResponse
): Promise<EmailSendResult> {
  if (!body.to || !body.summary) {
    badRequest(res, 'Campos "to" e "summary" são obrigatórios');
    return { success: false, error: 'Campos "to" e "summary" são obrigatórios' };
  }
  return sendWithRetry(() =>
    sendDailySummaryEmail(body.to as string, body.summary)
  ) as unknown as EmailSendResult;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth via token header
  if (!requireApiKey(req, res, "EMAIL_API_KEY")) return;

  // Rate limiting by IP
  const clientIP = getClientIP(req);
  const rateLimitPassed = await applyEmailRateLimit(clientIP, res);
  if (!rateLimitPassed) return;

  // Apenas POST permitido
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = EmailUnion.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.format() });
    }
    const body: EmailRequest = parsed.data;

    const handlers: Record<EmailRequest["type"], (b: EmailRequest) => Promise<EmailSendResult>> = {
      test: (b) => handleTestEmail(b, res),
      notification: (b) => handleNotificationEmail(b, res),
      urgent: (b) => handleUrgentEmail(b, res),
      daily_summary: (b) => handleDailySummaryEmail(b, res),
    };

    const handlerFn = handlers[body.type];
    if (!handlerFn) {
      return badRequest(
        res,
        `Tipo de email inválido: ${String(body.type)}. Use: test, notification, urgent, daily_summary`
      );
    }

    const result = await handlerFn(body);
    if (!result.success) {
      // Se algum handler já respondeu com 400, não forçar 500.
      // Retornamos aqui para evitar double-send.
      if (res.writableEnded) return;
      return serverError(res, result.error || "Erro ao enviar email");
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      message: `Email de tipo "${String(body.type)}" enviado com sucesso`,
    });
  } catch (error) {
    console.error("Erro no endpoint de emails:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}

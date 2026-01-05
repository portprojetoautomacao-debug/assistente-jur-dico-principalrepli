import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireApiKey } from "./lib/auth";
import {
  sendDailySummaryEmail,
  sendEmail,
  sendNotificationEmail,
  sendUrgentDeadlineAlert,
} from "./lib/email-service";
import { rateLimitMiddleware } from "./lib/rate-limit.js";
import { retryWithBackoff } from "./lib/retry";
import { escapeHtml } from "./lib/sanitize";
import { withTimeout } from "./lib/timeout";
import { EmailRequest, EmailUnion } from "./lib/validation";

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
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth via token header
  if (!requireApiKey(req, res, "EMAIL_API_KEY")) return;

  // Rate limiting by IP
  const clientIP =
    (req.headers["x-forwarded-for"] as string | undefined) ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown";
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
    return res.status(429).json({ error: rl.error || "Rate limit exceeded" });
  }
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

    let result;

    switch (body.type) {
      case "test":
        // Email de teste
        if (!body.to) {
          return res.status(400).json({ error: 'Campo "to" é obrigatório' });
        }
        result = await retryWithBackoff(
          () =>
            withTimeout(
              30000,
              sendEmail({
                to: body.to,
                subject: body.subject || "Email de Teste - Assistente Jurídico",
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
        break;

      case "notification": {
        // Email de notificação
        if (!body.to || !body.subject || !body.message) {
          return res.status(400).json({
            error: 'Campos "to", "subject" e "message" são obrigatórios',
          });
        }
        // sanitize subject/message
        const subject = escapeHtml(body.subject);
        const message = escapeHtml(body.message);
        const actionUrl = body.actionUrl;
        result = await retryWithBackoff(
          () =>
            withTimeout(
              30000,
              sendNotificationEmail(body.to as string, subject, message, actionUrl)
            ),
          3,
          200
        );
        break;
      }

      case "urgent":
        // Alerta urgente de prazo
        if (!body.to || !body.processNumber || !body.deadline) {
          return res.status(400).json({
            error: 'Campos "to", "processNumber" e "deadline" são obrigatórios',
          });
        }
        result = await retryWithBackoff(
          () =>
            withTimeout(
              30000,
              sendUrgentDeadlineAlert(
                body.to as string,
                escapeHtml(body.processNumber),
                escapeHtml(body.deadline),
                "Manifestação Processual"
              )
            ),
          3,
          200
        );
        break;

      case "daily_summary":
        // Resumo diário
        if (!body.to || !body.summary) {
          return res.status(400).json({
            error: 'Campos "to" e "summary" são obrigatórios',
          });
        }
        result = await retryWithBackoff(
          () => withTimeout(30000, sendDailySummaryEmail(body.to as string, body.summary)),
          3,
          200
        );
        break;

      default:
        return res.status(400).json({
          error: `Tipo de email inválido: ${body.type as string}. Use: test, notification, urgent, daily_summary`,
        });
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: `Email de tipo "${body.type as string}" enviado com sucesso`,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: "Erro ao enviar email",
      });
    }
  } catch (error) {
    console.error("Erro no endpoint de emails:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}

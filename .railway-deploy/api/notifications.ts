/**
 * API de Notificações
 *
 * Endpoints:
 * - GET /api/notifications - Lista notificações pendentes
 * - POST /api/notifications/send - Envia notificação (email/webhook)
 * - POST /api/notifications/webhook - Configura webhook externo
 * - POST /api/notifications/process - Processa fila de notificações
 */

import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Get color based on notification priority
 */
function getPriorityColor(priority: string): string {
  if (priority === "urgent") return "#ff0000";
  if (priority === "high") return "#ff9900";
  return "#36a64f";
}

// Constantes
const KV_KEYS = {
  NOTIFICATION_QUEUE: "notification-queue",
  NOTIFICATION_SETTINGS: "notification-settings",
  NOTIFICATION_LOG: "notification-log",
  WEBHOOKS: "configured-webhooks",
} as const;

// Tipos
interface Notification {
  id: string;
  type: "new_publication" | "deadline_reminder" | "system_alert" | "custom";
  title: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  recipientEmail?: string;
  recipientWebhook?: string;
  metadata?: {
    publicationId?: string;
    lawyerId?: string;
    processNumber?: string;
    tribunal?: string;
    [key: string]: unknown;
  };
  status: "pending" | "sent" | "failed";
  attempts: number;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  type: "slack" | "discord" | "teams" | "generic";
  enabled: boolean;
  events: string[];
  secret?: string;
  createdAt: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  webhookEnabled: boolean;
  emailFrom?: string;
  emailSmtpHost?: string;
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  teamsWebhookUrl?: string;
  minPriority: "low" | "normal" | "high" | "urgent";
}

interface SendResult {
  channel: string;
  success: boolean;
  error?: string;
}

// Redis client
async function getKv(): Promise<Redis> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis not configured");
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
  });
}

// Gera ID único
// Usa crypto.randomUUID() para geração segura de IDs
function generateId(): string {
  return `notif_${Date.now()}_${crypto.randomUUID().split("-")[0]}`;
}

// Mapas de prioridade
const PRIORITY_EMOJI = {
  low: "ℹ️",
  normal: "📢",
  high: "⚠️",
  urgent: "🚨",
} as const;

const PRIORITY_COLOR_HEX = {
  low: "808080",
  normal: "00ff00",
  high: "ffa500",
  urgent: "ff0000",
} as const;

const PRIORITY_COLOR_INT = {
  low: 0x808080,
  normal: 0x00ff00,
  high: 0xffa500,
  urgent: 0xff0000,
} as const;

const PRIORITY_ORDER = ["low", "normal", "high", "urgent"] as const;

/**
 * Formata campos de metadata para exibição
 */
function formatMetadataFields(
  metadata: Record<string, unknown>
): Array<{ name: string; value: string; inline?: boolean }> {
  return Object.entries(metadata)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1).replaceAll(/([A-Z])/g, " $1"),
      value: String(v),
      inline: true,
    }));
}

/**
 * Formata campos de metadata para formato "title/value"
 */
function formatMetadataFieldsAlt(
  metadata: Record<string, unknown>
): Array<{ title: string; value: string; short?: boolean }> {
  return Object.entries(metadata)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => ({
      title: k.charAt(0).toUpperCase() + k.slice(1).replaceAll(/([A-Z])/g, " $1"),
      value: String(v),
      short: true,
    }));
}

// Envia webhook para Slack
async function sendSlackWebhook(webhookUrl: string, notification: Notification): Promise<boolean> {
  try {
    const payload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${PRIORITY_EMOJI[notification.priority]} ${notification.title}`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: notification.message,
          },
        },
      ],
      attachments: notification.metadata
        ? [
            {
              color: getPriorityColor(notification.priority),
              fields: formatMetadataFieldsAlt(notification.metadata),
            },
          ]
        : undefined,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("[Notification] Slack webhook error:", error);
    return false;
  }
}

// Envia webhook para Discord
async function sendDiscordWebhook(
  webhookUrl: string,
  notification: Notification
): Promise<boolean> {
  try {
    const payload = {
      embeds: [
        {
          title: notification.title,
          description: notification.message,
          color: PRIORITY_COLOR_INT[notification.priority],
          timestamp: new Date().toISOString(),
          fields: notification.metadata ? formatMetadataFields(notification.metadata) : [],
          footer: {
            text: "Assistente Jurídico PJe",
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("[Notification] Discord webhook error:", error);
    return false;
  }
}

// Envia webhook para Microsoft Teams
async function sendTeamsWebhook(webhookUrl: string, notification: Notification): Promise<boolean> {
  try {
    const payload = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      themeColor: PRIORITY_COLOR_HEX[notification.priority],
      summary: notification.title,
      sections: [
        {
          activityTitle: notification.title,
          activitySubtitle: new Date().toLocaleString("pt-BR"),
          text: notification.message,
          facts: notification.metadata
            ? Object.entries(notification.metadata)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => ({
                  name: k.charAt(0).toUpperCase() + k.slice(1).replaceAll(/([A-Z])/g, " $1"),
                  value: String(v),
                }))
            : [],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("[Notification] Teams webhook error:", error);
    return false;
  }
}

// Envia webhook genérico
async function sendGenericWebhook(
  webhookUrl: string,
  notification: Notification,
  secret?: string
): Promise<boolean> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (secret) {
      // Simple HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(JSON.stringify(notification))
      );
      headers["X-Signature"] = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        event: notification.type,
        timestamp: new Date().toISOString(),
        data: notification,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[Notification] Generic webhook error:", error);
    return false;
  }
}

// Envia email via Resend API (se configurado)
async function sendEmail(
  notification: Notification,
  settings: NotificationSettings
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey || !notification.recipientEmail) {
    console.log("[Notification] Email skipped - no API key or recipient");
    return false;
  }

  try {
    const htmlContent = buildEmailHtml(notification);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: settings.emailFrom || "Assistente Juridico <noreply@resend.dev>",
        to: notification.recipientEmail,
        subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
        html: htmlContent,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[Notification] Email error:", error);
    return false;
  }
}

/**
 * Constrói HTML do email de notificação
 */
function buildEmailHtml(notification: Notification): string {
  const metadataHtml = notification.metadata
    ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">Detalhes:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          ${Object.entries(notification.metadata)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
            .join("")}
        </ul>
      </div>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${notification.title}</h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">${notification.message}</p>
      ${metadataHtml}
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px;">
        Enviado pelo Assistente Jurídico PJe
      </p>
    </div>
  `;
}

/**
 * Envia para um webhook específico baseado no tipo
 */
async function sendToWebhook(webhook: WebhookConfig, notification: Notification): Promise<boolean> {
  switch (webhook.type) {
    case "slack":
      return sendSlackWebhook(webhook.url, notification);
    case "discord":
      return sendDiscordWebhook(webhook.url, notification);
    case "teams":
      return sendTeamsWebhook(webhook.url, notification);
    default:
      return sendGenericWebhook(webhook.url, notification, webhook.secret);
  }
}

/**
 * Verifica se notificação deve ser enviada baseado na prioridade
 */
function shouldSendNotification(notificationPriority: string, minPriority: string): boolean {
  const notifPriorityIndex = PRIORITY_ORDER.indexOf(
    notificationPriority as (typeof PRIORITY_ORDER)[number]
  );
  const minPriorityIndex = PRIORITY_ORDER.indexOf(minPriority as (typeof PRIORITY_ORDER)[number]);
  return notifPriorityIndex >= minPriorityIndex;
}

/**
 * Handler GET /api/notifications - Lista notificações
 */
async function handleListNotifications(kv: Redis, res: VercelResponse): Promise<void> {
  const queue = (await kv.get<Notification[]>(KV_KEYS.NOTIFICATION_QUEUE)) || [];
  const settings = await kv.get<NotificationSettings>(KV_KEYS.NOTIFICATION_SETTINGS);
  const webhooks = (await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS)) || [];

  res.status(200).json({
    success: true,
    notifications: queue.slice(0, 50),
    pendingCount: queue.filter((n) => n.status === "pending").length,
    totalCount: queue.length,
    settings: settings || {
      emailEnabled: false,
      webhookEnabled: true,
      minPriority: "normal",
    },
    webhooks: webhooks.map((w) => ({ ...w, secret: undefined })),
  });
}

/**
 * Handler POST /api/notifications/send - Envia notificação
 */
async function handleSendNotification(
  kv: Redis,
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const { type, title, message, priority, recipientEmail, metadata } = req.body;

  if (!title || !message) {
    res.status(400).json({ error: "title and message required" });
    return;
  }

  const finalRecipientEmail = recipientEmail || process.env.NOTIFICATION_EMAIL;
  const notification: Notification = {
    id: generateId(),
    type: type || "custom",
    title,
    message,
    priority: priority || "normal",
    recipientEmail: finalRecipientEmail,
    metadata,
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  const settings = (await kv.get<NotificationSettings>(KV_KEYS.NOTIFICATION_SETTINGS)) || {
    emailEnabled: false,
    webhookEnabled: true,
    minPriority: "normal",
  };

  if (!shouldSendNotification(notification.priority, settings.minPriority)) {
    res.status(200).json({
      success: true,
      message: "Notification skipped due to priority threshold",
      notification,
    });
    return;
  }

  const results = await sendNotificationToChannels(notification, settings, kv);

  notification.status = results.some((r) => r.success) ? "sent" : "failed";
  notification.sentAt = notification.status === "sent" ? new Date().toISOString() : undefined;
  notification.attempts = 1;

  const queue = (await kv.get<Notification[]>(KV_KEYS.NOTIFICATION_QUEUE)) || [];
  queue.unshift(notification);
  await kv.set(KV_KEYS.NOTIFICATION_QUEUE, queue.slice(0, 500));

  res.status(200).json({ success: true, notification, results });
}

/**
 * Envia notificação para todos os canais configurados
 */
async function sendNotificationToChannels(
  notification: Notification,
  settings: NotificationSettings,
  kv: Redis
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  const webhooks = (await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS)) || [];

  if (settings.webhookEnabled) {
    for (const webhook of webhooks.filter((w) => w.enabled)) {
      try {
        const success = await sendToWebhook(webhook, notification);
        results.push({ channel: webhook.name, success });
      } catch (e) {
        results.push({ channel: webhook.name, success: false, error: String(e) });
      }
    }
  }

  if (settings.emailEnabled && notification.recipientEmail) {
    const emailSuccess = await sendEmail(notification, settings);
    results.push({ channel: "email", success: emailSuccess });
  }

  return results;
}

/**
 * Handler POST /api/notifications/webhook - Configura webhook
 */
async function handleCreateWebhook(
  kv: Redis,
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const { name, url, type, events, secret } = req.body;

  if (!name || !url || !type) {
    res.status(400).json({ error: "name, url and type required" });
    return;
  }

  const webhook: WebhookConfig = {
    id: generateId(),
    name,
    url,
    type,
    enabled: true,
    events: events || ["all"],
    secret,
    createdAt: new Date().toISOString(),
  };

  const webhooks = (await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS)) || [];
  webhooks.push(webhook);
  await kv.set(KV_KEYS.WEBHOOKS, webhooks);

  res.status(201).json({
    success: true,
    webhook: { ...webhook, secret: undefined },
  });
}

/**
 * Handler DELETE /api/notifications/webhook/:id - Remove webhook
 */
async function handleDeleteWebhook(
  kv: Redis,
  webhookId: string,
  res: VercelResponse
): Promise<void> {
  const webhooks = (await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS)) || [];
  const filtered = webhooks.filter((w) => w.id !== webhookId);

  if (filtered.length === webhooks.length) {
    res.status(404).json({ error: "Webhook not found" });
    return;
  }

  await kv.set(KV_KEYS.WEBHOOKS, filtered);
  res.status(200).json({ success: true });
}

/**
 * Handler PUT /api/notifications/settings - Atualiza configurações
 */
async function handleUpdateSettings(
  kv: Redis,
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const settings = req.body as Partial<NotificationSettings>;

  const current = (await kv.get<NotificationSettings>(KV_KEYS.NOTIFICATION_SETTINGS)) || {};
  const updated = { ...current, ...settings };

  await kv.set(KV_KEYS.NOTIFICATION_SETTINGS, updated);

  res.status(200).json({ success: true, settings: updated });
}

/**
 * Handler POST /api/notifications/test - Testa notificação
 */
async function handleTestNotification(
  kv: Redis,
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const { webhookId } = req.body;

  const webhooks = (await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS)) || [];
  const webhook = webhookId
    ? webhooks.find((w) => w.id === webhookId)
    : webhooks.find((w) => w.enabled);

  if (!webhook) {
    res.status(404).json({ error: "No webhook configured" });
    return;
  }

  const testNotification: Notification = {
    id: generateId(),
    type: "system_alert",
    title: "🧪 Teste de Notificação",
    message:
      "Esta é uma notificação de teste do Assistente Jurídico PJe. Se você recebeu esta mensagem, as notificações estão configuradas corretamente!",
    priority: "normal",
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
    metadata: {
      source: "test",
      timestamp: new Date().toISOString(),
    },
  };

  const success = await sendToWebhook(webhook, testNotification);

  res.status(200).json({
    success,
    message: success ? "Test notification sent successfully" : "Failed to send test notification",
    webhook: { name: webhook.name, type: webhook.type },
  });
}

// ===== Route Matching helpers (reduces S3776 Cognitive Complexity) =====

type RouteHandler = (
  kv: Redis,
  req: VercelRequest,
  res: VercelResponse
) => Promise<VercelResponse | void>;

interface RouteConfig {
  method: string;
  pattern: string | ((path: string) => boolean);
  handler: RouteHandler;
  extractParams?: (path: string) => Record<string, string>;
}

const ROUTES: RouteConfig[] = [
  {
    method: "GET",
    pattern: "",
    handler: (kv, _req, res) => handleListNotifications(kv, res),
  },
  {
    method: "POST",
    pattern: "/send",
    handler: handleSendNotification,
  },
  {
    method: "POST",
    pattern: "/webhook",
    handler: handleCreateWebhook,
  },
  {
    method: "DELETE",
    pattern: (path) => path.startsWith("/webhook/"),
    handler: async (kv, _req, res) => {
      const url = new URL(_req.url || "", `http://${_req.headers.host}`);
      const path = url.pathname.replaceAll("/api/notifications", "");
      const webhookId = path.replaceAll("/webhook/", "");
      return handleDeleteWebhook(kv, webhookId, res);
    },
  },
  {
    method: "PUT",
    pattern: "/settings",
    handler: handleUpdateSettings,
  },
  {
    method: "POST",
    pattern: "/test",
    handler: handleTestNotification,
  },
];

function matchRoute(method: string, path: string): RouteConfig | undefined {
  return ROUTES.find((route) => {
    if (route.method !== method) return false;
    if (typeof route.pattern === "string") return route.pattern === path;
    return route.pattern(path);
  });
}

function setupCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// Handler principal
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setupCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const kv = await getKv();
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const path = url.pathname.replaceAll("/api/notifications", "");

    const route = matchRoute(req.method || "", path);
    if (route) {
      return route.handler(kv, req, res);
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    console.error("[Notifications API] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

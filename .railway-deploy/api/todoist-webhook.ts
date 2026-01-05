/**
 * Todoist Webhook Handler
 *
 * Endpoint para receber webhooks do Todoist e processar eventos
 * Documentação: https://developer.todoist.com/sync/v9/#webhooks
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
// DESABILITADO (modo manutenção): import { TodoistAgent } from "@/lib/agents/todoist-agent";

/**
 * Interface para eventos do Todoist Webhook
 */
interface TodoistWebhookPayload {
  event_name: string;
  event_data: {
    id: string;
    content?: string;
    description?: string;
    due?: {
      date: string;
      datetime?: string;
      timezone?: string;
    };
    priority?: number;
    labels?: string[];
    project_id?: string;
    parent_id?: string;
    item_id?: string; // Para comentários
    task_id?: string; // Para comentários
  };
  user_id: string;
  initiator?: {
    id: string;
    email?: string;
    full_name?: string;
  };
}

/**
 * Verifica se o webhook é válido usando HMAC SHA256
 * Todoist assina payloads com TODOIST_WEBHOOK_SECRET
 * Ref: https://developer.todoist.com/sync/v9/#webhooks
 */
function validateWebhook(req: VercelRequest): boolean {
  // Validação HMAC para produção
  // Algoritmo:
  // 1. Extrair assinatura do header X-Todoist-Hmac-SHA256
  // 2. Calcular HMAC do body com TODOIST_WEBHOOK_SECRET
  // 3. Comparar assinaturas usando crypto.timingSafeEqual (evita timing attack)
  // Exemplo:
  // const signature = req.headers['x-todoist-hmac-sha256'];
  // const calculatedHmac = crypto.createHmac('sha256', process.env.TODOIST_WEBHOOK_SECRET!)
  //   .update(JSON.stringify(req.body))
  //   .digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedHmac));
  
  // Validação básica temporária (user-agent)
  const userAgent = req.headers["user-agent"] || "";
  return userAgent.includes("Todoist") || process.env.NODE_ENV === "development";
}

/**
 * Handler principal do webhook Todoist
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed - use POST",
    });
  }

  try {
    // Validar webhook
    if (!validateWebhook(req)) {
      console.warn("⚠️ Webhook Todoist inválido recebido");
      return res.status(401).json({
        success: false,
        error: "Unauthorized webhook",
      });
    }

    // Parse do payload
    const payload = req.body as TodoistWebhookPayload;

    console.log("📨 Webhook Todoist recebido:", {
      event: payload.event_name,
      userId: payload.user_id,
      itemId: payload.event_data.id,
    });

    // Verificar se evento é suportado
    const supportedEvents = [
      "item:added",
      "item:updated",
      "item:completed",
      "item:uncompleted",
      "item:deleted",
      "note:added",
      "note:updated",
    ];

    if (!supportedEvents.includes(payload.event_name)) {
      console.log(`ℹ️ Evento ${payload.event_name} não suportado, ignorando`);
      return res.status(200).json({
        success: true,
        message: "Event ignored (not supported)",
      });
    }

    // Validar event_data
    if (!payload.event_data || typeof payload.event_data.id !== "string") {
      console.warn("⚠️ Webhook Todoist com event_data inválido:", payload.event_data);
      return res.status(400).json({ success: false, error: "Missing event_data.id" });
    }

    // Processar evento com o agente
    // DESABILITADO (modo manutenção): agent não disponível no build
    // const agent = new TodoistAgent();
    // Garantir que event_data.content esteja sempre definido (Tipo TodoistEventData exige content: string)
    // const eventData = {
    //   ...payload.event_data,
    //   content: payload.event_data.content ?? "",
    // } as const;
    // await agent.processWebhookEvent({ event_name: payload.event_name, event_data: eventData });

    // MAINTENANCE: Processamento desabilitado temporariamente (modo manutenção)
    // Para reativar:
    // 1. Descomentar as linhas acima (instanciação do agente + processamento)
    // 2. Verificar se TodoistAgent está importado: import { TodoistAgent } from '../src/lib/agents/todoist-agent'
    // 3. Testar localmente: curl -X POST http://localhost:5173/api/todoist-webhook -H "Content-Type: application/json" -d '{...}'
    // 4. Atualizar webhook no painel do Todoist com URL de produção
    console.log(`ℹ️  Webhook recebido mas não processado (modo manutenção): ${payload.event_name}`);

    // Log de auditoria
    console.log(`✅ Webhook Todoist registrado: ${payload.event_name}`);

    // Responder com sucesso
    return res.status(200).json({
      success: true,
      event: payload.event_name,
      processedAt: new Date().toISOString(),
      note: "Webhook registered but not processed (maintenance mode)",
    });
  } catch (error) {
    console.error("❌ Erro ao processar webhook Todoist:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Configuração do handler Vercel
 */
export const config = {
  api: {
    bodyParser: true,
  },
};

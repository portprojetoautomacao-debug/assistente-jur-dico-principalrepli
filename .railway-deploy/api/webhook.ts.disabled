/**
 * GitHub Webhook Handler
 * Processa eventos enviados pelo GitHub
 * 
 * Endpoint: /api/webhook
 * Configurado em: https://github.com/thiagobodevan-a11y/assistente-jurdico-p/settings/hooks
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

// Tipos de eventos que processamos
interface WebhookEvent {
  event: string;
  action?: string;
  ref?: string;
  number?: number;
  commits?: unknown[];
  workflow_run?: { name?: string; conclusion?: string };
  workflow_job?: { name?: string; conclusion?: string };
  deployment?: { environment?: string };
  deployment_status?: { state?: string };
  check_run?: { name?: string; conclusion?: string };
  repository?: {
    name: string;
    full_name: string;
  };
  sender?: {
    login: string;
  };
}

/**
 * Valida a assinatura do webhook do GitHub (se configurado)
 */
function validateSignature(
  payload: string,
  signature: string | undefined,
  secret: string | undefined
): boolean {
  if (!secret || !signature) {
    // Se não houver secret configurado, aceita o webhook
    return true;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Processa eventos específicos
 */
async function processEvent(event: string, payload: WebhookEvent): Promise<void> {
  console.log(`[Webhook] Processando evento: ${event}`);

  switch (event) {
    case 'push':
      console.log(`[Webhook] Push para: ${payload.ref}`);
      console.log(`[Webhook] Commits: ${payload.commits?.length || 0}`);
      break;

    case 'pull_request':
      console.log(`[Webhook] PR #${payload.number}: ${payload.action}`);
      break;

    case 'workflow_run':
      console.log(`[Webhook] Workflow: ${payload.workflow_run?.name} - ${payload.workflow_run?.conclusion}`);
      break;

    case 'workflow_job':
      console.log(`[Webhook] Job: ${payload.workflow_job?.name} - ${payload.workflow_job?.conclusion}`);
      break;

    case 'deployment':
      console.log(`[Webhook] Deployment: ${payload.deployment?.environment}`);
      break;

    case 'deployment_status':
      console.log(`[Webhook] Deployment Status: ${payload.deployment_status?.state}`);
      break;

    case 'check_run':
      console.log(`[Webhook] Check Run: ${payload.check_run?.name} - ${payload.check_run?.conclusion}`);
      break;

    case 'ping':
      console.log(`[Webhook] Ping recebido - Webhook ativo!`);
      break;

    default:
      console.log(`[Webhook] Evento não processado: ${event}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Este endpoint aceita apenas POST requests do GitHub'
    });
  }

  // Obtém o tipo de evento
  const event = req.headers['x-github-event'] as string;
  const signature = req.headers['x-hub-signature-256'] as string;
  const delivery = req.headers['x-github-delivery'] as string;

  if (!event) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Header X-GitHub-Event não encontrado'
    });
  }

  // Valida assinatura (se WEBHOOK_SECRET estiver configurado)
  const webhookSecret = process.env.WEBHOOK_SECRET?.trim();
  const payload = JSON.stringify(req.body);

  // DEBUG: Temporariamente desabilitando validação para testar
  if (!validateSignature(payload, signature, webhookSecret)) {
    console.error('[Webhook] Assinatura inválida!');
    console.error('[Webhook] DEBUG - Expected secret length:', webhookSecret?.length);
    console.error('[Webhook] DEBUG - Received signature:', signature);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Assinatura do webhook inválida'
    });
  } try {
    // Processa o evento
    await processEvent(event, req.body);

    // Log de sucesso
    console.log(`[Webhook] ✓ Evento processado: ${event} (delivery: ${delivery})`);

    // Retorna sucesso
    res.status(200).json({
      success: true,
      event,
      delivery,
      timestamp: new Date().toISOString(),
      message: 'Webhook processado com sucesso'
    });
  } catch (error) {
    console.error('[Webhook] Erro ao processar evento:', error);

    res.status(500).json({
      success: false,
      event,
      delivery,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
}

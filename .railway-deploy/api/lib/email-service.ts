// NOTA: Este arquivo usa stub temporário até instalar a dependência Resend
// Para ativar emails de produção:
// 1. Instalar: npm install resend
// 2. Descomentar: import { Resend } from 'resend';
// 3. Remover stub abaixo e usar: const resend = new Resend(process.env.RESEND_API_KEY!);
// 4. Configurar .env: RESEND_API_KEY=re_your_api_key
// import { Resend } from 'resend';

// Stub temporário até instalar resend
type ResendResponse = {
  data?: { id: string };
  error?: { message: string };
};

const resend = {
  emails: {
    send: async (_options: any): Promise<ResendResponse> => {
      console.warn("RESEND_API_KEY não configurada ou dependência resend não instalada");
      return {
        error: { message: "Resend não configurado. Instale com: npm install resend" },
      };
    },
  },
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Envia um email usando Resend
 * Usado pelos agentes para notificações, alertas e comunicações
 */
export async function sendEmail(options: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não configurada no Vercel");
    }

    const response = await resend.emails.send(options);

    if (response.error) {
      console.error("Erro ao enviar email:", response.error);
      return {
        success: false,
        error: response.error.message,
        messageId: null,
      };
    }

    console.log("Email enviado com sucesso:", response.data?.id);
    return {
      success: true,
      messageId: response.data?.id,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na função sendEmail:", errorMessage);
    return {
      success: false,
      error: errorMessage,
      messageId: null,
    };
  }
}

/**
 * Envia email de notificação para operador
 * Usado para alertas de prazos, novas intimações, etc.
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string,
  actionUrl?: string
) {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1e88e5;">${subject}</h2>
          <p>${message}</p>
          ${
            actionUrl
              ? `<p style="margin-top: 20px;">
                <a href="${actionUrl}" style="background-color: #1e88e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Ver Detalhes
                </a>
              </p>`
              : ""
          }
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
          <p style="font-size: 12px; color: #666;">
            Você recebeu este email do Assistente Jurídico PJe.
            <br />
            <a href="https://assistente-juridico-github.vercel.app/preferences" style="color: #1e88e5; text-decoration: none;">
              Gerenciar preferências de notificação
            </a>
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    tags: [{ name: "tipo", value: "notificacao" }],
  });
}

/**
 * Envia email de alerta urgente para deadline
 * Usado quando há prazos críticos (menos de 24h)
 */
export async function sendUrgentDeadlineAlert(
  to: string,
  processNumber: string,
  deadline: string,
  type: string
) {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #d32f2f; border-radius: 8px; background-color: #fff3cd;">
          <h2 style="color: #d32f2f;">🚨 ALERTA URGENTE - PRAZO CRÍTICO</h2>
          <p style="font-size: 16px; font-weight: bold;">
            Processo: <code style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${processNumber}</code>
          </p>
          <p>
            <strong>Tipo:</strong> ${type}
            <br />
            <strong>Vencimento:</strong> ${deadline}
          </p>
          <p style="color: #d32f2f; font-weight: bold;">
            ⏰ AÇÃO REQUERIDA IMEDIATAMENTE
          </p>
          <p style="margin-top: 20px;">
            <a href="https://assistente-juridico-github.vercel.app/processes/${processNumber}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              Abrir Processo
            </a>
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
          <p style="font-size: 12px; color: #666;">
            Assistente Jurídico PJe - Alertas Automáticos
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `🚨 URGENTE: Prazo crítico - ${processNumber}`,
    html,
    tags: [
      { name: "tipo", value: "alerta_urgente" },
      { name: "processo", value: processNumber },
    ],
  });
}

/**
 * Envia email de resumo diário dos agentes
 * Usado para notificar operador do que foi processado
 */
export async function sendDailySummaryEmail(
  to: string,
  summary: {
    processesMonitored: number;
    deadlinesFound: number;
    documentsGenerated: number;
    errorsCount: number;
  }
) {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1e88e5;">📊 Resumo Diário - Assistente Jurídico</h2>
          <p>Bom dia! Aqui está o resumo da atividade de hoje:</p>

          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Processos Monitorados</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right; font-size: 18px; color: #1e88e5;">${summary.processesMonitored}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Prazos Identificados</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right; font-size: 18px; color: #d32f2f;">${summary.deadlinesFound}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Documentos Gerados</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right; font-size: 18px; color: #388e3c;">${summary.documentsGenerated}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Erros</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right; font-size: 18px; color: ${summary.errorsCount > 0 ? "#d32f2f" : "#388e3c"};">${summary.errorsCount}</td>
            </tr>
          </table>

          <p style="margin-top: 20px;">
            <a href="https://assistente-juridico-github.vercel.app/dashboard" style="background-color: #1e88e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Ver Dashboard Completo
            </a>
          </p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
          <p style="font-size: 12px; color: #666;">
            Relatório gerado automaticamente pelo Assistente Jurídico PJe
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `📊 Resumo Diário - ${new Date().toLocaleDateString("pt-BR")}`,
    html,
    tags: [{ name: "tipo", value: "resumo_diario" }],
  });
}

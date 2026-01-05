/**
 * Serviço de notificação por email
 *
 * TODO: Implementar integração com serviço de email (SendGrid, AWS SES, etc)
 */

interface EmailNotificacao {
  destinatario: string;
  assunto: string;
  processo: string;
  tribunal: string;
  tipo: string;
  teor: string;
  autor: string;
  reu: string;
}

/**
 * Envia email de notificação sobre nova publicação DJEN
 */
export async function enviarEmailNotificacao(dados: EmailNotificacao): Promise<void> {
  // TODO: Implementar envio real de email
  // Exemplos de serviços:
  // - SendGrid: https://sendgrid.com/
  // - AWS SES: https://aws.amazon.com/ses/
  // - Resend: https://resend.com/
  // - Postmark: https://postmarkapp.com/

  console.log(`📧 Email (simulado) enviado para: ${dados.destinatario}`);
  console.log(`   Assunto: ${dados.assunto}`);
  console.log(`   Processo: ${dados.processo}`);

  // Simulação de delay de envio
  await new Promise((resolve) => setTimeout(resolve, 500));
}

/**
 * Template HTML para o email
 */
function gerarTemplateEmail(dados: EmailNotificacao): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #1f2937; }
    .footer { text-align: center; color: #6b7280; margin-top: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Nova Publicação DJEN</h1>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Tribunal:</span>
        <span class="value">${dados.tribunal}</span>
      </div>
      <div class="field">
        <span class="label">Tipo:</span>
        <span class="value">${dados.tipo}</span>
      </div>
      <div class="field">
        <span class="label">Processo:</span>
        <span class="value">${dados.processo}</span>
      </div>
      <div class="field">
        <span class="label">Autor:</span>
        <span class="value">${dados.autor}</span>
      </div>
      <div class="field">
        <span class="label">Réu:</span>
        <span class="value">${dados.reu}</span>
      </div>
      <hr>
      <div class="field">
        <span class="label">Teor:</span>
        <div class="value" style="margin-top: 10px; white-space: pre-wrap;">
          ${dados.teor}
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Assistente Jurídico PJe - Sistema Automático de Monitoramento DJEN</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

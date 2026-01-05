// api/whatsapp/send.ts
// Wrapper que alinha com modelo de referência
// Integração com Evolution API mantendo interface compatível

import type { VercelRequest, VercelResponse } from "@vercel/node";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_INSTANCE_ID = process.env.EVOLUTION_INSTANCE_ID;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { numero, mensagem, msg } = req.body || {};
  const textoMensagem = mensagem || msg;

  if (!numero || !textoMensagem) {
    return res.status(400).json({
      ok: false,
      error: "Parâmetros 'numero' e 'mensagem' (ou 'msg') são obrigatórios.",
    });
  }

  // Modo simulado quando variáveis não estão configuradas
  if (!EVOLUTION_API_URL || !EVOLUTION_INSTANCE_ID || !EVOLUTION_API_KEY) {
    console.log(`[SIMULADO] WhatsApp para ${numero}: ${textoMensagem}`);
    
    return res.status(200).json({
      ok: true,
      simulated: true,
      message: "Evolution API não configurada. Mensagem simulada.",
      data: {
        numero,
        mensagem: textoMensagem,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Integração real com Evolution API
  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_ID}`;

    const evoRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: numero, // formato esperado: 5537999999999 (DDI+DDD+número)
        text: textoMensagem,
      }),
    });

    const data = await evoRes.json();

    if (!evoRes.ok) {
      console.error("[Evolution API] Erro:", data);
      return res.status(502).json({
        ok: false,
        error: "Erro ao enviar mensagem via Evolution API.",
        detalhes: data,
      });
    }

    return res.status(200).json({
      ok: true,
      simulated: false,
      result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[Evolution API] Exception:", error);
    return res.status(500).json({
      ok: false,
      error: "Erro inesperado ao contatar Evolution API.",
      message: error.message,
    });
  }
}

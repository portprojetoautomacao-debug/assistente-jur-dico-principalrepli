// api/pje.ts
// Wrapper endpoint que alinha com modelo de referência
// Delega para /api/legal-services internamente

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const numero =
    (req.method === "GET" ? req.query.numero : req.body?.numero) || "";

  if (!numero || typeof numero !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Parâmetro 'numero' do processo é obrigatório.",
    });
  }

  try {
    // Delega para implementação interna (legal-services)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/legal-services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "consultar-processo",
        numero,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        ok: false,
        error: errorData.error || "Erro ao consultar processo",
        detalhes: errorData,
      });
    }

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      processo: data.processo || data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[api/pje] Erro:", error);
    return res.status(500).json({
      ok: false,
      error: "Erro ao consultar processo",
      message: error.message,
    });
  }
}

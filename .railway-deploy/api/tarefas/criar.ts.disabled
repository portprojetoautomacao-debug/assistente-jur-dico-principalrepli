// api/tarefas/criar.ts
// Wrapper endpoint que alinha com modelo de referência
// Delega para /api/todoist internamente

import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Get base URL for internal API calls
 */
function getBaseUrl(req: VercelRequest): string {
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim().length > 0) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === 'production' && req.headers.host) {
    return `https://${req.headers.host}`;
  }
  return 'http://localhost:3000';
}

interface CreateTaskRequestBody {
  descricao?: string
  dueDate?: string
  priority?: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { descricao, dueDate, priority }: CreateTaskRequestBody = (req.body as CreateTaskRequestBody) || {}

  if (!descricao || typeof descricao !== 'string') {
    return res.status(400).json({
      ok: false,
      error: "Parâmetro 'descricao' é obrigatório e deve ser texto."
    })
  }

  try {
    // Descobre baseUrl para chamar o próprio backend
    const baseUrl = getBaseUrl(req);

    const response = await fetch(`${baseUrl}/api/todoist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Caller': 'api/tarefas/criar'
      },
      body: JSON.stringify({
        action: 'create-task',
        descricao,
        dueDate: dueDate || undefined,
        priority: priority ?? 1
      })
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string;[key: string]: unknown }

      return res.status(response.status).json({
        ok: false,
        error: errorData.error || 'Erro ao criar tarefa',
        detalhes: errorData
      })
    }

    const data = (await response.json()) as {
      tarefa?: { id?: string;[key: string]: unknown }
      id?: string
      [key: string]: unknown
    }

    return res.status(200).json({
      ok: true,
      tarefa: data.tarefa || data,
      id: data.id || data.tarefa?.id,
      timestamp: new Date().toISOString()
    })
  } catch (err: unknown) {

    console.error('[api/tarefas/criar] Erro:', err)

    return res.status(500).json({
      ok: false,
      error: 'Erro ao criar tarefa',
      message: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}

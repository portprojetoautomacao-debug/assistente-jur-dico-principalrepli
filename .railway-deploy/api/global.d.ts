/**
 * API para gerenciar expedientes/publicações do DJEN
 *
 * Endpoints:
 * - GET  /api/expedientes           → Lista publicações/expedientes
 * - POST /api/expedientes/sync (*) → Força sincronização com DJEN (trigger manual)
 *
 * (*) Na Vercel o ideal é ter um arquivo separado /api/expedientes/sync.ts,
 * mas aqui mantive a checagem por URL/action pra compatibilizar com o código atual.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const KV_KEYS = {
  PUBLICATIONS: 'publications',
  LAST_CHECK: 'last-djen-check',
  MONITORED_LAWYERS: 'monitored-lawyers'
} as const

interface StoredPublication {
  id: string
  djenId?: number | string
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  meio?: string
  link?: string
  hash?: string
  lawyerId: string
  lawyerName: string
  lawyerOAB: string
  matchType: 'nome' | 'oab' | 'ambos'
  notified: boolean
  createdAt: string
}

interface MonitoredLawyer {
  id: string
  name: string
  oab: string
  email?: string
  enabled: boolean
  tribunals: string[]
}

// Redis singleton pra evitar abrir conexão nova a cada chamada
let _kvClient: Redis | null = null

async function getKv(): Promise<Redis> {
  if (_kvClient) return _kvClient

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis not configured')
  }

  _kvClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim()
  })

  return _kvClient
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const kv = await getKv()

    // =========================================
    // GET /api/expedientes
    // =========================================
    if (req.method === 'GET') {
      const { lawyerId, limit, status } = req.query

      let publications = (await kv.get<StoredPublication[]>(KV_KEYS.PUBLICATIONS)) ?? []

      // Filtro por advogado
      if (typeof lawyerId === 'string' && lawyerId.trim().length > 0) {
        publications = publications.filter(p => p.lawyerId === lawyerId)
      }

      // Filtro por status (unread = não notificado)
      if (status === 'unread') {
        publications = publications.filter(p => !p.notified)
      }

      // Ordena por criação mais recente
      publications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      // Limita resultados
      const maxResults =
        typeof limit === 'string' && !Number.isNaN(Number(limit))
          ? Number.parseInt(limit, 10)
          : 50

      publications = publications.slice(0, maxResults)

      const lastCheck = await kv.get<string>(KV_KEYS.LAST_CHECK)
      const lawyers =
        (await kv.get<MonitoredLawyer[]>(KV_KEYS.MONITORED_LAWYERS)) ?? []

      // Mapeia para formato de "expediente" usado no frontend
      const expedientes = publications.map(pub => ({
        id: pub.id,
        type: pub.tipo || 'Intimação',
        tipo: pub.tipo,
        content: pub.teor,
        teor: pub.teor,
        data: pub.data || pub.createdAt, // campo base de data
        receivedAt: pub.data || pub.createdAt,
        dataRecebimento: pub.data || pub.createdAt,
        analyzed: false, // análise ainda não feita pelo agente
        tribunal: pub.tribunal,
        numeroProcesso: pub.numeroProcesso,
        orgao: pub.orgao,
        lawyerName: pub.lawyerName,
        matchType: pub.matchType,
        source: 'DJEN',
        createdAt: pub.createdAt
      }))

      return res.status(200).json({
        success: true,
        expedientes,
        publications,
        count: publications.length,
        lastCheck,
        lawyersConfigured: lawyers.length,
        message:
          lawyers.length === 0
            ? 'Nenhum advogado configurado. Use POST /api/lawyers para adicionar.'
            : `${lawyers.length} advogado(s) monitorado(s)`
      })
    }

    // =========================================
    // POST /api/expedientes/sync (trigger manual)
    // (depende de como a rota está configurada na Vercel)
    // =========================================
    if (req.method === 'POST') {
      // duas formas de acionar:
      // 1) /api/expedientes/sync  → via URL
      // 2) /api/expedientes?action=sync → via query
      const action = typeof req.query.action === 'string' ? req.query.action : undefined
      const isSyncByAction = action === 'sync'
      const isSyncByPath = req.url?.includes('/sync')

      if (isSyncByAction || isSyncByPath) {
        const baseUrl =
          process.env.VERCEL_URL && process.env.VERCEL_URL.trim().length > 0
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NODE_ENV === 'production'
              ? `https://${req.headers.host}`
              : 'http://localhost:3000'

        const cronUrl = `${baseUrl}/api/cron?action=djen-monitor`

        const response = await fetch(cronUrl, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer manual-sync-token'
          }
        })

        const result = await response.json().catch(() => ({}))

        return res.status(200).json({
          success: true,
          message: 'Sincronização iniciada',
          result
        })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {

    console.error('[API Expedientes] Error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      hint:
        'Verifique se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estão configurados na Vercel'
    })
  }
}

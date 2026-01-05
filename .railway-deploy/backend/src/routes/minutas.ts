import { Request, Response, Router } from "express";
import pg from "pg";
import { validateBody, validateParams, validateQuery } from "../middleware/validation.js";
import {
  CreateMinutaSchema,
  MinutaIdParamSchema,
  MinutasQuerySchema,
  UpdateMinutaSchema,
} from "../schemas/minutas.schemas.js";

const router = Router();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Minuta {
  id: string;
  titulo: string;
  processId?: string;
  tipo: "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";
  conteudo: string;
  status: "rascunho" | "em-revisao" | "pendente-revisao" | "finalizada" | "arquivada";
  criadoEm: string;
  atualizadoEm: string;
  autor: string;
  googleDocsId?: string;
  googleDocsUrl?: string;
  ultimaSincronizacao?: string;
  criadoPorAgente?: boolean;
  agenteId?: string;
  templateId?: string;
  expedienteId?: string;
  variaveis?: Record<string, string>;
}

function rowToMinuta(row: any): Minuta {
  return {
    id: row.id,
    titulo: row.titulo,
    processId: row.process_id || undefined,
    tipo: row.tipo,
    conteudo: row.conteudo,
    status: row.status,
    criadoEm: row.criado_em?.toISOString() || new Date().toISOString(),
    atualizadoEm: row.atualizado_em?.toISOString() || new Date().toISOString(),
    autor: row.autor,
    googleDocsId: row.google_docs_id || undefined,
    googleDocsUrl: row.google_docs_url || undefined,
    ultimaSincronizacao: row.ultima_sincronizacao?.toISOString() || undefined,
    criadoPorAgente: row.criado_por_agente || false,
    agenteId: row.agente_id || undefined,
    templateId: row.template_id || undefined,
    expedienteId: row.expediente_id || undefined,
    variaveis: row.variaveis || {},
  };
}

router.get("/stats", async (req: Request, res: Response) => {
  // Forward to /stats/resumo logic or implement here
  // For now, let's just redirect or call the same logic.
  // Since I can't easily call the handler function if it's defined inline, I'll just redirect internally or copy logic.
  // Better to refactor the handler to a function.
  res.redirect("/api/minutas/stats/resumo");
});

router.get("/stats/resumo", async (_req: Request, res: Response) => {
  try {
    const totalResult = await pool.query("SELECT COUNT(*) as count FROM minutas");
    const total = parseInt(totalResult.rows[0].count);

    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count FROM minutas GROUP BY status
    `);
    const porStatus: Record<string, number> = {
      rascunho: 0,
      "em-revisao": 0,
      "pendente-revisao": 0,
      finalizada: 0,
      arquivada: 0,
    };
    statusResult.rows.forEach((row) => {
      porStatus[row.status] = parseInt(row.count);
    });

    const tipoResult = await pool.query(`
      SELECT tipo, COUNT(*) as count FROM minutas GROUP BY tipo
    `);
    const porTipo: Record<string, number> = {
      peticao: 0,
      contrato: 0,
      parecer: 0,
      recurso: 0,
      procuracao: 0,
      outro: 0,
    };
    tipoResult.rows.forEach((row) => {
      porTipo[row.tipo] = parseInt(row.count);
    });

    const agenteResult = await pool.query(`
      SELECT criado_por_agente, COUNT(*) as count FROM minutas GROUP BY criado_por_agente
    `);
    let criadasPorAgente = 0;
    let criadasManualmente = 0;
    agenteResult.rows.forEach((row) => {
      if (row.criado_por_agente) {
        criadasPorAgente = parseInt(row.count);
      } else {
        criadasManualmente = parseInt(row.count);
      }
    });

    const stats = {
      total,
      porStatus,
      porTipo,
      criadasPorAgente,
      criadasManualmente,
    };

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Minutas] Error getting stats:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar estatísticas",
    });
  }
});

router.get("/", validateQuery(MinutasQuerySchema), async (req: Request, res: Response) => {
  const { status, tipo, criadoPorAgente, processId, limit, offset } = req.query;

  try {
    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (status && typeof status === "string") {
      whereConditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (tipo && typeof tipo === "string") {
      whereConditions.push(`tipo = $${paramIndex++}`);
      params.push(tipo);
    }

    if (criadoPorAgente !== undefined) {
      whereConditions.push(`criado_por_agente = $${paramIndex++}`);
      params.push(criadoPorAgente);
    }

    if (processId && typeof processId === "string") {
      whereConditions.push(`process_id = $${paramIndex++}`);
      params.push(processId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM minutas ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const offsetNum = parseInt(offset as string) || 0;
    const limitNum = parseInt(limit as string) || 50;

    const result = await pool.query(
      `SELECT * FROM minutas ${whereClause} ORDER BY atualizado_em DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limitNum, offsetNum]
    );

    const minutas = result.rows.map(rowToMinuta);

    res.json({
      success: true,
      data: minutas,
      pagination: {
        total,
        offset: offsetNum,
        limit: limitNum,
        hasMore: offsetNum + limitNum < total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Minutas] Error listing minutas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao listar minutas",
    });
  }
});

router.post("/", validateBody(CreateMinutaSchema), async (req: Request, res: Response) => {
  const {
    titulo,
    processId,
    tipo,
    conteudo,
    status,
    autor,
    criadoPorAgente,
    agenteId,
    templateId,
    expedienteId,
    variaveis,
  } = req.body;

  if (!titulo || typeof titulo !== "string") {
    return res.status(400).json({
      success: false,
      error: "titulo é obrigatório",
    });
  }

  if (!conteudo || typeof conteudo !== "string") {
    return res.status(400).json({
      success: false,
      error: "conteudo é obrigatório",
    });
  }

  if (!autor || typeof autor !== "string") {
    return res.status(400).json({
      success: false,
      error: "autor é obrigatório",
    });
  }

  const validTipos = ["peticao", "contrato", "parecer", "recurso", "procuracao", "outro"];
  const validStatuses = ["rascunho", "em-revisao", "pendente-revisao", "finalizada", "arquivada"];

  if (tipo && !validTipos.includes(tipo)) {
    return res.status(400).json({
      success: false,
      error: `tipo inválido. Valores permitidos: ${validTipos.join(", ")}`,
    });
  }

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `status inválido. Valores permitidos: ${validStatuses.join(", ")}`,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO minutas (titulo, process_id, tipo, conteudo, status, autor, criado_por_agente, agente_id, template_id, expediente_id, variaveis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        titulo,
        processId || null,
        tipo || "peticao",
        conteudo,
        status || "rascunho",
        autor,
        criadoPorAgente || false,
        agenteId || null,
        templateId || null,
        expedienteId || null,
        JSON.stringify(variaveis || {}),
      ]
    );

    const minuta = rowToMinuta(result.rows[0]);

    console.log(`[Minutas] Created minuta: ${minuta.id} - ${minuta.titulo}`);

    res.status(201).json({
      success: true,
      data: minuta,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Minutas] Error creating minuta:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar minuta",
    });
  }
});

router.get("/:id", validateParams(MinutaIdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM minutas WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Minuta com id '${id}' não encontrada`,
      });
    }

    const minuta = rowToMinuta(result.rows[0]);

    res.json({
      success: true,
      data: minuta,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Minutas] Error getting minuta:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar minuta",
    });
  }
});

router.put(
  "/:id",
  validateParams(MinutaIdParamSchema),
  validateBody(UpdateMinutaSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const validTipos = ["peticao", "contrato", "parecer", "recurso", "procuracao", "outro"];
    const validStatuses = ["rascunho", "em-revisao", "pendente-revisao", "finalizada", "arquivada"];

    if (updates.tipo && !validTipos.includes(updates.tipo)) {
      return res.status(400).json({
        success: false,
        error: `tipo inválido. Valores permitidos: ${validTipos.join(", ")}`,
      });
    }

    if (updates.status && !validStatuses.includes(updates.status)) {
      return res.status(400).json({
        success: false,
        error: `status inválido. Valores permitidos: ${validStatuses.join(", ")}`,
      });
    }

    try {
      const existsResult = await pool.query("SELECT id FROM minutas WHERE id = $1", [id]);
      if (existsResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Minuta com id '${id}' não encontrada`,
        });
      }

      const immutableFields = ["id", "criadoEm", "criado_em"];
      immutableFields.forEach((field) => delete updates[field]);

      const fieldMapping: Record<string, string> = {
        titulo: "titulo",
        processId: "process_id",
        tipo: "tipo",
        conteudo: "conteudo",
        status: "status",
        autor: "autor",
        googleDocsId: "google_docs_id",
        googleDocsUrl: "google_docs_url",
        ultimaSincronizacao: "ultima_sincronizacao",
        criadoPorAgente: "criado_por_agente",
        agenteId: "agente_id",
        templateId: "template_id",
        expedienteId: "expediente_id",
        variaveis: "variaveis",
      };

      let setClauses: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMapping[key] || key;
        if (dbField && !immutableFields.includes(dbField)) {
          setClauses.push(`${dbField} = $${paramIndex++}`);
          if (dbField === "variaveis") {
            params.push(JSON.stringify(value));
          } else {
            params.push(value);
          }
        }
      }

      setClauses.push(`atualizado_em = NOW()`);

      if (setClauses.length === 1) {
        const result = await pool.query("SELECT * FROM minutas WHERE id = $1", [id]);
        const minuta = rowToMinuta(result.rows[0]);
        return res.json({
          success: true,
          data: minuta,
          timestamp: new Date().toISOString(),
        });
      }

      params.push(id);
      const result = await pool.query(
        `UPDATE minutas SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        params
      );

      const minuta = rowToMinuta(result.rows[0]);

      console.log(`[Minutas] Updated minuta: ${id}`);

      res.json({
        success: true,
        data: minuta,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Minutas] Error updating minuta:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao atualizar minuta",
      });
    }
  }
);

router.delete("/:id", validateParams(MinutaIdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM minutas WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Minuta com id '${id}' não encontrada`,
      });
    }

    console.log(`[Minutas] Deleted minuta: ${id}`);

    res.json({
      success: true,
      message: `Minuta '${id}' deletada com sucesso`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Minutas] Error deleting minuta:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar minuta",
    });
  }
});

router.post(
  "/:id/duplicar",
  validateParams(MinutaIdParamSchema),
  async (req: Request, res: Response) => {
    await duplicarMinuta(req, res);
  }
);

router.post(
  "/:id/duplicate",
  validateParams(MinutaIdParamSchema),
  async (req: Request, res: Response) => {
    await duplicarMinuta(req, res);
  }
);

async function duplicarMinuta(req: Request, res: Response) {
  const { id } = req.params;
  const { novoTitulo } = req.body;

  try {
    const existsResult = await pool.query("SELECT * FROM minutas WHERE id = $1", [id]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Minuta com id '${id}' não encontrada`,
      });
    }

    const original = existsResult.rows[0];

    const result = await pool.query(
      `INSERT INTO minutas (titulo, process_id, tipo, conteudo, status, autor, criado_por_agente, agente_id, template_id, expediente_id, variaveis)
       VALUES ($1, $2, $3, $4, 'rascunho', $5, false, NULL, $6, $7, $8)
       RETURNING *`,
      [
        novoTitulo || `${original.titulo} (cópia)`,
        original.process_id,
        original.tipo,
        original.conteudo,
        original.autor,
        original.template_id,
        original.expediente_id,
        JSON.stringify(original.variaveis || {}),
      ]
    );

    const duplicada = rowToMinuta(result.rows[0]);

    console.log(`[Minutas] Duplicated minuta: ${id} -> ${duplicada.id}`);

    res.status(201).json({
      success: true,
      data: duplicada,
      originalId: id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Minutas] Error duplicating minuta:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao duplicar minuta",
    });
  }
}

export default router;

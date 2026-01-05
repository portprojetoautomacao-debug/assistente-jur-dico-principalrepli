import { Router } from "express";
import { Pool } from "pg";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const status = req.query.status as string;

  try {
    let query = `
      SELECT 
        id,
        numero_processo as "numeroProcesso",
        tribunal,
        tipo,
        titulo,
        conteudo,
        data_disponibilizacao as "dataDisponibilizacao",
        nome_orgao as "nomeOrgao",
        autor,
        reu,
        advogado_autor as "advogadoAutor",
        advogado_reu as "advogadoReu",
        lawyer_name as "lawyerName",
        lido,
        arquivado,
        analyzed,
        priority,
        created_at as "createdAt"
      FROM expedientes
    `;

    const conditions: string[] = [];
    if (status === "unread") {
      conditions.push("lido = false");
    } else if (status === "archived") {
      conditions.push("arquivado = true");
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY data_disponibilizacao DESC, created_at DESC LIMIT $1`;

    const result = await pool.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expedientes:", error);
    res.status(500).json({ error: "Erro ao buscar expedientes" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { lido, arquivado, analyzed, priority } = req.body;

  try {
    const updates: string[] = [];
    const values: (string | boolean)[] = [];
    let paramIndex = 1;

    if (lido !== undefined) {
      updates.push(`lido = $${paramIndex++}`);
      values.push(lido);
    }
    if (arquivado !== undefined) {
      updates.push(`arquivado = $${paramIndex++}`);
      values.push(arquivado);
    }
    if (analyzed !== undefined) {
      updates.push(`analyzed = $${paramIndex++}`);
      values.push(analyzed);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE expedientes 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expediente não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating expediente:", error);
    res.status(500).json({ error: "Erro ao atualizar expediente" });
  }
});

export default router;

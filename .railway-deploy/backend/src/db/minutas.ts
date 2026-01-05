import crypto from "crypto";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface MinutaRecord {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: string;
  status: string;
  processId?: string;
  autor: string;
  googleDocsId?: string;
  googleDocsUrl?: string;
  criadoEm: string;
  atualizadoEm: string;
  criadoPorAgente?: boolean;
  agenteId?: string;
  templateId?: string;
  expedienteId?: string;
  variaveis?: Record<string, string>;
}

export async function inicializarTabelaMinutas() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS minutas (
      id UUID PRIMARY KEY,
      titulo TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'outro',
      status TEXT NOT NULL DEFAULT 'rascunho',
      process_id TEXT,
      autor TEXT NOT NULL DEFAULT 'Sistema',
      google_docs_id TEXT,
      google_docs_url TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      criado_por_agente BOOLEAN DEFAULT FALSE,
      agente_id TEXT,
      template_id TEXT,
      expediente_id TEXT,
      variaveis JSONB DEFAULT '{}'::jsonb
    );`
  );
}

function rowToMinuta(row: any): MinutaRecord {
  return {
    id: row.id,
    titulo: row.titulo,
    conteudo: row.conteudo,
    tipo: row.tipo,
    status: row.status,
    processId: row.process_id || undefined,
    autor: row.autor,
    googleDocsId: row.google_docs_id || undefined,
    googleDocsUrl: row.google_docs_url || undefined,
    criadoEm: row.criado_em?.toISOString() || new Date().toISOString(),
    atualizadoEm: row.atualizado_em?.toISOString() || new Date().toISOString(),
    criadoPorAgente: row.criado_por_agente || false,
    agenteId: row.agente_id || undefined,
    templateId: row.template_id || undefined,
    expedienteId: row.expediente_id || undefined,
    variaveis: row.variaveis || {},
  };
}

export async function createMinuta(data: {
  titulo: string;
  conteudo: string;
  tipo?: string;
  status?: string;
  processId?: string;
  autor?: string;
  variaveis?: Record<string, string>;
  criadoPorAgente?: boolean;
  agenteId?: string;
  templateId?: string;
  expedienteId?: string;
}): Promise<MinutaRecord> {
  const id = crypto.randomUUID();
  const tipo = data.tipo || "outro";
  const status = data.status || "rascunho";
  const autor = data.autor || "Sistema";

  const result = await pool.query(
    `INSERT INTO minutas (
      id, titulo, conteudo, tipo, status, process_id, autor, variaveis,
      criado_por_agente, agente_id, template_id, expediente_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      id,
      data.titulo,
      data.conteudo,
      tipo,
      status,
      data.processId || null,
      autor,
      data.variaveis ? JSON.stringify(data.variaveis) : "{}",
      data.criadoPorAgente ?? false,
      data.agenteId || null,
      data.templateId || null,
      data.expedienteId || null,
    ]
  );

  return rowToMinuta(result.rows[0]);
}

export async function getMinutaById(id: string): Promise<MinutaRecord | null> {
  const result = await pool.query(`SELECT * FROM minutas WHERE id = $1`, [id]);
  if (result.rowCount === 0) return null;
  return rowToMinuta(result.rows[0]);
}

export async function getAllMinutas(): Promise<MinutaRecord[]> {
  const result = await pool.query(`SELECT * FROM minutas ORDER BY atualizado_em DESC`);
  return result.rows.map(rowToMinuta);
}

export async function updateMinuta(
  id: string,
  data: Partial<{
    titulo: string;
    conteudo: string;
    tipo: string;
    status: string;
    processId: string;
    autor: string;
    variaveis: Record<string, string>;
    googleDocsId: string;
    googleDocsUrl: string;
    criadoPorAgente: boolean;
    agenteId: string;
    templateId: string;
    expedienteId: string;
  }>
): Promise<MinutaRecord | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const pushField = (column: string, value: any) => {
    fields.push(`${column} = $${idx}`);
    values.push(value);
    idx += 1;
  };

  if (data.titulo !== undefined) pushField("titulo", data.titulo);
  if (data.conteudo !== undefined) pushField("conteudo", data.conteudo);
  if (data.tipo !== undefined) pushField("tipo", data.tipo);
  if (data.status !== undefined) pushField("status", data.status);
  if (data.processId !== undefined) pushField("process_id", data.processId);
  if (data.autor !== undefined) pushField("autor", data.autor);
  if (data.variaveis !== undefined) pushField("variaveis", JSON.stringify(data.variaveis));
  if (data.googleDocsId !== undefined) pushField("google_docs_id", data.googleDocsId);
  if (data.googleDocsUrl !== undefined) pushField("google_docs_url", data.googleDocsUrl);
  if (data.criadoPorAgente !== undefined) pushField("criado_por_agente", data.criadoPorAgente);
  if (data.agenteId !== undefined) pushField("agente_id", data.agenteId);
  if (data.templateId !== undefined) pushField("template_id", data.templateId);
  if (data.expedienteId !== undefined) pushField("expediente_id", data.expedienteId);

  // Always touch atualizado_em
  fields.push(`atualizado_em = NOW()`);

  if (fields.length === 0) return getMinutaById(id);

  values.push(id);

  await pool.query(`UPDATE minutas SET ${fields.join(", ")} WHERE id = $${idx}`, values);

  return getMinutaById(id);
}

export async function deleteMinuta(id: string): Promise<void> {
  await pool.query(`DELETE FROM minutas WHERE id = $1`, [id]);
}

export async function closePool() {
  await pool.end();
}

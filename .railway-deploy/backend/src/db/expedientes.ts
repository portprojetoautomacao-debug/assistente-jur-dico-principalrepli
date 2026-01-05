import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

interface Expediente {
  id?: string;
  numeroProcesso: string;
  tribunal: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  dataDisponibilizacao: string;
  nomeOrgao: string;
  autor: string | null;
  reu: string | null;
  advogadoAutor: string | null;
  advogadoReu: string | null;
  lawyerName: string;
  lido?: boolean;
  arquivado?: boolean;
  analyzed?: boolean;
  priority?: string;
}

/**
 * Salva um expediente no banco de dados
 */
export async function salvarExpediente(expediente: Expediente): Promise<Expediente> {
  const query = `
    INSERT INTO expedientes (
      numero_processo,
      tribunal,
      tipo,
      titulo,
      conteudo,
      data_disponibilizacao,
      nome_orgao,
      autor,
      reu,
      advogado_autor,
      advogado_reu,
      lawyer_name,
      lido,
      arquivado,
      analyzed,
      priority
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING
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
      priority
  `;

  const values = [
    expediente.numeroProcesso,
    expediente.tribunal,
    expediente.tipo,
    expediente.titulo,
    expediente.conteudo,
    expediente.dataDisponibilizacao,
    expediente.nomeOrgao,
    expediente.autor,
    expediente.reu,
    expediente.advogadoAutor,
    expediente.advogadoReu,
    expediente.lawyerName,
    expediente.lido || false,
    expediente.arquivado || false,
    expediente.analyzed || false,
    expediente.priority || "high",
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error(`❌ Erro ao salvar expediente:`, error);
    throw error;
  }
}

/**
 * Cria a tabela de expedientes se não existir
 */
export async function inicializarTabelaExpedientes() {
  const query = `
    CREATE TABLE IF NOT EXISTS expedientes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      numero_processo VARCHAR(255) NOT NULL,
      tribunal VARCHAR(50),
      tipo VARCHAR(100),
      titulo TEXT,
      conteudo TEXT,
      data_disponibilizacao DATE,
      nome_orgao VARCHAR(255),
      autor TEXT,
      reu TEXT,
      advogado_autor TEXT,
      advogado_reu TEXT,
      lawyer_name VARCHAR(255),
      lido BOOLEAN DEFAULT false,
      arquivado BOOLEAN DEFAULT false,
      analyzed BOOLEAN DEFAULT false,
      priority VARCHAR(20) DEFAULT 'high',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_expedientes_numero_processo ON expedientes(numero_processo);
    CREATE INDEX IF NOT EXISTS idx_expedientes_tribunal ON expedientes(tribunal);
    CREATE INDEX IF NOT EXISTS idx_expedientes_data ON expedientes(data_disponibilizacao);
    CREATE INDEX IF NOT EXISTS idx_expedientes_lawyer ON expedientes(lawyer_name);
  `;

  try {
    await pool.query(query);
    console.log(`✅ Tabela expedientes inicializada`);
  } catch (error) {
    console.error(`❌ Erro ao criar tabela expedientes:`, error);
    throw error;
  }
}

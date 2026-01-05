/**
 * Testes de Integração - DJEN Scheduler
 *
 * ⚠️ REGRA DE ÉTICA: SEM MOCKS
 * Usa API DJEN real, PostgreSQL real, e IA Gemini real
 */

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shouldRun = process.env.ENABLE_DB_TEST === "true";
const describeFn = shouldRun ? describe : describe.skip;

describeFn("DJEN Scheduler - Integração Real", () => {
  let pool: Pool;
  let executarManualmente: (() => Promise<unknown>) | null = null;

  beforeAll(async () => {
    if (shouldRun) {
      // Import dinâmico evita falhar em ambientes onde o teste está skipado.
      // Além disso, o caminho relativo correto a partir de tests/integration é ../../backend/...
      const mod = await import("../../backend/src/services/djen-scheduler");
      executarManualmente = mod.executarManualmente as () => Promise<unknown>;
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });

    // Verificar conexão
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    console.log("✅ Conexão PostgreSQL estabelecida");
  });

  afterAll(async () => {
    await pool.end();
    console.log("🧹 Limpando dados de teste...");
    console.log("✅ Testes de integração concluídos");
  });

  it("deve executar scheduler manualmente e processar publicações reais", async () => {
    console.log("\n🧪 Testando execução manual do scheduler DJEN...");

    if (!executarManualmente) {
      throw new Error("executarManualmente não foi carregado");
    }

    // Executar scheduler
    const resultado = await executarManualmente();

    // Validações
    expect(resultado).toBeDefined();
    expect(resultado.sucesso).toBe(true);
    expect(typeof resultado.total).toBe("number");
    expect(typeof resultado.processadas).toBe("number");

    console.log(`📊 Resultado: ${resultado.processadas}/${resultado.total} processadas`);

    // Se houver publicações, validar se foram salvas no DB
    if (resultado.processadas > 0) {
      const client = await pool.connect();
      try {
        // Verificar processos criados
        const processos = await client.query(
          `SELECT * FROM processos
           WHERE notas LIKE '%Origem: DJEN%'
           AND created_at > NOW() - INTERVAL '1 hour'
           ORDER BY created_at DESC
           LIMIT 5`
        );

        console.log(`💾 ${processos.rows.length} processos encontrados no DB`);
        expect(processos.rows.length).toBeGreaterThan(0);

        // Validar estrutura do processo
        const processo = processos.rows[0];
        expect(processo.numero_cnj).toBeDefined();
        expect(processo.autor).toBeDefined();
        expect(processo.reu).toBeDefined();
        expect(processo.comarca).toBeDefined();

        console.log(`✅ Processo validado: ${processo.numero_cnj}`);

        // Verificar expedientes criados
        const expedientes = await client.query(
          `SELECT * FROM expedientes
           WHERE process_id = $1`,
          [processo.id]
        );

        expect(expedientes.rows.length).toBeGreaterThan(0);
        console.log(`📋 ${expedientes.rows.length} expedientes encontrados`);

        // Validar estrutura do expediente
        const expediente = expedientes.rows[0];
        expect(expediente.tipo).toBe("intimacao");
        expect(expediente.conteudo).toBeDefined();
        expect(expediente.lido).toBe(false);
        expect(expediente.priority).toBe("high");

        console.log(`✅ Expediente validado: ${expediente.titulo}`);
      } finally {
        client.release();
      }
    } else {
      console.log("ℹ️ Nenhuma publicação nova encontrada (normal)");
    }
  }, 120000); // Timeout de 2 minutos

  it("deve validar estrutura das tabelas PostgreSQL", async () => {
    console.log("\n🧪 Validando estrutura do banco de dados...");

    const client = await pool.connect();
    try {
      // Verificar tabela processos
      const processos = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'processos'
      `);

      const colunas = processos.rows.map((r) => r.column_name);
      expect(colunas).toContain("id");
      expect(colunas).toContain("numero_cnj");
      expect(colunas).toContain("autor");
      expect(colunas).toContain("reu");
      expect(colunas).toContain("comarca");

      console.log(`✅ Tabela 'processos' válida (${colunas.length} colunas)`);

      // Verificar tabela expedientes
      const expedientes = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'expedientes'
      `);

      const colunasExp = expedientes.rows.map((r) => r.column_name);
      expect(colunasExp).toContain("id");
      expect(colunasExp).toContain("process_id");
      expect(colunasExp).toContain("tipo");
      expect(colunasExp).toContain("conteudo");

      console.log(`✅ Tabela 'expedientes' válida (${colunasExp.length} colunas)`);
    } finally {
      client.release();
    }
  });

  it("deve verificar status do scheduler via API", async () => {
    console.log("\n🧪 Testando endpoint /api/djen/status...");

    const response = await fetch("http://localhost:3001/api/djen/status");
    const status = await response.json();

    expect(response.ok).toBe(true);
    expect(status.status).toBe("ativo");
    expect(status.horarios).toEqual(["01:00", "09:00"]);
    expect(status.advogadoPadrao.oab).toContain("/");

    console.log(`✅ Scheduler ativo: ${status.advogadoPadrao.nome}`);
  });
});

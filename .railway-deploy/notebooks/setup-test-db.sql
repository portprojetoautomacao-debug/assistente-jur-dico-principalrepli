-- Setup script para banco de teste PostgreSQL local
-- Execute manualmente: sudo -u postgres psql < setup-test-db.sql

-- Criar banco de teste
CREATE DATABASE assistente_juridico_test;

-- Conectar ao banco (executar separadamente após criar)
\c assistente_juridico_test

-- Criar schema de minutas
CREATE TABLE IF NOT EXISTS minutas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    process_id VARCHAR(100),
    tipo VARCHAR(50) NOT NULL,
    conteudo TEXT NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'rascunho',
    autor VARCHAR(100) NOT NULL,
    google_docs_id VARCHAR(255),
    google_docs_url TEXT,
    ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
    criado_por_agente BOOLEAN DEFAULT false,
    agente_id VARCHAR(100),
    template_id VARCHAR(100),
    expediente_id VARCHAR(100),
    variaveis JSONB DEFAULT '{}',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS djen_lawyers (
    id SERIAL PRIMARY KEY,
    numero_oab VARCHAR(20) NOT NULL,
    uf_oab VARCHAR(2) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(numero_oab, uf_oab)
);

CREATE TABLE IF NOT EXISTS djen_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_numero VARCHAR(100),
    data_publicacao DATE NOT NULL,
    tipo_publicacao VARCHAR(100),
    conteudo TEXT NOT NULL,
    tribunal VARCHAR(50),
    caderno VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS djen_scheduler_logs (
    id SERIAL PRIMARY KEY,
    execution_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status VARCHAR(50) NOT NULL,
    publications_found INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER
);

-- Inserir advogado padrão
INSERT INTO djen_lawyers (numero_oab, uf_oab, nome, enabled)
VALUES ('184404', 'MG', 'Thiago Bodevan Veiga', true)
ON CONFLICT (numero_oab, uf_oab) DO NOTHING;

-- Inserir minuta de exemplo
INSERT INTO minutas (titulo, tipo, conteudo, status, autor)
VALUES ('Petição de Teste', 'peticao', 'Conteúdo de exemplo', 'rascunho', 'Thiago Bodevan Veiga');

-- Mostrar tabelas criadas
\dt

-- Mostrar dados
SELECT 'Minutas:' as tabela, count(*) as registros FROM minutas
UNION ALL
SELECT 'Advogados:', count(*) FROM djen_lawyers
UNION ALL
SELECT 'Publicações:', count(*) FROM djen_publications
UNION ALL
SELECT 'Logs:', count(*) FROM djen_scheduler_logs;

CREATE TABLE IF NOT EXISTS minutas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  process_id TEXT,
  tipo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  autor TEXT NOT NULL,
  google_docs_id TEXT,
  google_docs_url TEXT,
  ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
  criado_por_agente BOOLEAN DEFAULT FALSE,
  agente_id TEXT,
  template_id TEXT,
  expediente_id TEXT,
  variaveis JSONB
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_minutas_status ON minutas(status);
CREATE INDEX IF NOT EXISTS idx_minutas_tipo ON minutas(tipo);
CREATE INDEX IF NOT EXISTS idx_minutas_autor ON minutas(autor);

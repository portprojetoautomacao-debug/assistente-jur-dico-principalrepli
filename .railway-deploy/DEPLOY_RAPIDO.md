# ?? DEPLOY LOCAL RÁPIDO - Assistente Jurídico PJe

## ? EXECUÇÃO RÁPIDA (3 passos)

### Passo 1: Executar Script Automático
```powershell
# Windows PowerShell (recomendado)
.\deploy-local.ps1

# OU Windows CMD
deploy-local.bat
```

### Passo 2: Configurar Credenciais
Edite o arquivo `.env` criado com suas chaves API:
- `VITE_GEMINI_API_KEY` - Chave do Google Gemini
- `UPSTASH_REDIS_REST_URL` - URL do Upstash Redis
- `UPSTASH_REDIS_REST_TOKEN` - Token do Upstash Redis
# AutoGen Orchestrator API Key
# Set a secure random key for multi-agent orchestration API
AUTOGEN_API_KEY=your-autogen-api-key-here

# Qdrant Vector Database (Cloud)
# URL for Qdrant Cloud instance
# Exemplo: https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333
VITE_QDRANT_URL=https://your-cluster-id.region.gcp.cloud.qdrant.io:6333
# API key for Qdrant authentication (obter em https://cloud.qdrant.io)
VITE_QDRANT_API_KEY=your-qdrant-api-key-here
# Collection name for vector storage
VITE_QDRANT_COLLECTION=legal_docs# ============================================
# QDRANT CLOUD - CONFIGURAÇÃO
# ============================================
# Cluster: cluster01
# Região: us-east4-0 (GCP)
# Tier: Free (1GB)

# URL do cluster (incluir porta :6333)
VITE_QDRANT_URL=https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333

# API Key (JWT)
VITE_QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.TqZHXs0l7tUQRRrKTI4EO44Yao5QXg2zosFL1pl8IJo

# Collection padrão
VITE_QDRANT_COLLECTION=legal_docs

# ============================================
# EXEMPLO DE USO (Python)
# ============================================
# from qdrant_client import QdrantClient
#
# qdrant_client = QdrantClient(
#     url="https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333", 
#     api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.TqZHXs0l7tUQRRrKTI4EO44Yao5QXg2zosFL1pl8IJo",
# )
#
# print(qdrant_client.get_collections())


# DSPy Bridge Service
# URL for DSPy bridge (use http://localhost:8765 for local)
VITE_DSPY_URL=http://localhost:8765
# API token for DSPy bridge (must match DSPY_API_TOKEN in bridge service)
VITE_DSPY_API_TOKEN=your-secure-random-token-here

# DSPy Bridge Configuration (for running the Python bridge service)
# Token for authentication (REQUIRED - set before starting bridge)
DSPY_API_TOKEN=your-secure-random-token-here
# Port for DSPy bridge service (default: 8765)
DSPY_PORT=8765
# Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
### Passo 3: Verificar Funcionamento
```powershell
# Verificar se tudo está OK
.\check-deploy.ps1
```

## ?? URLs de Acesso

Após o deploy bem-sucedido:
- **?? Aplicação**: http://localhost:5173
- **?? API Health**: http://localhost:5173/api/health
- **?? Preview**: http://localhost:4173 (use `npm run preview`)

## ?? O que o Script Faz

### ? Verificações Automáticas
- [x] Node.js 22.x instalado
- [x] npm funcionando
- [x] Arquivos do projeto presentes
- [x] Arquivo .env configurado

### ?? Instalação
- [x] Instalar todas as dependências npm
- [x] Verificar build completo
- [x] Iniciar servidor de desenvolvimento

### ?? Validações
- [x] Build sem erros
- [x] Servidor respondendo
- [x] API funcionando
- [x] Redis conectado (se configurado)

## ?? Problemas Comuns

### "Node.js não encontrado"
```bash
# Instale Node.js 22.x
# Download: https://nodejs.org/
```

### "Credenciais não configuradas"
```powershell
# Edite o arquivo .env
notepad .env
```

### "Build falha"
```bash
# Execute novamente
npm install
npm run build
```

### "Servidor não inicia"
```bash
# Verifique porta 5173 livre
# Execute: npm run dev
```

## ?? Suporte

- **?? Guia Completo**: `DEPLOY_LOCAL.md`
- **?? Troubleshooting**: `BUILD_GUIDE.md`
- **?? Scripts Disponíveis**:
  - `deploy-local.ps1` - Deploy completo (PowerShell)
  - `deploy-local.bat` - Deploy completo (CMD)
  - `check-deploy.ps1` - Verificar status

---

**?? Resultado**: Sistema rodando localmente em 5 minutos!
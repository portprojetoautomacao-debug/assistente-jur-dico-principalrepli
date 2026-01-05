# ?? Checklist de Configura��o do Qdrant

## Pr�-requisitos

- [x] Conta no Qdrant Cloud: https://cloud.qdrant.io/
- [ ] Cluster criado (Free tier: 1GB suficiente para come�ar)
- [ ] API Key copiada

---

## ?? Passos de Configura��o

### 1. Criar Cluster no Qdrant Cloud

1. Acesse: https://cloud.qdrant.io/
2. Clique em **"Create Cluster"**
3. Escolha:
   - **Region**: `us-east4-0` (GCP) - mais pr�ximo do Brasil
   - **Tier**: `Free` (1GB)
   - **Name**: `assistente-juridico-cluster`
4. Aguarde cria��o (~2 minutos)

### 2. Copiar Credenciais

Ap�s cria��o, copie:

- **Cluster URL**: `https://xxx.qdrant.cloud:6333`
- **API Key**: Clique em "API Keys" ? "Create API Key"

### 3. Configurar `.env`

Edite o arquivo `.env` e adicione:

```env
QDRANT_URL=https://sua-url-aqui.qdrant.cloud:6333
QDRANT_API_KEY=sua-api-key-aqui
QDRANT_COLLECTION_NAME=legal_docs
QDRANT_TIMEOUT=30000
```

### 4. Criar Collection

Execute o script de inicializa��o:

```bash
# Via Node.js
node scripts/init-qdrant-collection.js

# Ou via API REST direta
curl -X PUT 'https://sua-url.qdrant.cloud:6333/collections/legal_docs' \
  -H 'api-key: sua-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }'
```

### 5. Testar Conex�o

```bash
# Verificar se collection foi criada
curl 'https://sua-url.qdrant.cloud:6333/collections/legal_docs' \
  -H 'api-key: sua-api-key'

# Resposta esperada:
# {
#   "result": {
#     "status": "green",
#     "vectors_count": 0,
#     "points_count": 0
#   }
# }
```

---

## ?? Configura��o Avan�ada

### M�ltiplas Collections

Se voc� quiser separar por tipo de documento:

```env
QDRANT_COLLECTION_PRECEDENTES=precedentes_stf_stj
QDRANT_COLLECTION_PETICOES=peticoes_templates
QDRANT_COLLECTION_DOCUMENTOS=documentos_processuais
```

### Timeout Personalizado

Para documentos muito grandes (>1000 p�ginas):

```env
QDRANT_TIMEOUT=60000  # 60 segundos
```

---

## ? Valida��o da Configura��o

Rode o seguinte script para validar:

```typescript
// scripts/test-qdrant-connection.ts
import { createQdrantService } from "@/lib/qdrant-service";

const config = {
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
  collectionName: "legal_docs",
};

const service = createQdrantService(config);

if (service) {
  console.log("? Qdrant configurado corretamente!");
} else {
  console.error("? Configura��o incompleta. Verifique .env");
}
```

---

## ?? Monitoramento

### Dashboard Qdrant Cloud

Acesse: https://cloud.qdrant.io/clusters

Voc� ver�:

- **Vectors Count**: Quantos vetores est�o armazenados
- **Storage Used**: Espa�o usado (m�x 1GB no free tier)
- **API Requests**: N�mero de requisi��es

### Alertas Importantes

- ?? Se ultrapassar 900MB ? Limpar vetores antigos
- ?? Se taxa de erro > 5% ? Verificar API Key
- ?? Se lat�ncia > 500ms ? Considerar upgrade de tier

---

## ?? Seguran�a

### Prote��o da API Key

**N�O COMMITE** a API Key no Git:

```bash
# Verifique se .env est� no .gitignore
cat .gitignore | grep .env

# Se n�o estiver, adicione:
echo ".env" >> .gitignore
```

### Rota��o de API Keys

Recomendado a cada 90 dias:

1. Crie nova API Key no dashboard
2. Atualize `.env` com nova key
3. Teste aplica��o
4. Revogue key antiga no dashboard

---

## ?? Documenta��o de Refer�ncia

- **Qdrant Cloud**: https://qdrant.tech/documentation/cloud/
- **API REST**: https://qdrant.tech/documentation/interfaces/rest/
- **Pricing**: https://qdrant.tech/pricing/
- **Limits Free Tier**: 1GB storage, 100k vectors, 1M API calls/m�s

---

## ?? Troubleshooting

### Erro: "Collection not found"

```bash
# Recrie a collection
curl -X PUT 'https://sua-url.qdrant.cloud:6333/collections/legal_docs' \
  -H 'api-key: sua-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"vectors": {"size": 768, "distance": "Cosine"}}'
```

### Erro: "Unauthorized"

- Verifique se API Key est� correta no `.env`
- Teste a key no dashboard do Qdrant Cloud

### Erro: "Timeout"

- Aumente `QDRANT_TIMEOUT` no `.env`
- Verifique conex�o de internet
- Verifique se cluster est� online no dashboard

---

## ?? Pr�ximos Passos

Ap�s configura��o bem-sucedida:

1. [ ] Popular collection com dados iniciais (ver `ROADMAP_IMPLEMENTACAO_HIBRIDA.md`)
2. [ ] Integrar com agente de Pesquisa Jurisprudencial
3. [ ] Configurar busca h�brida (dense + sparse)
4. [ ] Monitorar uso e performance

**Documenta��o relacionada**:
- `ROADMAP_IMPLEMENTACAO_HIBRIDA.md` - Fase 2 (Integra��o de Retrieval)
- `MATRIZ_DECISAO_FRAMEWORKS.md` - Decis�o Qdrant vs ChromaDB
- `src/lib/qdrant-service.ts` - C�digo do servi�o

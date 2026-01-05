# ?? População Automatizada do Qdrant com DataJud

**Data**: 09/12/2024  
**Fonte de Dados**: API Pública DataJud (CNJ)  
**Status**: ? **Pronto para Uso**

---

## ?? **Visão Geral**

Sistema automatizado que popula o cluster Qdrant com **dados reais de tribunais brasileiros** sem necessidade de download manual de arquivos.

### **Fluxo de Dados**

```
???????????????????????
?  API DataJud (CNJ)  ?  ? Dados públicos de tribunais
???????????????????????
           ? HTTP GET
           ?
???????????????????????
?  dataJudService     ?  ? Busca processos/precedentes
???????????????????????
           ? Processos JSON
           ?
???????????????????????
?  Gemini Embedding   ?  ? Gera vetores (768 dim)
???????????????????????
           ? Embeddings
           ?
???????????????????????
?  Qdrant Cloud       ?  ? Armazena vetores + metadata
???????????????????????
```

---

## ?? **Arquivos Criados**

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `src/lib/datajud-service.ts` | Integração com API DataJud | ? Criado |
| `src/lib/gemini-embedding-service.ts` | Geração de embeddings Gemini | ? Criado |
| `scripts/populate-qdrant-datajud.ts` | Script automatizado de população | ? Criado |
| `package.json` | Comando `qdrant:populate-datajud` | ? Adicionado |

---

## ?? **Como Usar**

### **Pré-requisitos**

1. ? Cluster Qdrant configurado (já feito)
2. ? API Key do Gemini configurada (`VITE_GEMINI_API_KEY`)
3. ? Variáveis de ambiente no `.env`:

```env
# Qdrant (já configurado)
QDRANT_URL=https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
QDRANT_COLLECTION_NAME=legal_docs

# Gemini (obrigatório para embeddings)
VITE_GEMINI_API_KEY=sua_chave_aqui
```

### **Executar População**

```sh
npm run qdrant:populate-datajud
```

**O que acontece:**

1. ?? Conecta na API DataJud do CNJ
2. ?? Busca processos por **temas jurídicos curados**:
   - Direitos Trabalhistas (TST)
   - Direito Previdenciário (TRF1)
   - Direito do Consumidor (TJMG)
   - Direito Civil - Contratos (TJSP)
   - Direito Administrativo (TRF6)
3. ?? Busca processos dos **tribunais prioritários**:
   - TST, TRT3, TJMG, TRF1, TRF6, STJ
4. ?? Gera embeddings com **Gemini text-embedding-004** (768 dimensões)
5. ?? Insere no **Qdrant Cloud** com metadata completa
6. ? Exibe resumo de sucessos/erros

---

## ?? **Saída Esperada**

```
?? Iniciando população automatizada do Qdrant com DataJud

?? Conectando ao Qdrant Cloud...
? Conectado: https://4aee698c-53f6-4571-8f41-eb80f56ff1f2...
?? Collection: legal_docs

?? Modelo Gemini: text-embedding-004 (768 dimensões)
? Collection verificada/criada

?? Buscando dados do DataJud (CNJ)...

?? Estratégia: Temas Jurídicos Curados

?? Processando: Direitos Trabalhistas (TST)
   15 processos encontrados
   ?? Lote 1/3 (5 itens)
   .....
   ?? Lote 2/3 (5 itens)
   .....
   ? Direitos Trabalhistas concluído

?? Processando: Direito Previdenciário (TRF1)
   12 processos encontrados
   ...

?? RESUMO DA POPULAÇÃO

   Total Processado: 127
   Total Inserido:   124 ?
   Total Erros:      3 ??
   Taxa de Sucesso:  97.6%

? População concluída!

?? Acesse o dashboard: https://cloud.qdrant.io/clusters
```

---

## ?? **API DataJud - Detalhes Técnicos**

### **Endpoint Base**

```
https://api-publica.datajud.cnj.jus.br/api_publica
```

### **Exemplo de Request**

```http
GET /api_publica/processos?siglaTribunal=TST&assunto=Direitos%20Trabalhistas&tamanho=100&pagina=0
Accept: application/json
User-Agent: AssistenteJuridico/1.0
```

### **Resposta (Formato Elasticsearch)**

```json
{
  "hits": {
    "total": { "value": 1234 },
    "hits": [
      {
        "_id": "abc-123",
        "_source": {
          "numeroProcesso": "0001234-56.2023.5.01.0001",
          "siglaTribunal": "TST",
          "classe": "Reclamação Trabalhista",
          "assunto": "Horas Extras",
          "dataAjuizamento": "2023-05-15T00:00:00Z",
          "orgaoJulgador": "1ª Vara do Trabalho de São Paulo",
          "movimentacoes": [
            {
              "dataHora": "2023-05-16T10:30:00Z",
              "codigoNacional": "12345",
              "complemento": "Citação realizada"
            }
          ],
          "partes": [
            { "polo": "AUTOR", "nome": "João Silva" },
            { "polo": "REU", "nome": "Empresa XYZ Ltda" }
          ]
        }
      }
    ]
  }
}
```

---

## ?? **Gemini Embedding - Detalhes**

### **Modelo Usado**

- **Nome**: `text-embedding-004`
- **Dimensões**: 768
- **Distância**: Cosine Similarity
- **Provider**: Google Gemini API

### **Texto Processado**

Para cada processo, combina:

```typescript
const fullText = [
  `Tribunal: TST`,
  `Classe: Reclamação Trabalhista`,
  `Assunto: Horas Extras`,
  `Movimentações: Citação realizada; Audiência marcada; ...`
].join(". ");

const embedding = await geminiEmbeddingService.generateEmbedding(fullText);
// ? [0.123, -0.456, 0.789, ..., 0.321] (768 números)
```

---

## ?? **Metadata Armazenada no Qdrant**

Cada vetor inserido tem o seguinte payload:

```typescript
{
  id: "abc-123",
  vector: [0.123, -0.456, ..., 0.321], // 768 dims
  payload: {
    numero: "0001234-56.2023.5.01.0001",
    tribunal: "TST",
    classe: "Reclamação Trabalhista",
    assunto: "Horas Extras",
    tema: "Direitos Trabalhistas", // Curado pelo script
    dataAjuizamento: "2023-05-15T00:00:00Z",
    orgaoJulgador: "1ª Vara do Trabalho de São Paulo",
    totalMovimentacoes: 5,
    partes: "João Silva; Empresa XYZ Ltda",
    embedModel: "text-embedding-004",
    createdAt: "2024-12-09T15:30:00Z"
  }
}
```

---

## ?? **Temas Curados (Estratégia 1)**

O script busca automaticamente os seguintes temas:

| Tema | Tribunal | Limite |
|------|----------|--------|
| Direitos Trabalhistas | TST | 20 processos |
| Direito Previdenciário | TRF1 | 20 processos |
| Direito do Consumidor | TJMG | 20 processos |
| Direito Civil - Contratos | TJSP | 20 processos |
| Direito Administrativo | TRF6 | 20 processos |

**Total estimado**: ~100 processos (depende da disponibilidade na API)

---

## ??? **Tribunais Prioritários (Estratégia 2)**

Busca complementar por tribunal:

- **TST**: Tribunal Superior do Trabalho
- **TRT3**: Tribunal Regional do Trabalho 3ª Região (MG)
- **TJMG**: Tribunal de Justiça de Minas Gerais
- **TRF1**: Tribunal Regional Federal 1ª Região
- **TRF6**: Tribunal Regional Federal 6ª Região
- **STJ**: Superior Tribunal de Justiça

**Limite**: 20 processos por tribunal (últimos desde 2023)

---

## ?? **Rate Limits e Performance**

### **Delays Configurados**

- **Entre lotes**: 2 segundos
- **Entre tribunais**: 3 segundos
- **Entre embeddings**: 100ms (Gemini API)
- **Entre requests DataJud**: 1 segundo

### **Estimativa de Tempo**

Para ~150 processos:

- Busca DataJud: ~5 minutos
- Geração embeddings: ~3 minutos
- Upload Qdrant: ~2 minutos
- **Total**: ~10-15 minutos

### **Custos Estimados**

- **DataJud API**: Gratuita ?
- **Gemini Embedding**: ~$0.01 (150 requests)
- **Qdrant Cloud**: Free tier (1GB) ?
- **Total**: ~$0.01 ??

---

## ?? **Customização**

### **Alterar Temas**

Edite `scripts/populate-qdrant-datajud.ts`:

```typescript
const temas = [
  { tema: "Direito Tributário", tribunal: "TRF1" },
  { tema: "Direito Ambiental", tribunal: "TJMG" },
  // Adicione mais...
];
```

### **Alterar Tribunais**

```typescript
const TRIBUNAIS_PRIORITARIOS = ["STF", "STJ", "TST", "TJSP"];
```

### **Alterar Limite de Processos**

```typescript
const processos = await dataJudService.searchPrecedentes(tribunal, tema, 50); // Era 20
```

---

## ?? **Validação**

### **1. Verificar População**

```sh
npm run qdrant:test
```

**Saída esperada**:

```
?? Estatísticas:
   - Vectors: 124  ? Deve ser > 0
   - Status: green
```

### **2. Testar Busca**

```sh
curl 'https://4aee698c-53f6-4571-8f41-eb80f56ff1f2.us-east4-0.gcp.cloud.qdrant.io:6333/collections/legal_docs/points/scroll?limit=5' \
  -H 'api-key: sua-api-key'
```

### **3. Dashboard Qdrant**

Acesse: https://cloud.qdrant.io/clusters

Verifique:
- ? **Vectors Count** > 0
- ? **Storage Used** ~1-5 MB (para 100-150 processos)
- ? **Status**: Green

---

## ? **Troubleshooting**

### **Erro: "DataJud API timeout"**

**Causa**: API do CNJ pode estar lenta ou indisponível

**Solução**:
```typescript
// Aumentar timeout em src/lib/datajud-service.ts
private readonly timeout = 60000; // Era 30000
```

### **Erro: "Gemini API quota exceeded"**

**Causa**: Limite de requests/minuto do Gemini

**Solução**:
```typescript
// Aumentar delay em src/lib/gemini-embedding-service.ts
await this.delay(500); // Era 100
```

### **Erro: "Qdrant API error: 400"**

**Causa**: Dimensões do vetor incompatíveis

**Solução**:
1. Recriar collection: `npm run qdrant:init`
2. Rodar população novamente: `npm run qdrant:populate-datajud`

---

## ?? **Próximos Passos**

1. ? Popular Qdrant com DataJud
2. ? Atualizar agente `pesquisa-juris-qdrant` para usar dados reais
3. ? Registrar agente no sistema
4. ? Testar busca end-to-end
5. ? Configurar atualização periódica (cron job)

---

## ?? **Documentação de Referência**

- **DataJud API**: https://www.cnj.jus.br/datajud
- **Gemini Embedding**: https://ai.google.dev/docs/embeddings_guide
- **Qdrant Cloud**: https://qdrant.tech/documentation/cloud/
- **Guia Qdrant**: `docs/QDRANT_SETUP_CHECKLIST.md`

---

**Criado**: 09/12/2024  
**Status**: ? Pronto para produção

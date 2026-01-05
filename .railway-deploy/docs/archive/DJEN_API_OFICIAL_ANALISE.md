# Análise da API Oficial DJEN - Comunicação PJe

**Fonte:** https://comunicaapi.pje.jus.br/swagger/index.html  
**Versão:** 1.0.3  
**Última Atualização:** 29/05/2025

---

## 📋 Resumo Executivo

A API DJEN (Diário de Justiça Eletrônico Nacional e Plataforma de Editais) do CNJ fornece acesso programático a comunicações processuais de todos os tribunais brasileiros.

### Endpoints Disponíveis

1. **`POST /api/v1/login`** - Autenticação (apenas para Tribunais)
2. **`GET /api/v1/comunicacao`** - Consulta de comunicações (PRINCIPAL)
3. **`POST /api/v1/comunicacao`** - Inserção de comunicações (apenas Tribunais)
4. **`GET /api/v1/comunicacao/{hash}/certidao`** - Download de certidão
5. **`GET /api/v1/comunicacao/tribunal`** - Lista de tribunais
6. **`DELETE /api/v1/comunicacao/{id}`** - Cancelamento (apenas Tribunais)
7. **`GET /api/v1/caderno/{sigla_tribunal}/{data}/{meio}`** - Download de cadernos

---

## 🔑 Autenticação

### POST /api/v1/login

**Uso:** Apenas para Tribunais que publicam comunicações.  
**Necessário para:** Advogados consultando? **NÃO**

```json
// Request Body
{
  "login": "string",
  "senha": "string"
}

// Response 200 OK
{
  "user": {
    "id": 0,
    "nome": "string",
    "email": "string",
    "cpf": "string"
  },
  "access_token": "string"
}
```

**Status Codes:**
- `200` - Autenticado com sucesso
- `403` - Credenciais inválidas
- `422` - Erro negocial

**❗ IMPORTANTE:** Para consultas públicas (advogados verificando suas intimações), **não é necessário autenticação**.

---

## 🔍 Consulta de Comunicações (Endpoint Principal)

### GET /api/v1/comunicacao

**Este é o endpoint correto para monitoramento de publicações!**

### Parâmetros de Consulta

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `numeroOab` | string | Número da OAB do advogado | `184404` |
| `ufOab` | string | UF da OAB | `MG` |
| `nomeAdvogado` | string | Nome do advogado | `Thiago Bodevan` |
| `nomeParte` | string | Nome da parte processual | `João Silva` |
| `numeroProcesso` | string | Número do processo | `1234567-89.2024.8.13.0024` |
| `dataDisponibilizacaoInicio` | string (date) | Data inicial (aaaa-mm-dd) | `2025-11-01` |
| `dataDisponibilizacaoFim` | string (date) | Data final (aaaa-mm-dd) | `2025-11-21` |
| `siglaTribunal` | string | Sigla do tribunal | `TJMG`, `TRT3`, `TST`, `STJ` |
| `numeroComunicacao` | number | ID específico da comunicação | `12345` |
| `pagina` | number | Número da página | `1` |
| `itensPorPagina` | number | Itens por página | `5` ou `100` |
| `orgaoID` | number | ID do órgão requisitante | `123` |
| `meio` | string | Tipo de publicação | `E` (Edital) ou `D` (Diário) |

### Regras de Consulta

**Obrigatório pelo menos um dos seguintes:**
- `siglaTribunal`
- `texto`
- `nomeParte`
- `nomeAdvogado`
- `numeroOab`
- `numeroProcesso`
- OU limitar a 5 `itensPorPagina`

### Limitações

**Consultas limitadas a 10.000 resultados quando:**
- Pesquisas com campos textuais ou OAB
- `itensPorPagina` ≤ 5
- `dataDisponibilizacaoInicio` ≠ `dataDisponibilizacaoFim`
- Pesquisa por `numeroProcesso`

### Rate Limiting (Controle de Taxa)

**Headers de resposta:**
- `x-ratelimit-limit` - Janela de quantidade de requisições
- `x-ratelimit-remaining` - Requisições restantes

**Em caso de erro 429:**
- Aguardar **1 minuto** antes de retomar
- Evitar loops de erros
- ⚠️ **Múltiplos IPs para contornar o rate limit é considerado abuso e pode resultar em bloqueios**

### Response 200 OK

```json
{
  "status": "string",
  "message": "string",
  "count": 0,
  "items": [
    {
      "id": 0,
      "data_disponibilizacao": "string",
      "siglaTribunal": "string",
      "tipoComunicacao": "string",
      "nomeOrgao": "string",
      "texto": "string",
      "numero_processo": "string",
      "meio": "string",
      "link": "string",
      "tipoDocumento": "string",
      "nomeClasse": "string",
      "codigoClasse": "string",
      "numeroComunicacao": 0,
      "ativo": true,
      "hash": "string",
      "datadisponibilizacao": "string",
      "meiocompleto": "string",
      "numeroprocessocommascara": "string",
      "destinatarios": [
        {
          "nome": "string",
          "polo": "string",
          "comunicacao_id": 0
        }
      ],
      "destinatarioadvogados": [
        {
          "id": 0,
          "comunicacao_id": 0,
          "advogado_id": 0,
          "created_at": "string",
          "updated_at": "string",
          "advogado": {
            "id": 0,
            "nome": "string",
            "numero_oab": "string",
            "uf_oab": "string"
          }
        }
      ]
    }
  ]
}
```

### Status Codes

- `200` - Sucesso
- `422` - Erro negocial (parâmetros inválidos)
- `429` - Taxa de requisições elevada (rate limit)

---

## 📁 Download de Cadernos

### GET /api/v1/caderno/{sigla_tribunal}/{data}/{meio}

**Uso:** Download de cadernos compactados completos do dia.

**Parâmetros:**
- `sigla_tribunal` (path, required) - Ex: `TJMG`
- `data` (path, required, format: date) - Ex: `2025-11-21`
- `meio` (path, required) - `E` (Edital) ou `D` (Diário)

**Características:**
- Retorna metadados + URL temporária (válida por **5 minutos**)
- Cadernos disponibilizados a partir das **02:00**
- URL expira rapidamente

### Response 200 OK

```json
{
  "tribunal": "string",
  "sigla_tribunal": "string",
  "meio": "string",
  "status": "string",
  "versao": "string",
  "data": "string",
  "total_comunicacoes": 0,
  "numero_paginas": 0,
  "hash": "string",
  "url": "string"  // URL temporária (5 min)
}
```

**Status Codes:**
- `200` - Sucesso
- `422` - Erro negocial

---

## 📜 Certidão de Publicação

### GET /api/v1/comunicacao/{hash}/certidao

**Uso:** Download de certidão individual de uma comunicação.

**Parâmetros:**
- `hash` (path, required) - Hash único da comunicação

**Response:** Arquivo de certidão (provavelmente PDF)

---

## 🏛️ Lista de Tribunais

### GET /api/v1/comunicacao/tribunal

**Uso:** Obter lista de tribunais por UF com dados de último envio.

**Parâmetros:** Nenhum

### Response 200 OK

```json
[
  {
    "id": 0,
    "nome": "string",
    "sigla": "string",
    "jurisdicao": "string",
    "endereco": "string",
    "telefone": "string"
  }
]
```

**Status Codes:**
- `200` - Sucesso
- `404` - Nenhum tribunal encontrado
- `500` - Erro interno

---

## 🔧 Inserção de Comunicações (Tribunais)

### POST /api/v1/comunicacao

**Uso:** Apenas para Tribunais publicarem novas comunicações.

**Autenticação:** Token obtido via `/api/v1/login`

```json
{
  "codigo_classe": "string",
  "numero_processo": "string",
  "sigla_tribunal": "string",
  "meio": "\"E\"",
  "link": "string",
  "texto": "string",
  "tipo_documento": "string",
  "orgao": "string",
  "data_disponibilizacao": "string",
  "tipo_comunicacao": "\"C\"",
  "destinatarios": [
    {
      "nome": "string",
      "cpf_cnpj": "string",
      "polo": "\"A\""
    }
  ],
  "advogados": [
    {
      "nome": "string",
      "numero_oab": "string",
      "uf_oab": "string"
    }
  ]
}
```

---

## 🗑️ Cancelamento de Comunicações (Tribunais)

### DELETE /api/v1/comunicacao/{id}

**Uso:** Apenas para Tribunais cancelarem comunicações.

**Autenticação:** Token obtido via `/api/v1/login`

**Comportamento:**
- **Antes da disponibilização:** Comunicação não aparecerá em consultas
- **Após disponibilização:** Conteúdo substituído por motivo de cancelamento
- Pode levar algumas horas para refletir em todas as pesquisas

```json
{
  "motivo_cancelamento": "string"  // Obrigatório se já disponibilizado
}
```

---

## 📊 Análise para Nosso Sistema

### ❌ O Que Estava Errado

1. **Endpoint incorreto:** Usávamos `/api/v1/caderno/{tribunal}/{data}/html`
   - ✅ Correto: `/api/v1/comunicacao` com query params

2. **Parâmetros incorretos:** Não enviávamos OAB, nome do advogado
   - ✅ Correto: `numeroOab`, `ufOab`, `nomeAdvogado`, `siglaTribunal`

3. **Sem paginação:** Não controlávamos `pagina` e `itensPorPagina`
   - ✅ Correto: Implementar paginação com 100 itens/página

4. **Sem rate limiting:** Não tratávamos erro 429
   - ✅ Correto: Implementar retry com backoff de 1 minuto

5. **Sem filtro de data:** Não usávamos range de datas
   - ✅ Correto: `dataDisponibilizacaoInicio` e `dataDisponibilizacaoFim`

### ✅ Correções Necessárias

#### 1. Endpoint de Consulta
```typescript
// ERRADO
const url = `https://comunicaapi.pje.jus.br/api/v1/caderno/${tribunal}/${data}/html`;

// CORRETO
const params = new URLSearchParams({
  numeroOab: '184404',
  ufOab: 'MG',
  nomeAdvogado: 'Thiago Bodevan Veiga',
  siglaTribunal: 'TJMG',
  dataDisponibilizacaoInicio: '2025-11-01',
  dataDisponibilizacaoFim: '2025-11-21',
  pagina: '1',
  itensPorPagina: '100',
  meio: 'D'  // Diário
});
const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${params}`;
```

#### 2. Headers Corretos
```typescript
const headers = {
  'Accept': 'application/json',
  'User-Agent': 'AssistenteJuridico-PJe/1.0'  // Identificação
};
// NÃO precisa de Authorization para consultas públicas
```

#### 3. Rate Limiting
```typescript
const response = await fetch(url, { headers });

// Verificar headers de rate limit
const rateLimit = response.headers.get('x-ratelimit-limit');
const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');

if (response.status === 429) {
  // Aguardar 1 minuto
  await new Promise(resolve => setTimeout(resolve, 60000));
  // Retry
}
```

#### 4. Paginação
```typescript
async function consultarTodasPaginas(params: ConsultaParams) {
  const results = [];
  let pagina = 1;
  let hasMore = true;
  
  while (hasMore) {
    const queryParams = new URLSearchParams({
      ...params,
      pagina: pagina.toString(),
      itensPorPagina: '100'
    });
    
    const response = await fetch(`/api/v1/comunicacao?${queryParams}`);
    const data = await response.json();
    
    results.push(...data.items);
    
    // Se retornou menos que 100, é a última página
    hasMore = data.items.length === 100;
    pagina++;
    
    // Limite de 10.000 resultados
    if (results.length >= 10000) break;
  }
  
  return results;
}
```

### 🎯 Tribunais para Configurar

**Thiago Bodevan Veiga - OAB/MG 184.404:**

| Tribunal | Sigla | Meio |
|----------|-------|------|
| TJ-MG | `TJMG` | `D` |
| TRT 3ª Região | `TRT3` | `D` |
| TST | `TST` | `D` |
| STJ | `STJ` | `D` |

### 📅 Estratégia de Consulta

1. **Diária (9h UTC / 6h BRT):**
   - Consultar data de ontem e hoje
   - Usar `dataDisponibilizacaoInicio` = ontem
   - Usar `dataDisponibilizacaoFim` = hoje

2. **Por Advogado:**
   - `numeroOab=184404`
   - `ufOab=MG`
   - `nomeAdvogado=Thiago Bodevan Veiga`

3. **Por Tribunal (4 consultas separadas):**
   - Uma para cada: TJMG, TRT3, TST, STJ

4. **Paginação:**
   - Iniciar com `pagina=1`
   - `itensPorPagina=100` (máximo)
   - Continuar até receber < 100 resultados

### ⚠️ Limitações e Cuidados

1. **Rate Limiting:**
   - Não fazer mais que X requisições por minuto (valor não especificado)
   - Implementar retry com backoff de 1 minuto
   - NÃO usar múltiplos IPs para contornar

2. **Limite de Resultados:**
   - Máximo 10.000 resultados por consulta
   - Evitar ranges de data muito grandes

3. **Disponibilidade:**
   - Cadernos disponíveis a partir das 02:00
   - Executar cron às 09:00 UTC garante dados disponíveis

4. **URL Temporária (Cadernos):**
   - Válida por apenas 5 minutos
   - Fazer download imediatamente após obter

### 🔄 Fluxo Recomendado

```
1. Cron executa às 09:00 UTC
2. Para cada tribunal (TJMG, TRT3, TST, STJ):
   a. Consultar /api/v1/comunicacao
   b. Params: numeroOab, ufOab, siglaTribunal, dataInicio, dataFim
   c. Paginar até obter todos resultados
   d. Verificar rate limit headers
   e. Se 429, aguardar 1 minuto e retry
3. Armazenar resultados no Spark KV
4. Enviar notificações por email
5. Atualizar dashboard
```

---

## 📝 Resumo de Mudanças

### Arquivo: `lib/api/djen-client.ts`

**Antes:**
- Endpoint: `/api/v1/caderno/{tribunal}/{data}/html`
- Headers: `User-Agent: PJe-DataCollector/1.0`
- Sem autenticação
- Sem paginação
- Sem rate limiting

**Depois:**
- Endpoint: `/api/v1/comunicacao`
- Query params: `numeroOab`, `ufOab`, `siglaTribunal`, `dataDisponibilizacaoInicio`, `dataDisponibilizacaoFim`, `pagina`, `itensPorPagina`
- Headers: `Accept: application/json`, `User-Agent: AssistenteJuridico-PJe/1.0`
- Paginação automática (100 itens/página)
- Retry em caso de 429 (1 minuto)
- Verificação de rate limit headers

### Benefícios

✅ **API Correta:** Usando endpoint documentado oficialmente  
✅ **Filtros Precisos:** OAB + nome do advogado + tribunal  
✅ **Paginação:** Suporte para > 100 resultados  
✅ **Rate Limiting:** Respeita limites da API  
✅ **Dados Estruturados:** JSON com metadados completos  
✅ **Destinatários:** Lista de advogados e partes  
✅ **Hash para Certidão:** Possibilidade de baixar certidão oficial  

---

**Preparado por:** GitHub Copilot  
**Data:** 21 de novembro de 2025  
**Repositório:** thiagobodevan-a11y/assistente-jurdico-p

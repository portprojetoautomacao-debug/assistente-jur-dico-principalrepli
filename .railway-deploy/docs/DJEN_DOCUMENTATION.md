# Sistema de Consulta DJEN - Documentação Técnica

## Visão Geral

Sistema completo de consulta ao **Diário de Justiça Eletrônico Nacional (DJEN)** através da **API oficial pública do Comunica PJe** do Conselho Nacional de Justiça (CNJ). Permite buscar publicações de múltiplos tribunais por nome de advogado ou número de OAB de forma automatizada, **gratuita** e eficiente - **sem necessidade de robôs privados pagos**.

> 💡 **DJEN: habemus API!** Como compartilhado por advogados no LinkedIn: _"O CNJ disponibiliza uma API para acessar os dados do DJEN. Basta colocar no seu browser o endereço da API ou usar o Swagger para mais opções. Dá até para rodar um código que baixa e trabalha os dados em Excel!"_

### 📚 Documentação Oficial

- **Swagger UI**: https://comunicaapi.pje.jus.br/swagger/index.html
- **Versão**: 1.0.3 (última atualização: 29/05/2025)
- **Recursos**: API REST com suporte a JSON, controle de rate limiting, autenticação para tribunais

## Arquitetura

### Componentes Principais

#### 1. `src/lib/djen-api.ts` - Camada de API
Biblioteca TypeScript com funções puras para comunicação com a API do DJEN.

**Principais funções:**
- `consultarDJEN(config)` - Função principal que orquestra a consulta
- `consultarPublicacoesTribunal(params)` - Consulta um tribunal específico
- `matchesSearchTerms()` - Verifica se publicação contém termos buscados
- `validarFormatoData()` - Valida formato de data AAAA-MM-DD
- `validarNumeroOAB()` - Valida formato OAB/UF 12345

**Tratamento de Erros:**
- Classe customizada `DJENAPIError` com contexto detalhado
- Timeout configurável (padrão 60s)
- Retry logic pode ser implementada pelo consumidor
- Validação de content-type da resposta

**Normalização de Texto:**
- Remove acentos (NFD normalization)
- Converte para lowercase
- Permite matching flexível de nomes

#### 2. `src/components/DJENConsulta.tsx` - Interface de Usuário
Componente React completo com formulário e exibição de resultados.

**Recursos:**
- ✅ Seleção múltipla de tribunais (7 disponíveis)
- ✅ Busca por nome e/ou OAB
- ✅ Seletor de data com valor padrão = hoje
- ✅ Loading states com spinner
- ✅ Exibição de erros por tribunal
- ✅ Cards de resultado com badges de match type
- ✅ Copiar teor para clipboard
- ✅ Exportar resultados em JSON
- ✅ Histórico de buscas (persistido com useKV)

#### 3. Integração com DatabaseQueries
O componente foi integrado na aba DJEN do módulo de consultas existente.

## Endpoints da API

### 1. GET /api/v1/comunicacao - Consulta de Comunicações

**Endpoint Base:**
```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao
```

**Descrição**: Método de consulta de comunicações processuais (publicações) do DJEN e Plataforma de Editais.

#### Parâmetros (Query String)

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo | Valores |
|-----------|------|-------------|-----------|---------|---------|
| `numeroOab` | string | Condicional* | Número da OAB (apenas dígitos) | `184404` | - |
| `ufOab` | string | Condicional* | UF da OAB (sigla) | `MG` | 2 letras |
| `nomeAdvogado` | string | Condicional* | Nome do advogado | `Thiago Bodevan Veiga` | - |
| `nomeParte` | string | Condicional* | Nome da parte no processo | `Maria Santos` | - |
| `numeroProcesso` | string | Condicional* | Número CNJ do processo | `50012345620228130000` | 20 dígitos |
| `dataDisponibilizacaoInicio` | string | Não | Data inicial (padrão: hoje) | `2025-01-16` | AAAA-MM-DD |
| `dataDisponibilizacaoFim` | string | Não | Data final (padrão: dataInicio) | `2025-01-16` | AAAA-MM-DD |
| `siglaTribunal` | string | Condicional* | Sigla do tribunal | `TJMG`, `TST` | Oficial |
| `numeroComunicacao` | number | Não | ID interno da comunicação | `123456` | - |
| `pagina` | number | Não | Número da página (padrão: 1) | `1`, `2` | ≥ 1 |
| `itensPorPagina` | number | Não | Itens por página | `100` | 5 ou 100 |
| `orgaoId` | number | Não | ID interno do órgão | `1234` | - |
| `meio` | string | Não | Tipo de publicação | `D`, `E` | D=Diário, E=Edital |
| `texto` | string | Condicional* | Busca textual livre | `intimação` | - |

**\* Regras de Obrigatoriedade:**
- A pesquisa **deve conter pelo menos um** dos seguintes parâmetros:
  - `siglaTribunal`
  - `texto`
  - `nomeParte`
  - `nomeAdvogado`
  - `numeroOab`
  - `numeroProcesso`
  - OU ser limitado a 5 `itensPorPagina`

#### ⚠️ Limitações e Rate Limiting

**Limitações de Resultado (máximo 10.000 itens):**
- Pesquisas com campos textuais ou OAB (`texto`, `nomeAdvogado`, `numeroOab`, `nomeParte`)
- Pesquisas com 5 ou menos `itensPorPagina`
- Pesquisas com `dataDisponibilizacaoInicio` ≠ `dataDisponibilizacaoFim`
- Pesquisas com `numeroProcesso`

**Rate Limiting (controle por IP):**
- Headers retornados:
  - `x-ratelimit-limit`: Janela de quantidade de requisições
  - `x-ratelimit-remaining`: Requisições restantes na janela atual
- Erro `429 Too Many Requests`: Aguardar **1 minuto** antes de retomar
- ⚠️ **Uso de múltiplos IPs para contornar rate limit é considerado abuso** e pode resultar em bloqueios

#### Headers Obrigatórios

```http
Accept: application/json
User-Agent: PJe-DataCollector/1.0
```

⚠️ **CRÍTICO**: 
- Sem `Accept: application/json` a resposta pode vir em HTML/PDF
- Sem `User-Agent` correto a API retorna `403 Forbidden`

#### Exemplo de Requisição

**Simples (browser):**
```
https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroOab=184404&ufOab=MG&meio=D
```

**Completa (cURL):**
```bash
curl -X GET "https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroOab=184404&ufOab=MG&dataDisponibilizacaoInicio=2025-11-21&dataDisponibilizacaoFim=2025-11-21&meio=D&pagina=1&itensPorPagina=100" \
  -H "Accept: application/json" \
  -H "User-Agent: PJe-DataCollector/1.0"
```

#### Resposta (200 OK)

```json
{
  "status": "success",
  "message": "Comunicações encontradas",
  "count": 42,
  "items": [
    {
      "id": 123456,
      "data_disponibilizacao": "2025-11-21",
      "siglaTribunal": "TJMG",
      "tipoComunicacao": "Intimação",
      "nomeOrgao": "1ª Vara Cível",
      "texto": "Intimação para apresentação de manifestação...",
      "numero_processo": "50012345620228130001",
      "meio": "D",
      "link": "https://...",
      "tipoDocumento": "Despacho",
      "nomeClasse": "Procedimento Comum Cível",
      "codigoClasse": "318",
      "numeroComunicacao": 123456,
      "ativo": true,
      "hash": "abc123def456",
      "datadisponibilizacao": "2025-11-21",
      "meiocompleto": "Diário Eletrônico",
      "numeroprocessocommascara": "5001234-56.2022.8.13.0001",
      "destinatarios": [
        {
          "nome": "João da Silva",
          "polo": "A",
          "comunicacao_id": 123456
        }
      ],
      "destinatarioadvogados": [
        {
          "id": 789,
          "comunicacao_id": 123456,
          "advogado_id": 101112,
          "created_at": "2025-11-21T09:00:00Z",
          "updated_at": "2025-11-21T09:00:00Z",
          "advogado": {
            "id": 101112,
            "nome": "Thiago Bodevan Veiga",
            "numero_oab": "184404",
            "uf_oab": "MG"
          }
        }
      ]
    }
  ]
}
```

#### Códigos de Status

| Código | Descrição | Ação |
|--------|-----------|------|
| `200` | OK - Comunicações encontradas | Processar `items` |
| `422` | Erro negocial - Parâmetros inválidos | Verificar parâmetros obrigatórios |
| `429` | Rate limit excedido | Aguardar 1 minuto e tentar novamente |

---

### 2. GET /api/v1/caderno/{sigla_tribunal}/{data}/{meio} - Download de Cadernos

**Endpoint:**
```
GET https://comunicaapi.pje.jus.br/api/v1/caderno/{sigla_tribunal}/{data}/{meio}
```

**Descrição**: Método para baixar cadernos compactados de comunicações de cada tribunal. Retorna metadados e URL temporária (5 minutos) para download.

#### Parâmetros (Path)

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo | Valores |
|-----------|------|-------------|-----------|---------|---------|
| `sigla_tribunal` | string | Sim | Sigla oficial do tribunal | `TJMG` | - |
| `data` | string | Sim | Data do caderno | `2025-11-21` | AAAA-MM-DD |
| `meio` | string | Sim | Tipo de publicação | `D` | D=Diário, E=Edital |

**Disponibilidade**: Cadernos do dia atual são disponibilizados a partir das **02:00** (madrugada).

#### Exemplo de Requisição

```bash
curl -X GET "https://comunicaapi.pje.jus.br/api/v1/caderno/TJMG/2025-11-21/D" \
  -H "Accept: application/json"
```

#### Resposta (200 OK)

```json
{
  "tribunal": "Tribunal de Justiça de Minas Gerais",
  "sigla_tribunal": "TJMG",
  "meio": "D",
  "status": "disponivel",
  "versao": "1.0",
  "data": "2025-11-21",
  "total_comunicacoes": 1523,
  "numero_paginas": 245,
  "hash": "abc123def456789",
  "url": "https://storage.googleapis.com/comunicaapi-cadernos/TJMG_2025-11-21_D.zip?expires=300"
}
```

**⚠️ URL expira em 5 minutos!**

---

### 3. GET /api/v1/comunicacao/tribunal - Lista de Tribunais

**Endpoint:**
```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao/tribunal
```

**Descrição**: Retorna lista de tribunais por UF com dados de último envio.

#### Resposta (200 OK)

```json
[
  {
    "id": 1,
    "nome": "Tribunal de Justiça de Minas Gerais",
    "sigla": "TJMG",
    "jurisdicao": "MG",
    "endereco": "Av. Afonso Pena, 1212 - Belo Horizonte/MG",
    "telefone": "(31) 3250-0000"
  }
]
```

---

### 4. GET /api/v1/comunicacao/{hash}/certidao - Download de Certidão

**Endpoint:**
```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao/{hash}/certidao
```

**Descrição**: Download de certidão de uma comunicação específica (PDF).

#### Parâmetros (Path)

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `hash` | string | Sim | Hash único da comunicação |

---

### 5. POST /api/v1/login - Autenticação (Tribunais)

**⚠️ Apenas para uso dos Tribunais** (inclusão/remoção de comunicações).

**Endpoint:**
```
POST https://comunicaapi.pje.jus.br/api/v1/login
```

#### Request Body

```json
{
  "login": "usuario_tribunal",
  "senha": "senha_tribunal"
}
```

#### Resposta (200 OK)

```json
{
  "user": {
    "id": 123,
    "nome": "Tribunal de Justiça XY",
    "email": "ti@tjxy.jus.br",
    "cpf": "12345678900"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Tribunais Suportados

Lista atualizada de tribunais integrados ao DJEN:

- **TST** - Tribunal Superior do Trabalho
- **TRT3** - Tribunal Regional do Trabalho da 3ª Região (MG)
- **TJMG** - Tribunal de Justiça de Minas Gerais
- **TRF1** - Tribunal Regional Federal da 1ª Região
- **TJES** - Tribunal de Justiça do Espírito Santo
- **TJSP** - Tribunal de Justiça de São Paulo
- **STJ** - Superior Tribunal de Justiça

Consulte `/api/v1/comunicacao/tribunal` para lista completa e atualizada.

## Estrutura de Dados

### DJENPublication (Resposta da API)

```typescript
interface DJENPublication {
  tribunal: string
  data_disponibilizacao: string
  tipo_comunicacao?: string
  tipo?: string
  orgao?: string
  meio?: string
  inteiro_teor?: string
  inteiroTeor?: string
  numero_processo?: string
  partes?: string[]
  advogados?: string[]
}
```

### DJENFilteredResult (Resultado Processado)

```typescript
interface DJENFilteredResult {
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  matchType: 'nome' | 'oab' | 'ambos'
}
```

## Uso Programático

### Exemplo Básico

```typescript
import { consultarDJEN } from '@/lib/djen-api'

const resultado = await consultarDJEN({
  tribunais: ['TJSP', 'TJMG'],
  searchTerms: {
    nomeAdvogado: 'Thiago Bodevan',
    numeroOAB: 'OAB/MG 123456'
  },
  dataInicio: '2025-01-16',
  dataFim: '2025-01-16'
})

console.log(`${resultado.resultados.length} publicações encontradas`)
console.log(`${resultado.erros.length} tribunais com erro`)
```

### Exemplo com Tratamento de Erros

```typescript
try {
  const resultado = await consultarDJEN({
    tribunais: ['TST', 'TRT3', 'STJ'],
    searchTerms: {
      numeroOAB: 'OAB/SP 12345'
    },
    dataInicio: '2025-01-16',
    dataFim: '2025-01-20',
    timeout: 90000, // 90 segundos
    delayBetweenRequests: 2000 // 2s entre requests
  })

  if (resultado.erros.length > 0) {
    console.warn('Alguns tribunais falharam:', resultado.erros)
  }

  for (const pub of resultado.resultados) {
    console.log(`${pub.tribunal} - ${pub.tipo}`)
    console.log(`Match type: ${pub.matchType}`)
    console.log(pub.teor.substring(0, 200))
  }
} catch (error) {
  if (error instanceof DJENAPIError) {
    console.error(`Erro no tribunal ${error.tribunal}: ${error.message}`)
  }
}
```

## Boas Práticas

### Performance

1. **Delay entre requisições**: Use `delayBetweenRequests: 1500` para evitar sobrecarga
2. **Timeout generoso**: Configure `timeout: 60000` (60s) para tribunais grandes
3. **Tribunais seletivos**: Consulte apenas tribunais relevantes ao caso

### Tratamento de Dados

1. **Normalização**: Use `normalizeText()` para matching case-insensitive
2. **Validação**: Sempre valide formato de OAB e data antes de consultar
3. **Empty states**: Trate `[]` como resposta válida (sem publicações naquele dia)

### Rate Limiting

Embora não documentado oficialmente, recomenda-se:
- Máximo 10 requisições por minuto
- Delay mínimo de 1.5s entre requests
- Retry com backoff exponencial em caso de 503/504

## Possíveis Erros e Soluções

### Erro 400 Bad Request

**Causa**: Parâmetros faltando ou inválidos
**Solução**: 
- Garantir que siglaTribunal, dataDisponibilizacaoInicio e dataDisponibilizacaoFim estão presentes
- Fornecer pelo menos um dos parâmetros de busca (nomeAdvogado, numeroOab/ufOab, nomeParte, ou numeroProcesso)
- Validar formato da data (YYYY-MM-DD)
- Verificar que numeroOab e ufOab estão corretos quando fornecidos

### Erro 403 Forbidden

**Causa**: Falta do User-Agent correto
**Solução**: Garantir header `User-Agent: PJe-DataCollector/1.0`

### Erro 404 Not Found

**Causa**: Tribunal ou endpoint inválidos
**Solução**: 
- Verificar sigla do tribunal (case-sensitive)
- Usar o endpoint correto: `/api/v1/comunicacao`
- Confirmar que o tribunal está disponível na API

### Timeout

**Causa**: Tribunal com volume alto de publicações (ex: TJSP)
**Solução**: 
- Aumentar timeout para 90-120 segundos
- Consultar dias úteis (menos volume)

### Response não é JSON

**Causa**: Header Accept incorreto
**Solução**: Garantir `Accept: application/json`

### AbortError

**Causa**: Request cancelado por timeout
**Solução**: Aumentar timeout ou tentar novamente

## Limitações Conhecidas

1. **Sem paginação**: API retorna todos resultados do dia de uma vez
2. **Sem autenticação**: Não requer nem suporta tokens de API
3. **Volume**: Dias com muitas publicações podem ter resposta lenta
4. **Campos variáveis**: Estrutura JSON pode variar entre tribunais
5. **Histórico limitado**: Consulta apenas data específica (não ranges)

## Futuras Melhorias

### Curto Prazo
- [ ] Cache de resultados (evitar requests duplicados)
- [ ] Filtros adicionais (tipo de comunicação, órgão)
- [ ] Exportar em PDF/Excel além de JSON
- [ ] Agendamento de consultas recorrentes

### Médio Prazo
- [ ] Agent autônomo para monitoramento diário
- [ ] Notificações push quando encontrar match
- [ ] Integração com cálculo automático de prazos
- [ ] Dashboard analítico de publicações

### Longo Prazo
- [ ] IA para classificação semântica de publicações
- [ ] Resumo automático com LLM
- [ ] Detecção de urgência/prioridade
- [ ] OCR para processar PDFs diretamente

## Referências

### Documentação Oficial
- [API Comunica PJe - Swagger](https://comunicaapi.pje.jus.br/swagger-ui.html)
- [Resolução CNJ sobre DJEN](https://pje.csjt.jus.br/manual/index.php?title=DJEN)

### Discussões Técnicas
- [Reddit r/brdev - API do DJEN](https://www.reddit.com/r/brdev/comments/1ncvpww/)

## Suporte

Para dúvidas ou problemas:
1. Verificar esta documentação primeiro
2. Consultar logs de erro detalhados (`DJENAPIError`)
3. Validar parâmetros de entrada
4. Testar endpoint manualmente (curl/Postman)

## Changelog

### v1.1.0 (2025-11-16)
- ✅ **CORREÇÃO CRÍTICA**: Atualizado endpoint de `/api/v1/caderno` para `/api/v1/comunicacao` (endpoint correto)
- ✅ Parâmetros agora passados via query string em vez de path
- ✅ Adicionado suporte a dataDisponibilizacaoInicio e dataDisponibilizacaoFim
- ✅ Extração automática de UF do número OAB (formato OAB/UF 12345)
- ✅ Corrigido erro HTTP 400 que impedia consultas

### v1.0.0 (2025-01-16)
- ✅ Implementação inicial completa
- ✅ Suporte a 7 tribunais principais
- ✅ UI responsiva com React/TypeScript
- ✅ Tratamento robusto de erros
- ✅ Exportação JSON
- ✅ Histórico de buscas persistido
- ✅ Documentação técnica completa

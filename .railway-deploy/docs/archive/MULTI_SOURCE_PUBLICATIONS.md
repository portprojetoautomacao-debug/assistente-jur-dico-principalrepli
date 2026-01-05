# Sistema Multi-Fonte de Publicações Jurídicas

## Visão Geral

Este documento descreve o novo sistema de consulta multi-fonte de publicações jurídicas implementado no Assistente Jurídico PJe. O sistema unifica o acesso a múltiplas fontes de dados oficiais e agregadores, permitindo que advogados encontrem publicações em seu nome de forma mais eficiente e abrangente.

## Fontes de Dados Implementadas

### 1. DJEN (Diário de Justiça Eletrônico Nacional) ✅ ATIVO

**Status**: Totalmente implementado e operacional

- **API**: CNJ Comunica API
- **URL**: https://comunicaapi.pje.jus.br/api/v1/comunicacao
- **Autenticação**: Não requerida (API pública)
- **Cobertura**: 
  - TST (Tribunal Superior do Trabalho)
  - TRT3 (Tribunal Regional do Trabalho - MG)
  - TJMG (Tribunal de Justiça de Minas Gerais)
  - TRF1 (Tribunal Regional Federal - 1ª Região)
  - TJES (Tribunal de Justiça do Espírito Santo)
  - TJSP (Tribunal de Justiça de São Paulo)
  - STJ (Superior Tribunal de Justiça)

**Recursos**:
- ✅ Busca por nome de advogado
- ✅ Busca por número OAB
- ✅ Busca por número de processo
- ✅ Busca por nome de parte
- ✅ Filtro por período (data início/fim)
- ✅ Múltiplos tribunais simultaneamente

**Limitações**:
- Consulta apenas data específica (não ranges amplos)
- Rate limit: ~40 requisições/minuto
- Delay recomendado: 1.5s entre requisições

**Documentação**: Ver `DJEN_DOCUMENTATION.md`

---

### 2. DataJud (API Pública do CNJ) ✅ ATIVO

**Status**: Totalmente implementado e operacional

- **API**: CNJ DataJud Public API
- **URL**: https://api-publica.datajud.cnj.jus.br
- **Autenticação**: Requer API Key (gratuita, cadastro obrigatório)
- **Cobertura**: Todos os tribunais brasileiros (estadual, federal, trabalhista, eleitoral, militar)

**Recursos**:
- ✅ Consulta de processos por número CNJ
- ✅ Acesso a movimentações processuais
- ✅ Metadados de processos
- ✅ Informações de partes e advogados
- ✅ Histórico completo de movimentos

**Configuração**:
```bash
# .env
VITE_DATAJUD_API_KEY=sua_chave_aqui
```

**Como obter API Key**:
1. Acesse https://www.cnj.jus.br/sistemas/datajud/api-publica/
2. Faça cadastro
3. Solicite chave de API
4. Configure no arquivo .env

**Documentação**: Ver `DATAJUD_SETUP.md`

---

### 3. PJe Direct (Processo Judicial Eletrônico) 🟡 BETA

**Status**: Framework implementado, requer credenciais específicas por tribunal

- **API**: Endpoints PJe de cada tribunal
- **URLs**: Varia por tribunal (ex: https://pje.tjmg.jus.br/pje)
- **Autenticação**: Usuário e senha específicos de cada tribunal
- **Cobertura**: 30+ tribunais com PJe

**Recursos Planejados**:
- Acesso direto a processos
- Consulta de publicações
- Movimentações em tempo real
- Download de documentos (petições, decisões)

**Estado Atual**:
- ⚠️ Requer credenciais de acesso fornecidas pelo tribunal
- ⚠️ Muitos tribunais exigem VPN ou IP whitelistado
- ⚠️ APIs variam entre tribunais (sem padronização completa)

**Implementação**:
```typescript
// Framework pronto em src/lib/pje-api.ts
// Necessita configuração específica por tribunal
```

**Tribunais com PJe disponível**:
- TRF1-5, TST, TRT (várias regiões)
- TJAC, TJAL, TJAM, TJAP, TJBA, TJCE, TJDFT, TJES, TJGO, TJMA
- TJMG, TJMS, TJMT, TJPA, TJPB, TJPE, TJPI, TJPR, TJRJ, TJRN
- TJRO, TJRR, TJRS, TJSC, TJSE, TJSP, TJTO

---

### 4. Diários Oficiais (via Querido Diário) ✅ ATIVO

**Status**: Implementado com Querido Diário (Open Knowledge Brasil)

- **API**: Querido Diário API
- **URL**: https://queridodiario.ok.org.br/api
- **Autenticação**: Não requerida (projeto open source)
- **Cobertura**: 4.500+ municípios brasileiros

**Recursos**:
- ✅ Busca por palavras-chave
- ✅ Filtro por município
- ✅ Filtro por período
- ✅ Extração de trechos relevantes
- ✅ Links para diários completos

**Limitações**:
- Foco em diários municipais
- Diários judiciais limitados (use DJEN para isso)
- OCR pode ter imprecisões em PDFs antigos

**Casos de Uso**:
- Monitorar licitações
- Acompanhar publicações municipais
- Buscar portarias e decretos
- Pesquisar nomeações e exonerações

**Documentação**: https://queridodiario.ok.org.br/api/docs

---

### 5. JusBrasil API 📋 PLANEJADO

**Status**: Planejado (aguardando assinatura)

- **API**: JusBrasil Soluções API
- **URL**: https://api.jusbrasil.com.br
- **Autenticação**: Requer assinatura comercial
- **Cobertura**: 400+ fontes de dados judiciais

**Recursos Planejados**:
- Busca unificada em diários
- Monitoramento automático
- Alertas em tempo real
- Histórico de 10+ anos
- API robusta e documentada

**Custos**:
- Consultar: https://insight.jusbrasil.com.br

**Endpoints**:
```
POST /diarios-oficiais/busca
POST /diarios-oficiais/monitoramento/processos
GET  /processos/{numero_cnj}
```

---

### 6. Escavador API 📋 PLANEJADO

**Status**: Planejado (aguardando assinatura)

- **API**: Escavador API
- **URL**: https://api.escavador.com
- **Autenticação**: Requer assinatura comercial
- **Cobertura**: 440+ sistemas judiciais, 175+ diários oficiais

**Recursos Planejados**:
- Monitoramento 24/7
- Alertas personalizados
- Busca por pessoa (CPF/CNPJ)
- Histórico completo de processos
- Integração com CRM

**Custos**:
- Consultar: https://api.escavador.com

---

## Arquitetura do Sistema

### Componentes Principais

```
src/lib/
├── publication-sources-types.ts    # Tipos unificados
├── multi-source-publications.ts    # Agregador principal
├── djen-api.ts                     # DJEN (já existia)
├── datajud-api.ts                  # DataJud (já existia)
├── pje-api.ts                      # PJe Direct (novo)
└── diario-oficial-api.ts           # Diários Oficiais (novo)

src/components/
├── MultiSourcePublications.tsx     # UI unificada (novo)
└── DatabaseQueries.tsx             # Atualizado com aba Multi-Fonte
```

### Fluxo de Dados

```
Usuario
  ↓
MultiSourcePublications (UI)
  ↓
searchPublications() (Agregador)
  ↓
├→ consultarDJEN()
├→ consultarProcessoDatajud()
├→ consultarPublicacoesPJe()
└→ consultarQueridoDiario()
  ↓
Resultados Unificados
```

### Modelo de Dados Unificado

```typescript
interface UnifiedPublication {
  id: string
  source: PublicationSource
  sourceUrl?: string
  title: string
  content: string
  publicationType: string
  processNumber?: string
  tribunal?: string
  court?: string
  parts?: string[]
  lawyers?: string[]
  lawyerOAB?: string[]
  publicationDate: string
  availabilityDate?: string
  deadlineDate?: string
  officialGazette?: string
  pageNumber?: string
  section?: string
  matchReason?: string
  matchType?: 'lawyer_name' | 'oab_number' | 'process_number' | 'party_name' | 'keyword'
  confidence?: number
  rawData?: unknown
}
```

---

## Como Usar

### Interface Gráfica

1. Acesse **Consultas → Multi-Fonte**
2. Selecione as fontes desejadas (ou deixe em branco para todas)
3. Preencha ao menos um critério:
   - Nome do advogado
   - Número OAB
   - Nome da parte
   - Número do processo
   - Palavras-chave
4. Defina o período (data início/fim)
5. Clique em **Buscar Publicações**

### Via Código

```typescript
import { searchPublications } from '@/lib/multi-source-publications'

const result = await searchPublications({
  lawyerName: 'João Silva',
  oabNumber: 'OAB/SP 123456',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  sources: ['djen', 'datajud', 'diario_oficial']
})

console.log(`${result.totalFound} publicações encontradas`)
result.publications.forEach(pub => {
  console.log(`[${pub.source}] ${pub.title}`)
})
```

---

## Configuração

### Variáveis de Ambiente

```bash
# .env

# DataJud (obrigatório para usar DataJud)
VITE_DATAJUD_API_KEY=sua_chave_datajud

# JusBrasil (futuro)
# VITE_JUSBRASIL_API_KEY=sua_chave_jusbrasil

# Escavador (futuro)
# VITE_ESCAVADOR_API_KEY=sua_chave_escavador
```

### Habilitando/Desabilitando Fontes

Edite `src/lib/multi-source-publications.ts`:

```typescript
export function getDefaultConfig(): MultiSourceConfig {
  const sources: PublicationSourceConfig[] = [
    {
      source: 'djen',
      enabled: true, // ← Mude para false para desabilitar
      ...
    },
    ...
  ]
}
```

---

## Recursos Avançados

### Deduplicação Automática

O sistema remove automaticamente resultados duplicados baseado em:
- Número do processo
- Data de publicação
- Tribunal

### Agregação Multi-Thread

As consultas são feitas em paralelo (máx 3 simultâneas) para melhor performance.

### Estatísticas Detalhadas

Cada busca retorna:
- Total de publicações encontradas
- Número de fontes consultadas
- Status por fonte (sucesso/erro)
- Tempo de resposta por fonte

### Exportação de Resultados

- Copiar conteúdo individual
- Exportar tudo em JSON
- Formato compatível com importação

---

## Boas Práticas

### Performance

1. **Selecione fontes específicas** quando possível
2. **Use períodos curtos** (7-30 dias) para DJEN
3. **Cache resultados** localmente quando apropriado
4. **Respeite rate limits** das APIs

### Segurança

1. **Nunca commite API keys** no Git
2. **Use .env** para credenciais
3. **Valide inputs** antes de enviar para APIs
4. **Trate erros** apropriadamente

### Monitoramento

1. **Verifique logs** de erros por fonte
2. **Monitore taxas de sucesso** das APIs
3. **Configure alertas** para falhas recorrentes

---

## Troubleshooting

### Erro: "DJEN não retorna resultados"

**Causa**: Tribunal pode não ter publicações no dia consultado

**Solução**: 
- Verifique se o tribunal está ativo
- Tente um período diferente
- Consulte múltiplos tribunais

### Erro: "DataJud API Key não configurada"

**Causa**: VITE_DATAJUD_API_KEY não está no .env

**Solução**:
1. Obtenha chave em https://www.cnj.jus.br/sistemas/datajud/api-publica/
2. Adicione ao .env
3. Reinicie o servidor de desenvolvimento

### Erro: "Timeout ao consultar fonte"

**Causa**: API demorou mais que o timeout configurado

**Solução**:
- Aumente timeout na configuração
- Tente em horário diferente
- Verifique conexão de internet

### Erro: "Querido Diário sem resultados"

**Causa**: Palavras-chave muito específicas ou município sem diário digital

**Solução**:
- Use termos mais genéricos
- Verifique se município está coberto
- Amplie período de busca

---

## Roadmap

### Curto Prazo (Q1 2025)

- [x] Implementar DJEN
- [x] Implementar DataJud
- [x] Implementar Diários Oficiais
- [x] Interface unificada
- [ ] Cache de resultados
- [ ] Agendamento de buscas

### Médio Prazo (Q2 2025)

- [ ] Integração JusBrasil API
- [ ] Integração Escavador API
- [ ] Alertas em tempo real
- [ ] Notificações push
- [ ] Dashboard analytics

### Longo Prazo (Q3-Q4 2025)

- [ ] Machine Learning para relevância
- [ ] Extração automática de prazos
- [ ] Integração com calendário
- [ ] Geração automática de petições
- [ ] API própria para terceiros

---

## Referências

### Documentação Oficial

- [CNJ DataJud API](https://www.cnj.jus.br/sistemas/datajud/api-publica/)
- [CNJ Comunica API (DJEN)](https://comunicaapi.pje.jus.br/swagger-ui.html)
- [PJe Documentação](https://docs.pje.jus.br/)
- [Querido Diário API](https://queridodiario.ok.org.br/api/docs)

### APIs Comerciais

- [JusBrasil API](https://api.jusbrasil.com.br/docs/)
- [Escavador API](https://api.escavador.com/)

### Projetos Open Source

- [busca-processos-judiciais](https://github.com/joaotextor/busca-processos-judiciais)
- [Querido Diário](https://github.com/okfn-brasil/querido-diario)

---

## Suporte

Para dúvidas ou problemas:

1. Consulte esta documentação
2. Verifique logs no console do navegador
3. Teste APIs manualmente (Postman/curl)
4. Abra issue no GitHub

---

## Changelog

### v1.0.0 (2025-11-17)

- ✅ Implementado sistema multi-fonte
- ✅ Integração DJEN (completa)
- ✅ Integração DataJud (completa)
- ✅ Framework PJe (beta)
- ✅ Integração Querido Diário (completa)
- ✅ Interface unificada
- ✅ Agregação e deduplicação
- ✅ Exportação JSON
- ✅ Documentação completa

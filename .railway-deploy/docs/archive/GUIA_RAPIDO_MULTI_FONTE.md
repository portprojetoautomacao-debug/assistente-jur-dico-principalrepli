# Guia Rápido: Sistema Multi-Fonte de Publicações

## O que é?

Um sistema unificado para encontrar publicações jurídicas em seu nome através de **múltiplas fontes oficiais**, incluindo:

- ✅ **DJEN** - Diário de Justiça Eletrônico (CNJ)
- ✅ **DataJud** - Base Nacional do CNJ
- ✅ **Diários Oficiais** - Gazetas municipais
- 🟡 **PJe** - Sistema eletrônico dos tribunais (beta)

## Como Usar em 3 Passos

### 1️⃣ Acesse a Ferramenta

1. Faça login no sistema
2. Vá em **"Consultas"** no menu lateral
3. Clique na aba **"Multi-Fonte"**

### 2️⃣ Configure sua Busca

Preencha **pelo menos um** dos campos:

```
✅ Nome do Advogado: "João Silva"
✅ Número OAB: "OAB/SP 123456"
✅ Nome da Parte: "Maria Santos"
✅ Número do Processo: "0000000-00.0000.0.00.0000"
✅ Palavras-chave: "intimação, sentença"
```

Defina o período:
```
Data Início: 2025-01-01
Data Fim: 2025-01-31
```

### 3️⃣ Buscar e Exportar

1. Clique em **"Buscar Publicações"**
2. Aguarde a consulta (5-30 segundos)
3. Visualize os resultados
4. **Copie** conteúdos individuais ou **Exporte** tudo em JSON

## Fontes Disponíveis

### 🟢 DJEN - Pronto para Usar

- **O que é**: Diário oficial dos tribunais brasileiros
- **Requer**: Nada! (API pública)
- **Cobertura**: TST, TRT3, TJMG, TRF1, TJES, TJSP, STJ
- **Busca por**: Nome do advogado, OAB, processo, parte

### 🟢 DataJud - Configuração Simples

- **O que é**: Base nacional de processos do CNJ
- **Requer**: API Key gratuita
- **Cobertura**: Todos os tribunais brasileiros
- **Busca por**: Número CNJ do processo

**Como configurar DataJud:**

1. Acesse: https://www.cnj.jus.br/sistemas/datajud/api-publica/
2. Faça cadastro gratuito
3. Solicite chave de API
4. Adicione no arquivo `.env`:
   ```bash
   VITE_DATAJUD_API_KEY=sua_chave_aqui
   ```
5. Reinicie o servidor

### 🟢 Diários Oficiais - Pronto para Usar

- **O que é**: Publicações municipais via Querido Diário
- **Requer**: Nada! (projeto open source)
- **Cobertura**: 4.500+ municípios brasileiros
- **Busca por**: Palavras-chave

### 🟡 PJe Direct - Em Desenvolvimento

- **O que é**: Acesso direto aos sistemas PJe dos tribunais
- **Requer**: Credenciais específicas de cada tribunal
- **Status**: Framework pronto, aguardando credenciais
- **Cobertura**: 30+ tribunais

## Exemplos Práticos

### Exemplo 1: Encontrar suas intimações

```
Nome do Advogado: Thiago Bodevan
Número OAB: OAB/MG 123456
Data Início: Hoje - 7 dias
Data Fim: Hoje
Fontes: DJEN
```

**Resultado**: Todas publicações do DJEN em seu nome nos últimos 7 dias.

### Exemplo 2: Acompanhar processo específico

```
Número do Processo: 0000123-45.2024.8.13.0000
Data Início: 2024-01-01
Data Fim: 2024-12-31
Fontes: DataJud, DJEN
```

**Resultado**: Histórico completo do processo em 2024.

### Exemplo 3: Monitorar publicações municipais

```
Palavras-chave: licitação, edital, pregão
Data Início: Últimos 30 dias
Data Fim: Hoje
Fontes: Diários Oficiais
```

**Resultado**: Editais de licitação publicados em diários municipais.

## Dicas e Truques

### ✅ Maximize Resultados

1. **Use múltiplas fontes**: Deixe todas selecionadas para busca completa
2. **Combine critérios**: Nome + OAB = maior precisão
3. **Períodos curtos no DJEN**: 1-7 dias para melhor performance
4. **Períodos longos nos Diários**: Até 1 ano para gazetas municipais

### ⚡ Otimize Performance

1. **Selecione fontes específicas** se souber onde procurar
2. **Use filtros precisos** para reduzir volume de dados
3. **Consulte tribunais relevantes** apenas

### 📊 Entenda os Resultados

Cada resultado mostra:
- **Fonte**: De onde veio (DJEN, DataJud, etc.)
- **Tipo**: Intimação, sentença, despacho, etc.
- **Data**: Quando foi publicado
- **Conteúdo**: Texto completo da publicação
- **Match**: Como você foi encontrado (nome, OAB, etc.)

## Estatísticas da Busca

Após cada busca, veja:
- ✅ Total de publicações encontradas
- ✅ Quantas fontes foram consultadas
- ✅ Quais tiveram sucesso ou erro
- ✅ Tempo de resposta de cada fonte

## Exportar Resultados

### Copiar Individual
Clique no ícone de **copiar** em cada resultado para copiar o conteúdo.

### Exportar Tudo
Clique em **"Exportar JSON"** no topo dos resultados para baixar tudo em formato JSON.

O arquivo inclui:
```json
{
  "id": "...",
  "source": "djen",
  "title": "Intimação - TJMG",
  "content": "...",
  "publicationDate": "2025-01-15",
  "processNumber": "...",
  "tribunal": "TJMG",
  ...
}
```

## Troubleshooting

### ❌ "Nenhuma publicação encontrada"

**Possíveis causas**:
- Não há publicações no período selecionado
- Critérios de busca muito específicos
- Fonte não tem dados para essa região/tribunal

**Soluções**:
- Amplie o período de busca
- Use critérios mais genéricos
- Tente outras fontes

### ❌ "DataJud API Key não configurada"

**Solução**: Siga o guia de configuração do DataJud acima.

### ❌ "Timeout ao consultar fonte"

**Possíveis causas**:
- API lenta ou indisponível
- Muitos resultados para processar
- Conexão de internet instável

**Soluções**:
- Tente novamente em alguns minutos
- Reduza o período de busca
- Selecione menos tribunais

### ❌ "Erro ao consultar [FONTE]"

**O que fazer**:
1. Verifique logs no console (F12)
2. Teste a fonte individualmente
3. Aguarde e tente novamente
4. Reporte o erro se persistir

## Próximos Passos

Quer mais funcionalidades? Em breve:

- 🔔 **Alertas automáticos** quando houver novas publicações
- 📅 **Agendamento** de buscas recorrentes
- 🤖 **IA para classificação** automática de relevância
- 📧 **Notificações por e-mail** de novas intimações
- 📱 **App mobile** para consultas on-the-go

## Ajuda

- 📖 **Documentação completa**: Veja `MULTI_SOURCE_PUBLICATIONS.md`
- 🔧 **Configuração técnica**: Veja documentação de cada fonte
- 💬 **Suporte**: Abra uma issue no GitHub

---

## Resumo Rápido

1. **Acesse**: Consultas → Multi-Fonte
2. **Preencha**: Nome/OAB/Processo + Período
3. **Busque**: Clique em "Buscar Publicações"
4. **Exporte**: Salve resultados em JSON

**Tempo estimado**: 2-3 minutos por busca

**Fontes grátis**: DJEN, Diários Oficiais
**Fontes com cadastro**: DataJud (gratuito)
**Fontes pagas**: JusBrasil, Escavador (em breve)

---

Pronto! Agora você pode monitorar publicações jurídicas de forma profissional e automatizada! 🚀

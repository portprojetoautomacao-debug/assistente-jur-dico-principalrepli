# 📊 Framework de Avaliação - Assistente Jurídico PJe

Sistema completo de avaliação automática para os 15 agentes de IA jurídicos.

## 🎯 Visão Geral

Este framework avalia a performance dos agentes em 3 métricas críticas:

1. **Precisão de Análise de Intimações** (Mrs. Justin-e)
2. **Qualidade de Redação de Petições** (redacao-peticoes)
3. **Precisão de Cálculo de Prazos** (gestao-prazos)

## 📁 Estrutura de Arquivos

```
data/evaluation/
├── README.md                    # Este arquivo
├── test-queries.json            # 30 queries de teste (10 por métrica)
├── test-responses.json          # Respostas coletadas dos agentes
└── evaluation-report.json       # Relatório de avaliação (gerado)

scripts/evaluation/
├── run-agent-evaluation.cjs     # Runner que coleta respostas dos agentes
└── evaluate_agents.py           # Script Python que calcula métricas
```

## 🚀 Como Usar

### 1. Coletar Respostas dos Agentes

```bash
# Executar runner que chama os agentes com queries de teste
npm run eval:run

# Saída esperada:
# ✅ 30/30 respostas coletadas
# 💾 Salvo em: data/evaluation/test-responses.json
```

### 2. Avaliar Performance

```bash
# Executar avaliação completa com Python
npm run eval:analyze

# Ou com parâmetros customizados:
python scripts/evaluation/evaluate_agents.py \
  --queries data/evaluation/test-queries.json \
  --responses data/evaluation/test-responses.json \
  --output data/evaluation/evaluation-report.json
```

### 3. Executar Pipeline Completo

```bash
# Coleta + Avaliação em um comando
npm run eval:full
```

## 📊 Métricas Detalhadas

### 1️⃣ Precisão de Análise de Intimações

**Agente**: `justine` (Mrs. Justin-e)

**Campos Avaliados**:

- `tipo` - Classificação do tipo de intimação (string)
- `prazo` - Prazo identificado (string, ex: "15 dias")
- `dataLimite` - Data limite calculada (ISO 8601 ou null)
- `urgencia` - Nível de urgência (crítica|alta|normal|baixa)
- `requerManifestacao` - Se requer resposta (boolean)

**Cálculo de Accuracy**:

```
Accuracy = (acertos_tipo + acertos_prazo + acertos_dataLimite + acertos_urgencia + acertos_manifestacao) / 5
```

**Exemplo de Query**:

```json
{
  "id": "intimacao_001",
  "metric": "Precisão de Análise de Intimações",
  "input": {
    "texto": "Fica a parte INTIMADA para apresentar CONTESTAÇÃO no prazo de 15 dias...",
    "dataPublicacao": "2024-12-01"
  },
  "expected_output": {
    "tipo": "Contestação",
    "prazo": "15 dias",
    "dataLimite": "2024-12-20",
    "urgencia": "normal",
    "requerManifestacao": true
  }
}
```

### 2️⃣ Qualidade de Redação de Petições

**Agente**: `redacao-peticoes`

**Campos Avaliados**:

- `estrutura` - Array de seções presentes (mínimo 4 esperado)
- `fundamentacaoJuridica` - Fundamentação presente (boolean)
- `citacaoLegislacao` - Citações legais adequadas (boolean)
- `jurisprudencia` - Referências a precedentes (boolean)
- `petitosClaros` - Pedidos objetivos (boolean)
- `linguagemFormal` - Linguagem técnica adequada (boolean)

**Cálculo de Accuracy**:

```
Accuracy = média de acertos nos 6 campos
```

**Exemplo de Query**:

```json
{
  "id": "peticao_001",
  "metric": "Qualidade de Redação de Petições",
  "input": {
    "tipo": "Petição Inicial",
    "assunto": "Ação de Cobrança",
    "detalhes": "Cliente prestou serviços no valor de R$ 50.000,00..."
  },
  "expected_output": {
    "estrutura": ["Qualificação", "Fatos", "Direito", "Pedidos"],
    "fundamentacaoJuridica": true,
    "citacaoLegislacao": true,
    "jurisprudencia": true,
    "petitosClaros": true,
    "linguagemFormal": true
  }
}
```

### 3️⃣ Precisão de Cálculo de Prazos

**Agente**: `gestao-prazos`

**Campos Avaliados**:

- `dataLimite` - Data final calculada (ISO 8601)
- `diasCorridos` - Número de dias corridos (number)
- `diasUteis` - Número de dias úteis (number ou null)
- `feriadosNoIntervalo` - Lista de feriados detectados (array)
- `alertas` - Avisos relevantes (array)

**Cálculo de Accuracy**:

```
Accuracy = (acertos_dataLimite + acertos_diasCorridos + acertos_diasUteis + acertos_feriados + acertos_alertas) / 5
```

**Exemplo de Query**:

```json
{
  "id": "prazo_001",
  "metric": "Precisão de Cálculo de Prazos",
  "input": {
    "prazo": "15 dias",
    "dataInicio": "2024-12-01",
    "tipo": "dias corridos"
  },
  "expected_output": {
    "dataLimite": "2024-12-16",
    "diasCorridos": 15,
    "diasUteis": null,
    "feriadosNoIntervalo": [],
    "alertas": []
  }
}
```

## 📈 Interpretação de Resultados

### Scores de Accuracy

| Faixa   | Interpretação             | Ação Recomendada            |
| ------- | ------------------------- | --------------------------- |
| 90-100% | ✅ Excelente              | Manter monitoramento        |
| 70-90%  | ⚠️ Bom, mas pode melhorar | Revisar casos de erro       |
| 50-70%  | 🔴 Abaixo do esperado     | Refatorar lógica do agente  |
| <50%    | ❌ Crítico                | Revisão completa necessária |

### Exemplo de Relatório

```json
{
  "timestamp": "2024-12-13T10:30:00Z",
  "total_queries": 30,
  "overall_accuracy": 0.85,
  "metric_results": [
    {
      "metric_name": "Precisão de Análise de Intimações",
      "agent_id": "justine",
      "accuracy": 0.92,
      "precision": 0.92,
      "recall": 0.92,
      "f1_score": 0.92,
      "detailed_scores": {
        "accuracy_tipo": 0.95,
        "accuracy_prazo": 0.9,
        "accuracy_dataLimite": 0.88,
        "accuracy_urgencia": 0.93,
        "accuracy_manifestacao": 0.94
      }
    }
  ],
  "recommendations": [
    "✅ justine: Excelente performance (92%)!",
    "🔍 justine: Focar em melhorar: accuracy_dataLimite"
  ]
}
```

## 🔧 Customizações

### Adicionar Nova Query

Editar `test-queries.json`:

```json
{
  "id": "intimacao_011",
  "metric": "Precisão de Análise de Intimações",
  "input": {
    "texto": "...",
    "dataPublicacao": "..."
  },
  "expected_output": {
    "tipo": "...",
    "prazo": "..."
  }
}
```

### Adicionar Nova Métrica

1. **Criar Avaliador** em `evaluate_agents.py`:

```python
class NovaMetricaEvaluator:
    def __init__(self):
        self.metric_name = "Nome da Nova Métrica"
        self.agent_id = "id-do-agente"

    def evaluate(self, responses: List[Dict]) -> MetricResult:
        # Implementar lógica de avaliação
        pass
```

2. **Registrar Avaliador**:

```python
# Em AgentEvaluationFramework.__init__
self.evaluators.append(NovaMetricaEvaluator())
```

3. **Adicionar Queries** para nova métrica em `test-queries.json`

### Alterar Limites de Accuracy

Em `evaluate_agents.py`, função `_generate_recommendations`:

```python
if result.accuracy < 0.7:  # Alterar para 0.8 se quiser ser mais rigoroso
    recommendations.append("⚠️ Accuracy baixa...")
```

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'json'"

Você precisa ter Python 3.8+ instalado:

```bash
python --version  # Deve ser 3.8 ou superior
```

### Erro: "FileNotFoundError: test-queries.json not found"

Execute o comando a partir da raiz do projeto:

```bash
cd c:\Users\thiag\OneDrive\Documentos\GitHub\assistente-jur-dico-principal\.git\assistente-jur-dico-principal
npm run eval:analyze
```

### Agent Runner falha ao executar

Verificar se o servidor de desenvolvimento está rodando:

```bash
npm run dev
```

Ou executar apenas com mocks (padrão):

```bash
npm run eval:run  # Usa respostas simuladas
```

## 📚 Próximos Passos

- [ ] Adicionar visualizações (gráficos) ao relatório
- [ ] Integrar com CI/CD para avaliação contínua
- [ ] Criar dashboard web para visualizar resultados
- [ ] Expandir para os outros 12 agentes
- [ ] Implementar comparação entre versões de agentes

## 🤝 Contribuindo

Para adicionar novas queries ou métricas:

1. Edite os arquivos JSON apropriados
2. Execute `npm run eval:full` para validar
3. Commit as mudanças se accuracy >= 70%

---

**Documentação**: `docs/EVALUATION_FRAMEWORK.md`  
**Suporte**: Consulte as instruções do Copilot em `.github/copilot-instructions.md`

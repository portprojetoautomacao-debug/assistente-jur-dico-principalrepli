# Prompts

Diretório de prompts em formato YAML (`.prompt.yaml` ou `.prompt.yml`) para uso com o tooling de IA no GitHub. Campos em inglês, descrições e textos em PT-BR.

## Convenções

- Nome dos arquivos: `prompts/<area>/<nome>.prompt.yaml` (quando houver subárea) ou diretamente em `prompts/`.
- Estrutura básica:
  - `name`, `description`, `model`, `modelParameters`
  - `messages` com placeholders `{{variavel}}`
  - `testData` com `input`/`expected` (ou campos específicos do caso)
  - `evaluators` para validações de saída (string, regex, etc.)
- Respostas esperadas sempre em português, conforme exemplos.

## Arquivos atuais

- `text-summarizer.prompt.yaml`: resumo conciso iniciando com "Resumo -".
- `risk-analysis.prompt.yaml`: classificação de risco jurídico (baixo/médio/alto) com ação recomendada.
- `contract-review.prompt.yaml`: revisão de cláusulas-chave (Prazo, Multa, Rescisão, Confidencialidade).

## Boas práticas

- Mantenha `temperature` baixo/moderado para previsibilidade em cenários jurídicos.
- Inclua `testData` realista e `evaluators` para evitar regressões ao ajustar mensagens ou parâmetros.
- Evite PII em exemplos; use casos genéricos.
- Versione ajustes em `modelParameters` e mensagens para rastrear impacto nos diffs.

# 🚀 Quick Start - Evaluation Framework

## TL;DR - Execute em 2 comandos

```bash
# 1. Coletar respostas dos agentes (30 queries)
npm run eval:run

# 2. Avaliar e gerar relatório
npm run eval:analyze

# Ou tudo de uma vez:
npm run eval:full
```

## 📊 O que o Framework Avalia?

### Agente: Mrs. Justin-e (`justine`)
**Métrica**: Precisão de Análise de Intimações  
**Avalia**: Tipo, prazo, data limite, urgência, necessidade de manifestação

### Agente: Redação de Petições (`redacao-peticoes`)
**Métrica**: Qualidade de Redação de Petições  
**Avalia**: Estrutura, fundamentação jurídica, citações, jurisprudência, clareza

### Agente: Gestão de Prazos (`gestao-prazos`)
**Métrica**: Precisão de Cálculo de Prazos  
**Avalia**: Data limite, dias corridos/úteis, feriados, alertas

## 🎯 Interpretação dos Resultados

```
✅ 90-100%: Excelente - Manter monitoramento
⚠️  70-90%: Bom, mas pode melhorar - Revisar erros
🔴 50-70%: Abaixo do esperado - Refatorar agente
❌ <50%: Crítico - Revisão completa necessária
```

## 📁 Arquivos Importantes

- **test-queries.json**: 30 queries de teste (10 por métrica)
- **test-responses.json**: Respostas coletadas dos agentes
- **evaluation-report.json**: Relatório final com scores

## 🛠️ Comandos Disponíveis

```bash
# Coletar respostas
npm run eval:run

# Avaliar performance
npm run eval:analyze

# Pipeline completo
npm run eval:full

# Customizar output
py scripts/evaluation/evaluate_agents.py --output custom-report.json
```

## 📈 Resultado Atual (Baseline)

**Última execução**: 13/12/2024

| Agente | Métrica | Accuracy | Status |
|--------|---------|----------|--------|
| justine | Intimações | 70% | ⚠️ Melhorar |
| redacao-peticoes | Petições | 98.3% | ✅ Excelente |
| gestao-prazos | Prazos | 73% | ⚠️ Melhorar |

**Accuracy Geral**: 80.4%

### 🔍 Principais Problemas Identificados

**Mrs. Justin-e**:
- accuracy_tipo: 10% - Classificação de tipo de intimação muito baixa
- accuracy_dataLimite: 60% - Cálculo de data limite precisa melhorar

**Gestão de Prazos**:
- accuracy_dataLimite: 50% - Inconsistente com esperado
- accuracy_diasCorridos: 50% - Erro em cálculos básicos

**Redação de Petições**:
- jurisprudencia: 90% - Ocasionalmente não inclui precedentes

## 🎓 Próximos Passos

1. **Corrigir agent `justine`**: Melhorar classificação de tipos de intimação
2. **Corrigir agent `gestao-prazos`**: Validar lógica de cálculo de datas
3. **Expandir dataset**: Adicionar mais queries de teste
4. **Automatizar**: Integrar com CI/CD

## 📚 Documentação Completa

Ver: [data/evaluation/README.md](./README.md)

---

**Status**: ✅ Framework implementado e funcional  
**Versão**: 1.0.0  
**Última atualização**: 13/12/2024

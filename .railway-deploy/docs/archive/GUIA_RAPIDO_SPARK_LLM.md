# Guia Rápido - Recursos Avançados Spark LLM

## 🚀 Início Rápido

Este guia mostra como usar os novos recursos de IA implementados no Assistente Jurídico PJe.

---

## 📊 Dashboard de Observabilidade LLM

### Como Acessar
1. Faça login na aplicação
2. No menu lateral, clique em **"Observabilidade LLM"**
3. Você verá o dashboard com métricas em tempo real

### O Que Você Verá

#### Cards Principais (Topo)
```
┌────────────────────────────────────────────────────────────────┐
│  ⚡ Total Requisições  │  ⏰ Latência Média  │  💰 Custo Total  │  💾 Taxa Cache  │
│      1,234 (98%)       │      1.5s           │   R$ 45.20      │     62%         │
└────────────────────────────────────────────────────────────────┘
```

#### Tabs de Análise
- **Modelos**: Veja uso por GPT-4o, GPT-4, GPT-3.5-turbo
- **Features**: Análise por funcionalidade (NER, sentimento, etc.)
- **Performance**: Estatísticas de cache e requisições recentes
- **Auditoria**: Log completo de todas as operações

### Ações Disponíveis
- **Período**: Selecione 1h, 24h, 7d ou 30d
- **Atualizar**: Clique para refresh manual (auto: 30s)
- **Limpar Cache**: Botão na tab Performance

### Quando Usar
- Monitorar custos de IA
- Verificar performance do sistema
- Auditar operações de usuários
- Otimizar uso de cache

---

## 🧠 Dashboard NLP Avançado

### Como Acessar
1. Faça login na aplicação
2. No menu lateral, clique em **"NLP Avançado"**
3. Você verá interface de processamento de documentos

### Passo a Passo

#### 1. Cole o Documento
```
┌──────────────────────────────────────────────────────────┐
│  Texto para Análise                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Cole aqui o texto do documento jurídico...         │  │
│  │                                                     │  │
│  │ Exemplo:                                           │  │
│  │ "PETIÇÃO INICIAL                                   │  │
│  │  Processo nº 0001234-56.2024.8.26.0100            │  │
│  │  Autor: João da Silva                             │  │
│  │  Réu: Empresa XYZ Ltda                            │  │
│  │  Valor: R$ 50.000,00..."                          │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

#### 2. Escolha a Operação
```
┌─────────────────────────────────────────────────────────────┐
│  [⚡ Análise Completa]  [🏷️ Entidades]  [📊 Sentimento]    │
│  [🔍 Classificar]       [🧠 Extrair Info]                  │
└─────────────────────────────────────────────────────────────┘
```

**Análise Completa**: Executa todas as operações em paralelo (recomendado)
**Entidades**: Apenas extrai nomes, organizações, datas, valores, etc.
**Sentimento**: Apenas analisa o tom do documento
**Classificar**: Apenas identifica tipo de documento
**Extrair Info**: Apenas extrai informações estruturadas

#### 3. Veja os Resultados

**Tab Entidades**
```
┌──────────────────────────────────────────────────────────┐
│  Entidades Nomeadas (15)                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  João da Silva          [PERSON] 95% confiança    │  │
│  │  Empresa XYZ Ltda       [ORGANIZATION] 92%        │  │
│  │  R$ 50.000,00          [MONETARY_VALUE] 98%       │  │
│  │  Art. 389 CC           [LEGAL_REFERENCE] 90%      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Tab Sentimento**
```
┌──────────────────────────────────────────────────────────┐
│  Análise de Sentimento                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │        😊 POSITIVO                                 │  │
│  │        Score: 0.75                                 │  │
│  │        89% de confiança                            │  │
│  │                                                     │  │
│  │  Aspectos:                                         │  │
│  │  • Argumentação jurídica: Positivo (0.82)         │  │
│  │  • Fundamentação legal: Neutro (0.05)             │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Tab Classificação**
```
┌──────────────────────────────────────────────────────────┐
│  Classificação do Documento                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Categoria: Petição Inicial                        │  │
│  │  Subcategoria: Ação de Cobrança                    │  │
│  │  Confiança: 92%                                    │  │
│  │                                                     │  │
│  │  Tags: [cível] [contrato] [inadimplência]         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Tab Extração**
```
┌──────────────────────────────────────────────────────────┐
│  Informações Extraídas                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  RESUMO:                                           │  │
│  │  Ação de cobrança referente a contrato de          │  │
│  │  prestação de serviços no valor de R$ 50.000,00... │  │
│  │                                                     │  │
│  │  PONTOS-CHAVE:                                     │  │
│  │  ✓ Valor principal: R$ 50.000,00                   │  │
│  │  ✓ Inadimplência desde março/2024                  │  │
│  │  ✓ Cláusula penal: 10%                             │  │
│  │                                                     │  │
│  │  DATAS: [15/03/2024] [30/04/2024]                  │  │
│  │  VALORES: [R$ 50.000,00] [R$ 5.000,00]             │  │
│  │  REFERÊNCIAS: [Art. 389 CC] [Art. 395 CC]          │  │
│  │  PARTES: [Empresa XYZ] [José Santos]              │  │
│  └────────────────────────────────────────────────────┘  │
│  [📋 Copiar] [💾 Download JSON]                          │
└──────────────────────────────────────────────────────────┘
```

### Quando Usar

**Análise de Intimações:**
1. Cole texto da intimação
2. Clique "Análise Completa"
3. Veja prazos extraídos automaticamente
4. Copie informações relevantes

**Análise de Contratos:**
1. Cole texto do contrato
2. Clique "Análise Completa"
3. Veja partes, valores e cláusulas
4. Download JSON para arquivo

**Classificação de Documentos:**
1. Cole documento desconhecido
2. Clique "Classificar"
3. Sistema identifica tipo automaticamente

**Extração de Dados:**
1. Cole documento longo
2. Clique "Extrair Info"
3. Obtenha resumo + dados estruturados

---

## 💡 Dicas de Uso

### Maximize a Performance
- ✅ Use "Análise Completa" para documentos novos
- ✅ Cache automático para documentos repetidos (0ms!)
- ✅ Batch processing para múltiplos documentos

### Controle de Custos
- 📊 Monitore dashboard de Observabilidade
- 💰 Cache reduz custos em até 100%
- 📈 Veja custos por feature

### Melhores Práticas
- 📝 Textos mais limpos = melhores resultados
- 🔄 Análise completa mais eficiente que individual
- 💾 Export JSON para integração com outras ferramentas

---

## 📱 Atalhos de Teclado

```
Ctrl + K  → Buscar processos
Ctrl + N  → Novo processo
Ctrl + D  → Dashboard principal
?         → Mostrar todos os atalhos
```

---

## 🔧 Casos de Uso Práticos

### 1. Processar 50 Intimações
```
1. Copie todas as intimações para um arquivo
2. Use API batch (veja documentação técnica)
3. Processe todas em paralelo
4. Obtenha prazos de todas automaticamente
```

### 2. Comparar Versões de Contrato
```
1. Abra NLP Avançado
2. Cole versão original
3. Execute "Extrair Info"
4. Repita com versão revisada
5. Compare JSONs exportados
```

### 3. Monitorar Custos Mensais
```
1. Abra Observabilidade LLM
2. Selecione período "30 dias"
3. Tab "Features" → veja custos por área
4. Tab "Auditoria" → exporte relatório
```

### 4. Classificar Documentos em Massa
```
1. Use batch processing API
2. Envie array de documentos
3. Receba classificações de todos
4. Organize por categoria automaticamente
```

---

## 🆘 Troubleshooting

### Cache não está funcionando
- Verifique se `useCache: true` está configurado
- Limpeza manual: Dashboard Observabilidade → Tab Performance → Limpar Cache

### Latência alta
- Normal para primeira execução (sem cache)
- Verifique dashboard: Tab Performance
- Cache hit = 0ms, miss = 1-5s

### Erro de requisição
- Tab Auditoria mostra detalhes do erro
- Sistema tem retry automático (3 tentativas)
- Verifique conexão com Spark LLM

---

## 📖 Documentação Completa

**Detalhada:** `SPARK_LLM_ADVANCED_FEATURES.md`
**Technical:** Código em `src/lib/llm-service.ts` e `src/lib/nlp-pipeline.ts`

---

## ✅ Checklist de Primeiro Uso

- [ ] Login na aplicação
- [ ] Abrir "Observabilidade LLM" → ver métricas
- [ ] Abrir "NLP Avançado" → testar com documento
- [ ] Executar "Análise Completa" em uma intimação
- [ ] Ver resultados nas 4 tabs
- [ ] Exportar JSON de um resultado
- [ ] Verificar cache funcionando (segunda análise = 0ms)
- [ ] Monitorar custos no dashboard

---

**Pronto!** Você está usando ferramentas de IA de classe empresarial! 🚀

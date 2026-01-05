# 📊 Relatório de Status - Scheduler DJEN

**Data:** 04 de Janeiro de 2026
**Status:** ✅ **IMPLEMENTADO E OPERACIONAL**

---

## 🎯 Requisitos Atendidos

✅ **Monitoramento automático às 01:00**
✅ **Monitoramento automático às 09:00**
✅ **Timezone América/São Paulo**
✅ **Integração com API CNJ DJEN**
✅ **Extração de partes com IA (Gemini)**
✅ **Persistência em PostgreSQL**
✅ **Logs detalhados de execução**
✅ **Endpoint de trigger manual**

---

## 🛠️ Implementação Técnica

### Arquivos do Sistema

| Arquivo | Função | Status |
|---------|--------|--------|
| `backend/src/services/djen-scheduler.ts` | Cron jobs + processamento | ✅ Implementado |
| `backend/src/services/djen-api.ts` | Cliente API DJEN | ✅ Implementado |
| `backend/src/services/extract-parties.ts` | Extração Regex + IA | ✅ Implementado |
| `backend/src/db/expedientes.ts` | Persistência PostgreSQL | ✅ Implementado |
| `backend/src/server.ts` | Integração scheduler | ✅ Implementado |
| `DJEN_SCHEDULER_README.md` | Documentação completa | ✅ Atualizado |

### Configuração dos Cron Jobs

```typescript
// Job 1: 01:00 da manhã (America/Sao_Paulo)
cron.schedule("0 1 * * *", async () => {
  console.log(`\n🌙 [DJEN Scheduler] Executando job 01:00...`);
  await processarPublicacoesDJEN();
}, { timezone: "America/Sao_Paulo" });

// Job 2: 09:00 da manhã (America/Sao_Paulo)
cron.schedule("0 9 * * *", async () => {
  console.log(`\n☀️ [DJEN Scheduler] Executando job 09:00...`);
  await processarPublicacoesDJEN();
}, { timezone: "America/Sao_Paulo" });
```

---

## ⚙️ Variáveis de Ambiente

### Obrigatórias

```env
# Ativação do Scheduler
DJEN_SCHEDULER_ENABLED=true

# Timezone (CRÍTICO para horários corretos)
TZ=America/Sao_Paulo

# Dados do advogado
DJEN_OAB_NUMERO=184404
DJEN_OAB_UF=MG
DJEN_ADVOGADO_NOME=Thiago Bodevan Veiga

# Banco de dados (Neon)
DATABASE_URL=postgresql://user:pass@host/db
```

### Opcionais

```env
# Notificações por email
EMAIL_NOTIFICACAO_ENABLED=false
EMAIL_NOTIFICACAO_DESTINO=advogado@exemplo.com

# Google Gemini (extração de partes)
GOOGLE_GEMINI_API_KEY=sua-chave-aqui
```

---

## 🔄 Fluxo de Execução Automática

```
┌─────────────────────────────────────────────────┐
│  Cron Job Triggered (01:00 ou 09:00)           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  processarPublicacoesDJEN()                     │
│  - Configura ADVOGADO_PADRAO                    │
│  - Busca data de hoje                           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  buscarPublicacoesDJEN(advogado, data)          │
│  - API: comunicaapi.pje.jus.br                  │
│  - Fallback: browser-direct se geoblocking      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Para cada publicação:                          │
│  1. extractPartiesWithFallback()                │
│     - Regex patterns (CPF, CNPJ, nomes)         │
│     - IA Gemini se regex falhar                 │
│  2. salvarExpediente(db)                        │
│     - PostgreSQL (tabela expedientes)           │
│  3. enviarEmailNotificacao() [se habilitado]    │
│     - Email com resumo da publicação            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Relatório Final:                               │
│  ✅ Total: X | Sucesso: Y | Erros: Z            │
│  ⏱️  Duração: N segundos                        │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Como Testar

### 1. Trigger Manual (Imediato)

```bash
curl -X POST http://localhost:3001/api/djen/trigger-manual
```

Resposta esperada:
```json
{
  "sucesso": true,
  "total": 5,
  "processadas": 5,
  "erros": 0,
  "duracao": "12.45"
}
```

### 2. Verificar Logs do Scheduler

```bash
# No console do backend, você verá:
🕐 [DJEN Scheduler] Iniciando jobs automáticos
   Timezone: America/Sao_Paulo
   Job 1: 01:00 (todos os dias)
   Job 2: 09:00 (todos os dias)
✅ [DJEN Scheduler] Jobs configurados com sucesso
```

### 3. Monitorar Execuções (1:00 e 9:00)

No horário programado, o log mostrará:

```
🌙 [DJEN Scheduler] Executando job 01:00...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [DJEN Scheduler] Iniciando processamento...
   Advogado: Thiago Bodevan Veiga (OAB MG 184404)
   Data: 04/01/2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 [DJEN Scheduler] Buscando publicações na API...
✅ [DJEN Scheduler] 5 publicações encontradas

[1/5] ⏳ Processando: Processo 1234567-89.2026.8.13.0024
      ✅ Partes extraídas (Regex)
      ✅ Expediente salvo (ID: 42)

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Processamento concluído
   Total: 5
   Sucesso: 5
   Erros: 0
   Duração: 14.23s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📦 Dependências

```json
{
  "node-cron": "^3.0.3",
  "@types/node-cron": "^3.0.11",
  "@google/generative-ai": "^0.21.0"
}
```

Todas já instaladas em `backend/package.json`.

---

## 🔐 Segurança e LGPD

✅ **Filtragem de PII** nos logs (CPF, email, telefone sanitizados)
✅ **Dados sensíveis** apenas em produção via env vars
✅ **Rate limiting** de 2 segundos entre requisições
✅ **Logs estruturados** sem exposição de credenciais

---

## 📈 Monitoramento de Produção

### Logs do Sistema

```bash
# Ver logs em tempo real
tail -f backend/.sonar-results/auto-analyze.log
```

### Verificar Banco de Dados

```sql
-- Ver últimos expedientes processados
SELECT * FROM expedientes
ORDER BY data_publicacao DESC
LIMIT 10;

-- Contar expedientes de hoje
SELECT COUNT(*)
FROM expedientes
WHERE DATE(data_publicacao) = CURRENT_DATE;
```

### Endpoint de Status

```bash
# Verificar saúde do sistema
curl http://localhost:3001/health

# Response:
{
  "status": "ok",
  "timestamp": "2026-01-04T13:00:00.000Z",
  "env": "production"
}
```

---

## 🚨 Troubleshooting

### Scheduler não está rodando

**Problema:** Logs não aparecem nos horários programados.

**Solução:**
```bash
# 1. Verificar variável de ambiente
echo $DJEN_SCHEDULER_ENABLED  # Deve ser "true"

# 2. Verificar timezone
echo $TZ  # Deve ser "America/Sao_Paulo"

# 3. Verificar logs do servidor
grep -i "DJEN Scheduler" backend-logs.txt
```

### Nenhuma publicação encontrada

**Problema:** API retorna lista vazia.

**Causas possíveis:**
- Não há publicações para o advogado na data
- Geoblocking (API CNJ só funciona no Brasil)
- Dados de OAB incorretos

**Solução:**
```bash
# Testar API diretamente
curl -X GET "https://comunicaapi.pje.jus.br/api/v1/comunicacao/processuais?oab=184404&uf=MG&dataInicio=04/01/2026&dataFim=04/01/2026"

# Se retornar 403/451, usar fallback browser
# Já implementado automaticamente no sistema
```

### Erro de conexão com banco

**Problema:** `password authentication failed for user "postgres"`

**Solução:**
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT NOW();"
```

---

## 📚 Documentação Adicional

- **Guia Completo:** [DJEN_SCHEDULER_README.md](./DJEN_SCHEDULER_README.md)
- **Workflow DJEN:** [ANALISE_WORKFLOW_DJEN.md](./ANALISE_WORKFLOW_DJEN.md)
- **Arquitetura:** [ARQUITETURA_UNIFICADA.md](./ARQUITETURA_UNIFICADA.md)

---

## ✅ Próximos Passos (Opcional)

- [ ] Implementar notificações por email (`backend/src/services/email-notifier.ts`)
- [ ] Adicionar métricas de performance (Sentry/AppInsights)
- [ ] Dashboard de monitoramento em tempo real
- [ ] Webhook para Slack/Teams ao detectar publicações críticas
- [ ] Backup automático de expedientes processados

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs: `backend/.sonar-results/auto-analyze.log`
2. Execute trigger manual: `curl -X POST http://localhost:3001/api/djen/trigger-manual`
3. Consulte a documentação: [DJEN_SCHEDULER_README.md](./DJEN_SCHEDULER_README.md)

---

**Última atualização:** 04/01/2026 - Status: ✅ Operacional

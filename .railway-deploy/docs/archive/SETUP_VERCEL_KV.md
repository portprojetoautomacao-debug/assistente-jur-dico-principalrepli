# 🗄️ Configuração do Vercel KV - Assistente Jurídico PJe

## Visão Geral

Este guia mostra como configurar o **Vercel KV** (Key-Value Database) para armazenar dados dos agentes autônomos e advogados monitorados.

---

## 🎯 Por Que Precisamos do KV?

O sistema armazena:
- ✅ **7 agentes autônomos** (configuração e status)
- ✅ **Advogados monitorados** (OAB, tribunais, e-mail)
- ✅ **Fila de tarefas** dos agentes
- ✅ **Histórico de tarefas** completadas
- ✅ **Notificações** de publicações DJEN

---

## 📋 Configuração via Dashboard (Recomendado)

### Passo 1: Acesse o Projeto
```
https://vercel.com/thiagos-projects-9834ca6f/assistente-jurdico-p
```

### Passo 2: Navegue até Storage
1. Clique na aba **Storage** (ícone 🗄️)
2. Ou acesse diretamente: https://vercel.com/thiagos-projects-9834ca6f/assistente-jurdico-p/stores

### Passo 3: Crie o Database KV
1. Clique em **Create Database**
2. Selecione **KV** (Key-Value)
3. Configure:
   - **Name**: `assistente-juridico-kv`
   - **Region**: `iad1` (Washington, D.C., USA - mais próximo do Brasil)
   - **Pricing**: Hobby (Free até 256 MB)
4. Clique em **Create**

### Passo 4: Variáveis de Ambiente Criadas Automaticamente
O Vercel cria automaticamente:
```
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxxxx
KV_REST_API_READ_ONLY_TOKEN=xxxxx
```

Disponível em: Production, Preview, Development

---

## 🧪 Teste a Configuração

### 1. Inicialize os Dados
Execute este comando após criar o KV:
```bash
curl -X POST 'https://assistente-jurdico-p.vercel.app/api/kv?action=init' | jq .
```

**Resposta esperada:**
```json
{
  "ok": true,
  "message": "Configuração inicializada com sucesso!",
  "data": {
    "agentes": 7,
    "advogado": {
      "name": "Thiago Bodevan Veiga",
      "oab": "184404/MG",
      "email": "thiagobodevanadvocacia@gmail.com",
      "tribunals": ["TJMG", "TRT3", "TST", "STJ", "TRF1"]
    },
    "keys": [
      "autonomous-agents",
      "monitored-lawyers",
      "agent-task-queue",
      "completed-agent-tasks"
    ]
  }
}
```

### 2. Verifique os Dados Salvos
```bash
# Listar advogados monitorados
curl 'https://assistente-jurdico-p.vercel.app/api/kv?key=monitored-lawyers' | jq .

# Listar agentes
curl 'https://assistente-jurdico-p.vercel.app/api/kv?key=autonomous-agents' | jq .
```

### 3. Teste o Cron de Monitoramento DJEN
```bash
curl -X POST 'https://assistente-jurdico-p.vercel.app/api/cron?action=djen-monitor' | jq .
```

**Resposta esperada:**
```json
{
  "ok": true,
  "checked": 1,
  "lawyers": [{
    "name": "Thiago Bodevan Veiga",
    "oab": "184404/MG",
    "tribunals": ["TJMG", "TRT3", "TST", "STJ", "TRF1"],
    "resultados": {...}
  }]
}
```

---

## 🔧 Configuração via CLI (Alternativa)

Infelizmente, o Vercel CLI **não suporta** criar KV databases diretamente. Use o dashboard web.

### Comandos Disponíveis:
```bash
# Vincular projeto
vercel link --yes

# Ver variáveis de ambiente
vercel env ls

# Abrir dashboard (se xdg-open disponível)
vercel open
```

---

## 📊 Limites do Plano Hobby (Free)

| Recurso | Limite |
|---------|--------|
| **Storage** | 256 MB |
| **Comandos/mês** | 3.000.000 |
| **Bandwidth** | 100 GB/mês |
| **Databases** | 1 KV database |

**Uso estimado do projeto:**
- Agentes + Advogado: ~50 KB
- Tarefas (100/dia): ~500 KB/mês
- Notificações: ~1 MB/mês
- **Total**: ~2 MB/mês (1% do limite)

---

## 🚨 Troubleshooting

### Erro: "KV_REST_API_URL is not defined"
**Solução:**
1. Verifique se o database foi criado: https://vercel.com/thiagos-projects-9834ca6f/assistente-jurdico-p/stores
2. Aguarde 1-2 minutos após criação
3. Force redeploy: `vercel --prod`

### Erro: "Failed to save to KV"
**Solução:**
1. Verifique se está em produção (não localhost)
2. Check variáveis: `vercel env ls | grep KV`
3. Teste direto na API: `curl /_spark/kv`

### Cron não encontra advogados
**Solução:**
```bash
# Reinicialize os dados
curl -X POST 'https://assistente-jurdico-p.vercel.app/api/kv?action=init'

# Verifique se salvou
curl 'https://assistente-jurdico-p.vercel.app/api/kv?key=monitored-lawyers'
```

---

## 📚 Arquivos Relacionados

- **api/kv.ts** - Endpoint KV com ação `init`
- **api/cron.ts** - Cron jobs que usam KV (DJEN monitor)
- **lib/api/kv-utils.ts** - Funções helper para KV
- **INICIALIZAR_AGENTES_BROWSER.js** - Script alternativo (localStorage)

---

## 🎯 Próximos Passos

Após configurar o KV:

1. ✅ Execute `/api/kv?action=init` para popular dados iniciais
2. ✅ Teste o cron `/api/cron?action=djen-monitor`
3. ✅ Verifique no dashboard: https://assistente-jurdico-p.vercel.app
4. ✅ Configure Google Calendar (ver: GOOGLE_CALENDAR_INTEGRATION.md)
5. ✅ Configure OAuth (ver: OAUTH_SETUP.md)

---

## 📞 Suporte

- **Documentação Vercel KV**: https://vercel.com/docs/storage/vercel-kv
- **Dashboard do Projeto**: https://vercel.com/thiagos-projects-9834ca6f/assistente-jurdico-p
- **Logs em Tempo Real**: https://vercel.com/thiagos-projects-9834ca6f/assistente-jurdico-p/logs

---

**Status**: ⏳ Aguardando criação do database no dashboard

**Última atualização**: 21/11/2025

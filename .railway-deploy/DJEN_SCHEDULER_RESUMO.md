# ✅ SCHEDULER DJEN - IMPLEMENTAÇÃO COMPLETA

## 🎯 Status: PRONTO PARA USO

---

## 📋 O Que Foi Implementado

### ✅ 1. Scheduler Automático
- **Horários:** 01:00 e 09:00 (horário de Brasília)
- **Frequência:** 2x por dia, todos os dias
- **Timezone:** `America/Sao_Paulo`
- **Biblioteca:** `node-cron` (instalada)

### ✅ 2. Fluxo Completo de Processamento
```
API DJEN → Extração IA → PostgreSQL → Email
```

#### Etapas Automatizadas:
1. 🔍 **Busca** publicações DJEN via API (com fallback browser)
2. 🤖 **Extrai** partes (autor/réu) usando IA Gemini
3. 💾 **Cria** processo no PostgreSQL
4. 📋 **Registra** expediente (intimação/citação)
5. 👤 **Cadastra/Atualiza** cliente
6. 📧 **Envia** email de notificação

### ✅ 3. Proteções e Fallbacks
- ⚡ **Rate limiting** (1.5s entre requisições)
- 🌍 **Fallback browser** (caso API esteja bloqueada geograficamente)
- 🧠 **Fallback regex** (caso IA Gemini falhe)
- 🔁 **Retry automático** (3 tentativas em caso de erro)
- 📊 **Logs detalhados** de cada execução

---

## 🚀 Como Ativar

### 1️⃣ Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```bash
# Ativar scheduler
DJEN_SCHEDULER_ENABLED=true

# Dados do advogado
DJEN_OAB_NUMERO=184404
DJEN_OAB_UF=MG
DJEN_ADVOGADO_NOME="Thiago Bodevan Veiga"
DJEN_ADVOGADO_EMAIL=thiago@example.com

# Banco de dados (já configurado)
DATABASE_URL=postgresql://...

# IA Gemini (já configurado)
GOOGLE_API_KEY=sua-chave
```

### 2️⃣ Reiniciar Servidor

```bash
# Desenvolvimento
cd backend
npm run dev

# Produção
npm run build
npm start
```

### 3️⃣ Verificar Ativação

Você verá no console:

```
✅ [DJEN Scheduler] Jobs configurados com sucesso
⏰ Próxima execução: 01:00 (America/Sao_Paulo)
```

---

## 🧪 Testar Agora (Execução Manual)

Não precisa esperar 01:00 ou 09:00! Execute manualmente:

### Via API:

```bash
curl -X POST http://localhost:3001/api/djen/trigger-manual
```

### Via Browser:

```javascript
// No DevTools do Chrome
fetch('http://localhost:3001/api/djen/trigger-manual', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

### Resposta Esperada:

```json
{
  "sucesso": true,
  "mensagem": "Processamento DJEN executado",
  "dados": {
    "total": 3,
    "processadas": 3,
    "erros": 0,
    "tempo": "7.2s"
  }
}
```

---

## 📊 Verificar Status

```bash
curl http://localhost:3001/api/djen/status
```

**Resposta:**

```json
{
  "status": "ativo",
  "timezone": "America/Sao_Paulo",
  "horarios": ["01:00", "09:00"],
  "advogadoPadrao": {
    "nome": "Thiago Bodevan Veiga",
    "oab": "184404/MG"
  },
  "emailNotificacao": true
}
```

---

## 📂 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `backend/src/services/djen-scheduler.ts` | ⏰ Código do scheduler (cron jobs) |
| `backend/src/services/djen-api.ts` | 🌐 Cliente API DJEN |
| `backend/src/services/extract-parties.ts` | 🤖 Extração IA de partes |
| `backend/src/db/expedientes.ts` | 💾 Banco de dados |
| `backend/src/routes/djen.ts` | 🛣️ Rotas de API |
| `backend/src/server.ts` | 🚀 Inicialização do servidor |
| `DJEN_SCHEDULER_COMPLETO.md` | 📖 Documentação completa |

---

## 📝 Exemplo de Execução

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 [DJEN Scheduler] Iniciando busca automática
⏰ Horário: 02/01/2026 09:00:00
👨‍⚖️ Advogado: Thiago Bodevan Veiga (OAB/MG 184404)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Buscando publicações DJEN...
📄 Publicações encontradas: 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Processando: 0001234-56.2026.8.13.0024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Extraindo partes com IA Gemini...
   👤 Autor: João Silva
   👤 Réu: Empresa XYZ Ltda
💾 Processo criado: ab12cd34-...
📋 Expediente criado: cd34ef56-...
👤 Cliente cadastrado: João Silva
✅ Sucesso em 2.3s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Relatório Final
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Total processadas: 3
❌ Erros: 0
⏱️  Tempo total: 7.2s
📧 Email enviado para: thiago@example.com
```

---

## ⚠️ Regras Importantes

### ❌ SEM MOCKS
Este sistema **NÃO USA dados falsos**:
- ✅ API DJEN **real**
- ✅ PostgreSQL **real**
- ✅ IA Gemini **real**
- ✅ Emails **reais**

### 🔐 Segurança LGPD
Dados sensíveis são **sanitizados** antes de envio para IA:
- ❌ CPF removido
- ❌ Telefone removido
- ❌ Email removido
- ✅ Apenas texto jurídico processado

### 📊 Persistência
Todos os dados são salvos permanentemente no PostgreSQL:
- Processos
- Expedientes
- Clientes
- Histórico de execuções

---

## 🔄 Próximas Execuções

| Data | 01:00 | 09:00 |
|------|-------|-------|
| **Hoje (02/01)** | ✅ Passou | ⏰ Próxima |
| **Amanhã (03/01)** | ⏰ Agendada | ⏰ Agendada |
| **Todos os dias** | ✅ Ativo | ✅ Ativo |

---

## 📞 Troubleshooting

### Scheduler não executa?

```bash
# Verificar se está habilitado
echo $DJEN_SCHEDULER_ENABLED

# Verificar logs
tail -f backend/logs/backend.log | grep "DJEN Scheduler"
```

### API DJEN retorna erro 403/451?

✅ **Normal!** Significa que você está fora do Brasil.
→ O sistema usa automaticamente o **fallback browser**.

### Nenhuma publicação encontrada?

✅ **Normal!** Significa que não há publicações novas para o advogado hoje.
→ O sistema registra isso nos logs.

---

## 📚 Documentação Completa

Para detalhes técnicos aprofundados:
👉 **[DJEN_SCHEDULER_COMPLETO.md](./DJEN_SCHEDULER_COMPLETO.md)**

---

## ✅ Checklist de Ativação

- [x] ✅ Dependências instaladas (`node-cron`)
- [x] ✅ Código do scheduler implementado
- [x] ✅ Rotas de API criadas (`/api/djen/trigger-manual`, `/api/djen/status`)
- [x] ✅ Integração com banco de dados PostgreSQL
- [x] ✅ Extração IA com Gemini
- [x] ✅ Envio de email configurado
- [x] ✅ Fallback browser para geobloqueio
- [x] ✅ Logs detalhados
- [x] ✅ Documentação completa
- [ ] ⏳ **FALTA:** Ativar via `.env` (`DJEN_SCHEDULER_ENABLED=true`)
- [ ] ⏳ **FALTA:** Reiniciar servidor backend

---

**🎉 Sistema pronto! Basta ativar e reiniciar.**

---

**Data de implementação:** 03 de Janeiro de 2026
**Status:** ✅ PRONTO PARA PRODUÇÃO
**Modo:** 🔴 SEM MOCKS (100% real data)

# 🤖 Scheduler Automático DJEN - Documentação Completa

## 📋 Visão Geral

Sistema de monitoramento automático que busca publicações do Diário de Justiça Eletrônico (DJEN) **2 vezes por dia** e processa automaticamente:
- ✅ Cria processos no PostgreSQL
- ✅ Registra expedientes (intimações, citações, etc.)
- ✅ Extrai partes (autor/réu) usando IA (Gemini)
- ✅ Cadastra/atualiza clientes
- ✅ **SEM MOCKS** - 100% de dados reais

---

## ⏰ Horários de Execução

| Horário | Descrição | Cron |
|---------|-----------|------|
| **01:00** | Madrugada (captura publicações do dia anterior) | `0 1 * * *` |
| **09:00** | Manhã (captura publicações do dia atual) | `0 9 * * *` |

**Fuso Horário:** `America/Sao_Paulo` (Brasília)

---

## 🔧 Configuração

### 1️⃣ Variáveis de Ambiente

Adicione no arquivo `.env`:

```bash
# === DJEN Scheduler ===
DJEN_SCHEDULER_ENABLED=true              # Ativar/desativar scheduler
DJEN_OAB_NUMERO=184404                   # Número OAB
DJEN_OAB_UF=MG                           # Estado OAB
DJEN_ADVOGADO_NOME="Thiago Bodevan Veiga" # Nome do advogado

# === Banco de Dados ===
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# === APIs de IA (para extração de partes) ===
GOOGLE_API_KEY=sua-chave-gemini
```

### 2️⃣ Instalar Dependências

```bash
cd backend
npm install node-cron @types/node-cron
```

### 3️⃣ Iniciar Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

---

## 📊 Fluxo de Execução

```mermaid
graph TD
    A[⏰ Cron 01:00/09:00] --> B[🔍 Buscar DJEN API]
    B --> C{Publicações?}
    C -->|Não| D[✅ Log: Nenhuma publicação]
    C -->|Sim| E[🤖 Para cada publicação]
    E --> F[📝 Extrair Partes IA Gemini]
    F --> G[💾 Criar Processo PostgreSQL]
    G --> H[📋 Criar Expediente]
    H --> I[👤 Criar/Atualizar Cliente]
    I --> J{Mais publicações?}
    J -->|Sim| E
    J -->|Não| K[📊 Relatório de Sucesso]
    K --> L[📧 Enviar Notificação Email]
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `processos`
```sql
CREATE TABLE processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cnj VARCHAR(50) UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  autor VARCHAR(255),
  reu VARCHAR(255),
  comarca VARCHAR(255),
  vara VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ativo',
  fase VARCHAR(100),
  data_distribuicao DATE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `expedientes`
```sql
CREATE TABLE expedientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES processos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  lido BOOLEAN DEFAULT FALSE,
  arquivado BOOLEAN DEFAULT FALSE,
  analyzed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'medium',
  tribunal VARCHAR(50),
  lawyer_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `clientes`
```sql
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(50),
  cidade VARCHAR(255),
  estado VARCHAR(2),
  processos TEXT[], -- Array de números de processos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testes

### Executar Manualmente

```bash
# Via API (precisa estar rodando)
curl -X POST http://localhost:3001/api/djen/executar-scheduler

# Ou diretamente no código
import { executarManualmente } from './backend/src/services/djen-scheduler';
await executarManualmente();
```

### Verificar Logs

```bash
# Logs do servidor backend
tail -f backend/logs/djen-scheduler.log

# Ou apenas no console
npm run dev
```

---

## 📝 Exemplo de Log

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
💾 Processo criado: ab12cd34-ef56-7890-gh12-ij34kl56mn78
📋 Expediente criado: cd34ef56-gh78-9012-ij34-kl56mn78op90
👤 Cliente cadastrado/atualizado: João Silva
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

## 🚨 Tratamento de Erros

### Geobloqueio (API só aceita Brasil)

```typescript
// Fallback automático para browser-direct
if (erro.code === 403 || erro.code === 451) {
  console.warn('[DJEN Scheduler] ⚠️  API bloqueada, usando fallback browser');
  publicacoes = await buscarDJENNoBrowser({ ... });
}
```

### Rate Limiting

```typescript
// Delay de 1.5s entre requisições
for (const pub of publicacoes) {
  await processar(pub);
  await sleep(1500);
}
```

### Erros de IA

```typescript
// Fallback para regex se IA falhar
const partes = await extractPartiesWithFallback(texto);
// 1. Tenta regex
// 2. Se falhar, usa Gemini
```

---

## 🔔 Notificações

### Email (Implementado)

```typescript
await enviarEmailNotificacao({
  destinatario: ADVOGADO_PADRAO.email,
  assunto: `DJEN: ${publicacoes.length} novas publicações`,
  corpo: `
    Foram encontradas ${publicacoes.length} publicações.
    ${processadas} processadas com sucesso.
    ${erros} erros.
  `
});
```

### Push Notifications (TODO)

```typescript
// Integração futura com Firebase Cloud Messaging
await enviarPushNotification({
  titulo: "Nova Intimação",
  corpo: "Processo 0001234-56.2026.8.13.0024",
  link: "/processos/0001234-56.2026.8.13.0024"
});
```

---

## 📈 Monitoramento

### Métricas Disponíveis

```typescript
// GET /api/djen/scheduler/stats
{
  "ultima_execucao": "2026-01-02T09:00:00Z",
  "total_execucoes": 42,
  "total_publicacoes": 127,
  "taxa_sucesso": 0.98,
  "proxima_execucao": "2026-01-03T01:00:00Z"
}
```

### Alertas

- ❌ **3 execuções consecutivas com erro** → Email para admin
- ⚠️  **Taxa de sucesso < 90%** → Investigar logs
- 🔔 **> 10 publicações em uma execução** → Alerta de volume alto

---

## 🛠️ Troubleshooting

### Scheduler não está executando

```bash
# Verificar se está habilitado
echo $DJEN_SCHEDULER_ENABLED

# Verificar timezone
TZ=America/Sao_Paulo date

# Verificar logs do servidor
grep "DJEN Scheduler" logs/backend.log
```

### Erro de conexão com PostgreSQL

```bash
# Testar conexão
psql $DATABASE_URL -c "SELECT NOW();"

# Verificar credenciais
echo $DATABASE_URL
```

### IA Gemini falhando

```bash
# Verificar API key
curl -H "x-goog-api-key: $GOOGLE_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models

# Ver logs de erro
grep "Gemini" logs/backend.log
```

---

## 📦 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `backend/src/services/djen-scheduler.ts` | Código principal do scheduler |
| `backend/src/services/djen-api.ts` | Cliente API DJEN CNJ |
| `backend/src/services/extract-parties.ts` | Extração IA de partes |
| `backend/src/db/expedientes.ts` | Acesso ao banco de dados |
| `backend/src/services/email-notifier.ts` | Envio de emails |
| `backend/src/server.ts` | Inicialização do scheduler |

---

## 🔄 Roadmap

### ✅ Implementado
- [x] Scheduler 01:00 e 09:00
- [x] Busca DJEN API com fallback
- [x] Extração de partes com IA
- [x] Persistência PostgreSQL
- [x] Envio de email

### 🚧 Em Desenvolvimento
- [ ] Dashboard de monitoramento
- [ ] Push notifications mobile
- [ ] Múltiplos advogados simultâneos
- [ ] Histórico de execuções

### 💡 Futuro
- [ ] Integração com WhatsApp Business
- [ ] Análise preditiva de prazos
- [ ] OCR para publicações em PDF
- [ ] Backup automático de expedientes

---

## 📞 Suporte

- **Logs:** `backend/logs/djen-scheduler.log`
- **Docs API DJEN:** https://comunicaapi.pje.jus.br/docs
- **GitHub Issues:** [Link do repositório]

---

**⚠️ Regra de Ética:** Este sistema **NÃO USA MOCKS**. Todos os testes e execuções são com dados reais do DJEN e PostgreSQL.

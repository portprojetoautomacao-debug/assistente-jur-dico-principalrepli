# 🤖 Sistema de Monitoramento Automático DJEN

Este documento descreve o sistema de monitoramento automático de publicações do DJEN (Diário de Justiça Eletrônico Nacional).

## 📋 Visão Geral

O sistema executa automaticamente a busca de publicações no DJEN em horários programados (01:00 e 09:00) e realiza:

1. **Busca de Publicações** - API do CNJ via `comunicaapi.pje.jus.br`
2. **Extração de Partes** - Regex + IA Gemini (fallback inteligente)
3. **Persistência em PostgreSQL** - Salvamento permanente dos expedientes
4. **Notificação (opcional)** - Email sobre novas publicações

## 🚀 Ativação do Sistema

### 1. Instalar Dependências

```bash
cd backend
npm install
```

Novas dependências adicionadas:
- `node-cron` - Agendamento de tarefas
- `@google/generative-ai` - IA para extração de partes

### 2. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
# === Scheduler DJEN ===
DJEN_SCHEDULER_ENABLED=true          # Ativa o scheduler
TZ=America/Sao_Paulo                 # Timezone (obrigatório)

# Dados do advogado
DJEN_OAB_NUMERO=184404
DJEN_OAB_UF=MG
DJEN_ADVOGADO_NOME=Thiago Bodevan Veiga

# === Notificações (opcional) ===
EMAIL_NOTIFICACAO_ENABLED=false      # true para ativar emails
EMAIL_NOTIFICACAO_DESTINO=seu-email@exemplo.com
```

### 3. Iniciar o Backend

```bash
cd backend
npm run dev
```

Você verá no console:

```
🕐 [DJEN Scheduler] Iniciando jobs automáticos
   Timezone: America/Sao_Paulo
   Job 1: 01:00 (todos os dias)
   Job 2: 09:00 (todos os dias)
✅ [DJEN Scheduler] Jobs configurados com sucesso
```

## 🔄 Fluxo de Execução

```
01:00 ou 09:00 (horário de Brasília)
   ↓
[DJEN Scheduler] inicia
   ↓
Busca API DJEN (data de hoje)
   ↓
Para cada publicação:
   1. Extrai partes (Regex → IA se falhar)
   2. Salva no PostgreSQL
   3. Envia email (se habilitado)
   ↓
Relatório no console:
   ✅ Total: X | Sucesso: Y | Erros: Z
```

## 📊 Arquitetura de Arquivos

```
backend/src/
├── services/
│   ├── djen-scheduler.ts       # Cron jobs (01:00 e 09:00)
│   ├── djen-api.ts             # Cliente API DJEN
│   ├── extract-parties.ts      # Extração Regex + IA
│   └── email-notifier.ts       # Envio de emails (TODO)
├── db/
│   └── expedientes.ts          # Persistência PostgreSQL
├── routes/
│   └── djen.ts                 # Endpoints de controle
└── server.ts                   # Integração principal
```

## 🛠️ Endpoints da API

### `POST /api/djen/trigger-manual`
Executa o processamento DJEN manualmente (útil para testes).

```bash
curl -X POST http://localhost:3001/api/djen/trigger-manual
```

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Processamento DJEN executado",
  "dados": {
    "total": 3,
    "processadas": 3,
    "erros": 0,
    "duracao": "12.45"
  }
}
```

### `GET /api/djen/status`
Retorna o status do scheduler.

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
  "emailNotificacao": false
}
```

## 🗄️ Estrutura da Tabela `expedientes`

```sql
CREATE TABLE expedientes (
  id                    UUID PRIMARY KEY,
  numero_processo       VARCHAR(255) NOT NULL,
  tribunal              VARCHAR(50),
  tipo                  VARCHAR(100),
  titulo                TEXT,
  conteudo              TEXT,
  data_disponibilizacao DATE,
  nome_orgao            VARCHAR(255),
  autor                 TEXT,
  reu                   TEXT,
  advogado_autor        TEXT,
  advogado_reu          TEXT,
  lawyer_name           VARCHAR(255),
  lido                  BOOLEAN DEFAULT false,
  arquivado             BOOLEAN DEFAULT false,
  analyzed              BOOLEAN DEFAULT false,
  priority              VARCHAR(20) DEFAULT 'high',
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

A tabela é criada automaticamente na inicialização do servidor.

## 🧠 Extração de Partes (Inteligência Híbrida)

O sistema usa uma estratégia inteligente de fallback:

### 1. **Regex (Rápido, Sem Custo)**
Tenta extrair autor e réu usando padrões regex comuns:
- `autor:`, `requerente:`, `exequente:`
- `réu:`, `requerido:`, `executado:`

### 2. **IA Gemini (Se Regex Falhar)**
Se o regex não encontrar autor **E** réu, aciona o Gemini 2.0 Flash:

```typescript
Prompt: "Extraia do texto jurídico:
{
  autor: string,
  reu: string,
  advogadoAutor: string,
  advogadoReu: string
}"
```

**Resultado:** Economiza custos de API enquanto garante precisão.

## 📧 Notificações por Email (Opcional)

### Configuração

1. **Escolha um provedor:**
   - SendGrid (gratuito até 100 emails/dia)
   - AWS SES (US$ 0.10 por 1000 emails)
   - Resend (gratuito até 3000 emails/mês)
   - Postmark (gratuito até 100 emails/mês)

2. **Configure no `.env`:**
```env
EMAIL_NOTIFICACAO_ENABLED=true
EMAIL_NOTIFICACAO_DESTINO=advogado@escritorio.com
EMAIL_SERVICE_API_KEY=sua-chave-sendgrid
```

3. **Implemente em `email-notifier.ts`:**
```typescript
// Exemplo com SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.EMAIL_SERVICE_API_KEY);

await sgMail.send({
  to: dados.destinatario,
  from: 'noreply@seudominio.com',
  subject: dados.assunto,
  html: gerarTemplateEmail(dados)
});
```

## ⚠️ Limitações & Observações

### Geobloqueio da API DJEN
A API `comunicaapi.pje.jus.br` **só aceita requisições do Brasil**.

- ✅ Backend no Brasil (Replit BR, AWS BR) → Funciona
- ❌ Backend fora do Brasil → Erro 403/451

**Solução:** O sistema tenta a API backend. Se falhar, o frontend usa fallback browser-direct (já implementado em `use-djen-publications.ts`).

### Rate Limiting
- Delay de 2 segundos entre publicações
- Evita sobrecarga das APIs (DJEN e Gemini)

### Custos de IA
- Gemini 2.0 Flash: Gratuito até 1500 req/dia
- Gemini 2.5 Pro: US$ 0.0075 por 1K tokens
- Regex é **sempre tentado primeiro** para economizar

## 🧪 Testando o Sistema

### Teste Manual Imediato

```bash
# Trigger manual via API
curl -X POST http://localhost:3001/api/djen/trigger-manual

# Ou no navegador/Postman:
POST http://localhost:3001/api/djen/trigger-manual
```

### Testar Horários Específicos (Dev)

Modifique temporariamente em `djen-scheduler.ts`:

```typescript
// Teste: executar a cada minuto
cron.schedule("* * * * *", async () => {
  await processarPublicacoesDJEN();
});
```

### Verificar Logs

O sistema gera logs detalhados:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 [DJEN Scheduler] Iniciando busca automática
⏰ Horário: 02/01/2026, 09:00:00
👨‍⚖️ Advogado: Thiago Bodevan Veiga (OAB/MG 184404)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Publicações encontradas: 2

📋 Processando: 0001234-56.2026.8.13.0024
   Tribunal: TJMG
   Tipo: Intimação
   🎯 Regex: autor="João Silva", réu="Empresa XYZ"
   ✅ Salvo: ID abc-123-def
   📧 Email enviado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Processamento concluído
   Total: 2
   Sucesso: 2
   Erros: 0
   Duração: 8.32s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📈 Próximos Passos (Roadmap)

- [ ] Dashboard de estatísticas (publicações por tribunal/tipo)
- [ ] Suporte a múltiplos advogados (config por usuário)
- [ ] Notificações push (via WebSockets)
- [ ] Integração com WhatsApp Business API
- [ ] ML para classificação automática de urgência
- [ ] Exportação de relatórios (PDF/Excel)

## 🆘 Troubleshooting

### Scheduler não executa

**Verificar:**
1. `DJEN_SCHEDULER_ENABLED=true` no `.env`?
2. Variável `TZ` configurada?
3. Backend rodando sem reiniciar?

### Erro 403 na API DJEN

**Causa:** Geobloqueio (servidor fora do Brasil)

**Solução:**
- Use VPN brasileira no servidor
- Ou confie no fallback browser-direct do frontend

### IA Gemini não extrai partes

**Verificar:**
1. `VITE_GEMINI_API_KEY` configurada?
2. Quota da API não excedida?
3. Regex funcionou (check logs: `🎯 Regex:`)?

### Emails não enviados

**Verificar:**
1. `EMAIL_NOTIFICACAO_ENABLED=true`?
2. Implementou integração em `email-notifier.ts`?
3. Credenciais do provedor corretas?

---

**Desenvolvido para:** Assistente Jurídico PJe
**Versão:** 1.0.0
**Data:** Janeiro 2026
**Licença:** MIT

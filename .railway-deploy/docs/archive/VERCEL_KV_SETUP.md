# Guia de Configuração do Vercel KV

## 📦 O Que é Vercel KV?

Vercel KV é um banco de dados Redis gerenciado pela Vercel, otimizado para edge computing e serverless functions. Ele permite que os cron jobs armazenem e recuperem dados de forma persistente.

## 🎯 Por Que Precisamos?

Os cron jobs agora estão **completamente funcionais** com integração DJEN real! Mas para funcionar, eles precisam de um lugar para armazenar:

- Lista de advogados monitorados
- Publicações encontradas
- Estados dos agentes autônomos
- Fila de notificações

## 🚀 Como Configurar

### Passo 1: Acessar o Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá para a aba **Storage**

### Passo 2: Criar Vercel KV Database

1. Clique em **Create Database**
2. Selecione **KV**
3. Escolha um nome (ex: `assistente-juridico-kv`)
4. Selecione a região mais próxima (ex: São Paulo - GRU)
5. Clique em **Create**

### Passo 3: Conectar ao Projeto

1. Na página do KV database, clique em **Connect Project**
2. Selecione seu projeto da lista
3. Escolha o environment: **Production** (ou todos)
4. Clique em **Connect**

Pronto! As variáveis de ambiente `KV_*` serão automaticamente injetadas no seu projeto.

### Passo 4: Deploy Novamente

```bash
git push
```

O Vercel vai re-deployar com as novas variáveis de ambiente.

## 📝 Configurar Advogados para Monitoramento

Agora você precisa adicionar advogados para serem monitorados. Há 3 formas:

### Opção 1: Via Vercel KV CLI (Recomendado)

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Conectar ao projeto
vercel link

# Adicionar advogados
vercel env pull .env.development.local

# Agora use um script Node.js para popular o KV:
```

Crie `scripts/populate-kv.js`:

```javascript
import { kv } from '@vercel/kv';

const lawyers = [
  {
    id: crypto.randomUUID(),
    name: 'João da Silva',
    oab: 'OAB/MG 123456',
    email: 'joao@escritorio.com',
    enabled: true,
    tribunals: ['TJMG', 'TRT3']
  },
  {
    id: crypto.randomUUID(),
    name: 'Maria Santos',
    oab: 'OAB/SP 789012',
    email: 'maria@escritorio.com',
    enabled: true,
    tribunals: [] // Usa tribunais padrão
  }
];

await kv.set('monitored-lawyers', lawyers);
console.log('Advogados adicionados com sucesso!');
```

Execute:
```bash
node scripts/populate-kv.js
```

### Opção 2: Via Vercel Dashboard (Mais Fácil)

1. Vá para **Storage** → Seu KV database
2. Clique em **Data Browser**
3. Clique em **Add Key**
4. Key: `monitored-lawyers`
5. Value (JSON):

```json
[
  {
    "id": "unique-id-1",
    "name": "João da Silva",
    "oab": "OAB/MG 123456",
    "email": "joao@escritorio.com",
    "enabled": true,
    "tribunals": ["TJMG", "TRT3"]
  },
  {
    "id": "unique-id-2",
    "name": "Maria Santos",
    "oab": "OAB/SP 789012",
    "email": "maria@escritorio.com",
    "enabled": true,
    "tribunals": []
  }
]
```

6. Clique em **Save**

### Opção 3: Via API Serverless Function

Crie um endpoint em `api/admin/add-lawyer.ts` (protegido com senha):

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificar senha de admin
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lawyer = req.body;
  
  const lawyers = await kv.get('monitored-lawyers') || [];
  lawyers.push({
    id: crypto.randomUUID(),
    ...lawyer,
    enabled: true
  });
  
  await kv.set('monitored-lawyers', lawyers);
  
  return res.status(200).json({ success: true, lawyer });
}
```

Use:
```bash
curl -X POST https://seu-app.vercel.app/api/admin/add-lawyer \
  -H "Authorization: Bearer sua-senha-secreta" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João da Silva",
    "oab": "OAB/MG 123456",
    "email": "joao@escritorio.com",
    "tribunals": ["TJMG", "TRT3"]
  }'
```

## 📊 Estrutura de Dados no KV

### `monitored-lawyers` (Array)

```json
[
  {
    "id": "uuid-v4",
    "name": "Nome do Advogado",
    "oab": "OAB/UF 12345",
    "email": "email@exemplo.com",
    "enabled": true,
    "tribunals": ["TJMG", "TRT3"]
  }
]
```

### `publications:{lawyerId}` (Array)

Criado automaticamente pelo cron job quando encontra publicações:

```json
[
  {
    "id": "uuid-v4",
    "tribunal": "TJMG",
    "data": "2025-11-17",
    "tipo": "Intimação",
    "teor": "Texto da publicação...",
    "numeroProcesso": "1234567-89.2025.8.13.0024",
    "orgao": "1ª Vara Cível",
    "matchType": "nome",
    "lawyerId": "uuid-do-advogado",
    "notified": false,
    "createdAt": "2025-11-17T14:00:00.000Z"
  }
]
```

### `autonomous-agents` (Array)

```json
[
  {
    "id": "agent-1",
    "name": "DJEN Monitor",
    "enabled": true,
    "tasksCompleted": 150,
    "tasksToday": 5,
    "status": "active",
    "lastActivity": "Checking publications...",
    "continuousMode": true
  }
]
```

## ✅ Verificar Configuração

### 1. Verificar Variáveis de Ambiente

```bash
vercel env ls
```

Deve mostrar:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 2. Testar Conexão

Crie `api/test-kv.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await kv.set('test-key', 'Hello Vercel KV!');
    const value = await kv.get('test-key');
    return res.json({ success: true, value });
  } catch (error) {
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
```

Acesse: `https://seu-app.vercel.app/api/test-kv`

### 3. Verificar Cron Jobs

1. Vá para **Deployments** → Último deploy → **Functions**
2. Encontre `/api/cron/djen-monitor`
3. Clique e veja os logs
4. Deve mostrar: "Found X monitored lawyers"

## 🔍 Monitorar Execuções

### Via Vercel Dashboard

1. **Cron Jobs**: https://vercel.com/dashboard → Projeto → Cron Jobs
2. **Function Logs**: Deployments → Functions → Selecione função
3. **KV Data**: Storage → Seu KV → Data Browser

### Via Vercel CLI

```bash
# Logs em tempo real
vercel logs --follow

# Filtrar por função
vercel logs --filter=djen-monitor

# Ver dados do KV
vercel kv get monitored-lawyers --json
```

## 📈 Custos

**Vercel KV (Hobby Plan - Grátis):**
- 256 MB de armazenamento
- 3.000 comandos/mês
- 30 KB por comando

**Cron Jobs (Hobby Plan - Grátis):**
- 2 cron jobs simultâneos
- 60 segundos de execução máxima

Se você exceder, considere:
- **Pro Plan**: $20/mês
  - 512 MB KV storage
  - 100.000 comandos/mês
  - 60s execution time

## 🚨 Troubleshooting

### "KV_REST_API_URL is not defined"

- Certifique-se de criar o Vercel KV database
- Conecte-o ao projeto
- Re-deploy a aplicação

### "No monitored lawyers configured"

- Adicione advogados usando uma das opções acima
- Verifique no Data Browser se a key `monitored-lawyers` existe

### Cron job não está executando

- Verifique se está em **production** (crons não rodam em preview)
- Vá para Cron Jobs no dashboard e veja o histórico
- Verifique logs da função para erros

### Publicações não aparecem

- Verifique se os advogados têm `enabled: true`
- Verifique se os tribunais estão corretos
- Veja logs do cron job para erros de API
- A API do DJEN pode estar offline ou com rate limiting

## 📚 Recursos

- [Documentação Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

## ✨ Próximos Passos

Agora que o Vercel KV está configurado, os cron jobs estão 100% funcionais:

1. ✅ DJEN Monitor consulta APIs reais
2. ✅ Publicações são armazenadas no KV
3. ✅ Notificações são enfileiradas
4. ✅ Agentes têm contadores resetados

**O que ainda não está implementado:**
- Sistema de envio de notificações (email/push)
- Interface para visualizar publicações no frontend
- Dashboard para gerenciar advogados monitorados

Veja `VERCEL_CRON_JOBS.md` para mais detalhes!

# 🔄 Integração PJe em Tempo Real

## 📋 Resumo Executivo

Este documento descreve como integrar seu **Assistente Jurídico** com o **PJe (Processo Judicial Eletrônico)** para obter informações em tempo real.

---

## 🎯 Status Atual da Integração

### ✅ O Que Já Funciona (Implementado)

| Recurso | Status | Arquivo | Atualização |
|---------|--------|---------|-------------|
| Monitor DJEN | ✅ Ativo | `api/cron.ts` | 2x/dia (09:00 e 17:00 BRT) |
| API DataJud | ✅ Ativo | `src/lib/datajud-api.ts` | Sob demanda |
| Análise de Intimações | ✅ Ativo | `src/lib/agents.ts` (Mrs. Justin-e) | Automático |
| Criação de Expedientes | ✅ Ativo | `api/expedientes.ts` | Em tempo real |
| Widget Publicações | ✅ Ativo | `src/components/DJENPublicationsWidget.tsx` | Tempo real |

### ⏸️ O Que Falta (Opcional)

| Recurso | Prioridade | Complexidade | Estimativa |
|---------|-----------|--------------|------------|
| Scraping PJe | ❌ Baixa (não recomendado) | Alta | 20h |
| Browser Extension | 🟡 Média | Alta | 40h |
| Webhook PJe | ❌ Impossível | N/A | N/A |
| Push Notifications | ✅ Alta | Baixa | 4h |

---

## 🔧 Opções de Integração

### **Opção 1: USAR O QUE JÁ EXISTE (RECOMENDADO)**

Seu sistema **já monitora automaticamente**:

1. **DJEN** → Detecta novas publicações 2x/dia
2. **DataJud** → Consulta processos sob demanda
3. **Mrs. Justin-e** → Analisa intimações e cria tarefas
4. **Monitor DJEN** → Notifica novas movimentações

**✅ Não precisa fazer nada! O sistema já funciona.**

#### Como Usar:

```typescript
// 1. Sistema detecta publicação automaticamente (cron job)
// 2. Cria expediente no KV
// 3. Mrs. Justin-e analisa
// 4. Gera tarefas no Todoist
// 5. Notifica no dashboard

// Para forçar sync manual:
await fetch('/api/djen-sync', { method: 'POST' });
```

---

### **Opção 2: Browser Extension (Tempo Real)**

Se precisar de dados **instantâneos** (não pode esperar 2x/dia):

#### Arquitetura:

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUÁRIO FAZ LOGIN NO PJE (navegador normal)         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. EXTENSÃO CHROME MONITORA PÁGINA                     │
│    - Detecta mudanças no painel                         │
│    - Extrai dados de processos                          │
│    - Envia para backend via API                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. BACKEND RECEBE DADOS (/api/pje-sync)                │
│    - Valida e sanitiza dados                            │
│    - Salva no KV storage                                │
│    - Dispara agentes IA                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. DASHBOARD ATUALIZA EM TEMPO REAL                    │
│    - React Query invalida cache                         │
│    - Componentes re-renderizam                          │
│    - Notificações push                                  │
└─────────────────────────────────────────────────────────┘
```

#### Implementação:

**1. Criar extensão Chrome:**

```javascript
// manifest.json
{
  "name": "PJe Sync - Assistente Jurídico",
  "version": "1.0.0",
  "manifest_version": 3,
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://pje.tjmg.jus.br/*"],
  "content_scripts": [{
    "matches": ["https://pje.tjmg.jus.br/painel*"],
    "js": ["content.js"]
  }]
}
```

```javascript
// content.js
// Monitora mudanças no painel do advogado
const observer = new MutationObserver(() => {
  const processos = extractProcessos();
  sendToBackend(processos);
});

observer.observe(document.body, { 
  childList: true, 
  subtree: true 
});

function extractProcessos() {
  const rows = document.querySelectorAll('.processo-row');
  return Array.from(rows).map(row => ({
    numero: row.querySelector('.numero-processo')?.textContent?.trim(),
    parte: row.querySelector('.parte-autor')?.textContent?.trim(),
    movimento: row.querySelector('.ultimo-movimento')?.textContent?.trim(),
    data: row.querySelector('.data-movimento')?.textContent?.trim(),
    comarca: row.querySelector('.comarca')?.textContent?.trim()
  }));
}

async function sendToBackend(processos) {
  await fetch('https://assistente-juridico-github.vercel.app/api/pje-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processos, timestamp: new Date().toISOString() })
  });
}
```

**2. Criar endpoint backend:**

```typescript
// api/pje-sync.ts
import { redis } from './kv';
import { triggerAgent } from './agents';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { processos } = await req.json();

  // Salvar no KV
  for (const processo of processos) {
    const key = `processo:${processo.numero}`;
    const existing = await redis.get(key);
    
    // Detectar mudanças
    if (!existing || existing.movimento !== processo.movimento) {
      await redis.set(key, processo);
      
      // Criar expediente
      await redis.lpush('expedientes', JSON.stringify({
        id: crypto.randomUUID(),
        processNumber: processo.numero,
        description: processo.movimento,
        createdAt: new Date().toISOString(),
        source: 'pje-extension'
      }));
      
      // Disparar Mrs. Justin-e para análise
      await triggerAgent('justine', {
        type: 'ANALYZE_EXPEDIENTE',
        data: processo
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**3. Atualizar dashboard:**

```tsx
// src/components/ProcessCRM.tsx
import { useQuery } from '@tanstack/react-query';

export function ProcessCRM() {
  // Polling a cada 30s
  const { data: processos } = useQuery({
    queryKey: ['processos'],
    queryFn: async () => {
      const res = await fetch('/api/kv?key=processos:*');
      return res.json();
    },
    refetchInterval: 30000 // 30 segundos
  });

  return (
    <div>
      {processos?.map(p => (
        <ProcessCard key={p.numero} processo={p} />
      ))}
    </div>
  );
}
```

---

### **Opção 3: Web Scraping (NÃO RECOMENDADO)**

**⚠️ RISCOS:**
- Viola termos de uso do PJe
- Pode bloquear conta OAB
- Frágil (quebra se site mudar)
- Difícil manutenção

**Se insistir (use por sua conta e risco):**

```typescript
// api/pje-scraper.ts (NÃO IMPLEMENTAR SEM ANÁLISE JURÍDICA)
import puppeteer from 'puppeteer';

export async function scrapePJe(username: string, password: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Login
    await page.goto('https://pje.tjmg.jus.br');
    await page.type('#username', username);
    await page.type('#password', password);
    await page.click('#loginButton');
    await page.waitForNavigation();
    
    // Extrair processos
    const processos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.processo-row')).map(row => ({
        numero: row.querySelector('.numero-processo')?.textContent?.trim(),
        movimento: row.querySelector('.ultimo-movimento')?.textContent?.trim()
      }));
    });
    
    return processos;
  } finally {
    await browser.close();
  }
}
```

---

## 🚀 Implementação Recomendada

### **Fase 1: Melhorar o Que Já Existe (1 dia)**

```typescript
// 1. Aumentar frequência do DJEN Monitor
// api/cron.ts
{
  name: 'djen-monitor',
  schedule: '0 */4 * * *', // A cada 4h (em vez de 2x/dia)
  action: async () => { /* ... */ }
}

// 2. Adicionar push notifications
// src/lib/notifications.ts
export async function notifyNewExpediente(expediente: Expediente) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Nova Intimação', {
      body: `${expediente.processNumber}: ${expediente.description}`,
      icon: '/logo.png',
      tag: expediente.id
    });
  }
}

// 3. Implementar polling no frontend
// src/hooks/use-expedientes.ts
export function useExpedientes() {
  return useQuery({
    queryKey: ['expedientes'],
    queryFn: () => fetch('/api/expedientes').then(r => r.json()),
    refetchInterval: 60000 // 1 minuto
  });
}
```

### **Fase 2: Browser Extension (1 semana)**

Se realmente precisar de tempo real:

1. **Criar extensão Chrome** (2 dias)
2. **Endpoint `/api/pje-sync`** (1 dia)
3. **Testes de integração** (2 dias)
4. **Publicar na Chrome Web Store** (2 dias)

---

## 📊 Comparação de Soluções

| Critério | DJEN + DataJud (Atual) | Browser Extension | Web Scraping |
|----------|------------------------|-------------------|--------------|
| **Legalidade** | ✅ Totalmente legal | ✅ Legal (usuário autoriza) | ❌ Viola termos |
| **Tempo Real** | ❌ Delay 2-24h | ✅ Instantâneo | ✅ Configurável |
| **Confiabilidade** | ✅ Alta (API oficial) | 🟡 Média (depende do site) | ❌ Baixa (frágil) |
| **Manutenção** | ✅ Baixa | 🟡 Média | ❌ Alta |
| **Custo** | ✅ Grátis | ✅ Grátis | 🟡 Servidor 24/7 |
| **Implementação** | ✅ Já feito | 🟡 1 semana | ❌ 3 semanas |

---

## 🎯 Recomendação Final

**Para 90% dos casos: USE O SISTEMA ATUAL (DJEN + DataJud)**

Motivos:
1. ✅ Já está implementado e funcionando
2. ✅ Legal e seguro
3. ✅ Delay de 2-24h é aceitável para maioria dos processos
4. ✅ Zero manutenção

**Se realmente precisar de tempo real:**
1. Implemente **push notifications** (4h)
2. Aumente **frequência do cron** para 4x/dia (30min)
3. Se ainda insuficiente, desenvolva **browser extension** (1 semana)

**⚠️ NÃO USE web scraping** (riscos legais + técnicos muito altos)

---

## 📝 Próximos Passos

### Opção A: Melhorar Sistema Atual (Recomendado)

```bash
# 1. Aumentar frequência DJEN
# Editar api/cron.ts:
schedule: '0 */3 * * *'  # A cada 3h

# 2. Adicionar push notifications
npm install web-push
npm run dev

# 3. Testar
curl -X POST http://localhost:5173/api/djen-sync
```

### Opção B: Desenvolver Browser Extension

```bash
# 1. Criar estrutura da extensão
mkdir chrome-extension
cd chrome-extension
npm init -y

# 2. Instalar dependências
npm install -D @types/chrome

# 3. Desenvolver
# (Ver código acima)

# 4. Testar localmente
# Chrome → Extensões → Modo desenvolvedor → Carregar sem compactação
```

---

## 🔒 Considerações de Segurança

### ✅ Boas Práticas:

1. **Nunca armazene credenciais** no código
2. **Use HTTPS** em todas as comunicações
3. **Valide e sanitize** dados recebidos
4. **Implemente rate limiting** (evitar sobrecarga)
5. **Log de auditoria** para rastreabilidade

### ❌ Evite:

1. ❌ Salvar senha do PJe no sistema
2. ❌ Compartilhar tokens entre usuários
3. ❌ Fazer scraping sem consentimento
4. ❌ Ignorar erros de certificado SSL

---

## 📖 Referências

- [API DataJud - CNJ](https://www.cnj.jus.br/datajud/)
- [DJEN - Diário Eletrônico](https://www.cnj.jus.br/djen/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Puppeteer Docs](https://pptr.dev/)

---

## 🆘 Suporte

Para dúvidas sobre a integração, consulte:

1. `docs/DJEN_DOCUMENTATION.md` - Documentação DJEN
2. `src/lib/djen-api.ts` - Código de integração
3. `api/cron.ts` - Jobs automáticos

---

**Última atualização:** 05/12/2025

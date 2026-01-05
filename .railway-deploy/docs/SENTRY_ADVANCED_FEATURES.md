# Sentry Advanced Features - Assistente Jurídico PJe

Este documento descreve as funcionalidades avançadas do Sentry implementadas no projeto, incluindo **Feature Flags**, **Crons Monitoring** e **Metrics**.

## 📋 Índice

1. [Feature Flags Tracking](#1-feature-flags-tracking)
2. [Crons Monitoring](#2-crons-monitoring)
3. [Metrics (Counters, Distributions, Gauges)](#3-metrics)
4. [Integração com Error Tracking](#4-integração-com-error-tracking)
5. [Dashboards e Queries no Sentry](#5-dashboards-e-queries-no-sentry)
6. [Best Practices](#6-best-practices)

---

## 1. Feature Flags Tracking

### 📖 Visão Geral

O sistema de Feature Flags permite rastrear avaliações de feature flags no Sentry. Quando um erro ocorre, você pode ver quais flags estavam ativos, facilitando a correlação entre features e bugs.

### 🛠️ Instalação

```typescript
import { addFeatureFlag, FEATURE_FLAGS } from '@/lib/sentry-feature-flags';
```

### 💡 Uso Básico

#### Rastrear um Flag Individual

```typescript
import { addFeatureFlag } from '@/lib/sentry-feature-flags';

// Registra uma avaliação de flag
addFeatureFlag('new-dashboard', true);
addFeatureFlag('max-processes', 100);

// Quando um erro ocorre, os flags serão incluídos automaticamente
Sentry.captureException(new Error("Something went wrong!"));
```

#### Rastrear Múltiplos Flags

```typescript
import { addFeatureFlags } from '@/lib/sentry-feature-flags';

addFeatureFlags({
  'new-dashboard': true,
  'max-processes': 100,
  'enable-ai-agents': false
});
```

#### Usar Hook React

```tsx
import { useFeatureFlag } from '@/lib/sentry-feature-flags';

function MyComponent() {
  const isNewDashboard = useFeatureFlag('new-dashboard', true);
  
  return isNewDashboard ? <NewDashboard /> : <OldDashboard />;
}
```

### 🔌 Integração com Provedores

#### LaunchDarkly

```typescript
import { trackLaunchDarklyFlag } from '@/lib/sentry-feature-flags';
import { useLDClient } from 'launchdarkly-react-client-sdk';

function MyComponent() {
  const ldClient = useLDClient();
  const flagValue = ldClient?.variation('my-flag', false);
  
  trackLaunchDarklyFlag('my-flag', flagValue);
  
  return <div>...</div>;
}
```

#### Statsig

```typescript
import { trackStatsigGate } from '@/lib/sentry-feature-flags';
import { useGate } from 'statsig-react';

function MyComponent() {
  const { value } = useGate('my_gate');
  
  trackStatsigGate('my_gate', value);
  
  return <div>...</div>;
}
```

#### Unleash

```typescript
import { trackUnleashFlag } from '@/lib/sentry-feature-flags';
import { useFlag } from '@unleash/proxy-client-react';

function MyComponent() {
  const enabled = useFlag('my-feature');
  
  trackUnleashFlag('my-feature', enabled);
  
  return <div>...</div>;
}
```

### 🎯 Flags Pré-Definidos

```typescript
import { FEATURE_FLAGS } from '@/lib/sentry-feature-flags';

// Agentes de IA
FEATURE_FLAGS.AI_AGENTS_ENABLED
FEATURE_FLAGS.AI_REDACAO_PETICOES
FEATURE_FLAGS.AI_ANALISE_DOCUMENTAL

// Integrações
FEATURE_FLAGS.DJEN_AUTO_SYNC
FEATURE_FLAGS.DATAJUD_INTEGRATION
FEATURE_FLAGS.GOOGLE_CALENDAR_SYNC

// Features experimentais
FEATURE_FLAGS.EXPERIMENTAL_DASHBOARD
FEATURE_FLAGS.EXPERIMENTAL_KANBAN

// Performance
FEATURE_FLAGS.LAZY_LOADING_ENABLED
FEATURE_FLAGS.CODE_SPLITTING_ENABLED
```

### 🔍 Visualizar no Sentry

Os feature flags aparecem no Sentry em:

1. **Contexts** do evento de erro
2. **Tags** para facilitar busca (`flag.nome-do-flag`)

**Query de exemplo no Sentry:**

```
flag.new-dashboard:true
```

---

## 2. Crons Monitoring

### 📖 Visão Geral

O Crons Monitoring permite monitorar jobs agendados (cron jobs) e detectar:
- Jobs que não iniciaram quando esperado (missed)
- Jobs que falharam (error)
- Jobs que excederam o tempo máximo (timeout)

### 🛠️ Instalação

```typescript
import { captureCheckin, MonitorStatus, monitorCron } from '@/lib/sentry-crons';
```

### 💡 Uso Básico

#### Check-ins Manuais

```typescript
import { captureCheckin, MonitorStatus } from '@/lib/sentry-crons';

// Inicia o job
const checkInId = captureCheckin({
  monitorSlug: 'djen-sync',
  status: MonitorStatus.IN_PROGRESS,
});

try {
  // Execute sua tarefa aqui
  await syncDJEN();
  
  // Finaliza com sucesso
  captureCheckin({
    monitorSlug: 'djen-sync',
    checkInId,
    status: MonitorStatus.OK,
  });
} catch (error) {
  // Finaliza com erro
  captureCheckin({
    monitorSlug: 'djen-sync',
    checkInId,
    status: MonitorStatus.ERROR,
  });
  throw error;
}
```

#### Decorator para Funções

```typescript
import { monitorCron } from '@/lib/sentry-crons';

const syncDJEN = monitorCron(
  'djen-sync',
  async () => {
    // Sua lógica de sync aqui
    const data = await fetchDJENData();
    return data;
  },
  {
    schedule: { type: 'crontab', value: '0 12 * * *' }, // Diariamente ao meio-dia UTC
    timezone: 'America/Sao_Paulo',
    max_runtime: 10, // 10 minutos
  }
);

// Executa o job monitorado
await syncDJEN();
```

#### Context Manager

```typescript
import { withCronMonitor, MonitorStatus } from '@/lib/sentry-crons';

await withCronMonitor('backup-job', async (reportStatus) => {
  try {
    // Sua lógica de backup aqui
    await performBackup();
    reportStatus(MonitorStatus.OK);
  } catch (error) {
    reportStatus(MonitorStatus.ERROR);
    throw error;
  }
});
```

### ⏰ Monitores Pré-Definidos

```typescript
import { CRON_MONITORS } from '@/lib/sentry-crons';

// Monitores disponíveis:
CRON_MONITORS.DJEN_SYNC_MORNING      // 9h BRT (diário)
CRON_MONITORS.DJEN_SYNC_EVENING      // 17h BRT (diário)
CRON_MONITORS.DAILY_RESET            // 21h BRT (diário)
CRON_MONITORS.PROCESS_AGENT_QUEUE    // A cada 15min
CRON_MONITORS.PROCESS_NOTIFICATIONS  // A cada 5min
CRON_MONITORS.CALENDAR_SYNC          // A cada 2h
CRON_MONITORS.BACKUP                 // 0h BRT (diário)
CRON_MONITORS.DATAJUD_MONITOR        // 13h BRT (diário)
CRON_MONITORS.DEADLINE_ALERTS        // 8:55 BRT (diário)
CRON_MONITORS.WATCHDOG               // A cada 30min
```

### 📊 Configuração de Monitor

```typescript
interface MonitorConfig {
  schedule: {
    type: 'crontab' | 'interval';
    value: string | number; // '0 12 * * *' ou 60 (para interval)
  };
  timezone?: string;             // 'America/Sao_Paulo'
  checkin_margin?: number;       // Minutos de margem (default: 5)
  max_runtime?: number;          // Tempo máximo em minutos (default: 30)
  failure_issue_threshold?: number; // Falhas consecutivas para criar issue (default: 3)
  recovery_threshold?: number;   // Check-ins OK para resolver issue (default: 1)
}
```

### 🔔 Configurar Alertas no Sentry

1. Navegue para **Alerts** no Sentry
2. Crie um novo alerta e selecione **"Issues"** em **"Errors"**
3. Configure filtro: `The event's tags match monitor.slug equals djen-sync`

---

## 3. Metrics

### 📖 Visão Geral

O sistema de Metrics permite emitir três tipos de métricas customizadas:

- **Counters**: Contadores incrementais (ex: número de cliques, requisições)
- **Distributions**: Distribuições com percentis (ex: latências, tamanhos)
- **Gauges**: Gauges eficientes sem percentis (ex: memória, processos ativos)

### 🛠️ Instalação

```typescript
import { count, distribution, gauge, METRICS } from '@/lib/sentry-metrics';
```

### 💡 Uso Básico

#### Counters

```typescript
import { count } from '@/lib/sentry-metrics';

// Registra 5 cliques de botão
count('button_click', 5, {
  tags: {
    browser: 'Firefox',
    app_version: '1.0.0',
  },
});

// Incrementa em 1 (valor padrão)
count('api_request');
```

#### Distributions

```typescript
import { distribution } from '@/lib/sentry-metrics';

// Registra tempo de carregamento de página
distribution('page_load', 15.0, {
  unit: 'millisecond',
  tags: {
    page: '/home',
  },
});

// Registra tamanho de resposta API
distribution('api_response_size', 1024, {
  unit: 'byte',
  tags: {
    endpoint: '/api/processes',
  },
});
```

#### Gauges

```typescript
import { gauge } from '@/lib/sentry-metrics';

// Registra uso de memória
gauge('memory_usage', 512, {
  unit: 'megabyte',
  tags: {
    instance: 'web-1',
  },
});

// Registra número de processos ativos
gauge('active_processes', 42, {
  tags: {
    status: 'running',
  },
});
```

### ⏱️ Medir Duração

```typescript
import { measureDuration } from '@/lib/sentry-metrics';

const result = await measureDuration(
  'database_query',
  async () => {
    return await db.query('SELECT * FROM processes');
  },
  {
    tags: { table: 'processes' },
  }
);
```

### ⚛️ Hook React - Medir Renderização

```tsx
import { useMeasureRender } from '@/lib/sentry-metrics';

function MyComponent() {
  useMeasureRender('MyComponent', { version: '1.0' });
  
  return <div>...</div>;
}
```

### 🎯 Métricas Pré-Definidas

```typescript
import { METRICS } from '@/lib/sentry-metrics';

// Counters
METRICS.COUNTERS.BUTTON_CLICK
METRICS.COUNTERS.API_REQUEST
METRICS.COUNTERS.ERROR_CAPTURED
METRICS.COUNTERS.PROCESS_CREATED
METRICS.COUNTERS.MINUTA_GENERATED
METRICS.COUNTERS.AGENT_EXECUTED

// Distributions
METRICS.DISTRIBUTIONS.PAGE_LOAD
METRICS.DISTRIBUTIONS.API_RESPONSE_TIME
METRICS.DISTRIBUTIONS.API_RESPONSE_SIZE
METRICS.DISTRIBUTIONS.AGENT_EXECUTION_TIME
METRICS.DISTRIBUTIONS.RENDER_TIME
METRICS.DISTRIBUTIONS.DATABASE_QUERY_TIME

// Gauges
METRICS.GAUGES.MEMORY_USAGE
METRICS.GAUGES.ACTIVE_PROCESSES
METRICS.GAUGES.PENDING_MINUTAS
METRICS.GAUGES.QUEUE_SIZE
METRICS.GAUGES.ACTIVE_AGENTS
```

### 🔧 Filtrar/Modificar Métricas (before_send_metric)

```typescript
import { setBeforeSendMetric } from '@/lib/sentry-metrics';

setBeforeSendMetric((metric, hint) => {
  // Filtra métricas específicas
  if (metric.name === 'removed-metric') {
    return null;
  }
  
  // Adiciona tags extras
  metric.tags = {
    ...metric.tags,
    extra: 'foo',
  };
  
  // Remove tag específica
  if (metric.tags?.browser) {
    delete metric.tags.browser;
  }
  
  return metric;
});
```

### 📊 Unidades Suportadas

```typescript
type MetricUnit =
  | 'nanosecond' | 'microsecond' | 'millisecond' | 'second'
  | 'minute' | 'hour' | 'day' | 'week'
  | 'byte' | 'kilobyte' | 'megabyte' | 'gigabyte' | 'terabyte'
  | 'bit' | 'kilobit' | 'megabit' | 'gigabit'
  | 'percent' | 'none';
```

---

## 4. Integração com Error Tracking

### 🔗 Feature Flags + Erros

Quando um erro ocorre, os feature flags ativos são incluídos automaticamente:

```typescript
import { addFeatureFlag } from '@/lib/sentry-feature-flags';
import * as Sentry from '@sentry/react';

// Registra flags
addFeatureFlag('new-dashboard', true);
addFeatureFlag('max-processes', 100);

// Quando o erro ocorre, flags são incluídos no contexto
try {
  throw new Error('Dashboard error!');
} catch (error) {
  Sentry.captureException(error);
  // No Sentry, você verá:
  // - Context: feature_flag.new-dashboard = true
  // - Tag: flag.new-dashboard = true
}
```

### 📊 Metrics + Erros

Métricas são enviadas como breadcrumbs e tags:

```typescript
import { count, distribution } from '@/lib/sentry-metrics';
import * as Sentry from '@sentry/react';

// Registra métrica
count('api_request', 1, { tags: { endpoint: '/api/processes' } });

// Se ocorrer erro logo depois, a métrica aparece como breadcrumb
Sentry.captureException(new Error('API failed'));
// Breadcrumb: metric.counter > api_request: 1
```

---

## 5. Dashboards e Queries no Sentry

### 🔍 Buscar por Feature Flag

```
flag.new-dashboard:true
```

### 🔍 Buscar por Monitor de Cron

```
monitor.slug:djen-sync
monitor.status:error
```

### 📈 Criar Dashboard de Métricas

1. Acesse **Dashboards** no Sentry
2. Crie um novo dashboard
3. Adicione widgets:
   - **Counter**: `metric.button_click`
   - **Distribution**: `metric.page_load` (p50, p90, p99)
   - **Gauge**: `metric.active_processes` (avg, max)

---

## 6. Best Practices

### ✅ Feature Flags

- ✅ Registre flags **antes** de usar a feature
- ✅ Use flags pré-definidos (`FEATURE_FLAGS`)
- ✅ Integre com provedor de flags (LaunchDarkly, Statsig, etc.)
- ❌ Não abuse de flags - mantenha lista enxuta

### ✅ Crons

- ✅ Use `monitorCron` decorator para automação
- ✅ Configure `max_runtime` e `checkin_margin`
- ✅ Crie alertas no Sentry para monitores críticos
- ❌ Não crie monitores para jobs que rodam com muita frequência (< 1min)

### ✅ Metrics

- ✅ Use **counters** para eventos discretos (cliques, erros)
- ✅ Use **distributions** quando precisar de percentis (latências)
- ✅ Use **gauges** quando percentis não importam (memória, queue size)
- ✅ Adicione tags para segmentar métricas
- ❌ Não crie métricas com cardinalidade alta (muitos valores únicos)

### 🔐 Privacidade

- **Feature Flags**: Não incluem PII por padrão
- **Crons**: Breadcrumbs podem conter nomes de jobs (seguros)
- **Metrics**: Tags podem conter identificadores - evite PII

---

## 📚 Referências

- [Sentry Feature Flags (Python)](https://docs.sentry.io/platforms/python/feature-flags/)
- [Sentry Crons (Python)](https://docs.sentry.io/platforms/python/crons/)
- [Sentry Metrics (Python)](https://docs.sentry.io/platforms/python/metrics/)
- [Sentry AI Monitoring](https://docs.sentry.io/product/insights/ai/agents/)

---

## 🆘 Troubleshooting

### Problema: Feature flags não aparecem no Sentry

**Solução**: Verifique se `send_default_pii` está habilitado no `sentry_sdk.init()`.

```typescript
Sentry.init({
  dsn: "...",
  sendDefaultPii: true, // Necessário para contexts
});
```

### Problema: Crons não criam alertas

**Solução**: Configure alertas manualmente no Sentry:

1. **Alerts** > **Create Alert**
2. Filtro: `monitor.slug equals seu-monitor-slug`

### Problema: Métricas não aparecem no dashboard

**Solução**: Sentry JS SDK não tem API nativa para métricas (ainda). Atualmente, usamos breadcrumbs + tags. Para métricas completas, considere usar Sentry Python SDK no backend.

---

**✅ Sistema completo de observabilidade Sentry implementado!**

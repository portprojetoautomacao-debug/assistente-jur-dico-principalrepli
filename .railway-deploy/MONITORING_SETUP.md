# 📊 Guia de Configuração de Monitoramento

## Error Tracking (Sentry/GitLab)

### Status Atual
✅ **Implementado** - `src/services/error-tracking.ts`

### Configuração

O sistema já está configurado com GitLab Error Tracking. Para ativar:

1. **Variáveis de Ambiente** (opcional - já tem DSN hardcoded):
```env
VITE_SENTRY_DSN=https://glet_11997d8fcca1f917be020f0d22aa5175@observe.gitlab.com:443/errortracking/api/v1/projects/76299042
VITE_APP_VERSION=1.0.0
```

2. **Inicialização** (já implementado em `main.tsx`):
```typescript
import { initErrorTracking } from '@/services/error-tracking'

// Inicializa apenas em produção
if (import.meta.env.PROD) {
  initErrorTracking()
}
```

### Features Ativas

✅ **Automatic Error Capture**
- Erros não tratados
- Promise rejections
- Console errors

✅ **Performance Monitoring**
- Sample rate: 10% em produção
- Traces de navegação
- API calls timing

✅ **Session Replay**
- 10% das sessões normais
- 100% das sessões com erro
- Dados sensíveis mascarados

✅ **Breadcrumbs**
- Últimas 50 ações do usuário
- Navegação
- Cliques
- API calls

### Uso Manual

```typescript
import * as Sentry from '@sentry/react'

// Capturar erro manualmente
try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'process-management' },
    extra: { processId: '123' }
  })
}

// Adicionar contexto do usuário
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name
})

// Adicionar breadcrumb
Sentry.addBreadcrumb({
  category: 'action',
  message: 'User clicked save button',
  level: 'info'
})
```

---

## Performance Monitoring (Vercel Speed Insights)

### Status Atual
✅ **Implementado** - `src/App.tsx`

### Configuração

Já ativo automaticamente no Vercel. Nenhuma configuração adicional necessária.

```typescript
import { SpeedInsights } from '@vercel/speed-insights/react'

function App() {
  return (
    <>
      <YourApp />
      <SpeedInsights />
    </>
  )
}
```

### Métricas Coletadas

- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time to First Byte)

### Visualização

Acesse: https://vercel.com/dashboard → Seu Projeto → Speed Insights

---

## Analytics (Opcional)

### Google Analytics 4

Para adicionar GA4:

1. **Instalar dependência:**
```bash
npm install react-ga4
```

2. **Configurar:**
```typescript
// src/lib/analytics.ts
import ReactGA from 'react-ga4'

export function initAnalytics() {
  if (import.meta.env.PROD && import.meta.env.VITE_GA_MEASUREMENT_ID) {
    ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID)
  }
}

export function trackPageView(path: string) {
  ReactGA.send({ hitType: 'pageview', page: path })
}

export function trackEvent(category: string, action: string, label?: string) {
  ReactGA.event({ category, action, label })
}
```

3. **Usar no App:**
```typescript
import { initAnalytics, trackPageView } from '@/lib/analytics'

useEffect(() => {
  initAnalytics()
  trackPageView(window.location.pathname)
}, [])

// Track navigation
useEffect(() => {
  trackPageView(currentView)
}, [currentView])
```

---

## Lighthouse CI

### Status Atual
✅ **Configurado** - `lighthouserc.json`

### Executar Localmente

```bash
# Build do projeto
npm run build

# Executar Lighthouse
npx lighthouse-ci autorun
```

### Thresholds Configurados

- Performance: ≥ 70%
- Accessibility: ≥ 90%
- Best Practices: ≥ 90%
- SEO: ≥ 90%

### CI/CD Integration

Adicionar ao GitHub Actions:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npx lighthouse-ci autorun
```

---

## Custom Metrics (Agent Performance)

### Implementação Atual

Métricas de agentes já estão sendo coletadas:

```typescript
// src/hooks/use-autonomous-agents.ts
const metrics = {
  totalTasksProcessed: number
  successRate: number
  averageProcessingTime: number
  activeAgents: number
  queuedTasks: number
}
```

### Exportar para Dashboard

Criar endpoint de métricas:

```typescript
// api/metrics.ts
export default async function handler(req, res) {
  const metrics = await getAgentMetrics()
  
  res.json({
    timestamp: new Date().toISOString(),
    agents: metrics.agents.map(a => ({
      id: a.id,
      name: a.name,
      tasksCompleted: a.tasksCompleted,
      tasksToday: a.tasksToday,
      status: a.status
    })),
    orchestrator: {
      totalTasks: metrics.totalTasksProcessed,
      successRate: metrics.successRate,
      avgTime: metrics.averageProcessingTime
    }
  })
}
```

### Visualização

Integrar com:
- **Grafana** - Dashboards customizados
- **Datadog** - APM completo
- **New Relic** - Performance monitoring

---

## Alertas e Notificações

### Configurar Alertas no Sentry

1. Acesse: GitLab → Monitor → Error Tracking
2. Configure regras de alerta:
   - Novos erros
   - Spike de erros (>10 em 5min)
   - Erros críticos

### Webhook para Slack/Discord

```typescript
// api/webhook-alerts.ts
export default async function handler(req, res) {
  const { error, level } = req.body
  
  if (level === 'critical') {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 Erro Crítico: ${error.message}`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Erro', value: error.message },
            { title: 'Stack', value: error.stack }
          ]
        }]
      })
    })
  }
  
  res.json({ ok: true })
}
```

---

## Checklist de Monitoramento

### Produção
- [x] Sentry/GitLab Error Tracking
- [x] Vercel Speed Insights
- [x] Lighthouse CI configurado
- [ ] Google Analytics (opcional)
- [ ] Alertas configurados
- [ ] Dashboard de métricas

### Desenvolvimento
- [x] Console logs (removidos em prod)
- [x] React DevTools
- [x] Network tab monitoring
- [ ] Performance profiling

---

## Troubleshooting

### Sentry não está capturando erros

1. Verificar DSN configurado
2. Verificar ambiente (só ativa em prod)
3. Verificar console para erros de inicialização

### Speed Insights não aparece

1. Verificar deploy no Vercel
2. Aguardar 24h para primeiros dados
3. Verificar componente `<SpeedInsights />` no App

### Lighthouse CI falhando

1. Verificar build bem-sucedido
2. Verificar thresholds em `lighthouserc.json`
3. Executar localmente para debug

---

**Última atualização:** 23/11/2025  
**Status:** ✅ Implementado

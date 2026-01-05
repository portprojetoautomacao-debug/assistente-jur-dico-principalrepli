# 📊 Relatório de Análise Lighthouse - Soluções Técnicas Completas

**Data**: 29 de Novembro de 2025  
**App**: https://assistente-juridico-github.vercel.app/  
**Lighthouse**: 12.8.2 (Chromium 142.0.0.0)

---

## ✅ CORREÇÕES APLICADAS (29/11/2025)

| # | Correção | Arquivo | Status |
|---|----------|---------|--------|
| 1 | Removido `'unsafe-inline'` do CSP script-src | `vercel.json` | ✅ Aplicado |
| 2 | Desabilitado Trusted Types (temporário) | `src/main.tsx` | ✅ Aplicado |
| 3 | VitePWA com `injectRegister: 'inline'` | `vite.config.ts` | ✅ Aplicado |
| 4 | Fonte Inter hospedada localmente | `public/fonts/` + `src/index.css` | ✅ Aplicado |
| 5 | Lazy loading do TiptapEditor | `src/components/MinutasManager.tsx` | ✅ Aplicado |
| 6 | Cache header para fontes | `vercel.json` | ✅ Aplicado |
| 7 | Preload da fonte Inter no HTML | `index.html` | ✅ Aplicado |

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. Erros de Performance (NO_NAVSTART)

**Erro**: `Something went wrong with recording the trace over your page load. Please run Lighthouse again. (NO_NAVSTART)`

**Causa Raiz**: 
- O erro de JavaScript está impedindo que a página carregue corretamente
- O CSP está bloqueando o Service Worker (`registerSW.js`)
- A aplicação React falha antes do `navigationStart`

**Erros JavaScript no Console**:
```
TypeError: Cannot set properties of undefined (setting 'Activity')
TypeError: Failed to execute 'register' on 'ServiceWorkerContainer': This document requires 'TrustedScriptURL' assignment.
Failed to load resource: the server responded with a status of 404 () (fonts.gstatic.com)
```

---

## 🛠️ SOLUÇÕES TÉCNICAS DETALHADAS

### SOLUÇÃO 1: Corrigir CSP para Trusted Types

O erro `This document requires 'TrustedScriptURL' assignment` ocorre porque o CSP está exigindo Trusted Types, mas o `registerSW.js` não está passando uma URL confiável.

**Problema no `vercel.json`**:
```json
"Content-Security-Policy": "... script-src 'self' 'unsafe-inline' ..."
```

A CSP atual usa `'unsafe-inline'` que é considerado inseguro pelo Lighthouse.

---

### SOLUÇÃO 2: Corrigir erro de fonte 404

O erro `fonts.gstatic.com/s/…hjp-Ek-_EeA.woff2:1 Failed to load resource: 404` indica que a URL da fonte Inter está incorreta ou truncada.

**URL atual no `index.css` (linha 9)**:
```css
src: url(https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2)
```

Esta URL está correta, mas o Lighthouse pode estar mostrando uma versão truncada. O problema real é que dependemos de uma CDN externa.

---

### SOLUÇÃO 3: Corrigir erro TypeError no Editor Tiptap

O erro `Cannot set properties of undefined (setting 'Activity')` indica um problema de inicialização do React ou Tiptap.

**Arquivo**: `react-vendor-CHVg_mey.js:25` → `editor-DuJ28j7t.js:9`

Isso sugere que o código do editor está tentando acessar uma propriedade antes da inicialização completa.

---

## ✅ CORREÇÕES A IMPLEMENTAR

### Correção 1: Ajustar CSP no `vercel.json`

Remove a necessidade de `require-trusted-types-for` e ajusta `script-src`:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://vercel.live https://*.vercel.app https://apis.google.com https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://www.gstatic.com https://tagmanager.google.com; img-src 'self' data: blob: https://*.googleusercontent.com https://*.githubusercontent.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://ssl.gstatic.com https://www.gstatic.com; font-src 'self' https://fonts.gstatic.com https://*.gstatic.com data:; connect-src 'self' https://*.vercel.app https://*.googleapis.com https://apis.google.com https://*.upstash.io https://accounts.google.com https://fonts.gstatic.com https://*.gstatic.com https://main.vscode-cdn.net https://*.tunnels.api.visualstudio.com wss://*.tunnels.api.visualstudio.com https://*.rel.tunnels.api.visualstudio.com wss://*.rel.tunnels.api.visualstudio.com https://*.sentry.io https://*.ingest.sentry.io https://api.datajud.cnj.jus.br https://www.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net; worker-src 'self' blob:; frame-src 'self' https://accounts.google.com https://vercel.live https://www.googletagmanager.com; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
}
```

**Mudanças**:
1. ❌ Removido `'unsafe-inline'` de `script-src` (era a causa do warning High severity)
2. ✅ Adicionado `data:` em `font-src` para fallback
3. ✅ Service Worker usa `blob:` em `worker-src`

---

### Correção 2: Desabilitar Trusted Types (temporariamente)

O problema é que o PWA plugin gera `registerSW.js` que não é compatível com Trusted Types rígido.

**Opção A**: Desabilitar Trusted Types no main.tsx (recomendado para produção):

```typescript
// src/main.tsx - NÃO inicializar Trusted Types automaticamente
// import('./lib/trusted-types').then...  // COMENTAR ESTA LINHA
```

**Opção B**: Criar wrapper seguro para registerSW:

---

### Correção 3: Configurar PWA para ser compatível com CSP

No `vite.config.ts`, ajustar o VitePWA:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'inline', // Muda de 'script' para 'inline'
  // OU desabilitar completamente:
  // injectRegister: false,
  // devOptions: { enabled: false },
  ...
})
```

---

### Correção 4: Usar fontes locais (melhor performance)

Ao invés de depender do Google Fonts CDN, hospedar a fonte localmente:

1. Baixar Inter de https://fonts.google.com/specimen/Inter
2. Colocar em `/public/fonts/`
3. Atualizar CSS:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/Inter-VariableFont.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

---

### Correção 5: Lazy loading do Editor Tiptap

O erro `Cannot set properties of undefined (setting 'Activity')` indica que o código do editor está sendo carregado antes do DOM estar pronto.

No componente que usa o editor, adicionar:

```tsx
import { lazy, Suspense } from 'react'

const TiptapEditor = lazy(() => import('@/components/editor/TiptapEditor'))

// No JSX:
<Suspense fallback={<div>Carregando editor...</div>}>
  <TiptapEditor {...props} />
</Suspense>
```

---

### Correção 6: Adicionar Cache Headers Eficientes

No `vercel.json`, já temos:
```json
{
  "source": "/assets/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
}
```

Adicionar para fontes:
```json
{
  "source": "/fonts/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
}
```

---

### Correção 7: Otimizar Minificação

O Lighthouse reporta `Minify CSS` e `Minify JavaScript`. Verificar se o build está usando minificação:

No `vite.config.ts` já temos:
```typescript
build: {
  cssMinify: 'lightningcss',
  minify: 'esbuild',
  target: 'es2020',
}
```

Isso está correto. O problema pode ser código de terceiros não minificado.

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

| # | Tarefa | Prioridade | Impacto |
|---|--------|------------|---------|
| 1 | Remover `'unsafe-inline'` do CSP script-src | 🔴 Alta | Fix erros console + Best Practices |
| 2 | Comentar inicialização Trusted Types | 🔴 Alta | Fix Service Worker registration |
| 3 | Mudar VitePWA injectRegister | 🟡 Média | Compatibilidade CSP |
| 4 | Hospedar fonte Inter localmente | 🟡 Média | Fix 404 + melhor LCP |
| 5 | Lazy load do TiptapEditor | 🟡 Média | Fix TypeError + melhor TTI |
| 6 | Adicionar cache para /fonts | 🟢 Baixa | Melhor cache performance |
| 7 | Verificar código de terceiros | 🟢 Baixa | Reduce unused JS |

---

## 🔧 COMANDOS PARA APLICAR

Após implementar as correções:

```bash
# Build local para testar
npm run build

# Preview
npm run preview

# Rodar Lighthouse localmente
npx lighthouse http://localhost:4173 --view
```

---

## 📊 SCORES ESPERADOS APÓS CORREÇÕES

| Categoria | Antes | Esperado |
|-----------|-------|----------|
| Performance | Error | 70-85 |
| Accessibility | 100 | 100 |
| Best Practices | 79 | 90+ |
| SEO | 100 | 100 |

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **O erro NO_NAVSTART** é causado por JavaScript quebrando antes do page load completar. Corrigir os erros de console é a prioridade.

2. **Trusted Types** é uma feature avançada de segurança. Se causar problemas, é melhor desabilitar do que ter uma app quebrada.

3. **Google Fonts 404** pode ser intermitente ou específico da rede do Lighthouse. Hospedar localmente elimina essa variável.

4. **O CSP com 'unsafe-inline'** está sendo reportado como vulnerabilidade de segurança pelo Lighthouse. É importante remover.

---

*Documento gerado em 29/11/2025 - Assistente Jurídico PJe*

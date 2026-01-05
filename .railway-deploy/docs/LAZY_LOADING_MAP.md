# Mapa de Lazy Loading - Performance Optimization

## 📋 Estratégia de Code Splitting

O projeto usa **lazy loading** para melhorar performance inicial, dividindo o bundle em chunks menores.

### 🎯 Por Que Lazy Loading?

- **Initial Load**: Apenas ~200KB ao invés de ~2MB
- **Time to Interactive**: < 2s ao invés de ~5-8s
- **Lighthouse Score**: 90+ ao invés de 60-70
- **Core Web Vitals**: Melhora FCP, LCP, TTI

## 🗺️ Componentes Lazy-Loaded

Configuração em [`src/App.tsx`](../src/App.tsx):

### ⚡ Componentes CRÍTICOS (Carregados Diretamente)

```tsx
// Sempre visíveis - não usar lazy()
import Dashboard from "@/components/Dashboard";
import Sidebar from "@/components/Sidebar";
import NotificationCenter from "@/components/NotificationCenter";
import GlobalSearch from "@/components/GlobalSearch";
```

**Por quê?**: Usuário sempre vê primeiro ao abrir o app.

### 📦 Componentes PESADOS (Lazy-Loaded)

```tsx
// Lazy loading via React.lazy()
const HarveySpecterChat = lazy(() => import("@/components/HarveySpecterChat"));
const MinutasManager = lazy(() => import("@/components/MinutasManager"));
const ProcessCRM = lazy(() => import("@/components/ProcessCRM"));
const Calendar = lazy(() => import("@/components/Calendar"));
const FinancialManagement = lazy(() => import("@/components/FinancialManagement"));
const CalculadoraPrazos = lazy(() => import("@/components/CalculadoraPrazos"));
const PDFUploader = lazy(() => import("@/components/PDFUploader"));
const AIAgents = lazy(() => import("@/components/AIAgents"));
const AnalyticsDashboard = lazy(() => import("@/components/AnalyticsDashboard"));
const ExpedientePanel = lazy(() => import("@/components/ExpedientePanel"));
const BatchAnalysis = lazy(() => import("@/components/BatchAnalysis"));
const AudioTranscription = lazy(() => import("@/components/AudioTranscription"));
const DatabaseQueries = lazy(() => import("@/components/DatabaseQueries"));
const DatajudChecklist = lazy(() => import("@/components/DatajudChecklist"));
const KnowledgeBase = lazy(() => import("@/components/KnowledgeBase"));
const AcervoPJe = lazy(() => import("@/components/AcervoPJe"));
```

**Por quê?**: Carregam sob demanda quando usuário navega para a view.

## 📂 Chunks Gerados (Vite Build)

### Estrutura de Output

```
dist/assets/
├── index-abc123.js           # Main bundle (~200KB)
├── MinutasManager-def456.js  # ~150KB (TipTap + Google Docs)
├── ProcessCRM-ghi789.js      # ~80KB (CRM components)
├── Calendar-jkl012.js        # ~60KB (FullCalendar)
├── HarveySpecterChat-mno345.js # ~50KB (Chat components)
├── FinancialManagement-pqr678.js # ~40KB (Charts)
├── AIAgents-stu901.js        # ~35KB (Agent UI)
├── ... (outros chunks)
```

### Manual Chunks (vite.config.ts)

```typescript
manualChunks: {
  // Vendors grandes
  'react-vendor': ['react', 'react-dom'],
  'router': ['react-router-dom'],
  'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  
  // Libs específicas
  'tiptap': ['@tiptap/react', '@tiptap/core'],
  'charts': ['recharts'],
  'calendar': ['react-big-calendar'],
  'pdf': ['react-pdf'],
  
  // Componentes grandes
  'minutas': [/MinutasManager/],
  'editor': [/TiptapEditor/],
  'agents': [/AIAgents/]
}
```

## 🔧 Como Adicionar Novo Componente Lazy

### 1. Se componente > 30KB (build)

```tsx
// App.tsx
const MeuNovoComponente = lazy(() => import("@/components/MeuNovoComponente"));

// Usage
<Suspense fallback={<LoadingFallback />}>
  <MeuNovoComponente />
</Suspense>
```

### 2. Se componente < 30KB

```tsx
// Importar diretamente
import MeuPequenoComponente from "@/components/MeuPequenoComponente";

// Uso direto (sem Suspense)
<MeuPequenoComponente />
```

## 📊 Skeleton Loaders

### LoadingFallback Padrão

```tsx
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);
```

### Skeletons Customizados

Para componentes específicos, crie skeleton que imita layout:

```tsx
const MinutasLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="h-12 bg-gray-200 rounded animate-pulse" />
    <div className="h-64 bg-gray-200 rounded animate-pulse" />
    <div className="h-32 bg-gray-200 rounded animate-pulse" />
  </div>
);

// Usage
<Suspense fallback={<MinutasLoadingSkeleton />}>
  <MinutasManager />
</Suspense>
```

## 🚫 Quando NÃO Usar Lazy Loading

- **Componentes pequenos** (< 30KB)
- **Componentes sempre visíveis** (Sidebar, Header)
- **Componentes críticos para First Paint**
- **Componentes usados em > 80% das sessões**

## 📈 Monitoramento de Performance

### Lighthouse CI

```bash
# Rodar audit local
npm run lighthouse

# Ver bundle analyzer
npm run build && npx vite-bundle-visualizer
```

### Métricas Alvo

| Métrica | Alvo | Atual |
|---------|------|-------|
| **First Contentful Paint** | < 1.8s | ~1.2s |
| **Largest Contentful Paint** | < 2.5s | ~2.0s |
| **Time to Interactive** | < 3.8s | ~2.5s |
| **Total Blocking Time** | < 200ms | ~150ms |
| **Cumulative Layout Shift** | < 0.1 | ~0.05 |

## 🔄 Atualizar Estratégia de Lazy Loading

### Checklist Anual (ou se bundle > 300KB)

1. **Analisar bundle**:
   ```bash
   npm run build
   npx vite-bundle-visualizer
   ```

2. **Identificar chunks grandes** (> 100KB):
   - Ver quais componentes estão juntos
   - Separar se forem usados em views diferentes

3. **Criar manual chunk** em `vite.config.ts`:
   ```typescript
   manualChunks: {
     'novo-chunk': [/ComponenteGrande/]
   }
   ```

4. **Testar**:
   - Lighthouse: Performance score > 90
   - Bundle size: Main chunk < 250KB
   - Lazy chunks: Nenhum > 200KB

5. **Commit & Deploy**

## 📚 Referências

- **Vite Code Splitting**: https://vitejs.dev/guide/build.html#chunking-strategy
- **React Lazy**: https://react.dev/reference/react/lazy
- **Lighthouse**: https://developer.chrome.com/docs/lighthouse/

---

**Última atualização**: 13/12/2024  
**Responsável**: Sistema automático de otimização

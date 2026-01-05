# Padronização de Cores Semânticas - themeConfig.colors

## Objetivo
Centralizar o uso de cores semânticas em badges e indicadores de status, facilitando manutenção e garantindo consistência visual.

## Sistema de Cores (`src/lib/themes.ts`)

### Cores de Estado
```typescript
themeConfig.colors.urgente    // hsl(0, 72%, 51%)   - Vermelho
themeConfig.colors.alerta     // hsl(38, 92%, 50%)  - Laranja
themeConfig.colors.sucesso    // hsl(142, 71%, 45%) - Verde
themeConfig.colors.info       // hsl(221, 83%, 53%) - Azul
```

### Cores de Tipo de Documento
```typescript
themeConfig.colors.certidao   // hsl(199, 89%, 48%) - Sky blue
themeConfig.colors.sentenca   // hsl(0, 72%, 51%)   - Red
themeConfig.colors.despacho   // hsl(262, 83%, 58%) - Indigo/Purple
themeConfig.colors.peticao    // hsl(160, 84%, 39%) - Emerald
themeConfig.colors.intimacao  // hsl(280, 65%, 60%) - Purple
themeConfig.colors.mandado    // hsl(38, 92%, 50%)  - Amber
themeConfig.colors.juntada    // hsl(221, 83%, 53%) - Blue
themeConfig.colors.conclusos  // hsl(173, 80%, 40%) - Teal
```

## Padrão de Uso

### 1. Helper para Badges com Style Inline
```typescript
const getStatusStyle = (status: string): React.CSSProperties => {
  const colorMap = {
    finalizada: themeConfig.colors.sucesso,
    'pendente-revisao': themeConfig.colors.alerta,
    urgente: themeConfig.colors.urgente,
  };

  const base = colorMap[status] || themeConfig.colors.info;
  return {
    color: base,
    backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
    borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
  };
};

// Uso:
<Badge style={getStatusStyle('urgente')}>Urgente</Badge>
```

### 2. Para Textos e Ícones
```typescript
<div style={{ color: themeConfig.colors.urgente }}>
  {stats.urgentDeadlines}
</div>
```

## Componentes Atualizados

### ✅ ProcessosView.tsx
- Badge "Urgente": usa `getUrgenteStyle()` com `themeConfig.colors.urgente`
- Estatística "Prazos": texto com `style={{ color: themeConfig.colors.urgente }}`

## Componentes Pendentes (para próximas sprints)

### AIAgents.tsx
- Badges de status de agente
- Indicadores de capacidade
- Status de tarefas

### MinutasManager.tsx
- Badges de status de minuta (rascunho, em-revisao, finalizada, arquivada)
- Badge "IA" para minutas criadas por agente

### Widgets e Dashboards
- Indicadores de prazos urgentes
- Status de intimações
- Tipos de documento

## Migração Futura (Opcional)

### CSS Variables Globais
```css
:root {
  --color-urgente: hsl(0, 72%, 51%);
  --color-alerta: hsl(38, 92%, 50%);
  --color-sucesso: hsl(142, 71%, 45%);
  --color-info: hsl(221, 83%, 53%);
}
```

### Tailwind com Arbitrary Values
```tsx
<Badge className="text-[--color-urgente] bg-[--color-urgente]/10 border-[--color-urgente]/20">
  Urgente
</Badge>
```

## Princípios de Manutenção

1. **Centralização**: Sempre usar `themeConfig.colors` como fonte única de verdade
2. **Transparência**: Manter padrão de 10% para fundo, 20% para borda
3. **Rastreabilidade**: Mudanças pequenas e incrementais com PRs dedicados
4. **Reversibilidade**: Comportamento visual mantido; fácil rollback
5. **Compatibilidade**: Não alterar estrutura de componentes ou fluxo de dados

## Referências
- Arquivo: `src/lib/themes.ts`
- Helpers: `getEventColor()`, `getEventBadgeClass()`, `getStatusBadgeClass()`
- Issue: #200 (Mover ProcessosView para components raiz)

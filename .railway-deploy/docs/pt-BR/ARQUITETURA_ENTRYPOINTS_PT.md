# Arquitetura: Pontos de Entrada e Estrutura Principal

Este arquivo descreve, em português, os pontos de entrada do projeto e o fluxo de renderização dos componentes principais — útil para extração de código e migração para GitHub Spark.

┌─────────────────────────────────────────────────────────┐
│                    index.html (Entry)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   src/main.tsx                           │
│  - Importa @github/spark                                │
│  - ErrorBoundary                                        │
│  - Renderiza <App />                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   src/App.tsx                            │
│  - Renderiza <HarveySpecter /> (Donna.tsx)              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            src/components/Donna.tsx                      │
│              (Componente Principal)                      │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │  Harvey Specter - Interface do Assistente  │         │
│  │                                            │         │
│  │  • Chat com IA                             │
│  │  • Navegação entre módulos (Tabs)         │
│  │  • Dashboard                               │
│  │  • Processos                               │
│  │  • Calendário                              │
│  │  • Financeiro                              │
│  │  • Agentes IA                              │
│  │  • Configurações                           │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘

Notas importantes:

- `index.html` é o ponto de entrada estático. Ele injeta a aplicação React no DOM.
- `src/main.tsx` inicializa a integração com o Spark (via `@github/spark`), configura o `ErrorBoundary` e faz o `root.render(<App />)`.
- `src/App.tsx` conecta as rotas/áreas principais e renderiza o componente raiz `Donna.tsx` (a interface do assistente Harvey Specter).
- O componente `Donna.tsx` administra a UI de alto nível: gerenciamento do chat com IA, navegação entre módulos, telas de dashboard e utilitários como calendário e financeiro.

Recomendações para extração e migração para Spark:

- Preservar a separação entre o ponto de entrada (setup do runtime Spark) e o componente de UI principal (`Donna.tsx`).
- Mover lógica de persistência para `useKV` ou `spark.kv`, mantendo adaptadores se necessário.
- Evitar APIs do browser que não são permitidas pelo Spark: `window.confirm`, `localStorage` direto, e chamadas diretas de backend sem proxy.

---

Se desejar, eu posso adicionar uma versão curta desse mapa em `README.md` ou expandir para incluir dependências dos arquivos (ex: `src/components/*`) e uma lista priorizada para migração (MVP vs Complete).
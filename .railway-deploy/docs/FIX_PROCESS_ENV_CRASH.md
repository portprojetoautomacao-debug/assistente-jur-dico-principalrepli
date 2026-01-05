# Correção do Erro "Carregando sistema..." (ReferenceError: process is not defined)

## O Problema

O aplicativo estava travado na tela de carregamento ("Carregando sistema...") em produção (Vercel) e localmente após o build. O console do navegador mostrava o erro:
`ReferenceError: process is not defined`

## A Causa

O Vite é uma ferramenta de build moderna que não inclui polyfills para variáveis globais do Node.js, como `process`, no código do navegador.
No entanto, vários arquivos na pasta `src/lib/` (que são compartilhados ou importados pelo frontend) estavam acessando `process.env` diretamente.

Arquivos afetados:

- `src/lib/agent-monitoring.ts`
- `src/lib/notifications.ts`
- `src/lib/djen-monitor.ts`
- `src/lib/legal-memory.ts`

Quando o navegador tentava carregar esses módulos, ele encontrava `process.env` e falhava imediatamente, antes mesmo do React montar a aplicação.

## A Solução

Criamos um utilitário seguro `src/lib/env-helper.ts` que abstrai o acesso às variáveis de ambiente, verificando tanto `import.meta.env` (Vite) quanto `process.env` (Node.js) de forma segura (sem lançar erro se `process` não existir).

### Novo Utilitário: `src/lib/env-helper.ts`

```typescript
export function getEnv(key: string, defaultValue: string = ""): string {
  // Tenta import.meta.env (Vite)
  // Tenta process.env (Node.js) de forma segura
  // Retorna defaultValue se não encontrar
}
```

### Alterações Realizadas

Substituímos todas as chamadas diretas `process.env.VARIAVEL` por `getEnv('VARIAVEL')` nos arquivos afetados.

## Como Prevenir

1. **Nunca use `process.env` em arquivos dentro de `src/`**.
2. Use sempre `import.meta.env` para variáveis expostas ao cliente (prefixadas com `VITE_`).
3. Para código compartilhado (isomórfico) que roda tanto no servidor quanto no cliente, use `src/lib/env-helper.ts`.
4. Se precisar de uma variável de servidor no cliente, certifique-se de que ela tem o prefixo `VITE_` e está configurada no `.env`.

## Próximos Passos

1. Faça o commit dessas alterações.
2. O deploy automático na Vercel deve corrigir o problema.

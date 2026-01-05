# Correção de Loop Infinito e Erro 404

## Problema 1: Loop Infinito (Maximum update depth exceeded)

**Sintoma:** A aplicação travava com o erro "Maximum update depth exceeded" no console do React.

**Causa:** O hook customizado `useKV` (`src/hooks/use-kv.ts`) tinha uma dependência circular na função `setValue`.
A função `setValue` dependia de `storedValue` no array de dependências do `useCallback`.
Isso fazia com que `setValue` fosse recriada toda vez que o valor mudava.
Se `setValue` fosse usada em um `useEffect` (comum em componentes que sincronizam estado), isso causava um loop infinito:
`setValue` -> muda valor -> recria `setValue` -> dispara `useEffect` -> chama `setValue` -> ...

**Correção:**
Atualizamos `src/hooks/use-kv.ts` para usar a forma funcional de atualização de estado (`setStoredValue(prev => ...)`).
Isso permitiu remover `storedValue` das dependências do `useCallback`, tornando a função `setValue` estável (não muda entre renderizações).

## Problema 2: Erro 404 em `/_spark/loaded`

**Sintoma:** O console exibe `Failed to load resource: the server responded with a status of 404 (Not Found) :3000/_spark/loaded:1`.

**Causa:**
Este erro ocorre porque a biblioteca `@github/spark` tenta verificar se o ambiente de execução Spark está disponível chamando o endpoint `/_spark/loaded`.
Como você está rodando a aplicação localmente (via `vite preview` ou `serve`) ou em um container padrão, este endpoint não existe.
O arquivo `vercel.json` contém uma regra de reescrita para este endpoint, mas ela só é aplicada quando rodando na Vercel ou via `vercel dev`.

**Impacto:**
Este erro é **inofensivo** no ambiente local e não afeta o funcionamento da aplicação. Ele apenas indica que as funcionalidades específicas do runtime Spark não estão ativas (o que é esperado localmente).

## Status Atual

- ✅ **Build:** Sucesso.
- ✅ **Loop Infinito:** Corrigido em `useKV`.
- ✅ **Gráficos:** Corrigidos (width 99%).
- ℹ️ **Erro 404:** Identificado como inofensivo/esperado localmente.

A aplicação deve estar estável agora.

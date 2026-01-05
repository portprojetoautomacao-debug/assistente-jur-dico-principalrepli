# Correção do Erro FileReader e NO_FCP

## Diagnóstico
O relatório do Lighthouse indicou um erro crítico que impedia a renderização da página (NO_FCP - No First Contentful Paint):
`TypeError: Failed to execute 'readAsText' on 'FileReader': parameter 1 is not of type 'Blob'`

Este erro ocorre quando o método `readAsText` do `FileReader` é chamado com um argumento que não é um objeto `Blob` válido (por exemplo, `null`, `undefined` ou um objeto genérico).

Como não encontramos uso explícito de `readAsText` no código fonte da aplicação (apenas em `PDFUploader` que usa `readAsArrayBuffer` e `DocumentUploader` que usa `readAsDataURL`), concluímos que o erro provém de uma biblioteca de terceiros ou de um polyfill interno que está falhando silenciosamente durante a inicialização.

## Solução Aplicada
Implementamos um "Monkey Patch" defensivo no protótipo do `FileReader` em `src/lib/spark-client-fixes.ts`.

### O que o patch faz:
1. Intercepta todas as chamadas para `FileReader.prototype.readAsText`.
2. Verifica se o argumento passado é realmente uma instância de `Blob`.
3. Se **NÃO** for um Blob:
   - Registra um aviso no console (`console.warn`) em vez de lançar um erro fatal.
   - Dispara o evento `onerror` do FileReader de forma controlada.
   - Impede que a exceção `TypeError` derrube a thread principal do JavaScript.
4. Se for um Blob válido, executa o método original normalmente.

### Código do Patch
```typescript
export function patchFileReader() {
  if (typeof window === 'undefined') return;

  const originalReadAsText = FileReader.prototype.readAsText;
  FileReader.prototype.readAsText = function(blob, encoding) {
    if (!(blob instanceof Blob)) {
      console.warn('FileReader.readAsText called with non-Blob argument:', blob);
      // Tratamento de erro gracioso
      if (this.onerror) {
        const event = new ProgressEvent('error');
        Object.defineProperty(this, 'error', {
          value: new DOMException('Parameter is not of type Blob', 'TypeMismatchError'),
          writable: true
        });
        this.onerror(event);
      }
      return;
    }
    return originalReadAsText.call(this, blob, encoding);
  };
}
```

## Próximos Passos
1. Realizar novo deploy.
2. Executar auditoria do Lighthouse novamente.
3. Verificar se a tela branca foi resolvida e se o erro sumiu do console.

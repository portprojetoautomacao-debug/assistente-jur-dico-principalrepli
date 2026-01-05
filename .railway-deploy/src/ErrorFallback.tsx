interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  // Fallback extremamente simples que NÃO depende de componentes externos
  // Isso garante que erros de carregamento de chunks sejam exibidos
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#fff",
        color: "#333",
      }}
    >
      <div style={{ maxWidth: "28rem", width: "100%" }}>
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid #dc2626",
            borderRadius: "0.5rem",
            backgroundColor: "#fef2f2",
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "#dc2626",
              marginBottom: "0.5rem",
            }}
          >
            ⚠️ Erro na aplicação
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#7f1d1d" }}>
            Algo inesperado aconteceu. Tente recarregar a página ou limpar o cache do navegador.
          </p>
        </div>

        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            backgroundColor: "#f9fafb",
          }}
        >
          <h3
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#6b7280",
              marginBottom: "0.5rem",
            }}
          >
            Detalhes do Erro:
          </h3>
          <pre
            style={{
              fontSize: "0.75rem",
              color: "#dc2626",
              backgroundColor: "#fff",
              padding: "0.75rem",
              borderRadius: "0.25rem",
              border: "1px solid #e5e7eb",
              overflow: "auto",
              maxHeight: "8rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={resetErrorBoundary}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fff",
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            🔄 Tentar Novamente
          </button>
          <button
            onClick={() => {
              // Limpa cache e recarrega
              if ("caches" in globalThis.window) {
                caches.keys().then((names) => {
                  for (const name of names) caches.delete(name);
                });
              }
              localStorage.clear();
              sessionStorage.clear();
              globalThis.window.location.reload();
            }}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#374151",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            🗑️ Limpar Cache
          </button>
        </div>
      </div>
    </div>
  );
};

import { lazy, Suspense } from "react";

// Import dinâmico garante lazy loading do componente Donna/Harvey
const HarveySpecter = lazy(() => import("./Donna"));

export default function AssistenteIA() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando assistente…</div>}>
      <HarveySpecter />
    </Suspense>
  );
}

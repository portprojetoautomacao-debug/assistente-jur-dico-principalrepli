// Exemplo de como usar Error Tracking no seu App.tsx

import { useEffect } from "react";
import { usePageTracking, useUserTracking } from "../hooks/useErrorTracking";
import { getEnv } from "../lib/env-helper.js";
import { captureMessage, setErrorTag } from "../services/error-tracking";

export function AppWithErrorTracking({ user }: Readonly<{ user?: { id: string; email: string } }>) {
  // Rastrear usuário logado
  useUserTracking(user?.id, user?.email);

  // Rastrear navegação de páginas
  usePageTracking();

  // Rastrear versão do app
  useEffect(() => {
    const version = getEnv("REACT_APP_VERSION") || getEnv("VITE_APP_VERSION") || "unknown";
    const env = getEnv("NODE_ENV") || "development";

    setErrorTag("app_version", version);
    setErrorTag("environment", env);

    captureMessage(`App started - Version ${version} (${env})`, "info");
  }, []);

  return <div>{/* Seu App aqui */}</div>;
}

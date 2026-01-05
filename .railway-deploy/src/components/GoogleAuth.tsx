import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { config } from "@/lib/config";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Domínio fixo de produção para OAuth (autorizado no Google Cloud Console)
const PRODUCTION_DOMAIN = "https://assistente-juridico-github.vercel.app";

// URLs de produção autorizadas no Google Cloud Console (Set para performance)
const PRODUCTION_URLS = new Set([
  "assistente-juridico-github.vercel.app",
  "assistente-juridico-github.vercel.app",
]);

// Detecta se está em ambiente de desenvolvimento/preview (URL dinâmica)
const isDevelopmentEnvironment = (): boolean => {
  const hostname = globalThis.window.location.hostname;

  // Produção autorizada - permite login
  if (PRODUCTION_URLS.has(hostname)) {
    return false;
  }

  // GitHub Codespaces / DevContainers
  if (hostname.includes(".app.github.dev") || hostname.includes(".github.dev")) {
    return true;
  }

  // Gitpod
  if (hostname.includes(".gitpod.io")) {
    return true;
  }

  // StackBlitz
  if (hostname.includes(".stackblitz.io") || hostname.includes(".webcontainer.io")) {
    return true;
  }

  // Localhost
  // NOTA: Removido bloqueio de localhost para permitir desenvolvimento local
  // O desenvolvedor deve adicionar http://localhost:5173 no Google Cloud Console
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return false;
  }

  // Preview deployments da Vercel (qualquer outra URL .vercel.app)
  if (hostname.includes("vercel.app")) {
    return true;
  }

  return false;
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  role?: "admin" | "advogado" | "assistente";
}

interface GoogleAuthButtonProps {
  readonly onSuccess?: (user: GoogleUser) => void;
  readonly onError?: (error: Error) => void;
}

export function GoogleAuthButton({ onSuccess, onError }: Readonly<GoogleAuthButtonProps>) {
  const [error, setError] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState(false);

  type CredentialResponse = { credential: string };

  const handleCredentialResponse = useCallback(
    async (response: unknown) => {
      try {
        if (!response || typeof response !== "object" || !("credential" in response)) {
          throw new Error("Invalid credential response from Google");
        }

        const { credential } = response as CredentialResponse;
        const payloadBase64 = credential.split(".")?.[1] ?? "";
        const payload = JSON.parse(atob(payloadBase64)) as {
          sub?: string;
          email?: string;
          name?: string;
          picture?: string;
        };

        const user: GoogleUser = {
          id: payload.sub ?? "",
          email: payload.email ?? "",
          name: payload.name ?? "",
          picture: payload.picture ?? "",
        };

        onSuccess?.(user);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Falha ao processar login do Google");
        setError(error.message);
        onError?.(error);
      }
    },
    [onSuccess, onError]
  );

  type GoogleAccount = {
    accounts: {
      id: {
        initialize: (opts: {
          client_id: string;
          callback: (resp: { credential: string }) => void;
        }) => void;
        renderButton: (
          el: HTMLElement,
          options: {
            theme?: string;
            size?: string;
            width?: number;
            text?: string;
            shape?: string;
          }
        ) => void;
      };
    };
  };

  const initializeGoogleSignIn = useCallback(() => {
    const google = (globalThis.window as unknown as { google?: GoogleAccount })?.google;
    if (!google) return;

    google.accounts.id.initialize({
      client_id: config.google.clientId,
      callback: (resp) => {
        handleCredentialResponse(resp).catch(console.error);
      },
    });

    const buttonDiv = document.getElementById("google-signin-button");
    if (buttonDiv) {
      google.accounts.id.renderButton(buttonDiv, {
        theme: "outline",
        size: "large",
        width: buttonDiv.offsetWidth,
        text: "signin_with",
        shape: "rectangular",
      });
    }
  }, [handleCredentialResponse]);

  useEffect(() => {
    // Forçar configuração como true se temos o Client ID básico
    const configured = !!config.google.clientId;
    setIsConfigured(configured);

    if (!configured) {
      setError("Google OAuth não está configurado. Veja OAUTH_SETUP.md para instruções.");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    // SEGURANÇA (S5725): Google Identity Services não fornece hash SRI estável
    // Mitigação: crossOrigin + HTTPS + referrerPolicy + CSP no Vercel
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.onload = () => initializeGoogleSignIn();
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        script.remove();
      }
    };
  }, [initializeGoogleSignIn]);

  // Verificação de ambiente de desenvolvimento - deve vir antes das outras verificações
  if (isDevelopmentEnvironment()) {
    const isCodespace = globalThis.window.location.hostname.includes(".app.github.dev");
    const isLocalhost =
      globalThis.window.location.hostname === "localhost" ||
      globalThis.window.location.hostname === "127.0.0.1";

    const getEnvironmentTitle = () => {
      if (isCodespace) return "GitHub Codespace Detectado";
      if (isLocalhost) return "Ambiente Local Detectado";
      return "Ambiente de Desenvolvimento Detectado";
    };

    const getEnvironmentName = () => {
      if (isCodespace) return "Codespaces";
      if (isLocalhost) return "localhost";
      return "ambientes de desenvolvimento";
    };

    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>{getEnvironmentTitle()}</strong>
          <p className="mt-2 text-sm">
            O login com Google não funciona em {getEnvironmentName()} porque a origem{" "}
            <code className="text-xs bg-amber-100 dark:bg-amber-900 px-1 rounded">
              {globalThis.location.origin}
            </code>{" "}
            não está autorizada no Google Cloud Console.
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            💡 Para testar o login, use o ambiente de produção.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2 border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900"
            onClick={() => globalThis.open(PRODUCTION_DOMAIN, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir em Produção
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isConfigured) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Configuração OAuth Necessária</strong>
          <p className="mt-2 text-sm">
            As credenciais do Google OAuth não estão configuradas. Por favor:
          </p>
          <ol className="mt-2 text-sm list-decimal list-inside space-y-1">
            <li>
              Copie <code>.env.example</code> para <code>.env</code>
            </li>
            <li>
              Adicione seu Google Client ID ao <code>.env</code>
            </li>
            <li>
              Veja <code>OAUTH_SETUP.md</code> para instruções detalhadas
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <div id="google-signin-button" className="w-full" />
    </div>
  );
}

export function GoogleAuthExample() {
  const [user, setUser] = useState<GoogleUser | null>(null);

  const handleSuccess = (user: GoogleUser) => {
    console.log("Usuário logado:", user);
    setUser(user);
  };

  const handleError = (error: Error) => {
    console.error("Erro no login:", error);
  };

  const handleSignOut = () => {
    setUser(null);
  };

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo, {user.name}!</CardTitle>
          <CardDescription>Você está conectado com o Google</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full" />
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login com Google</CardTitle>
        <CardDescription>Use sua conta Google para fazer login com segurança</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleAuthButton onSuccess={handleSuccess} onError={handleError} />
      </CardContent>
    </Card>
  );
}

/**
 * Error Boundary Global com Integra��o Sentry
 * Captura erros de renderiza��o e exibe UI amig�vel
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@/lib/monitoring";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error, errorInfo);

    // Enviar para Sentry (produ��o)
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Se fallback customizado foi fornecido, usar
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI padr�o de erro
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Algo deu errado</CardTitle>
                  <CardDescription>
                    Ocorreu um erro inesperado. J� fomos notificados e vamos corrigir o mais r�pido
                    poss�vel.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Detalhes do erro (apenas em dev) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Detalhes do erro (vis�vel apenas em desenvolvimento):
                  </p>
                  <div className="p-3 bg-muted rounded-md">
                    <pre className="text-xs overflow-auto">{this.state.error.toString()}</pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Component Stack
                      </summary>
                      <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Mensagem amig�vel */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <p className="text-sm">
                  ?? <strong>O que voc� pode fazer:</strong>
                </p>
                <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                  <li>Tentar novamente (clique em "Tentar novamente")</li>
                  <li>Voltar para a p�gina inicial</li>
                  <li>Recarregar a p�gina (F5)</li>
                  <li>Se o problema persistir, entre em contato com o suporte</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="default" className="flex-1">
                <RefreshCw className="mr-2 w-4 h-4" />
                Tentar novamente
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                <Home className="mr-2 w-4 h-4" />
                Voltar ao in�cio
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based Error Boundary (para usar com React Query, etc)
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Erro
          </CardTitle>
          <CardDescription>{error.message || "Ocorreu um erro inesperado"}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={resetErrorBoundary} className="w-full">
            <RefreshCw className="mr-2 w-4 h-4" />
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

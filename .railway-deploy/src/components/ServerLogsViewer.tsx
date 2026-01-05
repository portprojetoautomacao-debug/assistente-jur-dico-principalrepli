import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bot, CheckCircle, Clock } from "lucide-react";

interface AgentActionLog {
  agentId: string;
  action: string;
  details?: Record<string, unknown>;
  timestamp: string;
  success: boolean;
  durationMs?: number;
}

async function fetchServerLogs() {
  const response = await fetch("/api/agents?action=logs");
  if (!response.ok) {
    throw new Error("Failed to fetch server logs");
  }
  const data = await response.json();
  return data.logs as AgentActionLog[];
}

interface ServerLogsViewerProps {
  readonly logs?: AgentActionLog[];
  readonly isLoading?: boolean;
  readonly onRefresh?: () => void;
}

export function ServerLogsViewer({
  logs: propLogs,
  isLoading: propIsLoading,
  onRefresh,
}: ServerLogsViewerProps = {}) {
  const {
    data: fetchedLogs,
    isLoading: queryIsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["server-agent-logs"],
    queryFn: fetchServerLogs,
    refetchInterval: 10000,
    enabled: propLogs === undefined, // Only fetch if logs are not provided via props
  });

  const logs = propLogs || fetchedLogs;
  const isLoading = propIsLoading ?? queryIsLoading;

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando logs do servidor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Não foi possível carregar os logs do servidor.
          <br />
          {error instanceof Error ? error.message : String(error)}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Logs do Servidor (Backend)</CardTitle>
          <CardDescription>
            Atividades executadas pelos agentes no ambiente serverless (Cron/API)
          </CardDescription>
        </div>
        <Badge variant="outline" className="cursor-pointer" onClick={handleRefresh}>
          Atualizar
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {!logs || logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log registrado no servidor ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={`${log.agentId}-${log.timestamp}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div
                    className={`mt-0.5 p-1 rounded-full ${
                      log.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {log.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        {log.agentId}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                      </span>
                    </div>

                    <p className="text-xs text-foreground mt-1 font-mono">{log.action}</p>

                    {log.durationMs && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Duração: {log.durationMs.toFixed(0)}ms
                      </p>
                    )}

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 p-2 bg-background rounded border text-[10px] font-mono text-muted-foreground overflow-x-auto">
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

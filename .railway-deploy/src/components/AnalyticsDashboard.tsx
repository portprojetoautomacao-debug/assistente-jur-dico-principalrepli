import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-analytics";
import { AlertTriangle, BarChart2, Eye, MousePointer, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

// Helper para cores de tipo de evento
function getEventTypeColor(type: string): string {
  if (type === "pageview") return "bg-secondary";
  if (type === "action") return "bg-accent";
  return "bg-destructive";
}

function getEventTitle(event: {
  type: string;
  data?: { path?: string; action?: string; error?: string };
}): string {
  if (event.type === "pageview") {
    return `Visualização: ${event.data?.path ?? "-"}`;
  }
  if (event.type === "action") {
    return `Ação: ${event.data?.action ?? "-"}`;
  }
  return `Erro: ${event.data?.error ?? "-"}`;
}

export default function AnalyticsDashboard() {
  const { getAnalytics, clearEvents, events } = useAnalytics();
  const analytics = getAnalytics();

  const handleClearEvents = () => {
    clearEvents();
    toast.success("Dados de análise limpos com sucesso");
  };

  // Garantir estrutura segura mesmo se o hook ainda não tiver dados
  const safeAnalytics = useMemo(() => {
    const baseLast = {
      total: 0,
      pageViews: 0,
      actions: 0,
      errors: 0,
      popularPages: [] as Array<[string, number]>,
      topActions: [] as Array<[string, number]>,
    };

    const last24h = analytics?.last24h ?? baseLast;
    const last7d = analytics?.last7d ?? {
      ...baseLast,
      popularPages: [],
      topActions: [],
    };

    return { last24h, last7d };
  }, [analytics]);

  const sortedPages = safeAnalytics.last24h.popularPages ?? [];
  const sortedActions = safeAnalytics.last24h.topActions ?? [];

  const pageMaxCount = (() => {
    if (sortedPages.length === 0) return 1;
    const [, max] = sortedPages[0];
    return max || 1;
  })();

  const actionMaxCount = (() => {
    if (sortedActions.length === 0) return 1;
    const [, max] = sortedActions[0];
    return max || 1;
  })();

  const safeEvents = events ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o uso e comportamento do sistema</p>
        </div>
        <Button
          variant="outline"
          onClick={handleClearEvents}
          className="hover:border-destructive/50 hover:text-destructive"
        >
          <Trash2 size={20} />
          Limpar Dados
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glassmorphic border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <BarChart2 size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">{safeAnalytics.last24h.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeAnalytics.last7d.total} nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphic border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações (24h)</CardTitle>
            <Eye size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {safeAnalytics.last24h.pageViews}
            </div>
            <p className="text-xs text-muted-foreground">
              {safeAnalytics.last24h.total} eventos totais
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphic border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações (24h)</CardTitle>
            <MousePointer size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{safeAnalytics.last24h.actions}</div>
            <p className="text-xs text-muted-foreground">Interações do usuário</p>
          </CardContent>
        </Card>

        <Card className="glassmorphic border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros (24h)</CardTitle>
            <AlertTriangle size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {safeAnalytics.last24h.errors}
            </div>
            <p className="text-xs text-muted-foreground">Erros registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Top pages / actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <CardTitle>Páginas Mais Visitadas (24h)</CardTitle>
            <CardDescription>Top 10 páginas por visualizações</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="space-y-4">
                {sortedPages.map(([page, count]) => (
                  <div key={page} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">
                        {page.replaceAll("-", " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full button-gradient"
                          style={{
                            width: `${Math.max(5, (count / pageMaxCount) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-primary w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <CardTitle>Ações Principais (24h)</CardTitle>
            <CardDescription>Top 10 ações dos usuários</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedActions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="space-y-4">
                {sortedActions.map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">
                        {action.replaceAll("-", " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-secondary to-accent"
                          style={{
                            width: `${Math.max(5, (count / actionMaxCount) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-secondary w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent events */}
      <Card className="glassmorphic border-border/50">
        <CardHeader>
          <CardTitle>Eventos Recentes</CardTitle>
          <CardDescription>Últimos 20 eventos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {safeEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum evento registrado ainda
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {safeEvents
                .slice(-20)
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-card/50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getEventTypeColor(
                        event.type
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium capitalize">{getEventTitle(event)}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleTimeString("pt-BR")}
                        </span>
                      </div>
                      {event.data?.category && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Categoria: {event.data.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

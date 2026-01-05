import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Agent, AgentTask } from "@/lib/agents";
import { CheckCircle, Clock, ChartLine, Timer, Pulse } from "@phosphor-icons/react";
import { TrendingUp, Zap, ZapOff } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";

interface AgentMetricsProps {
  readonly agents: Agent[];
  readonly completedTasks: AgentTask[];
  readonly activityLog: Array<{
    id: string;
    agentId: string;
    timestamp: string;
    action: string;
    result: "success" | "warning" | "error";
  }>;
}

interface CircuitBreakersMetrics {
  summary: {
    healthy: number;
    total: number;
    degraded: number;
    down: number;
  };
}

export default function AgentMetrics({ agents, completedTasks, activityLog }: AgentMetricsProps) {
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakersMetrics | null>(null);

  // Ref para capturar timestamp na montagem (evita violação de pureza)
  const initialTimestampRef = useRef(Date.now());

  // Fetch V2 metrics
  useEffect(() => {
    const fetchV2Metrics = async () => {
      try {
        const response = await fetch("/api/observability?action=circuit-breakers");
        if (!response.ok) return;

        const data = (await response.json()) as unknown;

        // Validação básica de shape para evitar runtime estranho
        if (
          data &&
          typeof data === "object" &&
          "summary" in data &&
          data.summary &&
          typeof (data as CircuitBreakersMetrics).summary.healthy === "number"
        ) {
          setCircuitBreakers(data as CircuitBreakersMetrics);
        }
      } catch (error) {
        console.error("Erro ao buscar métricas V2:", error);
      }
    };

    fetchV2Metrics();
    const interval = setInterval(fetchV2Metrics, 15000); // Atualiza a cada 15s
    return () => clearInterval(interval);
  }, []);

  const totalTasks = completedTasks.length;

  const todayStr = new Date(initialTimestampRef.current).toDateString();
  const totalToday = completedTasks.filter((t) => {
    return t.completedAt && new Date(t.completedAt).toDateString() === todayStr;
  }).length;

  const successRate =
    activityLog.length > 0
      ? Math.round(
          (activityLog.filter((log) => log.result === "success").length / activityLog.length) * 100
        )
      : 0;

  const estimatedTimeSaved = totalTasks * 10; // minutos
  const hoursPerTask = 10 / 60;
  const totalHoursSaved = (totalTasks * hoursPerTask).toFixed(1);

  const tasksLast24Hours = useMemo(() => {
    const now = typeof window !== "undefined" ? Date.now() : 0;
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    return completedTasks.filter((task) => task.completedAt && new Date(task.completedAt) > last24h)
      .length;
  }, [completedTasks]);

  const averageProcessingTime = useMemo(() => {
    const tasksWithTime = completedTasks.filter((task) => task.startedAt && task.completedAt);

    if (tasksWithTime.length === 0) return 0;

    const totalTime = tasksWithTime.reduce((sum, task) => {
      const start = new Date(task.startedAt!).getTime();
      const end = new Date(task.completedAt!).getTime();
      return sum + (end - start);
    }, 0);

    // segundos médios por tarefa
    return Math.round(totalTime / tasksWithTime.length / 1000);
  }, [completedTasks]);

  return (
    <div className="space-y-6">
      {/* Circuit Breakers Status - V2 Architecture */}
      {circuitBreakers && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ZapOff className="w-5 h-5 text-blue-600" />
                  Circuit Breakers (Arquitetura V2)
                </CardTitle>
                <CardDescription>Monitoramento de resiliência das APIs externas</CardDescription>
              </div>
              <Badge variant={circuitBreakers.summary.down === 0 ? "default" : "destructive"}>
                {circuitBreakers.summary.healthy}/{circuitBreakers.summary.total} APIs Saudáveis
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-600">
                  {circuitBreakers.summary.healthy}
                </div>
                <div className="text-xs text-muted-foreground">Saudáveis</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <Pulse className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-yellow-600">
                  {circuitBreakers.summary.degraded}
                </div>
                <div className="text-xs text-muted-foreground">Degradadas</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <Zap className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-600">
                  {circuitBreakers.summary.down}
                </div>
                <div className="text-xs text-muted-foreground">Indisponíveis</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{successRate}%</div>
            <Progress value={successRate} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {activityLog.filter((log) => log.result === "success").length} de {activityLog.length}{" "}
              ações bem-sucedidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Tarefas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{totalToday}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas concluídas hoje por todos os agentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{averageProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">Tempo médio de processamento por tarefa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Produtividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{tasksLast24Hours}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas completadas nas últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="w-5 h-5 text-green-600" />
            Economia de Tempo
          </CardTitle>
          <CardDescription>Tempo economizado pela automação dos agentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Minutos economizados</p>
              <p className="text-2xl font-bold text-green-600">{estimatedTimeSaved}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Horas totais</p>
              <p className="text-2xl font-bold text-green-600">{totalHoursSaved}h</p>
            </div>
          </div>
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Baseado em 10 minutos por tarefa se feita manualmente por humanos
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChartLine className="w-5 h-5 text-primary" />
            Desempenho por Agente
          </CardTitle>
          <CardDescription>Estatísticas individuais de cada agente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {agents.map((agent) => {
            const agentLogs = activityLog.filter((l) => l.agentId === agent.id);
            const agentSuccessRate =
              agentLogs.length > 0
                ? Math.round(
                    (agentLogs.filter((l) => l.result === "success").length / agentLogs.length) *
                      100
                  )
                : 0;

            return (
              <div key={agent.id} className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{agent.name}</h4>
                    {agent.enabled && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900"
                      >
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">{agentSuccessRate}%</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Taxa de sucesso: {agentSuccessRate}%</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

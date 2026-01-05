/**
 * Dashboard de M�tricas dos Agentes IA
 *
 * Visualiza em tempo real:
 * - Lat�ncia m�dia e P95/P99
 * - Taxa de sucesso/erro
 * - Uso de tokens
 * - Throughput (execu��es/minuto)
 * - Detec��o de agentes degradados
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAgentMetrics, type AgentStats } from "@/lib/agent-metrics";
import { Activity, AlertTriangle, CheckCircle, TrendingUp, Zap } from "lucide-react";

export function AgentMetricsDashboard() {
  const allStatsRaw = useAgentMetrics(); // Sem agentId = todos os agentes

  // Garantir que sempre temos um array
  const allStats: AgentStats[] = Array.isArray(allStatsRaw)
    ? allStatsRaw
    : allStatsRaw
      ? [allStatsRaw]
      : [];

  if (allStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>?? M�tricas dos Agentes</CardTitle>
          <CardDescription>Nenhum dado dispon�vel ainda</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Os agentes ainda n�o processaram nenhuma tarefa. As m�tricas aparecer�o aqui assim que
            houver atividade.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Classificar por total de execu��es (mais ativo primeiro)
  const sortedStats = [...allStats].sort((a, b) => b.totalExecutions - a.totalExecutions);

  // Detectar agentes com problemas
  const unhealthyAgents = sortedStats.filter((s) => s.errorRate > 10 || s.p95Latency > 5000);

  return (
    <div className="space-y-6">
      {/* Header com resumo geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execu��es</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedStats.reduce((sum, s) => sum + s.totalExecutions, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">�ltima hora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                (sortedStats.reduce((sum, s) => sum + s.successfulExecutions, 0) /
                  sortedStats.reduce((sum, s) => sum + s.totalExecutions, 0)) *
                100
              ).toFixed(1)}
              %
            </div>
            <p className="text-xs text-muted-foreground">M�dia geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lat�ncia M�dia</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                sortedStats.reduce((sum, s) => sum + s.averageLatency, 0) / sortedStats.length
              ).toFixed(0)}
              ms
            </div>
            <p className="text-xs text-muted-foreground">Todos os agentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Usados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(sortedStats.reduce((sum, s) => sum + s.totalTokens, 0) / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground">�ltima hora</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de agentes com problemas */}
      {unhealthyAgents.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Agentes com Problemas Detectados
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              {unhealthyAgents.length} agente(s) com alta lat�ncia ou taxa de erro elevada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unhealthyAgents.map((agent) => (
                <div key={agent.agentId} className="flex items-center justify-between">
                  <span className="font-medium">{agent.agentId}</span>
                  <div className="flex gap-2">
                    {agent.errorRate > 10 && (
                      <Badge variant="destructive">Erro: {agent.errorRate.toFixed(1)}%</Badge>
                    )}
                    {agent.p95Latency > 5000 && (
                      <Badge variant="destructive">P95: {agent.p95Latency}ms</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards individuais por agente */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedStats.map((stats) => {
          const successRate = (stats.successfulExecutions / stats.totalExecutions) * 100;
          const isHealthy = stats.errorRate < 10 && stats.p95Latency < 5000;

          return (
            <Card key={stats.agentId} className={!isHealthy ? "border-yellow-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{stats.agentId}</CardTitle>
                  {isHealthy ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <CardDescription>
                  {stats.totalExecutions} execu��es � {stats.throughput.toFixed(2)}/min
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Taxa de sucesso */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Taxa de Sucesso</span>
                    <span className="font-medium">{successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                </div>

                {/* Lat�ncia */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">M�dia</div>
                    <div className="font-medium">{stats.averageLatency.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">P95</div>
                    <div className="font-medium">{stats.p95Latency.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">P99</div>
                    <div className="font-medium">{stats.p99Latency.toFixed(0)}ms</div>
                  </div>
                </div>

                {/* Estat�sticas extras */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                  <div>
                    <div className="text-muted-foreground text-xs">Tokens</div>
                    <div className="font-medium">{(stats.totalTokens / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Erros</div>
                    <div className="font-medium">{stats.failedExecutions}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

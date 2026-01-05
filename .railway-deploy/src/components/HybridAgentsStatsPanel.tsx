/**
 * Painel de Estatísticas de Agentes Híbridos
 *
 * Mostra métricas em tempo real de execução LangGraph vs Tradicional
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useHybridAgents } from "@/hooks/use-hybrid-agents";
import { Activity, BarChart3, Clock, Cpu, RefreshCw, TrendingUp, Zap } from "lucide-react";
import { useEffect } from "react";

export function HybridAgentsStatsPanel() {
  const { stats, refreshStats, getHybridAgents } = useHybridAgents();

  // Obter lista de agentes
  const agents = getHybridAgents();

  // Atualizar estatísticas a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const langGraphPercentage =
    stats.totalExecutions > 0 ? (stats.langGraphExecutions / stats.totalExecutions) * 100 : 0;

  const traditionalPercentage =
    stats.totalExecutions > 0 ? (stats.traditionalExecutions / stats.totalExecutions) * 100 : 0;

  const hybridPercentage =
    stats.totalExecutions > 0 ? (stats.hybridExecutions / stats.totalExecutions) * 100 : 0;

  const successPercentage = stats.successRate * 100;

  const hybridAgentsCount = agents.filter(
    (a: { hasHybridVersion: boolean }) => a.hasHybridVersion
  ).length;
  const totalAgentsCount = agents.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Estatísticas de Agentes Híbridos
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real de execuções LangGraph vs Tradicional
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Execuções */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Execuções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Sucesso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div className="text-2xl font-bold">{successPercentage.toFixed(1)}%</div>
            </div>
            <Progress value={successPercentage} className="mt-2" />
          </CardContent>
        </Card>

        {/* Tempo Médio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div className="text-2xl font-bold">
                {(stats.averageExecutionTime / 1000).toFixed(2)}s
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cobertura Híbrida */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cobertura Híbrida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              <div className="text-2xl font-bold">
                {hybridAgentsCount}/{totalAgentsCount}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {((hybridAgentsCount / totalAgentsCount) * 100).toFixed(0)}% dos agentes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Execuções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição de Execuções
          </CardTitle>
          <CardDescription>
            Comparação entre execuções LangGraph, Tradicionais e Híbridas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* LangGraph */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-500">
                  LangGraph
                </Badge>
                <span className="text-sm font-medium">{stats.langGraphExecutions}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {langGraphPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={langGraphPercentage} className="h-2 bg-blue-100" />
          </div>

          {/* Tradicional */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Tradicional</Badge>
                <span className="text-sm font-medium">{stats.traditionalExecutions}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {traditionalPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={traditionalPercentage} className="h-2 bg-gray-100" />
          </div>

          {/* Híbrido */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-purple-500 text-purple-500">
                  Híbrido
                </Badge>
                <span className="text-sm font-medium">{stats.hybridExecutions}</span>
              </div>
              <span className="text-sm text-muted-foreground">{hybridPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={hybridPercentage} className="h-2 bg-purple-100" />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agentes Híbridos */}
      <Card>
        <CardHeader>
          <CardTitle>Agentes com Suporte LangGraph</CardTitle>
          <CardDescription>
            {hybridAgentsCount} de {totalAgentsCount} agentes têm implementação híbrida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {agents
              .filter((a: { hasHybridVersion: boolean }) => a.hasHybridVersion)
              .map((agent: { agentId: string }) => (
                <Badge
                  key={agent.agentId}
                  variant="default"
                  className="bg-linear-to-r from-blue-500 to-purple-500"
                >
                  {agent.agentId}
                </Badge>
              ))}
          </div>
          {hybridAgentsCount === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Nenhum agente com suporte híbrido ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

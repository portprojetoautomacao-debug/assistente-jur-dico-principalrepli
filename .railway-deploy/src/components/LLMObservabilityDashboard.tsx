/**
 * LLM Observability Dashboard
 *
 * Provides comprehensive monitoring and analytics for LLM operations
 * Inspired by Databricks LLMOps capabilities
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { llmService, type AuditLogEntry, type LLMMetrics } from "@/lib/llm-service";
import {
  AlertTriangle,
  BarChart2,
  ChartLine,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MetricsSummary {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  totalTokens: number;
  cacheHitRate: number;
  requestsByModel: Record<string, number>;
  requestsByFeature: Record<string, number>;
}

export default function LLMObservabilityDashboard() {
  const [timeRange, setTimeRange] = useState<number>(24 * 60 * 60 * 1000); // 24 hours
  const [metrics, setMetrics] = useState<LLMMetrics[]>([]);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [cacheStats, setCacheStats] = useState<{
    size: number;
    totalHits: number;
    averageAge: number;
  } | null>(null);
  // Audit log usa estrutura definida em llm-service (AuditLogEntry)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  const refreshData = () => {
    const currentMetrics = llmService.getMetrics(timeRange);
    const currentSummary = llmService.getAggregatedMetrics(timeRange);
    const currentCacheStats = llmService.getCacheStats();
    const currentAuditLog = llmService.getAuditLog(50);

    setMetrics(currentMetrics);
    setSummary(currentSummary);
    setCacheStats(currentCacheStats);
    setAuditLog(currentAuditLog);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const handleClearCache = () => {
    llmService.clearCache();
    toast.success("Cache limpo com sucesso");
    refreshData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Zap size={48} className="text-primary neon-glow mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <BarChart2 size={32} className="text-primary neon-glow" />
            Observabilidade LLM
          </h1>
          <p className="text-muted-foreground mt-1">Monitoramento e análise de operações de IA</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground"
          >
            <option value={60 * 60 * 1000}>Última hora</option>
            <option value={24 * 60 * 60 * 1000}>Últimas 24 horas</option>
            <option value={7 * 24 * 60 * 60 * 1000}>Últimos 7 dias</option>
            <option value={30 * 24 * 60 * 60 * 1000}>Últimos 30 dias</option>
          </select>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw size={20} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap size={16} />
              Total de Requisições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">
              {formatNumber(summary.totalRequests)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.successRate.toFixed(1)}% taxa de sucesso
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={16} />
              Latência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">
              {formatLatency(summary.averageLatency)}
            </div>
            <Progress
              value={Math.min((summary.averageLatency / 5000) * 100, 100)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign size={16} />
              Custo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">
              {formatCurrency(summary.totalCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(summary.totalTokens)} tokens
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database size={16} />
              Taxa de Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">
              {summary.cacheHitRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cacheStats?.size || 0} entradas em cache
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="models" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu size={20} />
                Uso por Modelo
              </CardTitle>
              <CardDescription>Distribuição de requisições por modelo de IA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(summary.requestsByModel).map(([model, count]) => {
                  const percentage = (count / summary.totalRequests) * 100;
                  return (
                    <div key={model}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{model}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(count)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLine size={20} />
                Uso por Feature
              </CardTitle>
              <CardDescription>Requisições agrupadas por funcionalidade</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {Object.entries(summary.requestsByFeature)
                    .sort(([, a], [, b]) => b - a)
                    .map(([feature, count]) => {
                      const percentage = (count / summary.totalRequests) * 100;
                      return (
                        <div
                          key={feature}
                          className="p-3 rounded-lg border border-border hover:bg-card/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">
                              {feature.replace("-", " ")}
                            </span>
                            <Badge variant="secondary">{formatNumber(count)}</Badge>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Performance de Cache
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tamanho do Cache</span>
                  <span className="font-bold">{cacheStats?.size || 0} entradas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total de Hits</span>
                  <span className="font-bold">{formatNumber(cacheStats?.totalHits || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Idade Média</span>
                  <span className="font-bold">{formatLatency(cacheStats?.averageAge || 0)}</span>
                </div>
                <Button onClick={handleClearCache} variant="outline" className="w-full mt-4">
                  <Database size={20} />
                  Limpar Cache
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  Taxa de Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold gradient-text mb-2">
                    {summary.successRate.toFixed(1)}%
                  </div>
                  <Progress value={summary.successRate} className="mb-4" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      {formatNumber(
                        Math.floor(summary.totalRequests * (summary.successRate / 100))
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Sucessos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {formatNumber(
                        Math.ceil(summary.totalRequests * (1 - summary.successRate / 100))
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Falhas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                Requisições Recentes
              </CardTitle>
              <CardDescription>Últimas 10 requisições processadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {metrics
                    .slice(-10)
                    .reverse()
                    .map((metric) => (
                      <div
                        key={metric.requestId}
                        className="p-3 rounded-lg border border-border hover:bg-card/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={metric.success ? "default" : "destructive"}>
                              {metric.model}
                            </Badge>
                            {metric.feature && (
                              <Badge variant="outline" className="text-xs">
                                {metric.feature}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(metric.timestamp).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatLatency(metric.latencyMs)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Cpu size={12} />
                            {formatNumber(metric.totalTokens)} tokens
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} />
                            {formatCurrency(metric.cost)}
                          </span>
                          {metric.success ? (
                            <CheckCircle size={12} className="text-green-500" />
                          ) : (
                            <AlertTriangle size={12} className="text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} />
                Log de Auditoria
              </CardTitle>
              <CardDescription>Registro completo de todas as operações LLM</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border border-border hover:bg-card/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {entry.success ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <AlertTriangle size={16} className="text-red-500" />
                          )}
                          <Badge variant="outline">{entry.model}</Badge>
                          {entry.feature && (
                            <span className="text-xs text-muted-foreground">{entry.feature}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {entry.userId && <span>Usuário: {entry.userId}</span>}
                        <span>{formatLatency(entry.latencyMs)}</span>
                        <span>{formatNumber(entry.tokensUsed)} tokens</span>
                        <span>{formatCurrency(entry.cost)}</span>
                      </div>
                      {entry.error && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                          {entry.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

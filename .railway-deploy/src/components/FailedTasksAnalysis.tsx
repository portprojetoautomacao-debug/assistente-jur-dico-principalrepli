/**
 * FailedTasksAnalysis - Painel de diagnóstico de tarefas falhadas
 * Mostra estatísticas de erros, padrões e recomendações de correção
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Network,
  RefreshCw,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ErrorGroup {
  errorType: string;
  count: number;
  affectedAgents: string[];
  affectedTaskTypes: string[];
  firstOccurrence: string;
  lastOccurrence: string;
  examples: Array<{
    taskId: string;
    agentId: string;
    type: string;
    error: string;
    createdAt: string;
  }>;
}

interface FailedTasksData {
  summary: {
    totalFailed: number;
    totalInQueue: number;
    failureRate: string;
    uniqueErrorTypes: number;
  };
  errorGroups: ErrorGroup[];
  patterns: Record<string, unknown>;
  recommendations: string[];
  timestamp: string;
}

const errorTypeLabels: Record<string, string> = {
  GEMINI_MODEL_NOT_FOUND: "❌ Modelo Gemini não encontrado",
  GEMINI_API_ERROR: "🤖 Erro na API Gemini",
  TIMEOUT_ERROR: "⏱️ Timeout",
  NETWORK_ERROR: "🌐 Erro de rede",
  AUTH_ERROR: "🔐 Erro de autenticação",
  RATE_LIMIT_ERROR: "🚦 Rate limit",
  VALIDATION_ERROR: "✏️ Erro de validação",
  OTHER_ERROR: "❓ Erro desconhecido",
};

const errorTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  GEMINI_MODEL_NOT_FOUND: AlertTriangle,
  TIMEOUT_ERROR: Clock,
  NETWORK_ERROR: Network,
  RATE_LIMIT_ERROR: TrendingDown,
  AUTH_ERROR: AlertTriangle,
  OTHER_ERROR: Zap,
};

export default function FailedTasksAnalysis() {
  const [data, setData] = useState<FailedTasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/failed-tasks-analysis");
      if (!response.ok) {
        throw new Error("Falha ao buscar análise de erros");
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleRefresh = () => {
    toast.info("Atualizando análise de erros...");
    fetchAnalysis();
  };

  const handleClearOld = async () => {
    try {
      toast.info("Removendo tarefas falhadas antigas...");
      const response = await fetch("/api/clear-old-failed-tasks", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Falha ao limpar tarefas antigas");
      }

      const result = await response.json();
      toast.success(
        `✅ ${result.stats.removed} tarefas removidas (${result.stats.failedBefore} → ${result.stats.failedAfter} falhas)`
      );

      // Recarregar análise
      setTimeout(() => {
        fetchAnalysis();
      }, 500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao limpar tarefas antigas");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Tarefas Falhadas</CardTitle>
          <CardDescription>Carregando análise...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Tarefas Falhadas</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.totalFailed === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Nenhuma Tarefa Falhada
          </CardTitle>
          <CardDescription>Todas as tarefas estão sendo processadas com sucesso!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Análise de Tarefas Falhadas
            </CardTitle>
            <CardDescription>
              {data.summary.totalFailed} de {data.summary.totalInQueue} tarefas falharam (
              {data.summary.failureRate})
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleClearOld}
              variant="outline"
              size="sm"
              title="Remove tarefas falhadas com mais de 24h"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpar Antigas
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-3xl font-bold text-destructive">{data.summary.totalFailed}</p>
              <p className="text-xs text-muted-foreground mt-1">Tarefas Falhadas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-foreground">{data.summary.failureRate}</p>
              <p className="text-xs text-muted-foreground mt-1">Taxa de Falha</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-foreground">{data.summary.uniqueErrorTypes}</p>
              <p className="text-xs text-muted-foreground mt-1">Tipos de Erro</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-foreground">
                {data.errorGroups.length > 0 ? data.errorGroups[0].count : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Erro Mais Comum</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔧 Recomendações de Correção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recommendations.map((rec) => (
                <div
                  key={`rec-${rec.slice(0, 50)}`}
                  className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5"
                >
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grupos de Erro */}
      <Card>
        <CardHeader>
          <CardTitle>Erros por Tipo</CardTitle>
          <CardDescription>Agrupados por tipo de erro</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {data.errorGroups.map((group) => {
                const IconComponent = errorTypeIcons[group.errorType] || AlertTriangle;
                const label = errorTypeLabels[group.errorType] || group.errorType;

                return (
                  <div
                    key={`group-${group.errorType}`}
                    className="p-4 rounded-lg border border-destructive/30 bg-destructive/5"
                  >
                    {/* Header do grupo */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-destructive/20">
                        <IconComponent className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold">{label}</h4>
                          <Badge variant="destructive">{group.count} ocorrências</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Agentes: {group.affectedAgents.length}</span>
                          <span>•</span>
                          <span>Tipos: {group.affectedTaskTypes.length}</span>
                          <span>•</span>
                          <span>
                            Última: {new Date(group.lastOccurrence).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Exemplos */}
                    {group.examples.length > 0 && (
                      <div className="ml-11 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Exemplos de mensagens:
                        </p>
                        {group.examples.slice(0, 2).map((example) => (
                          <div
                            key={`ex-${example.createdAt}-${example.type}`}
                            className="p-2 rounded bg-muted/50 text-xs"
                          >
                            <p className="font-mono text-destructive break-all">
                              {example.error.substring(0, 150)}
                              {example.error.length > 150 && "..."}
                            </p>
                            <p className="text-muted-foreground mt-1">
                              {example.type} • {new Date(example.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

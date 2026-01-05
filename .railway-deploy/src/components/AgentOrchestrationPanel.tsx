/**
 * Agent Orchestration Panel
 *
 * Painel de monitoramento e controle da orquestração de múltiplos agentes
 * Conecta com a arquitetura V2: ReAct, Circuit Breakers, Traces
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  GitBranch,
  PlayCircle,
  RefreshCw,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Helper: mapeia tipo de trace para variant do Badge (S3358)
function getTraceVariant(type: string): "default" | "secondary" | "outline" {
  if (type === "final") return "default";
  if (type === "action") return "secondary";
  return "outline";
}

interface CircuitBreakerStatus {
  name: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  successes: number;
  isHealthy: boolean;
  timeSinceLastFailure: number | null;
}

// Type alias para estados do circuit breaker (S6571)
type CircuitBreakerState = CircuitBreakerStatus["state"];

interface AgentTrace {
  timestamp: string;
  step: number;
  type: "thought" | "action" | "observation" | "final";
  content: string;
  toolUsed?: string;
  duration?: number;
  error?: string;
}

interface AgentExecution {
  agentId: string;
  agentName: string;
  steps: number;
  usedTools: string[];
  answer: string;
  traces: AgentTrace[];
  totalDuration: number;
  executionTimeMs: number;
  timestamp: string;
}

interface OrchestrationMetrics {
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  breakers: CircuitBreakerStatus[];
  timestamp: string;
}

export default function AgentOrchestrationPanel() {
  const [metrics, setMetrics] = useState<OrchestrationMetrics | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("justine");
  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const agents = [
    {
      id: "harvey",
      name: "Harvey Specter",
      icon: "👨‍⚖️",
      color: "text-purple-600",
    },
    {
      id: "justine",
      name: "Mrs. Justin-e",
      icon: "🤖",
      color: "text-blue-600",
    },
    {
      id: "monitor-djen",
      name: "Monitor DJEN",
      icon: "📰",
      color: "text-green-600",
    },
    {
      id: "gestao-prazos",
      name: "Gestão Prazos",
      icon: "⏰",
      color: "text-orange-600",
    },
    {
      id: "analise-risco",
      name: "Análise Risco",
      icon: "⚠️",
      color: "text-red-600",
    },
  ];

  // Fetch circuit breakers status
  const fetchMetrics = async (): Promise<void> => {
    try {
      const response = await fetch("/api/observability?action=circuit-breakers");
      if (!response.ok) return;

      const data = (await response.json()) as unknown;

      // Validação mínima de shape para evitar quebrar a UI se o backend mudar
      if (
        data &&
        typeof data === "object" &&
        "summary" in data &&
        "breakers" in data &&
        Array.isArray((data as OrchestrationMetrics).breakers)
      ) {
        setMetrics(data as OrchestrationMetrics);
      }
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
    }
  };

  // Execute agent
  const executeAgent = async (agentId: string, message?: string) => {
    setLoading(true);
    setSelectedAgent(agentId);
    try {
      const response = await fetch("/api/agents?action=process-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            id: `task-${Date.now()}`,
            agentId,
            type: "analyze_document",
            priority: "medium",
            status: "queued",
            createdAt: new Date().toISOString(),
            data: {
              message: message || "Execute sua rotina automática",
              sessionId: `session-${Date.now()}`,
            },
          },
          agent: {
            id: agentId,
            name: agents.find((a) => a.id === agentId)?.name || agentId,
            type: "analyzer",
            status: "active",
            enabled: true,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const agentName = agents.find((a) => a.id === agentId)?.name || agentId;
        const processingTime = data.processingTime ?? 0;
        const toolsUsed =
          data.result?.toolsUsed && Array.isArray(data.result.toolsUsed)
            ? data.result.toolsUsed
            : ["gemini-2.5-pro"];

        const answer =
          data.result?.analysis || data.result?.message || "Tarefa executada com sucesso";

        setExecution({
          agentId,
          agentName,
          steps: 1,
          usedTools: toolsUsed,
          answer,
          traces: [
            {
              timestamp: new Date().toISOString(),
              step: 1,
              type: "final",
              content: data.result?.analysis || "Processamento concluído",
              duration: processingTime,
            },
          ],
          totalDuration: processingTime,
          executionTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        });

        toast.success(`${agentName} executado com sucesso!`);
      } else {
        let errorMessage = "Falha na execução";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // ignora parse error, usa mensagem padrão
        }
        toast.error(`Erro: ${errorMessage}`);
      }
    } catch (error) {
      toast.error("Erro ao executar agente");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = autoRefresh ? setInterval(fetchMetrics, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStateColor = (state: CircuitBreakerState) => {
    switch (state) {
      case "CLOSED":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "HALF_OPEN":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "OPEN":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getStateIcon = (state: CircuitBreakerState) => {
    switch (state) {
      case "CLOSED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "HALF_OPEN":
        return <AlertTriangle className="h-4 w-4" />;
      case "OPEN":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Orquestração de Agentes
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real com ReAct Pattern + Circuit Breakers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh((prev) => !prev)}>
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-refresh" : "Manual"}
          </Button>
          <Button onClick={fetchMetrics} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList>
          <TabsTrigger value="agents">
            <Users className="h-4 w-4 mr-2" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="circuit-breakers">
            <Zap className="h-4 w-4 mr-2" />
            Circuit Breakers
          </TabsTrigger>
          <TabsTrigger value="traces">
            <GitBranch className="h-4 w-4 mr-2" />
            Traces
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const buttonText =
                loading && selectedAgent === agent.id ? "Executando..." : "Executar";
              return (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{agent.icon}</span>
                      <span className={agent.color}>{agent.name}</span>
                    </CardTitle>
                    <CardDescription>ID: {agent.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => executeAgent(agent.id)}
                      disabled={loading}
                      className="w-full"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Circuit Breakers Tab */}
        <TabsContent value="circuit-breakers" className="space-y-4">
          {metrics && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total APIs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.summary.total}</div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Saudáveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {metrics.summary.healthy}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Degradadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {metrics.summary.degraded}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Indisponíveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{metrics.summary.down}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Breakers List */}
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Circuit Breakers</CardTitle>
                  <CardDescription>Monitoramento de resiliência das APIs externas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {metrics.breakers.map((breaker) => (
                        <div
                          key={breaker.name}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={getStateColor(breaker.state)}>
                              {getStateIcon(breaker.state)}
                              <span className="ml-1">{breaker.state}</span>
                            </Badge>
                            <div>
                              <p className="font-medium">{breaker.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Falhas: {breaker.failures} | Sucessos: {breaker.successes}
                              </p>
                            </div>
                          </div>
                          {breaker.timeSinceLastFailure !== null && (
                            <div className="text-sm text-muted-foreground">
                              Última falha: {Math.floor(breaker.timeSinceLastFailure / 1000)}s atrás
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Traces Tab */}
        <TabsContent value="traces" className="space-y-4">
          {execution ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{execution.agentName}</span>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {execution.totalDuration}ms
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {execution.steps} passos | {execution.usedTools.length} ferramentas usadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Answer */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Resposta Final:</p>
                  <p className="text-sm whitespace-pre-wrap">{execution.answer}</p>
                </div>

                {/* Tools Used */}
                <div>
                  <p className="text-sm font-medium mb-2">Ferramentas Utilizadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(execution.usedTools)].map((tool) => (
                      <Badge key={tool} variant="secondary">
                        <Cpu className="h-3 w-3 mr-1" />
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Traces Timeline */}
                <div>
                  <p className="text-sm font-medium mb-3">Timeline de Execução (ReAct):</p>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {execution.traces.map((trace) => (
                        <TraceItem key={`trace-${trace.timestamp}-${trace.step}`} trace={trace} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Execute um agente para ver os traces</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TraceItem({ trace }: Readonly<{ trace: AgentTrace }>) {
  return (
    <div className="flex gap-3 p-3 border-l-4 border-primary/20 bg-muted/50 rounded">
      <div className="shrink-0">
        <Badge variant={getTraceVariant(trace.type)}>{trace.type.toUpperCase()}</Badge>
      </div>
      <div className="flex-1">
        <p className="text-sm whitespace-pre-wrap">{trace.content}</p>
        {trace.toolUsed && (
          <p className="text-xs text-muted-foreground mt-1">🔧 {trace.toolUsed}</p>
        )}
        {trace.error && <p className="text-xs text-red-600 mt-1">❌ {trace.error}</p>}
      </div>
      <div className="shrink-0 text-xs text-muted-foreground">
        {typeof trace.duration === "number" ? `${trace.duration}ms` : "-- ms"}
      </div>
    </div>
  );
}

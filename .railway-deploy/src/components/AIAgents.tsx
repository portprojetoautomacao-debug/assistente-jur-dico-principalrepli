import { AgentMetricsDashboard } from "@/components/AgentMetricsDashboard";
import AgentMetrics from "@/components/AgentMetrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentBackup } from "@/hooks/use-agent-backup";
import { useAutonomousAgents } from "@/hooks/use-autonomous-agents";
import { useKV } from "@/hooks/use-kv";
import { themeConfig } from "@/lib/themes";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bot,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  CloudUpload,
  Database,
  FileText,
  Gavel,
  History,
  Info,
  LineChart,
  ListChecks,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
// HumanAgentCollaboration - disponível para uso futuro
// import HumanAgentCollaboration from '@/components/HumanAgentCollaboration'
import AgentOrchestrationPanel from "@/components/AgentOrchestrationPanel";
import AgentStatusFloater from "@/components/AgentStatusFloater";
import { LegalMemoryViewer } from "@/components/LegalMemoryViewer";
import MrsJustinEModal from "@/components/MrsJustinEModal";
import { ServerLogsViewer } from "@/components/ServerLogsViewer";
import type { User, ViewType } from "@/types";
import { toast } from "sonner";

// ===========================
// Helper Functions (outside component to avoid re-creation)
// ===========================

function getAgentStatusLabel(isStreaming: boolean, enabled: boolean): string {
  if (isStreaming) return "Streaming";
  return enabled ? "Ativo" : "Pausado";
}

function getAgentStatusLabelExtended(isStreaming: boolean, enabled: boolean): string {
  if (isStreaming) return "⚡ Gerando resposta...";
  return enabled ? "Pronto para uso" : "Desativado";
}

function getTaskStatusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "processing") return "default";
  if (status === "queued") return "secondary";
  return "destructive";
}

function getStatusColor(enabled: boolean, isStreaming: boolean, status?: string): string {
  if (!enabled) return "text-muted-foreground";
  if (isStreaming) return "text-primary"; // azul info via theme
  if (status === "processing") return "text-accent";
  return "text-success"; // verde sucesso via theme
}

/**
 * Returns the badge variant based on streaming and enabled state
 * Extraído para evitar ternários aninhados (S3358)
 */
function _getBadgeVariant(isStreaming: boolean, enabled: boolean): "default" | "secondary" {
  if (isStreaming) return "default";
  return enabled ? "default" : "secondary";
}

function getCardClassName(enabled: boolean, isStreaming: boolean): string {
  const base = "transition-all duration-300";
  if (isStreaming) return `${base} border-primary/50 shadow-lg shadow-primary/10`; // azul info via theme
  if (enabled) return `${base} border-primary/30`;
  return base;
}

function getIconContainerClassName(enabled: boolean, isStreaming: boolean): string {
  const base = "p-2 rounded-lg relative";
  if (isStreaming) return `${base} bg-primary/20 animate-pulse`; // azul info via theme
  if (enabled) return `${base} bg-primary/10`;
  return `${base} bg-muted`;
}

function getActiveAgentsText(count: number): string {
  if (count === 0) return "Nenhum ativado";
  return `${count} ativo(s)`;
}

function getProcessingText(count: number): string {
  if (count > 0) return `${count} em processamento`;
  return "Aguardando tarefas";
}

/**
 * Retorna estilo para streaming usando themeConfig
 */
function getStreamingStyle(): React.CSSProperties {
  const base = themeConfig.colors.info;
  return {
    color: base,
    backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
    borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
  };
}

/**
 * Renderiza o preview de streaming de um agente
 */
function renderStreamingPreview(isStreaming: boolean, streamPreview: string): ReactNode | null {
  if (!isStreaming || !streamPreview) return null;

  const streamingStyle = getStreamingStyle();

  return (
    <div
      className="mt-3 p-3 rounded-lg border"
      style={{
        backgroundColor: streamingStyle.backgroundColor,
        borderColor: streamingStyle.borderColor,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: themeConfig.colors.info, animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: themeConfig.colors.info,
              opacity: 0.8,
              animationDelay: "150ms",
            }}
          />
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: themeConfig.colors.info,
              opacity: 0.6,
              animationDelay: "300ms",
            }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: themeConfig.colors.info }}>
          Streaming em tempo real
        </span>
      </div>
      <p className="text-xs text-muted-foreground font-mono line-clamp-2">
        {streamPreview}
        <span className="animate-pulse">▊</span>
      </p>
    </div>
  );
}

/**
 * Renderiza o indicador de streaming inline no título
 */
function renderStreamingIndicator(isStreaming: boolean): ReactNode | null {
  if (!isStreaming) return null;

  return (
    <Badge className="text-xs animate-pulse" style={getStreamingStyle()}>
      <Zap className="w-3 h-3 mr-1" />
      Gerando...
    </Badge>
  );
}

/**
 * Renderiza o ponto pulsante de streaming
 */
function renderStreamingPingIndicator(isStreaming: boolean): ReactNode | null {
  if (!isStreaming) return null;

  return (
    <span
      className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping"
      style={{ backgroundColor: themeConfig.colors.info }}
    />
  );
}

const agentIcons: Record<string, React.ElementType> = {
  "djen-monitor": Database,
  "agent-djen-monitor": Database,
  "mrs-justin-e": Brain,
  "petition-writer": Gavel,
  "agent-legal-writer": Gavel,
  "file-organizer": FileText,
  "harvey-specter": Sparkles,
  "doc-analyzer": FileText,
  "agent-document-analyzer": FileText,
  "deadline-tracker": Calendar,
  "agent-deadline-calculator": Calendar,
  "datajud-query": Database,
  "precedent-researcher": Database,
  "agent-jurisprudence-researcher": Database,
  "risk-analyst": AlertTriangle,
  "contract-reviewer": FileText,
  "client-communicator": MessageSquare,
  "billing-analyst": LineChart,
  "strategy-advisor": Brain,
  "agent-strategic-advisor": Brain,
  "legal-translator": ArrowLeftRight,
  "compliance-checker": CheckCircle,
  "agent-calendar-sync": Calendar,
};

interface AIAgentsProps {
  readonly onNavigate?: (view: ViewType) => void;
}

export default function AIAgents({ onNavigate }: Readonly<AIAgentsProps>) {
  const {
    agents,
    taskQueue,
    completedTasks,
    activityLog,
    toggleAgent,
    streamingContent,
    isStreamingEnabled,
    toggleStreaming,
    serverLogs,
    legalMemory,
    refreshServerData,
    setAgents: _setAgents, // mantido para compatibilidade futura
  } = useAutonomousAgents();

  const [user] = useKV<User | null>("user", null);
  const userId = user?.email || "default-user";

  // Sistema de backup automático
  const { createBackup, restoreBackup } = useAgentBackup({
    userId,
    autoBackupInterval: 5, // Backup a cada 5 minutos
    enableAutoBackup: true,
  });

  const [showMrsJustinEModal, setShowMrsJustinEModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState<"idle" | "saving" | "restoring">("idle");
  const [useV2Architecture, setUseV2Architecture] = useState(true); // Nova arquitetura ativada por padrão

  // Backup manual
  const handleManualBackup = async () => {
    setBackupStatus("saving");
    try {
      await createBackup();
      toast.success("Backup criado com sucesso", {
        description: "Seus dados foram salvos no servidor",
      });
    } catch (error) {
      console.error("Erro ao criar backup:", error);
      toast.error("Erro ao criar backup", {
        description: "Tente novamente mais tarde",
      });
    } finally {
      setBackupStatus("idle");
    }
  };

  // Restore manual
  const handleManualRestore = async () => {
    setBackupStatus("restoring");
    try {
      const backup = await restoreBackup();
      if (backup) {
        toast.success("Dados restaurados com sucesso", {
          description: `Backup de ${new Date(backup.timestamp).toLocaleString()}`,
        });
      } else {
        toast.info("Nenhum backup encontrado");
      }
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      toast.error("Erro ao restaurar backup");
    } finally {
      setBackupStatus("idle");
    }
  };

  // Métricas básicas
  const activeAgents = agents.filter((a) => a.enabled).length;
  const queuedTasks = taskQueue.filter((t) => t.status === "queued").length;
  const processingTasks = taskQueue.filter((t) => t.status === "processing").length;
  const humanInterventionTasks = taskQueue.filter((t) => t.status === "human_intervention").length;

  const handleToggleAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    toggleAgent(agentId);
    toast.success(agent.enabled ? `${agent.name} desativado` : `${agent.name} ativado`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agentes de IA Autônomos</h1>
        <p className="text-muted-foreground mt-2">
          Equipe de inteligência artificial trabalhando 24/7 para automatizar tarefas jurídicas
        </p>
      </div>

      <MrsJustinEModal
        open={showMrsJustinEModal}
        onOpenChange={setShowMrsJustinEModal}
        onActivate={() => {
          const agent = agents.find((a) => a.id === "mrs-justin-e");
          if (agent && !agent.enabled) {
            handleToggleAgent("mrs-justin-e");
          }
          setShowMrsJustinEModal(false);
        }}
      />

      {/* Cards principais de status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Disponíveis</CardTitle>
            <Bot className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAgents}/{agents.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getActiveAgentsText(activeAgents)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fila de Trabalho</CardTitle>
            <Clock className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queuedTasks + processingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {getProcessingText(processingTasks)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Local</CardTitle>
            <CloudUpload className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-success">Ativo</div>
                <p className="text-xs text-muted-foreground mt-1">A cada 5 min</p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualBackup}
                  disabled={backupStatus === "saving"}
                  title="Salvar backup agora"
                >
                  <CloudUpload className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualRestore}
                  disabled={backupStatus === "restoring"}
                  title="Ver histórico de backups"
                >
                  <History className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Harvey */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Harvey Specter</CardTitle>
                <CardDescription className="mt-1">
                  Seu assistente jurídico estratégico com análises completas do escritório
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => onNavigate?.("assistente")}>
              <Info className="w-4 h-4 mr-2" />
              Abrir Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <LineChart className="w-5 h-5 text-accent" />
                <h4 className="font-semibold text-foreground">Análises Inteligentes</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Performance, processos, prazos e finanças em um só lugar
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Insights Estratégicos</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Identifica padrões e sugere otimizações
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-accent" />
                <h4 className="font-semibold text-foreground">Respostas Rápidas</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Análises complexas em questão de segundos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mrs. Justin-e */}
      <Card className="bg-linear-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Mrs. Justin-e</CardTitle>
                <CardDescription className="mt-1">
                  Especialista em análise de intimações com 95% de precisão
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowMrsJustinEModal(true)}>
              <Info className="w-4 h-4 mr-2" />
              Saiba Mais
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <h4 className="font-semibold text-foreground">95% Precisa</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Precisão garantida sem esquecer detalhes importantes
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Economiza Tempo</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                50 horas economizadas a cada 150 intimações
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-accent" />
                <h4 className="font-semibold text-foreground">Análise Rápida</h4>
              </div>
              <p className="text-sm text-muted-foreground">Menos de 1 minuto por intimação</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {humanInterventionTasks > 0 && (
        <Card className="border-accent bg-accent/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              <CardTitle className="text-base">Intervenção Humana Necessária</CardTitle>
            </div>
            <CardDescription>
              {humanInterventionTasks} tarefa(s) aguardando conclusão da edição humana
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Abas principais */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="metrics">
            <LineChart className="w-4 h-4 mr-2" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="orchestration">
            <Bot className="w-4 h-4 mr-2" />
            Orquestração V2
          </TabsTrigger>
          <TabsTrigger value="activity">
            <ListChecks className="w-4 h-4 mr-2" />
            Atividade em Tempo Real
            {activityLog.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activityLog.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="queue">
            Fila de Tarefas
            {queuedTasks + processingTasks > 0 && (
              <Badge variant="secondary" className="ml-2">
                {queuedTasks + processingTasks}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Histórico
            {completedTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {completedTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="server-logs">Logs do Servidor</TabsTrigger>
          <TabsTrigger value="memory">Memória Jurídica</TabsTrigger>
        </TabsList>

        {/* Agents */}
        <TabsContent value="agents" className="space-y-4">
          {/* Toggle de Streaming Global */}
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium text-sm">Modo Streaming</p>
                  <p className="text-xs text-muted-foreground">
                    Veja respostas da IA em tempo real
                  </p>
                </div>
              </div>
              <Switch
                aria-label="Ativar modo streaming para respostas da IA em tempo real"
                checked={isStreamingEnabled}
                onCheckedChange={toggleStreaming}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const IconComponent = agentIcons[agent.id] || Bot;
              const isStreaming = !!streamingContent[agent.id];
              const streamPreview = streamingContent[agent.id]?.slice(-100) || "";
              const statusColor = getStatusColor(agent.enabled, isStreaming, agent.status);

              return (
                <Card key={agent.id} className={getCardClassName(agent.enabled, isStreaming)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={getIconContainerClassName(agent.enabled, isStreaming)}>
                          <IconComponent className={`w-6 h-6 ${statusColor}`} />
                          {renderStreamingPingIndicator(isStreaming)}
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {agent.name}
                            {renderStreamingIndicator(isStreaming)}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {agent.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        aria-label={`Ativar ou desativar o agente ${agent.name}`}
                        checked={agent.enabled}
                        onCheckedChange={() => handleToggleAgent(agent.id)}
                      />
                    </div>

                    {/* Streaming Preview */}
                    {renderStreamingPreview(isStreaming, streamPreview)}

                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Capacidades:</span>
                        <Badge
                          variant={isStreaming || agent.enabled ? "default" : "secondary"}
                          style={isStreaming ? getStreamingStyle() : undefined}
                          className="text-xs"
                        >
                          {getAgentStatusLabel(isStreaming, agent.enabled)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities?.slice(0, 4).map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                        {agent.capabilities && agent.capabilities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.capabilities.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs">Última atividade:</span>
                      <span
                        className="text-xs"
                        style={isStreaming ? { color: themeConfig.colors.info } : undefined}
                      >
                        {agent.lastActivity}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Status:</span>
                      <Badge
                        variant={isStreaming || agent.enabled ? "default" : "secondary"}
                        style={isStreaming ? getStreamingStyle() : undefined}
                      >
                        {getAgentStatusLabelExtended(isStreaming, agent.enabled)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Métricas */}
        <TabsContent value="metrics" className="space-y-4">
          {/* Dashboard de métricas em tempo real */}
          <AgentMetricsDashboard />

          {/* Métricas legadas */}
          <AgentMetrics agents={agents} completedTasks={completedTasks} activityLog={activityLog} />
        </TabsContent>

        {/* Orquestração V2 */}
        <TabsContent value="orchestration" className="space-y-4">
          {useV2Architecture ? (
            <AgentOrchestrationPanel />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Arquitetura V2 - ReAct + Circuit Breakers</CardTitle>
                <CardDescription>
                  Painel de orquestração com observabilidade completa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Ativar Arquitetura V2</h4>
                    <p className="text-sm text-muted-foreground">
                      Nova arquitetura com ReAct Pattern, Circuit Breakers, Traces e Orquestração
                    </p>
                  </div>
                  <Switch
                    aria-label="Ativar arquitetura V2 com ReAct Pattern, Circuit Breakers, Traces e Orquestração"
                    checked={useV2Architecture}
                    onCheckedChange={setUseV2Architecture}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Atividade em tempo real */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {activityLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade registrada ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityLog.map((log) => {
                      const agent = agents.find((a) => a.id === log.agentId);
                      const IconComponent = agentIcons[log.agentId] || Bot;

                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <IconComponent className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{log.action}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(log.timestamp).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fila */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Tarefas</CardTitle>
              <CardDescription>Tarefas aguardando processamento pelos agentes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {taskQueue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma tarefa na fila
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taskQueue.map((task) => {
                      const agent = agents.find((a) => a.id === task.agentId);
                      const IconComponent = agentIcons[task.agentId] || Bot;

                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <IconComponent className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criada em: {new Date(task.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <Badge variant={getTaskStatusVariant(task.status)} className="shrink-0">
                            {task.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Tarefas Concluídas</CardTitle>
              <CardDescription>Tarefas processadas com sucesso pelos agentes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {completedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma tarefa concluída ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completedTasks.map((task) => {
                      const agent = agents.find((a) => a.id === task.agentId);
                      const IconComponent = agentIcons[task.agentId] || Bot;

                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <IconComponent
                            className="w-5 h-5 shrink-0 mt-0.5"
                            style={{ color: themeConfig.colors.sucesso }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Concluída em:{" "}
                              {task.completedAt
                                ? new Date(task.completedAt).toLocaleString("pt-BR")
                                : "-"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                className="text-xs"
                                style={(() => {
                                  const base = themeConfig.colors.sucesso;
                                  return {
                                    color: "white",
                                    backgroundColor: base,
                                    borderColor: base,
                                  };
                                })()}
                              >
                                Concluído
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {task.completedAt &&
                                  new Date(task.completedAt).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Server Logs */}
        <TabsContent value="server-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Servidor</CardTitle>
              <CardDescription>Monitoramento em tempo real dos logs do servidor</CardDescription>
            </CardHeader>
            <CardContent>
              <ServerLogsViewer logs={serverLogs} onRefresh={refreshServerData} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory */}
        <TabsContent value="memory" className="space-y-4">
          <LegalMemoryViewer memory={legalMemory} onRefresh={refreshServerData} />
        </TabsContent>
      </Tabs>

      {/* Floater de status 24/7 */}
      <AgentStatusFloater />
    </div>
  );
}

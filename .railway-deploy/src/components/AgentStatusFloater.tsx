import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAutonomousAgents } from "@/hooks/use-autonomous-agents";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle, ChevronDown, ChevronUp, X, Zap } from "lucide-react";
import { useState } from "react";

export default function AgentStatusFloater() {
  const { agents, activityLog } = useAutonomousAgents();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const activeAgents = agents.filter(
    (a) => a.enabled && (a.status === "active" || a.status === "processing")
  );

  const processingAgents = agents.filter((a) => a.currentTask !== undefined);
  const recentActivity = activityLog.slice(0, 3);
  const enabledAgentsCount = agents.filter((a) => a.enabled).length;

  // Se não há agentes ativos, não mostra o floater
  if (activeAgents.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 w-80"
        >
          <Card className="border-primary/30 bg-linear-to-br from-background/95 to-primary/5 backdrop-blur-sm shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bot className="w-5 h-5 text-primary" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Agentes Trabalhando 24/7
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeAgents.length} agente
                      {activeAgents.length === 1 ? "" : "s"} ativo
                      {activeAgents.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    aria-label={
                      isExpanded
                        ? "Recolher painel de status dos agentes"
                        : "Expandir painel de status dos agentes"
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsVisible(false)}
                    aria-label="Fechar painel de status dos agentes"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {processingAgents.length > 0 && (
                <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent animate-pulse" />
                    <p className="text-xs font-medium text-foreground">
                      {processingAgents.length} tarefa
                      {processingAgents.length === 1 ? "" : "s"} em processamento
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((log) => {
                          const agent = agents.find((a) => a.id === log.agentId);
                          return (
                            <div
                              key={log.id}
                              className="flex items-start gap-2 p-2 rounded-lg bg-muted text-xs"
                            >
                              <CheckCircle className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground line-clamp-1">
                                  {agent?.name ?? "Agente desconhecido"}
                                </p>
                                <p className="text-muted-foreground line-clamp-1">{log.action}</p>
                                <p className="text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Aguardando atividades...
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Agentes ativos</span>
                        <Badge variant="secondary">
                          {enabledAgentsCount}/{agents.length}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isExpanded && (
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <span className="text-muted-foreground">Clique para ver detalhes</span>
                  <Badge variant="secondary" className="text-xs">
                    {enabledAgentsCount} ativos
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useKV } from "@/hooks/use-kv";
import { geminiGenerateJSON } from "@/lib/gemini-client";
import type { Process } from "@/types";
import { AlertTriangle, Bell, Bot, CheckCircle, Clock, FileText, Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface MissingDocument {
  id: string;
  processId: string;
  processNumber: string;
  documentType: string;
  reason: string;
  urgency: "high" | "medium" | "low";
  detectedAt: string;
  notified: boolean;
  resolved: boolean;
}

interface DocumentCheckAgentProps {
  readonly processes: Process[];
}

export default function DocumentCheckAgent({ processes }: DocumentCheckAgentProps) {
  const [missingDocs, setMissingDocs] = useKV<MissingDocument[]>("missing-documents", []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastCheck, setLastCheck] = useKV<string | null>("last-document-check", null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useKV<boolean>("auto-document-check", true);

  const normalizeUrgency = (value: string | undefined | null): MissingDocument["urgency"] => {
    const v = (value || "").toLowerCase();
    if (v === "high" || v === "alta") return "high";
    if (v === "low" || v === "baixa") return "low";
    return "medium";
  };

  const analyzeProcessDocuments = useCallback(async () => {
    if (!processes || processes.length === 0) {
      return null;
    }

    setIsAnalyzing(true);

    try {
      const processesToAnalyze = processes.filter((p) => p.status === "ativo");
      const newMissingDocs: MissingDocument[] = [];

      for (const processo of processesToAnalyze) {
        const prompt = `Você é um agente especializado em análise documental jurídica.

Analise o seguinte processo e identifique documentos que podem estar faltando com base nas informações fornecidas:

Processo CNJ: ${processo.numeroCNJ}
Título: ${processo.titulo}
Autor: ${processo.autor}
Réu: ${processo.reu}
Comarca: ${processo.comarca}
Vara: ${processo.vara}
Status: ${processo.status}
Data de Distribuição: ${processo.dataDistribuicao}
Notas: ${processo.notas || "Nenhuma nota"}

Com base nessas informações, identifique documentos que podem estar faltando para dar andamento adequado ao processo. 
Para cada documento faltante, informe:
1. Nome do documento
2. Motivo pelo qual é necessário
3. Urgência (high, medium, low)

Retorne um objeto JSON com a seguinte estrutura:
{
  "missingDocuments": [
    {
      "documentType": "Nome do documento",
      "reason": "Por que é necessário",
      "urgency": "high"
    }
  ]
}`;

        const result = await geminiGenerateJSON<{
          missingDocuments: Array<{
            documentType: string;
            reason: string;
            urgency?: string;
          }>;
        }>(prompt);

        if (result.missingDocuments && Array.isArray(result.missingDocuments)) {
          result.missingDocuments.forEach((doc) => {
            const urgency = normalizeUrgency(doc.urgency);
            newMissingDocs.push({
              id: crypto.randomUUID(),
              processId: processo.id,
              processNumber: processo.numeroCNJ,
              documentType: doc.documentType,
              reason: doc.reason,
              urgency,
              detectedAt: new Date().toISOString(),
              notified: false,
              resolved: false,
            });
          });
        }
      }

      setMissingDocs((current) => {
        const existing = current || [];
        const existingIds = new Set(existing.map((d) => `${d.processId}-${d.documentType}`));

        const uniqueNew = newMissingDocs.filter(
          (doc) => !existingIds.has(`${doc.processId}-${doc.documentType}`) && !doc.resolved
        );

        // Mantém apenas não resolvidos + novos únicos
        return [...existing.filter((d) => !d.resolved), ...uniqueNew];
      });

      setLastCheck(new Date().toISOString());

      const unresolvedCount = newMissingDocs.filter((d) => !d.resolved).length;
      if (unresolvedCount > 0) {
        toast.info(`Encontrados ${unresolvedCount} documentos possivelmente faltantes`, {
          description: "Verifique a lista de documentos pendentes",
        });
      } else {
        toast.success("Análise concluída", {
          description: "Nenhum novo documento faltante identificado",
        });
      }
    } catch (error) {
      console.error("Erro ao analisar documentos:", error);
      toast.error("Erro na análise", {
        description: "Não foi possível analisar os documentos",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [processes, setMissingDocs, setLastCheck]);

  const notifyMissingDocument = (docId: string) => {
    setMissingDocs((current) =>
      (current || []).map((doc) => (doc.id === docId ? { ...doc, notified: true } : doc))
    );

    const doc = missingDocs?.find((d) => d.id === docId);
    if (doc) {
      toast.warning("Notificação registrada", {
        description: `Lembrete criado para juntar "${doc.documentType}" no processo ${doc.processNumber}`,
      });
    }
  };

  const markAsResolved = (docId: string) => {
    setMissingDocs((current) =>
      (current || []).map((doc) => (doc.id === docId ? { ...doc, resolved: true } : doc))
    );
    toast.success("Documento marcado como juntado");
  };

  useEffect(() => {
    if (!autoCheckEnabled || !processes || processes.length === 0) return;

    const interval = setInterval(
      () => {
        analyzeProcessDocuments();
      },
      60 * 60 * 1000
    ); // a cada 1h

    return () => clearInterval(interval);
  }, [autoCheckEnabled, processes, analyzeProcessDocuments]);

  const unresolvedDocs = (missingDocs || []).filter((d) => !d.resolved);
  const highUrgency = unresolvedDocs.filter((d) => d.urgency === "high").length;
  const mediumUrgency = unresolvedDocs.filter((d) => d.urgency === "medium").length;
  const lowUrgency = unresolvedDocs.filter((d) => d.urgency === "low").length;

  const getUrgencyColor = (
    urgency: MissingDocument["urgency"]
  ): "default" | "destructive" | "secondary" => {
    switch (urgency) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getUrgencyLabel = (urgency: MissingDocument["urgency"]) => {
    switch (urgency) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return "Média";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Agente de Verificação Documental</CardTitle>
                <CardDescription>
                  Identifica documentos faltantes e notifica para juntá-los aos processos
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Auto-verificação (1h)</span>
                <Switch
                  id="auto-check"
                  aria-label="Ativar verificação automática de documentos a cada 1 hora"
                  checked={autoCheckEnabled}
                  onCheckedChange={setAutoCheckEnabled}
                  disabled={processes.length === 0}
                />
              </div>
              <Button
                onClick={analyzeProcessDocuments}
                disabled={isAnalyzing || processes.length === 0}
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="w-4 h-4 mr-1 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-1" />
                    Analisar Processos
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pendente</p>
                    <p className="text-2xl font-bold">{unresolvedDocs.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alta Urgência</p>
                    <p className="text-2xl font-bold text-destructive">{highUrgency}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Média Urgência</p>
                    <p className="text-2xl font-bold text-primary">{mediumUrgency}</p>
                  </div>
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Baixa Urgência</p>
                    <p className="text-2xl font-bold text-muted-foreground">{lowUrgency}</p>
                  </div>
                  <Info className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {lastCheck && (
            <div className="text-sm text-muted-foreground">
              Última verificação: {new Date(lastCheck).toLocaleString("pt-BR")}
            </div>
          )}
        </CardContent>
      </Card>

      {unresolvedDocs.length === 0 ? (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            {processes.length === 0
              ? "Nenhum processo cadastrado para análise."
              : "Nenhum documento faltante identificado. Todos os processos estão com documentação adequada."}
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Documentos Pendentes</CardTitle>
            <CardDescription>
              Lista de documentos que precisam ser juntados aos processos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {(() => {
                  const sortedDocs = unresolvedDocs.slice().sort((a, b) => {
                    const urgencyOrder: Record<MissingDocument["urgency"], number> = {
                      high: 0,
                      medium: 1,
                      low: 2,
                    };
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                  });

                  return sortedDocs.map((doc) => (
                    <Card
                      key={doc.id}
                      className="border-l-4"
                      style={{
                        borderLeftColor: getUrgencyColor(doc.urgency),
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <h4 className="font-semibold">{doc.documentType}</h4>
                                <Badge variant={getUrgencyColor(doc.urgency)}>
                                  {getUrgencyLabel(doc.urgency)}
                                </Badge>
                                {doc.notified && (
                                  <Badge variant="outline">
                                    <Bell className="w-3 h-3" />
                                    Notificado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Processo: {doc.processNumber}
                              </p>
                              <p className="text-sm">{doc.reason}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Detectado em: {new Date(doc.detectedAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              {!doc.notified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => notifyMissingDocument(doc.id)}
                                >
                                  <Bell className="w-4 h-4 mr-1" />
                                  Notificar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => markAsResolved(doc.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Juntado
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>Como funciona:</strong> o agente analisa automaticamente os processos ativos e
          identifica documentos que podem estar faltando com base no tipo de ação, partes envolvidas
          e informações do processo. Você pode registrar uma notificação e marcar como resolvido
          quando o documento for juntado.
        </AlertDescription>
      </Alert>
    </div>
  );
}

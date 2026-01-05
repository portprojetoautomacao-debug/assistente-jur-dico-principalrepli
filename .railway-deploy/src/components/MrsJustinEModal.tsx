import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAIStreaming } from "@/hooks/use-ai-streaming";
import { Brain, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MrsJustinEModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onActivate?: () => void;
}

const SKILLS: string[] = [
  "Interpreta intimações com IA jurídica (Gemini)",
  "Conta prazos com base no contexto da intimação",
  "Orienta a controladoria sobre próximos passos",
  "Sugere tarefas e responsáveis",
  "Organiza em sistema D-1, D-2 ou D-n",
  "Prepara atendimentos com resumo objetivo",
  "Cria workflow de controladoria a partir da análise",
  "Refaz análise sempre que há nova informação",
];

export default function MrsJustinEModal({ open, onOpenChange, onActivate }: MrsJustinEModalProps) {
  const [hasPreviewStarted, setHasPreviewStarted] = useState(false);

  const {
    streamingContent,
    isStreaming,
    streamChat,
    cancelStream,
    reset: resetStreaming,
  } = useAIStreaming({
    onError: (error) => {
      console.error("[MrsJustinE] Erro no streaming:", error);
      toast.error("Erro ao gerar exemplo em tempo real da Mrs. Justin-e");
    },
  });

  const handleActivate = () => {
    onActivate?.();
    onOpenChange(false);
  };

  const handleStartPreview = async () => {
    if (isStreaming) return;

    try {
      setHasPreviewStarted(true);
      resetStreaming();

      await streamChat([
        {
          role: "system",
          content:
            "Você é Mrs. Justin-e, uma agente de IA jurídica especializada em análise de intimações, prazos e controladoria de escritórios de advocacia brasileiros. " +
            "Fale sempre em primeira pessoa, de forma clara, objetiva e profissional, sem prometer precisão absoluta ou garantia de resultado. " +
            "Explique o que você faz, como ajuda e como integra prazos, tarefas e workflows.",
        },
        {
          role: "user",
          content:
            "Explique em poucos parágrafos como você analisa uma intimação, identifica prazos importantes e monta um workflow de tarefas para o escritório, de forma resumida.",
        },
      ]);
      // O texto final fica em streamingContent; não precisamos fazer nada aqui.
    } catch (error) {
      console.error("[MrsJustinE] Erro ao iniciar preview:", error);
      // onError do hook já mostra toast
    }
  };

  const handleStopPreview = () => {
    cancelStream();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              Mrs. Justin-e
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Quer impulsionar seu escritório?
            </h3>
            <p className="text-base font-medium text-foreground">
              Deixa a parte repetitiva comigo e foque nas estratégias.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-foreground">
              Eu analiso intimações usando IA jurídica treinada para contexto brasileiro, geralmente
              em menos de <span className="font-bold text-primary">1 minuto</span>,
            </p>
            <p className="text-sm text-foreground">
              enquanto humanos podem levar vários minutos e correr risco de esquecer detalhes
              importantes.
            </p>
          </div>

          <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
            <p className="text-sm text-foreground">
              Em cenários típicos, meu uso pode representar{" "}
              <span className="font-bold text-accent">dezenas de horas</span> economizadas a cada
              lote de intimações, além de reduzir o risco de prazos perdidos.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Minhas Skills</h3>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="text-sm py-1.5 px-3 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preview em streaming da IA */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">
                Ver Mrs. Justin-e em ação (exemplo em tempo real)
              </h3>
              {isStreaming ? (
                <Button variant="outline" size="sm" onClick={handleStopPreview}>
                  Parar preview
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleStartPreview}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar exemplo
                </Button>
              )}
            </div>

            <div className="bg-muted/60 rounded-lg p-3 text-sm min-h-20 max-h-40 overflow-y-auto">
              {isStreaming && (
                <p className="text-xs text-muted-foreground mb-1 animate-pulse">
                  Mrs. Justin-e está pensando...
                </p>
              )}
              <p className="whitespace-pre-wrap">
                {streamingContent ||
                  (hasPreviewStarted
                    ? "Nenhum conteúdo disponível. Clique em “Gerar exemplo” para ver uma demonstração."
                    : "Clique em “Gerar exemplo” para ver, ao vivo, como Mrs. Justin-e explicaria sua atuação na análise de intimações e criação de workflows.")}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-base font-semibold text-foreground mb-3">
              Como utilizar a Mrs. Justin-e
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Na tela de intimações, clique em{" "}
                    <span className="font-semibold">“Ativar Mrs. Justin-e”</span> para receber um
                    resumo estruturado da intimação e sugestões de tarefas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Entre as opções sugeridas, selecione a tarefa (ou combinação de tarefas) mais
                    adequada ao caso concreto.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Mrs. Justin-e irá montar um workflow completo de controladoria (prazos, D-1,
                    D-2, responsável, checagens) com base na análise.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Se surgirem novas informações (petições, decisões ou documentos), basta enviar
                    novamente: ela refaz a análise e ajusta o workflow automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Benefícios principais</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Análise muito mais rápida que a leitura manual</li>
                  <li>✓ Foco em contexto jurídico, não só em palavras soltas</li>
                  <li>✓ Menos risco de intimações esquecidas ou mal classificadas</li>
                  <li>✓ Workflow de controladoria padronizado e automatizado</li>
                  <li>✓ Economia significativa de horas da equipe</li>
                  <li>✓ Funciona 24/7 sem pausas ou fadiga</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1" size="lg" onClick={handleActivate}>
              <Brain className="w-5 h-5 mr-2" />
              Ativar Mrs. Justin-e
            </Button>
            <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Depois
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

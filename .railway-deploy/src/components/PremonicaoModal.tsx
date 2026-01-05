import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PremonicaoJuridica } from "@/types";
import { motion } from "framer-motion";
import { Check, ChevronRight, Copy, ExternalLink, Lightbulb, X } from "lucide-react";
import { useState } from "react";

interface PremonicaoModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly data: PremonicaoJuridica | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

interface ProbabilityMeterProps {
  readonly percentage: number;
}

function ProbabilityMeter({ percentage }: ProbabilityMeterProps) {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 75) return "oklch(0.65 0.18 145)";
    if (pct >= 50) return "oklch(0.75 0.15 85)";
    if (pct >= 25) return "oklch(0.68 0.15 45)";
    return "oklch(0.55 0.22 25)";
  };

  const getLabel = (pct: number) => {
    if (pct >= 75) return "Alta Probabilidade";
    if (pct >= 50) return "Média Probabilidade";
    if (pct >= 25) return "Baixa-Média Probabilidade";
    return "Baixa Probabilidade";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="oklch(0.88 0.005 260)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            stroke={getColor(percentage)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
      <Badge
        className="px-4 py-1.5 text-sm font-medium"
        style={{ backgroundColor: getColor(percentage), color: "white" }}
      >
        {getLabel(percentage)}
      </Badge>
    </div>
  );
}

interface CopyButtonProps {
  readonly text: string;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8 shrink-0"
      aria-label={copied ? "Texto copiado" : "Copiar texto"}
      title="Copiar texto"
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export default function PremonicaoModal({
  isOpen,
  onClose,
  data,
  isLoading,
  error,
}: PremonicaoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Lightbulb className="h-5 w-5 text-accent" />
            </div>
            <DialogTitle className="text-2xl font-semibold">Premonição Jurídica</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar premonição">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <div>
                  <p className="text-foreground font-medium">Analisando processo...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A IA está consultando jurisprudência e gerando análise
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2 max-w-md">
                <div className="text-5xl mb-4">⚠️</div>
                <p className="text-destructive font-semibold text-lg">Erro ao gerar premonição</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && data && (
            <div className="space-y-8">
              <div className="flex justify-center pb-4">
                <ProbabilityMeter percentage={data.probabilidade_exito} />
              </div>

              <div className="space-y-6">
                <div className="bg-muted/50 p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-accent" />
                    Análise da IA
                  </h3>
                  <p className="text-foreground leading-relaxed">{data.analise_ia}</p>
                </div>

                {data.estrategias_recomendadas && data.estrategias_recomendadas.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Estratégias Recomendadas</h3>
                    <div className="space-y-3">
                      {data.estrategias_recomendadas.map((estrategia, idx) => (
                        <div
                          key={`estrategia-${idx}-${estrategia.slice(0, 30).replaceAll(/\W/g, "")}`}
                          className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow group"
                        >
                          <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <p className="flex-1 text-foreground">{estrategia}</p>
                          <CopyButton text={estrategia} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.precedentes_relevantes && data.precedentes_relevantes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Precedentes Relevantes</h3>
                    <div className="space-y-4">
                      {data.precedentes_relevantes.map((precedente) => (
                        <div
                          key={precedente.id}
                          className="bg-card border-l-4 border-l-muted-foreground/40 rounded-lg p-5 space-y-3 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-semibold">
                                  {precedente.tribunal}
                                </Badge>
                                <span className="text-sm font-medium text-foreground">
                                  {precedente.numero}
                                </span>
                              </div>
                              <h4 className="font-semibold text-foreground">{precedente.tema}</h4>
                            </div>
                            <div className="flex gap-1">
                              <CopyButton
                                text={`${precedente.id} - ${precedente.tema}\n\n${precedente.resumo_relevancia}\n\nLink: ${precedente.link}`}
                              />
                              {precedente.link && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  asChild
                                  aria-label="Abrir jurisprudência em nova aba"
                                >
                                  <a
                                    href={precedente.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Abrir jurisprudência"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {precedente.resumo_relevancia}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Processo: {data.processo_cnj} • Análise gerada por IA • Revisão humana recomendada
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente para item individual de publicação DJEN
 * Reduz complexidade cognitiva do componente principal
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DJENPublication } from "@/types/djen-publication";
import { BellRing, CheckCircle, ChevronDown, ChevronUp, Copy, Plus } from "lucide-react";
import { toast } from "sonner";

interface PublicationItemProps {
  readonly pub: DJENPublication;
  readonly expanded: string | null;
  readonly onToggleExpand: (id: string | null) => void;
  readonly onRegister: (pub: DJENPublication) => void;
  readonly isAlreadyRegistered: boolean;
  readonly formatRelativeDate: (dateStr: string) => string;
}

const MATCH_BADGE_VARIANTS = {
  nome: {
    label: "Nome",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  oab: {
    label: "OAB",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  ambos: {
    label: "Nome + OAB",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
};

function MatchBadge({ type }: Readonly<{ type: "nome" | "oab" | "ambos" }>) {
  const variant = MATCH_BADGE_VARIANTS[type];
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

export function PublicationItem({
  pub,
  expanded,
  onToggleExpand,
  onRegister,
  isAlreadyRegistered,
  formatRelativeDate,
}: PublicationItemProps) {
  const handleCopy = (teor: string) => {
    navigator.clipboard.writeText(teor);
    toast.success("Copiado!", {
      description: "Teor copiado para a área de transferência",
    });
  };

  return (
    <button
      type="button"
      className={cn(
        "p-3 rounded-lg border transition-all cursor-pointer w-full text-left",
        "hover:bg-accent/50 hover:border-primary/30",
        expanded === pub.id && "bg-accent/30 border-primary/50"
      )}
      onClick={() => onToggleExpand(expanded === pub.id ? null : pub.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="text-xs px-1.5">
              {pub.tribunal}
            </Badge>
            <MatchBadge type={pub.matchType} />
            {!pub.notified && (
              <Badge className="bg-primary/20 text-primary text-xs px-1.5">
                <BellRing size={10} className="mr-1" />
                Novo
              </Badge>
            )}
          </div>

          <p className="text-xs font-medium truncate">{pub.tipo || "Intimação"}</p>

          <p className="text-xs text-muted-foreground truncate">
            {pub.numeroProcesso && `Processo: ${pub.numeroProcesso}`}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-muted-foreground">{formatRelativeDate(pub.createdAt)}</span>
          {expanded === pub.id ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Conteúdo expandido */}
      {expanded === pub.id && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="bg-muted/50 p-2 rounded text-xs">
            <p className="font-medium mb-1 text-muted-foreground">Teor:</p>
            <p className="whitespace-pre-wrap text-xs max-h-32 overflow-y-auto">
              {pub.teor.substring(0, 500)}
              {pub.teor.length > 500 && "..."}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Advogado: {pub.lawyerName}</span>
            <span>
              Data:{" "}
              {pub.data && !Number.isNaN(new Date(pub.data).getTime())
                ? new Date(pub.data).toLocaleDateString("pt-BR")
                : "Data não disponível"}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(pub.teor);
              }}
            >
              <Copy size={12} />
              Copiar
            </Button>
            <Button
              variant={isAlreadyRegistered ? "ghost" : "default"}
              size="sm"
              className={cn("h-7 text-xs flex-1", !isAlreadyRegistered && "button-gradient")}
              disabled={isAlreadyRegistered}
              onClick={(e) => {
                e.stopPropagation();
                onRegister(pub);
              }}
            >
              {isAlreadyRegistered ? (
                <>
                  <CheckCircle size={12} />
                  No Acervo
                </>
              ) : (
                <>
                  <Plus size={12} />
                  Cadastrar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </button>
  );
}

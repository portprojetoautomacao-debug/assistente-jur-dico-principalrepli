/**
 * Widget de sincronização de documentos PJe
 * Exibe documentos capturados pela extensão Chrome aguardando ação
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePJeDocumentSync, usePJeDocumentWidget } from "@/hooks/use-pje-document-sync";
import { DocumentoPJe } from "@/types";
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export function PJeDocumentWidget() {
  const {
    visivel,
    documentosNovos,
    documentosProcessados,
    extensaoAtivaNoTab,
    forcarSincronizacao,
    abrirPainel,
    fecharPainel,
  } = usePJeDocumentWidget();

  if (!extensaoAtivaNoTab || (documentosNovos === 0 && documentosProcessados === 0)) {
    return null;
  }

  return (
    <Sheet open={visivel} onOpenChange={(open) => (open ? abrirPainel() : fecharPainel())}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2" onClick={abrirPainel}>
          <FileText className="h-4 w-4" />
          <span>PJe Sync</span>
          {documentosNovos > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
            >
              {documentosNovos}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>📄 Documentos PJe Capturados</SheetTitle>
          <SheetDescription>Sincronização em tempo real da extensão Chrome</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <PJeDocumentList />
        </div>

        <div className="border-t pt-4 flex gap-2 justify-between mt-auto">
          <Button variant="outline" onClick={fecharPainel}>
            Fechar
          </Button>
          <Button onClick={forcarSincronizacao} className="gap-2">
            <Zap className="h-4 w-4" />
            Sincronizar Agora
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Lista de documentos pendentes e processados
 */
function PJeDocumentList() {
  const { documentosPendentes, documentosProcessados, salvarDocumento, descartarDocumento } =
    usePJeDocumentSync();
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const toggleExpandir = (id: string) => {
    const novo = new Set(expandidos);
    if (novo.has(id)) {
      novo.delete(id);
    } else {
      novo.add(id);
    }
    setExpandidos(novo);
  };

  return (
    <div className="space-y-4">
      {/* Documentos Novos */}
      {documentosPendentes.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            Novos Documentos ({documentosPendentes.length})
          </h3>

          <div className="space-y-2">
            {documentosPendentes.map((doc) => (
              <PJeDocumentCard
                key={doc.id}
                documento={doc}
                expandido={expandidos.has(doc.id)}
                onToggleExpandir={() => toggleExpandir(doc.id)}
                onSalvar={salvarDocumento}
                onDescartar={descartarDocumento}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documentos Processados */}
      {documentosProcessados.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Salvos ({documentosProcessados.length})
          </h3>

          <div className="space-y-2">
            {documentosProcessados.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-green-900">{doc.tipo.toUpperCase()}</p>
                    <p className="text-green-700">{doc.metadados?.numeroProcesso || "N/A"}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vazio */}
      {documentosPendentes.length === 0 && documentosProcessados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
          <div className="bg-muted p-4 rounded-full">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Nenhum documento capturado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Navegue pelo PJe para capturar documentos automaticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Card individual de documento
 */
interface PJeDocumentCardProps {
  documento: DocumentoPJe;
  expandido: boolean;
  onToggleExpandir: () => void;
  onSalvar: (doc: DocumentoPJe) => Promise<string>;
  onDescartar: (id: string) => void;
}

function PJeDocumentCard({
  documento,
  expandido,
  onToggleExpandir,
  onSalvar,
  onDescartar,
}: PJeDocumentCardProps) {
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await onSalvar(documento);
    } finally {
      setSalvando(false);
    }
  };

  const tipoEmoji =
    {
      certidao: "📜",
      sentenca: "⚖️",
      despacho: "📋",
      mandado: "📬",
      outro: "📄",
    }[documento.tipo] || "📄";

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader
        className="pb-2 cursor-pointer hover:bg-muted/50 focus:bg-muted/50 outline-none"
        onClick={onToggleExpandir}
        role="button"
        tabIndex={0}
        aria-label={expandido ? "Recolher detalhes do documento" : "Expandir detalhes do documento"}
        aria-expanded={expandido}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpandir();
          }
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <span>{tipoEmoji}</span>
              <span>{documento.tipo.toUpperCase()}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              {documento.metadados?.numeroProcesso || "Processo não identificado"}
            </CardDescription>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(documento.dataExtracao).toLocaleTimeString("pt-BR")}
          </span>
        </div>
      </CardHeader>

      {expandido && (
        <CardContent className="space-y-3">
          {/* Metadados */}
          {documento.metadados && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {documento.metadados.autor && (
                <div>
                  <p className="text-muted-foreground">Autor:</p>
                  <p className="font-medium">{documento.metadados.autor}</p>
                </div>
              )}
              {documento.metadados.reu && (
                <div>
                  <p className="text-muted-foreground">Réu:</p>
                  <p className="font-medium">{documento.metadados.reu}</p>
                </div>
              )}
              {documento.metadados.comarca && (
                <div>
                  <p className="text-muted-foreground">Comarca:</p>
                  <p className="font-medium">{documento.metadados.comarca}</p>
                </div>
              )}
              {documento.metadados.vara && (
                <div>
                  <p className="text-muted-foreground">Vara:</p>
                  <p className="font-medium">{documento.metadados.vara}</p>
                </div>
              )}
            </div>
          )}

          {/* Preview do conteúdo */}
          <div className="bg-muted p-2 rounded max-h-32 overflow-y-auto text-xs">
            <p className="line-clamp-5">{documento.conteudo}</p>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDescartar(documento.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Descartar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSalvar}
              disabled={salvando}
              aria-busy={salvando}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4 mr-1" aria-hidden="true" />
              )}
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Componente de status da extensão PJe
 * Mostra se está conectada e sincronizando
 */
export function PJeStatusBadge() {
  const { extensaoAtivaNoTab } = usePJeDocumentSync();
  const [statusLabel, setStatusLabel] = useState("Detectando...");

  useEffect(() => {
    setStatusLabel(extensaoAtivaNoTab ? "PJe Conectado" : "PJe Desconectado");
  }, [extensaoAtivaNoTab]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={extensaoAtivaNoTab ? "outline" : "secondary"}
            className={`gap-1.5 cursor-help transition-all ${
              extensaoAtivaNoTab
                ? "border-green-500/50 bg-green-500/10 text-green-700 hover:bg-green-500/20"
                : "text-muted-foreground"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full shadow-sm transition-colors ${
                extensaoAtivaNoTab ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {statusLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium mb-1">
            {extensaoAtivaNoTab ? "Conexão Estabelecida" : "Extensão não detectada"}
          </p>
          <p className="text-xs text-muted-foreground">
            {extensaoAtivaNoTab
              ? "A extensão Chrome está ativa e monitorando esta aba do PJe."
              : "Instale a extensão Chrome e acesse uma página do PJe para sincronizar documentos."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

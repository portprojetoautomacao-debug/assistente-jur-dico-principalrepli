/**
 * GoogleDocsEmbed - Componente para embutir Google Docs dentro do app
 *
 * Features:
 * - Iframe com URL de embed
 * - Tabs "Editar" e "Visualizar"
 * - Botões fullscreen e abrir externamente
 * - Tratamento de erro de carregamento
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowSquareOut, Eye, NotePencil, X } from "@phosphor-icons/react";
import { Maximize2 } from "lucide-react";
import { useState } from "react";

interface GoogleDocsEmbedProps {
  readonly docId: string;
  readonly docUrl: string;
  readonly title: string;
  readonly onClose?: () => void;
}

/**
 * Validate Google Docs ID format
 * Google Docs IDs are typically 44 characters long and contain alphanumeric, hyphens, and underscores
 */
function isValidDocId(docId: string): boolean {
  // Basic validation: alphanumeric, hyphens, underscores, 20-60 chars
  return /^[a-zA-Z0-9_-]{20,60}$/.test(docId);
}

// Helper: Construir URLs do Google Docs
function buildGoogleDocsUrls(docId: string) {
  const isValid = isValidDocId(docId);
  if (!isValid) {
    console.error("Invalid Google Docs ID format:", docId);
  }

  return {
    viewUrl: isValid ? `https://docs.google.com/document/d/${docId}/preview` : "",
    editUrl: isValid ? `https://docs.google.com/document/d/${docId}/edit` : "",
  };
}

export function GoogleDocsEmbed({ docId, docUrl, title, onClose }: GoogleDocsEmbedProps) {
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { viewUrl, editUrl } = buildGoogleDocsUrls(docId);
  const iframeUrl = activeTab === "edit" ? editUrl : viewUrl;

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOpenExternal = () => {
    window.open(docUrl, "_blank", "noopener,noreferrer");
  };

  const handleIframeError = () => {
    setHasError(true);
  };

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden transition-all",
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-full border-border shadow-lg"
      )}
    >
      <CardHeader className="border-b border-border py-3 px-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold truncate flex-1">{title}</CardTitle>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleFullscreen}
              title={isFullscreen ? "Sair do modo tela cheia" : "Tela cheia"}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleOpenExternal}
              title="Abrir em nova aba"
            >
              <ArrowSquareOut className="h-5 w-5" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onClose}
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "view" | "edit")}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="border-b border-border px-4">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger
              value="view"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <NotePencil className="h-4 w-4 mr-2" />
              Editar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="view" className="flex-1 m-0 overflow-hidden">
          <CardContent className="p-0 h-full">
            {hasError || !isValidDocId(docId) ? (
              <div className="flex items-center justify-center h-full bg-muted/10">
                <div className="text-center space-y-4 p-8">
                  <div className="text-6xl">📄</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {!isValidDocId(docId)
                        ? "ID de documento inválido"
                        : "Não foi possível carregar o documento"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {!isValidDocId(docId)
                        ? "O ID fornecido não está no formato correto"
                        : "Verifique se você tem permissão para acessar este documento"}
                    </p>
                    <Button onClick={handleOpenExternal} variant="outline">
                      <ArrowSquareOut className="h-4 w-4 mr-2" />
                      Abrir no Google Docs
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                src={iframeUrl}
                className="w-full h-full border-0"
                title={title}
                allow="clipboard-read; clipboard-write"
                onError={handleIframeError}
              />
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="edit" className="flex-1 m-0 overflow-hidden">
          <CardContent className="p-0 h-full">
            {hasError || !isValidDocId(docId) ? (
              <div className="flex items-center justify-center h-full bg-muted/10">
                <div className="text-center space-y-4 p-8">
                  <div className="text-6xl">📝</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {!isValidDocId(docId)
                        ? "ID de documento inválido"
                        : "Não foi possível carregar o editor"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {!isValidDocId(docId)
                        ? "O ID fornecido não está no formato correto"
                        : "Verifique se você tem permissão de edição para este documento"}
                    </p>
                    <Button onClick={handleOpenExternal} variant="outline">
                      <ArrowSquareOut className="h-4 w-4 mr-2" />
                      Editar no Google Docs
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                src={iframeUrl}
                className="w-full h-full border-0"
                title={`${title} - Editar`}
                allow="clipboard-read; clipboard-write"
                onError={handleIframeError}
              />
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default GoogleDocsEmbed;

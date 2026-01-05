/**
 * PjeImageImporter - Componente para importar processos via imagem/screenshot
 * Upload de imagens do PJe e extração automática de dados via OCR
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKV } from "@/hooks/use-kv";
import { processarImagemPJe, type PjeDocumentData } from "@/lib/pje-ocr-extractor";
import type { Expediente, Process } from "@/types";
import { AlertCircle, Camera, CheckCircle, FileImage, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export function PjeImageImporter() {
  const [_processes, setProcesses] = useKV<Process[]>("processes", []);
  const [_expedientes, setExpedientes] = useKV<Expediente[]>("expedientes", []);

  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<PjeDocumentData | null>(null);
  const [processoGerado, setProcessoGerado] = useState<Partial<Process> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo: 10MB");
      return;
    }

    setSelectedImage(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.success(`Imagem "${file.name}" selecionada`);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, solte uma imagem válida");
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.success(`Imagem "${file.name}" carregada`);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const processImage = useCallback(async () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressStage("Iniciando...");

    const toastId = toast.loading("Processando imagem...");

    try {
      const result = await processarImagemPJe(selectedImage, (stage, prog) => {
        setProgressStage(stage);
        setProgress(prog);
      });

      setExtractedData(result.dadosOriginais);
      setProcessoGerado(result.processo);

      toast.success("✅ Imagem processada com sucesso!", { id: toastId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao processar imagem";
      toast.error(errorMsg, { id: toastId });
      console.error("[PjeImageImporter] Erro:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressStage("");
    }
  }, [selectedImage]);

  const salvarProcesso = useCallback(() => {
    if (!processoGerado || !extractedData) {
      toast.error("Nenhum dado para salvar");
      return;
    }

    // Criar processo
    const novoProcesso: Process = {
      id: `process-${Date.now()}`,
      numeroCNJ: processoGerado.numeroCNJ || "",
      titulo: processoGerado.titulo || "Processo Importado",
      autor: processoGerado.autor || "",
      reu: processoGerado.reu || "",
      comarca: processoGerado.comarca || "Não identificado",
      vara: processoGerado.vara || "Não identificado",
      fase: "inicial",
      status: "ativo",
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      prazos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Criar expediente
    const novoExpediente: Expediente = {
      id: `exp-${Date.now()}`,
      processId: novoProcesso.id,
      tipo: "intimacao" as const,
      dataRecebimento: extractedData.dataExpedicao || new Date().toISOString(),
      conteudo: extractedData.conteudo,
      lido: true,
      titulo: `${extractedData.tipoDocumento?.toUpperCase() || "DOCUMENTO"} - Importado via OCR`,
    };

    // Salvar
    setProcesses((current) => [...(current || []), novoProcesso]);
    setExpedientes((current) => [...(current || []), novoExpediente]);

    toast.success("✅ Processo e expediente salvos com sucesso!");

    // Reset
    setSelectedImage(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setProcessoGerado(null);
    setProgress(0);
    setProgressStage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsOpen(false);
  }, [processoGerado, extractedData, setProcesses, setExpedientes]);

  const resetForm = useCallback(() => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setProcessoGerado(null);
    setProgress(0);
    setProgressStage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Camera className="h-4 w-4" />
          Importar do PJe (Imagem)
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-primary" />
            Importar Processo via Screenshot/Imagem
          </DialogTitle>
          <DialogDescription>
            Tire um print do PJe ou faça upload de uma certidão/expediente. O sistema extrairá
            automaticamente os dados usando OCR (Reconhecimento Óptico de Caracteres).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-6">
            {/* Coluna Esquerda: Upload e Preview */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">1. Upload da Imagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetForm();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Clique ou arraste uma imagem aqui
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (máx. 10MB)</p>
                      </>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {selectedImage && (
                    <div className="mt-4 text-xs text-muted-foreground">
                      📄 {selectedImage.name} ({(selectedImage.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                </CardContent>
              </Card>

              {isProcessing && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{progressStage}</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Coluna Direita: Dados Extraídos */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">2. Dados Extraídos</CardTitle>
                  <CardDescription>Revise e edite os dados antes de salvar</CardDescription>
                </CardHeader>
                <CardContent>
                  {extractedData ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Número do Processo
                          </Label>
                          <Input
                            value={processoGerado?.numeroCNJ || "Não identificado"}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, numeroCNJ: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Tipo de Documento</Label>
                          <Input
                            value={extractedData.tipoDocumento || "Não identificado"}
                            readOnly
                            className="mt-1 bg-muted"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Autor</Label>
                          <Input
                            value={processoGerado?.autor || ""}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, autor: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Réu</Label>
                          <Input
                            value={processoGerado?.reu || ""}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, reu: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Comarca</Label>
                          <Input
                            value={processoGerado?.comarca || ""}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, comarca: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Vara</Label>
                          <Input
                            value={processoGerado?.vara || ""}
                            onChange={(e) =>
                              setProcessoGerado((prev) =>
                                prev ? { ...prev, vara: e.target.value } : null
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Data de Expedição</Label>
                          <Input
                            value={extractedData.dataExpedicao || ""}
                            readOnly
                            className="mt-1 bg-muted"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Texto Completo (OCR)
                          </Label>
                          <textarea
                            value={extractedData.conteudo}
                            readOnly
                            className="mt-1 w-full h-32 p-2 text-xs border rounded bg-muted font-mono"
                          />
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-center text-muted-foreground">
                      <div>
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">
                          Faça upload de uma imagem e clique em "Processar" para extrair os dados
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {extractedData && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Dados extraídos com sucesso
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>

            {!extractedData ? (
              <Button onClick={processImage} disabled={!selectedImage || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Processar Imagem
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={salvarProcesso}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Salvar Processo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

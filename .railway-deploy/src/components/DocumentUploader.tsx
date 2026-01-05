import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKV } from "@/hooks/use-kv";
import { Download, Eye, FileText, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface Document {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  data: string;
  conteudo: string; // base64
}

interface DocumentUploaderProps {
  readonly processoId: string;
}

export default function DocumentUploader({ processoId }: DocumentUploaderProps) {
  const [documentos, setDocumentos] = useKV<Document[]>(`docs-${processoId}`, []);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const uploadedFile of files) {
        // Validate file size (max 50MB)
        if (uploadedFile.size > 50 * 1024 * 1024) {
          toast.error(`Arquivo ${uploadedFile.name} é muito grande. Máximo: 50MB`);
          continue;
        }

        // Validate file type
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "image/jpeg",
          "image/png",
        ];

        if (!allowedTypes.includes(uploadedFile.type)) {
          toast.error(`Tipo de arquivo não suportado: ${uploadedFile.name}`);
          continue;
        }

        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });

        // Add document
        const newDoc: Document = {
          id: crypto.randomUUID(),
          nome: uploadedFile.name,
          tipo: uploadedFile.type,
          tamanho: uploadedFile.size,
          data: new Date().toISOString(),
          conteudo: base64,
        };

        setDocumentos((docs) => [...(docs || []), newDoc]);
        toast.success(`${uploadedFile.name} enviado com sucesso!`);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDelete = (docId: string) => {
    setDocumentos((docs) => (docs || []).filter((d) => d.id !== docId));
    setDeleteId(null);
    toast.success("Documento removido");
  };

  const handleDownload = (doc: Document) => {
    try {
      const link = document.createElement("a");
      link.href = doc.conteudo;
      link.download = doc.nome;
      link.click();
      toast.success("Download iniciado");
    } catch (error) {
      console.error("Erro ao baixar:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc);
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.includes("pdf")) return <FileText size={24} className="text-red-500" />;
    if (tipo.includes("word") || tipo.includes("document"))
      return <FileText size={24} className="text-blue-500" />;
    return <FileText size={24} className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          onChange={handleUpload}
          disabled={uploading}
          multiple
          className="flex-1"
        />
        <Button disabled={uploading} variant="outline" size="icon" aria-label="Enviar arquivos">
          <Upload size={20} />
        </Button>
      </div>

      {uploading && <div className="text-sm text-muted-foreground">Enviando arquivo(s)...</div>}

      <div className="text-xs text-muted-foreground">
        Tipos aceitos: PDF, DOC, DOCX, TXT, JPG, PNG (máx. 50MB por arquivo)
      </div>

      {documentos && documentos.length > 0 ? (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {documentos.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">{getFileIcon(doc.tipo)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{doc.nome}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(doc.tamanho)}
                        </Badge>
                        <span>{new Date(doc.data).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {doc.tipo.includes("pdf") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handlePreview(doc)}
                          aria-label="Visualizar documento"
                          title="Visualizar"
                        >
                          <Eye size={16} />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDownload(doc)}
                        aria-label="Baixar documento"
                        title="Baixar"
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(doc.id)}
                        aria-label="Excluir documento"
                        title="Excluir"
                        className="text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum documento anexado</p>
            <p className="text-xs mt-1">Selecione arquivos acima para fazer upload</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Preview Dialog */}
      <AlertDialog open={previewDoc !== null} onOpenChange={() => setPreviewDoc(null)}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh]">
          <AlertDialogHeader>
            <AlertDialogTitle>{previewDoc?.nome}</AlertDialogTitle>
          </AlertDialogHeader>
          {previewDoc && (
            <div className="overflow-auto max-h-[60vh]">
              <iframe
                src={previewDoc.conteudo}
                className="w-full h-[60vh] border-0"
                title={previewDoc.nome}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

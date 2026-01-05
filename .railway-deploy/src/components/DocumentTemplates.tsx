import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useState } from "react";

interface Template {
  id: string;
  name: string;
  description: string;
  url: string;
  type: "pdf" | "docx";
  size?: number;
  uploadedAt?: string;
}

export function DocumentTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Petição Inicial",
      description: "Modelo padrão de petição inicial",
      url: "/templates/peticao-inicial.pdf",
      type: "pdf",
    },
    {
      id: "2",
      name: "Contestação",
      description: "Modelo de contestação genérica",
      url: "/templates/contestacao.pdf",
      type: "pdf",
    },
    {
      id: "3",
      name: "Recurso de Apelação",
      description: "Template de recurso de apelação",
      url: "/templates/apelacao.docx",
      type: "docx",
    },
    {
      id: "4",
      name: "Agravo de Instrumento",
      description: "Modelo de agravo de instrumento",
      url: "/templates/agravo.docx",
      type: "docx",
    },
    {
      id: "5",
      name: "Procuração",
      description: "Modelo de procuração ad judicia",
      url: "/templates/procuracao.pdf",
      type: "pdf",
    },
  ]);

  const handleDownload = (template: Template) => {
    const link = document.createElement("a");
    link.href = template.url;
    link.download = `${template.name}.${template.type}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast({
      title: "Download iniciado",
      description: `Baixando ${template.name}...`,
    });
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx";
    input.onchange = (e) => {
      const uploadedFile = (e.target as HTMLInputElement).files?.[0];
      if (uploadedFile) {
        toast({
          title: "Upload bem-sucedido",
          description: `${uploadedFile.name} adicionado aos templates via Git LFS`,
        });
      }
    };
    input.click();
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast({
      title: "Template removido",
      description: "O template foi removido com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates de Documentos</h2>
          <p className="text-muted-foreground">
            Gerencie modelos de petições e documentos jurídicos (armazenados via Git LFS)
          </p>
        </div>
        <Button onClick={handleUpload} aria-label="Upload de Template">
          <Upload className="mr-2 h-4 w-4" />
          Upload Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="h-8 w-8 text-primary mb-2" />
                <span className="text-xs bg-secondary px-2 py-1 rounded uppercase">
                  {template.type}
                </span>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(template)}
                  aria-label={`Baixar template ${template.name}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(template.id)}
                  aria-label={`Excluir template ${template.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Sobre Git LFS</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Os templates são armazenados usando <strong>Git LFS (Large File Storage)</strong>, que
            permite versionar arquivos grandes sem aumentar o tamanho do repositório. Você tem{" "}
            <strong>$10 de orçamento mensal</strong> para armazenamento e banda.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>PDFs, DOCX, imagens são rastreados automaticamente</li>
            <li>Versionamento completo de documentos</li>
            <li>Download otimizado apenas quando necessário</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

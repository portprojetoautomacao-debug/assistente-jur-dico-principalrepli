import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useClientesManager } from "@/hooks/use-clientes-manager";
import { useKV } from "@/hooks/use-kv";
import type { Expediente } from "@/types";
import { Download, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * BatchAnalysis - Análise em lote de documentos jurídicos
 *
 * ✅ Versão V2 (Gemini 2.5 Pro + upload de arquivos grandes)
 * - Aceita texto colado
 * - Aceita upload de arquivos (PDF/TXT/DOCX etc) até 200MB cada
 * - Preparado para documentos longos (até ~1000 páginas, tratadas no backend)
 *
 * Endpoint esperado no backend:
 *   POST /api/ai/batch-expedientes
 *   - multipart/form-data
 *   - fields:
 *       text?: string       → texto opcional colado
 *       files?: File[]      → 0..N arquivos anexados
 *   - response JSON:
 *       { expedientes: Array<{ cnj, parties, deadline, type }>, error?: string }
 */

interface ExtractedData {
  cnj: string;
  parties: string;
  deadline: string;
  type: string;
}

export default function BatchAnalysis() {
  const [, setExpedientes] = useKV<Expediente[]>("expedientes", []);
  const [inputText, setInputText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook centralizado para cadastro de clientes
  const { createOrUpdateFromDjenIntimacao } = useClientesManager();

  const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    const validFiles: File[] = [];
    let rejected = 0;

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected++;
      } else {
        validFiles.push(file);
      }
    });

    if (rejected > 0) {
      toast.error(`Alguns arquivos foram rejeitados por excederem 200MB (${rejected} arquivo(s))`);
    }

    setSelectedFiles(validFiles);

    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} arquivo(s) selecionado(s) para análise em lote`);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && selectedFiles.length === 0) {
      toast.error("Cole os expedientes ou selecione arquivos para análise");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();

      if (inputText.trim()) {
        formData.append("text", inputText);
      }

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });
      }

      // Chama a API real do Gemini 2.5 Pro via backend
      const response = await fetch("/api/ai/batch-expedientes", {
        method: "POST",
        body: formData,
        // NÃO definir Content-Type manualmente aqui (browser cuida do boundary)
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const parsed = (await response.json()) as {
        expedientes?: ExtractedData[];
        error?: string;
      };

      if (parsed.error && (!parsed.expedientes || parsed.expedientes.length === 0)) {
        setError(parsed.error || "Nenhum expediente encontrado no conteúdo enviado");
        toast.warning("Nenhum expediente identificado");
        setExtractedData([]);
        return;
      }

      const expedientes: ExtractedData[] = parsed.expedientes || [];

      if (expedientes.length === 0) {
        setError("Nenhum expediente com dados estruturados foi encontrado");
        toast.warning("Nenhum expediente identificado");
        setExtractedData([]);
        return;
      }

      // Conteúdo-base salvo nos registros (apenas referência)
      const conteudoBase =
        inputText ||
        (selectedFiles.length > 0
          ? `Documentos anexados: ${selectedFiles.map((f) => f.name).join(", ")}`
          : "");

      const nowIso = new Date().toISOString();

      // Salva os expedientes extraídos na KV
      const newExpedientes: Expediente[] = expedientes.map((data) => {
        // Cadastra/atualiza cliente automaticamente a partir das partes
        // O campo 'parties' geralmente tem formato "Autor vs Réu" ou "Autor x Réu"
        if (data.parties) {
          // Usar split ao invés de regex para evitar ReDoS
          const parts = data.parties.split(/\s+(?:vs?\.?|x)\s+/i);
          if (parts.length >= 2) {
            const autor = parts[0].trim();
            // const reu = parts[1].trim() // Unused
            // Cadastra o autor como cliente
            if (autor && autor !== "Não identificado") {
              createOrUpdateFromDjenIntimacao({
                nomeCliente: autor,
                numeroProcesso: data.cnj,
              });
            }
          } else {
            // Se não conseguiu separar, cadastra o campo inteiro como nome
            createOrUpdateFromDjenIntimacao({
              nomeCliente: data.parties,
              numeroProcesso: data.cnj,
            });
          }
        }

        return {
          id: crypto.randomUUID(),
          processId: data.cnj || "CNJ não identificado",
          tipo: (() => {
            const t = data.type?.toLowerCase() || "";
            if (t.includes("intimação")) return "intimacao";
            if (t.includes("citação")) return "citacao";
            return "outro";
          })(),
          titulo: data.type || "Documento",
          type: data.type || "Documento",
          conteudo: conteudoBase,
          content: conteudoBase,
          dataRecebimento: nowIso,
          receivedAt: nowIso,
          prazoFatal: data.deadline || "Não identificado",
          deadline: data.deadline || "Não identificado",
          lido: false,
          arquivado: false,
          analyzed: true,
        };
      });

      setExpedientes((current) => [...(current || []), ...newExpedientes]);
      setExtractedData(expedientes);

      toast.success(`${expedientes.length} expediente(s) extraído(s) com IA Gemini 2.5 Pro`);
    } catch (err) {
      console.error("Erro na análise em lote:", err);
      setError("Erro ao analisar com IA. Verifique a conexão ou tente novamente.");
      toast.error("Erro na análise com IA");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (extractedData.length === 0) {
      toast.warning("Não há dados para exportar");
      return;
    }

    const csv = [
      ["CNJ", "Partes", "Prazo", "Tipo"].join(","),
      ...extractedData.map((d) =>
        [d.cnj, d.parties, d.deadline, d.type]
          .map((field) => `"${(field || "").replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expedientes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados com sucesso");
  };

  const totalFileSize = selectedFiles.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Análise de Documentos em Lote</h1>
        <p className="text-muted-foreground mt-1">
          Extraia informações estruturadas de múltiplos expedientes, inclusive de documentos grandes
          (até ~1000 páginas / 200MB por arquivo)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entrada: texto + upload de arquivos grandes */}
        <Card>
          <CardHeader>
            <CardTitle>Entrada de Expedientes</CardTitle>
            <CardDescription>
              Cole o texto dos expedientes ou envie arquivos (PDF, DOCX, TXT)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={
                "Cole aqui o conteúdo dos expedientes...\n\nExemplo:\nINTIMAÇÃO - Processo nº 0001234-56.2023.5.02.0001\nPartes: João Silva vs Empresa XYZ Ltda\nPrazo: 15 dias para apresentação de alegações finais..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[260px] document-content"
            />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Ou selecione documentos (até 200MB cada, ~1000 páginas por arquivo)
              </p>
              <Input type="file" multiple onChange={handleFileChange} className="cursor-pointer" />
              {selectedFiles.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedFiles.length} arquivo(s) selecionado(s) · {totalFileSize.toFixed(1)} MB
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/5 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={analyzing || (!inputText.trim() && selectedFiles.length === 0)}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {analyzing ? "Analisando com IA..." : "Analisar com Gemini 2.5 Pro"}
            </Button>
          </CardContent>
        </Card>

        {/* Saída: dados extraídos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dados Extraídos</CardTitle>
                <CardDescription>
                  Informações estruturadas dos expedientes identificados
                </CardDescription>
              </div>
              {extractedData.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {extractedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Aguardando análise</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cole os expedientes ou envie arquivos e clique em &quot;Analisar&quot;
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-[460px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CNJ</TableHead>
                      <TableHead>Partes</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.map((data) => (
                      <TableRow key={`${data.cnj}-${data.deadline}-${data.type}`}>
                        <TableCell className="font-mono text-xs">{data.cnj}</TableCell>
                        <TableCell className="text-sm">{data.parties}</TableCell>
                        <TableCell className="text-sm">{data.deadline}</TableCell>
                        <TableCell className="text-sm">{data.type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { geminiGenerateJSON } from "@/lib/gemini-client";
import { Copy, Download, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SummarizerResult {
  summary: string;
  keyPoints: string[];
  deadlines: string[];
  actions: string[];
}

export default function AIDocumentSummarizer() {
  const [documentText, setDocumentText] = useState("");
  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSummarize = async () => {
    if (!documentText.trim()) {
      toast.error("Por favor, insira o texto do documento");
      return;
    }

    setIsProcessing(true);

    try {
      const prompt = `Você é um assistente jurídico especializado em resumir documentos legais.

Analise o seguinte texto e forneça:

1. Um resumo executivo conciso (2-3 parágrafos)
2. Uma lista de 5-7 pontos-chave mais importantes
3. Identificação de prazos mencionados
4. Ações recomendadas

Documento:
${documentText}

Responda EXCLUSIVAMENTE com um JSON VÁLIDO (sem comentários, sem texto antes ou depois), no seguinte formato:

{
  "summary": "resumo executivo aqui",
  "keyPoints": ["ponto 1", "ponto 2"],
  "deadlines": ["prazo 1", "prazo 2"],
  "actions": ["ação 1", "ação 2"]
}`;

      const result = await geminiGenerateJSON<SummarizerResult>(prompt);

      const safeSummary = result.summary ?? "";
      const safeKeyPoints = Array.isArray(result.keyPoints) ? result.keyPoints : [];
      const safeDeadlines = Array.isArray(result.deadlines) ? result.deadlines : [];
      const safeActions = Array.isArray(result.actions) ? result.actions : [];

      setSummary(safeSummary);
      setKeyPoints([
        ...safeKeyPoints,
        ...(safeDeadlines.length > 0 ? ["--- PRAZOS ---", ...safeDeadlines] : []),
        ...(safeActions.length > 0 ? ["--- AÇÕES RECOMENDADAS ---", ...safeActions] : []),
      ]);

      toast.success("Documento resumido com sucesso!");
    } catch (error) {
      console.error("Erro ao resumir documento:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao resumir documento");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) {
      toast.info("Nenhum resumo para copiar ainda");
      return;
    }

    const keyPointsText = keyPoints.join("\n");
    const fullText = `RESUMO:\n${summary}\n\nPONTOS-CHAVE:\n${keyPointsText}`;
    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        toast.success("Resumo copiado para área de transferência");
      })
      .catch(() => {
        toast.error("Não foi possível copiar para a área de transferência");
      });
  };

  const handleDownload = () => {
    if (!summary) {
      toast.info("Nenhum resumo para baixar ainda");
      return;
    }

    const separator = "=".repeat(50);
    const formattedPoints = keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n");
    const timestamp = new Date().toLocaleString("pt-BR");

    const fullText = `RESUMO DO DOCUMENTO
${separator}

${summary}

PONTOS-CHAVE:
${formattedPoints}

Gerado em: ${timestamp}`;

    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumo-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Resumo baixado com sucesso");
  };

  const approxTokens = Math.ceil(documentText.length / 4);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 gradient-text">
          <FileText size={32} className="text-primary neon-glow" />
          Resumidor de Documentos IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Transforme documentos extensos em resumos executivos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle>Documento Original</CardTitle>
            <CardDescription>Cole o texto do documento para análise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole aqui o texto da petição, sentença, contrato ou qualquer documento jurídico..."
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {documentText.length} caracteres · {approxTokens} tokens aprox.
              </p>
              <Button
                onClick={handleSummarize}
                disabled={isProcessing || !documentText.trim()}
                className="button-gradient"
              >
                <Sparkles size={20} className={isProcessing ? "animate-spin" : ""} />
                {isProcessing ? "Analisando..." : "Resumir com IA"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic card-glow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resumo Executivo</span>
              {summary && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopySummary}>
                    <Copy size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download size={16} />
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>Análise gerada por IA</CardDescription>
          </CardHeader>
          <CardContent>
            {summary ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-6 pr-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline">Resumo</Badge>
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{summary}</p>
                  </div>

                  {keyPoints.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Badge variant="outline">Pontos-Chave</Badge>
                      </h3>
                      <ul className="space-y-2">
                        {keyPoints.map((point, index) => {
                          const uniqueKey = `keypoint-${index}-${point
                            .slice(0, 20)
                            .replaceAll(/\W/g, "")}`;
                          return (
                            <li key={uniqueKey} className="text-sm flex gap-2">
                              {point.startsWith("---") ? (
                                <span className="font-bold text-primary mt-2">{point}</span>
                              ) : (
                                <>
                                  <span className="text-primary shrink-0">•</span>
                                  <span>{point}</span>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles size={48} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  O resumo aparecerá aqui após processar o documento
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle>Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Funciona com petições, sentenças, contratos e documentos jurídicos</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Identifica automaticamente prazos e ações necessárias</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Copie ou baixe o resumo para usar em outros documentos</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

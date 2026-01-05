import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  consultarProcessoDatajud,
  getTribunaisDisponiveis,
  isApiKeyConfigured,
  validarNumeroCNJ,
  type DatajudProcesso,
} from "@/lib/datajud-api";
import { geminiGenerateText } from "@/lib/gemini-client";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Copy,
  FileText,
  Gavel,
  Search,
  Sparkles,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const TRIBUNAIS = getTribunaisDisponiveis().filter((t) =>
  ["tjsp", "tjrj", "tjmg", "trf1", "trf2", "trf3", "trf4", "tst"].includes(t.value)
);

export default function DatajudChecklist() {
  const [cnjNumber, setCnjNumber] = useState("");
  const [tribunal, setTribunal] = useState("tjsp");
  const [isLoading, setIsLoading] = useState(false);
  const [processoData, setProcessoData] = useState<DatajudProcesso | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const apiKeyConfigured = isApiKeyConfigured();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    if (!cnjNumber.trim()) {
      setError("Por favor, digite um número de processo CNJ válido.");
      toast.error("Digite um número de processo CNJ válido");
      return;
    }

    if (!validarNumeroCNJ(cnjNumber)) {
      setError("Formato de número CNJ inválido. Use: NNNNNNN-DD.AAAA.J.TR.OOOO");
      toast.error("Formato de número CNJ inválido");
      return;
    }

    if (!apiKeyConfigured) {
      setError(
        "API Key do DataJud não configurada. Configure VITE_DATAJUD_API_KEY no arquivo .env"
      );
      toast.error("Configure a API Key do DataJud");
      return;
    }

    setError(null);
    setAnalysis(null);
    setProcessoData(null);
    setIsLoading(true);

    try {
      const processo = await consultarProcessoDatajud({
        numeroProcesso: cnjNumber,
        tribunal: tribunal,
      });

      setProcessoData(processo);
      toast.success("Processo encontrado com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar processo.";
      setError(message);
      toast.error(message);
      console.error("Erro ao consultar DataJud:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!processoData) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const recentMovements = processoData.movimentos
        .slice(0, 15)
        .map((m) => `${m.nome} - ${new Date(m.dataHora).toLocaleDateString("pt-BR")}`)
        .join("\n");

      const promptText = `Você é um assistente jurídico especializado em análise de processos. Analise os dados do processo abaixo e forneça:

Número do Processo: ${processoData.numeroProcesso}
Tribunal: ${processoData.tribunal}
Classe: ${processoData.classe?.nome || "Não especificada"}
Assuntos: ${processoData.assuntos?.map((a) => a.nome).join(", ") || "Não especificados"}
Últimos andamentos:
${recentMovements}

Forneça uma análise concisa contendo:
1. Resumo do estado atual do processo
2. Fase processual em que se encontra
3. Próximos passos esperados
4. Prazos relevantes a observar
5. Recomendações estratégicas

Mantenha a resposta objetiva e profissional.`;

      const analysisText = await geminiGenerateText(promptText);
      setAnalysis(analysisText);
      toast.success("Análise concluída!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao analisar processo.";
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Consulta DataJud</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulte os últimos andamentos processuais via DataJud
        </p>
      </div>

      <ScrollArea className="flex-1 px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cnj">Número do Processo (CNJ)</Label>
                  <Input
                    id="cnj"
                    placeholder="0000001-00.2024.8.26.0100"
                    value={cnjNumber}
                    onChange={(e) => setCnjNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tribunal">Tribunal</Label>
                  <Select value={tribunal} onValueChange={setTribunal} disabled={isLoading}>
                    <SelectTrigger id="tribunal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIBUNAIS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Selecione o tribunal de origem</p>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Buscar Processo
                  </>
                )}
              </Button>
            </form>
          </Card>

          {!apiKeyConfigured && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                API Key do DataJud não configurada. Configure VITE_DATAJUD_API_KEY no arquivo .env
                para usar este recurso.
                <br />
                <a
                  href="https://www.cnj.jus.br/sistemas/datajud/api-publica/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-sm mt-1 inline-block"
                >
                  Obtenha sua API Key gratuita aqui
                </a>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {processoData && (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel className="w-6 h-6 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">
                        {processoData.classe?.nome || "Processo Judicial"}
                      </h2>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground mb-3">
                      {processoData.numeroProcesso}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {processoData.tribunal}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {processoData.orgaoJulgador && (
                    <div>
                      <p className="text-xs text-muted-foreground">Órgão Julgador</p>
                      <p className="text-sm font-medium text-foreground">
                        {processoData.orgaoJulgador.nome}
                      </p>
                    </div>
                  )}
                  {processoData.dataAjuizamento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Ajuizamento</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(processoData.dataAjuizamento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>

                {processoData.assuntos && processoData.assuntos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Assuntos</p>
                    <div className="flex flex-wrap gap-2">
                      {processoData.assuntos.map((assunto) => (
                        <Badge key={assunto.codigo} variant="secondary">
                          {assunto.nome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="w-full border-accent text-accent hover:bg-accent/10"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Analisando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analisar Andamentos com IA
                    </>
                  )}
                </Button>
              </Card>

              {analysisError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}

              {analysis && (
                <Card className="p-6 bg-linear-to-br from-accent/5 to-primary/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-accent" />
                    <h3 className="text-lg font-bold text-foreground">Análise da IA</h3>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans bg-background/50 p-4 rounded-lg">
                      {analysis}
                    </pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(analysis)}
                    className="mt-3"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Análise
                  </Button>
                </Card>
              )}

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Últimos Andamentos</h3>
                  </div>
                  <Badge variant="outline">{processoData.movimentos.length} movimento(s)</Badge>
                </div>

                <div className="space-y-3">
                  {processoData.movimentos
                    .slice()
                    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
                    .slice(0, 10)
                    .map((movimento, index) => (
                      <div
                        key={`${movimento.codigo}-${movimento.dataHora}-${index}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{movimento.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {new Date(movimento.dataHora).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {processoData.movimentos.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Mostrando os 10 andamentos mais recentes de {processoData.movimentos.length}{" "}
                    total
                  </p>
                )}
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

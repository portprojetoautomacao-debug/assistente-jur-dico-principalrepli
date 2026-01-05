/**
 * Advanced NLP Processing Dashboard
 *
 * Interface for advanced NLP operations inspired by Databricks Spark NLP
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  nlpPipeline,
  type DocumentClassification,
  type ExtractedInformation,
  type NamedEntity,
  type SentimentAnalysis,
} from "@/lib/nlp-pipeline";
import {
  BarChart3,
  Brain,
  CheckCircle,
  Copy,
  Download,
  FileText,
  Search,
  Tag,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdvancedNLPDashboard() {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Results state
  const [entities, setEntities] = useState<NamedEntity[]>([]);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [classification, setClassification] = useState<DocumentClassification | null>(null);
  const [extraction, setExtraction] = useState<ExtractedInformation | null>(null);

  const hasInput = () => {
    if (!inputText.trim()) {
      toast.error("Digite um texto para análise");
      return false;
    }
    return true;
  };

  const runWithProcessing = async <T,>(
    fn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    successMsg?: string,
    errorMsg?: string
  ) => {
    setIsProcessing(true);
    try {
      const result = await fn();
      onSuccess?.(result);
      if (successMsg) toast.success(successMsg);
    } catch (error) {
      console.error(error);
      toast.error(errorMsg || "Erro ao processar operação");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractEntities = async () => {
    if (!hasInput()) return;
    await runWithProcessing(
      () => nlpPipeline.extractEntities(inputText),
      (result) => {
        setEntities(result);
      },
      "Entidades extraídas",
      "Erro ao extrair entidades"
    );
  };

  const handleAnalyzeSentiment = async () => {
    if (!hasInput()) return;
    await runWithProcessing(
      () => nlpPipeline.analyzeSentiment(inputText),
      (result) => setSentiment(result),
      "Análise de sentimento concluída",
      "Erro ao analisar sentimento"
    );
  };

  const handleClassifyDocument = async () => {
    if (!hasInput()) return;
    await runWithProcessing(
      () => nlpPipeline.classifyDocument(inputText),
      (result) => setClassification(result),
      "Documento classificado",
      "Erro ao classificar documento"
    );
  };

  const handleExtractInformation = async () => {
    if (!hasInput()) return;
    await runWithProcessing(
      () => nlpPipeline.extractInformation(inputText),
      (result) => setExtraction(result),
      "Informações extraídas",
      "Erro ao extrair informações"
    );
  };

  const handleProcessAll = async () => {
    if (!hasInput()) return;
    await runWithProcessing(
      async () => {
        const [entitiesResult, sentimentResult, classificationResult, extractionResult] =
          await Promise.all([
            nlpPipeline.extractEntities(inputText),
            nlpPipeline.analyzeSentiment(inputText),
            nlpPipeline.classifyDocument(inputText),
            nlpPipeline.extractInformation(inputText),
          ]);
        setEntities(entitiesResult);
        setSentiment(sentimentResult);
        setClassification(classificationResult);
        setExtraction(extractionResult);
        return true as const;
      },
      undefined,
      "Análise completa concluída",
      "Erro ao processar análise completa"
    );
  };

  const copyToClipboard = (text: string) => {
    try {
      if (!navigator?.clipboard) {
        toast.error("Copiar para a área de transferência não é suportado neste ambiente");
        return;
      }
      void navigator.clipboard.writeText(text);
      toast.success("Copiado para área de transferência");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível copiar o texto");
    }
  };

  const downloadAsJSON = (
    data: NamedEntity[] | SentimentAnalysis | DocumentClassification | ExtractedInformation | null,
    filename: string
  ) => {
    try {
      if (globalThis.window === undefined || globalThis.document === undefined) {
        toast.error("Download não é suportado neste ambiente");
        return;
      }

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Arquivo baixado");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar arquivo para download");
    }
  };

  const getEntityColor = (type: string) => {
    const colors: Record<string, string> = {
      PERSON: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      ORGANIZATION: "bg-green-500/20 text-green-400 border-green-500/50",
      LOCATION: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      DATE: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      MONETARY_VALUE: "bg-pink-500/20 text-pink-400 border-pink-500/50",
      LEGAL_REFERENCE: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      PROCESS_NUMBER: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      LAW_ARTICLE: "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return colors[type] || "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: "text-green-500",
      negative: "text-red-500",
      neutral: "text-gray-400",
    };
    return colors[sentiment] || "text-gray-400";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          <Brain size={32} className="text-primary neon-glow" />
          Processamento NLP Avançado
        </h1>
        <p className="text-muted-foreground mt-1">
          Pipeline de análise de linguagem natural para documentos jurídicos
        </p>
      </div>

      {/* Input Section */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Texto para Análise
          </CardTitle>
          <CardDescription>
            Cole ou digite o texto do documento para processamento NLP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Cole aqui o texto do documento jurídico para análise..."
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleProcessAll}
              disabled={isProcessing || !inputText.trim()}
              className="gradient-button"
            >
              <Zap size={20} />
              {isProcessing ? "Processando..." : "Análise Completa"}
            </Button>
            <Button
              onClick={handleExtractEntities}
              disabled={isProcessing || !inputText.trim()}
              variant="outline"
            >
              <Tag size={20} />
              Extrair Entidades
            </Button>
            <Button
              onClick={handleAnalyzeSentiment}
              disabled={isProcessing || !inputText.trim()}
              variant="outline"
            >
              <BarChart3 size={20} />
              Analisar Sentimento
            </Button>
            <Button
              onClick={handleClassifyDocument}
              disabled={isProcessing || !inputText.trim()}
              variant="outline"
            >
              <Search size={20} />
              Classificar
            </Button>
            <Button
              onClick={handleExtractInformation}
              disabled={isProcessing || !inputText.trim()}
              variant="outline"
            >
              <Brain size={20} />
              Extrair Info
            </Button>
          </div>
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap size={16} className="animate-pulse" />
                Processando com IA...
              </div>
              <Progress className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Tabs */}
      <Tabs defaultValue="entities" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="entities">
            Entidades {entities.length > 0 && `(${entities.length})`}
          </TabsTrigger>
          <TabsTrigger value="sentiment">Sentimento {sentiment && "✓"}</TabsTrigger>
          <TabsTrigger value="classification">Classificação {classification && "✓"}</TabsTrigger>
          <TabsTrigger value="extraction">Extração {extraction && "✓"}</TabsTrigger>
        </TabsList>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4">
          {entities.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Tag size={20} />
                      Entidades Nomeadas ({entities.length})
                    </CardTitle>
                    <CardDescription>
                      Pessoas, organizações, localizações e outras entidades identificadas
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsJSON(entities, "entities.json")}
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {entities.map((entity, index) => (
                      <div
                        key={`${entity.type}-${entity.text}-${index}`}
                        className="p-3 rounded-lg border border-border hover:bg-card/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{entity.text}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={getEntityColor(entity.type)}>
                              {entity.type.replaceAll("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {(entity.confidence * 100).toFixed(0)}% confiança
                            </span>
                          </div>
                        </div>
                        <Progress value={entity.confidence * 100} className="h-1" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Tag size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma entidade extraída ainda</p>
                <p className="text-sm mt-2">Execute a análise para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-4">
          {sentiment ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 size={20} />
                      Análise de Sentimento
                    </CardTitle>
                    <CardDescription>Sentimento geral e análise por aspectos</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsJSON(sentiment, "sentiment.json")}
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Sentiment */}
                <div className="text-center p-6 rounded-lg border border-border bg-card/50">
                  <div className="text-sm text-muted-foreground mb-2">Sentimento Geral</div>
                  <div
                    className={`text-4xl font-bold capitalize mb-2 ${getSentimentColor(
                      sentiment.sentiment
                    )}`}
                  >
                    {sentiment.sentiment === "positive" && "😊 Positivo"}
                    {sentiment.sentiment === "negative" && "😟 Negativo"}
                    {sentiment.sentiment === "neutral" && "😐 Neutro"}
                  </div>
                  <div className="text-2xl font-bold gradient-text mb-4">
                    Score: {sentiment.score.toFixed(2)}
                  </div>
                  <Progress value={sentiment.confidence * 100} className="mb-2" />
                  <div className="text-xs text-muted-foreground">
                    {(sentiment.confidence * 100).toFixed(1)}% de confiança
                  </div>
                </div>

                {/* Aspects */}
                {sentiment.aspects && sentiment.aspects.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Análise por Aspectos</h4>
                    <div className="space-y-3">
                      {sentiment.aspects.map((aspect, index) => (
                        <div
                          key={`${aspect.aspect}-${index}`}
                          className="p-3 rounded-lg border border-border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{aspect.aspect}</span>
                            <Badge className={getSentimentColor(aspect.sentiment)}>
                              {aspect.sentiment}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={(aspect.score + 1) * 50} className="flex-1" />
                            <span className="text-sm text-muted-foreground">
                              {aspect.score.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma análise de sentimento ainda</p>
                <p className="text-sm mt-2">Execute a análise para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Classification Tab */}
        <TabsContent value="classification" className="space-y-4">
          {classification ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Search size={20} />
                      Classificação do Documento
                    </CardTitle>
                    <CardDescription>Categoria, subcategoria e tags identificadas</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsJSON(classification, "classification.json")}
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 rounded-lg border border-border bg-card/50">
                  <div className="text-sm text-muted-foreground mb-2">Categoria Principal</div>
                  <div className="text-3xl font-bold gradient-text mb-2">
                    {classification.category}
                  </div>
                  {classification.subcategory && (
                    <div className="text-xl text-muted-foreground mb-4">
                      {classification.subcategory}
                    </div>
                  )}
                  <Progress value={classification.confidence * 100} className="mb-2" />
                  <div className="text-xs text-muted-foreground">
                    {(classification.confidence * 100).toFixed(1)}% de confiança
                  </div>
                </div>

                {classification.tags && classification.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {classification.tags.map((tag, index) => (
                        <Badge key={`${tag}-${index}`} variant="secondary" className="text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma classificação ainda</p>
                <p className="text-sm mt-2">Execute a análise para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Extraction Tab */}
        <TabsContent value="extraction" className="space-y-4">
          {extraction ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain size={20} />
                      Informações Extraídas
                    </CardTitle>
                    <CardDescription>
                      Resumo, pontos-chave e informações estruturadas
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsJSON(extraction, "extraction.json")}
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Resumo</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(extraction.summary ?? "")}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card/50 whitespace-pre-wrap">
                    {extraction.summary}
                  </div>
                </div>

                {/* Key Points */}
                {extraction.keyPoints && extraction.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Pontos-Chave</h4>
                    <div className="space-y-2">
                      {extraction.keyPoints.map((point, index) => (
                        <div
                          key={`${String(point).slice(0, 20)}-${index}`}
                          className="flex items-start gap-2 p-3 rounded-lg border border-border"
                        >
                          <CheckCircle size={20} className="text-primary shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extraction.dates && extraction.dates.length > 0 && (
                    <div className="p-4 rounded-lg border border-border">
                      <h5 className="font-semibold mb-2">Datas</h5>
                      <div className="space-y-1">
                        {extraction.dates.map((date) => (
                          <div key={date} className="text-sm text-muted-foreground">
                            • {date}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {extraction.monetaryValues && extraction.monetaryValues.length > 0 && (
                    <div className="p-4 rounded-lg border border-border">
                      <h5 className="font-semibold mb-2">Valores Monetários</h5>
                      <div className="space-y-1">
                        {extraction.monetaryValues.map((value) => (
                          <div key={value} className="text-sm text-muted-foreground">
                            • {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {extraction.legalReferences && extraction.legalReferences.length > 0 && (
                    <div className="p-4 rounded-lg border border-border">
                      <h5 className="font-semibold mb-2">Referências Legais</h5>
                      <div className="space-y-1">
                        {extraction.legalReferences.map((ref) => (
                          <div key={ref} className="text-sm text-muted-foreground">
                            • {ref}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {extraction.parties && extraction.parties.length > 0 && (
                    <div className="p-4 rounded-lg border border-border">
                      <h5 className="font-semibold mb-2">Partes Envolvidas</h5>
                      <div className="space-y-1">
                        {extraction.parties.map((party) => (
                          <div key={party} className="text-sm text-muted-foreground">
                            • {party}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Brain size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma informação extraída ainda</p>
                <p className="text-sm mt-2">Execute a análise para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

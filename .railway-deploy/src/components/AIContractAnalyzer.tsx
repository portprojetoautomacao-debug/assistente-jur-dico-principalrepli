import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { geminiGenerateJSON } from "@/lib/gemini-client";
import { AlertCircle, CheckCircle, FileText, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Interface para resultado da análise de risco de contratos
 */
interface RiskAnalysis {
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  risks: string[];
  protections: string[];
  recommendations: string[];
  keyTerms: string[];
  missingClauses: string[];
}

export default function AIContractAnalyzer() {
  const [contractText, setContractText] = useState("");
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      toast.error("Por favor, insira o texto do contrato");
      return;
    }

    setIsAnalyzing(true);

    try {
      const prompt = `Você é um advogado especializado em análise de contratos. Analise o seguinte contrato e identifique:

1. Nível de risco geral (low, medium, high)
2. Score de risco (0-100)
3. Principais riscos identificados
4. Proteções já existentes no contrato
5. Recomendações para mitigar riscos
6. Termos-chave importantes
7. Cláusulas ausentes que deveriam estar presentes

Contrato:
${contractText}

Retorne EXATAMENTE um JSON válido (sem comentários, sem texto antes ou depois), seguindo este modelo:

{
  "riskLevel": "low",
  "riskScore": 42,
  "risks": ["risco 1", "risco 2"],
  "protections": ["proteção 1", "proteção 2"],
  "recommendations": ["recomendação 1", "recomendação 2"],
  "keyTerms": ["termo 1", "termo 2"],
  "missingClauses": ["cláusula ausente 1", "cláusula ausente 2"]
}`;

      const result = await geminiGenerateJSON<RiskAnalysis>(prompt);
      setAnalysis(result);
      toast.success("Contrato analisado com sucesso!");
    } catch (error) {
      console.error("Erro ao analisar contrato:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao analisar contrato");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "low":
        return "default";
      case "medium":
        return "secondary";
      case "high":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 gradient-text">
          <ShieldAlert size={32} className="text-primary neon-glow" />
          Analisador de Contratos IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Identifique riscos e oportunidades em contratos automaticamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle>Texto do Contrato</CardTitle>
            <CardDescription>Cole o contrato para análise de riscos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole aqui o texto do contrato, termo de compromisso, acordo ou qualquer documento contratual..."
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{contractText.length} caracteres</p>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !contractText.trim()}
                className="button-gradient"
              >
                <Sparkles size={20} className={isAnalyzing ? "animate-spin" : ""} />
                {isAnalyzing ? "Analisando..." : "Analisar Riscos"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {analysis ? (
            <>
              <Card className="glassmorphic card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Análise de Risco</span>
                    <Badge variant={getRiskBadgeVariant(analysis.riskLevel)}>
                      {analysis.riskLevel === "low" && "Baixo Risco"}
                      {analysis.riskLevel === "medium" && "Médio Risco"}
                      {analysis.riskLevel === "high" && "Alto Risco"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Score de Risco</span>
                      <span className={`text-2xl font-bold ${getRiskColor(analysis.riskLevel)}`}>
                        {analysis.riskScore}/100
                      </span>
                    </div>
                    <Progress value={analysis.riskScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <AlertCircle size={24} className="mx-auto mb-1 text-destructive" />
                      <p className="text-2xl font-bold text-destructive">{analysis.risks.length}</p>
                      <p className="text-xs text-muted-foreground">Riscos</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <CheckCircle size={24} className="mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold text-primary">
                        {analysis.protections.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Proteções</p>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-lg">
                      <FileText size={24} className="mx-auto mb-1 text-secondary" />
                      <p className="text-2xl font-bold text-secondary">
                        {analysis.keyTerms.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Termos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphic">
                <CardHeader>
                  <CardTitle>Detalhes da Análise</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-6 pr-4">
                      {analysis.risks.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                            <AlertCircle size={20} />
                            Riscos Identificados
                          </h3>
                          <ul className="space-y-2">
                            {analysis.risks.map((risk) => (
                              <li
                                key={risk}
                                className="text-sm flex gap-2 p-2 bg-destructive/5 rounded"
                              >
                                <span className="text-destructive shrink-0">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.protections.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                            <CheckCircle size={20} />
                            Proteções Existentes
                          </h3>
                          <ul className="space-y-2">
                            {analysis.protections.map((protection) => (
                              <li
                                key={protection}
                                className="text-sm flex gap-2 p-2 bg-primary/5 rounded"
                              >
                                <span className="text-primary shrink-0">•</span>
                                <span>{protection}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.recommendations.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Sparkles size={20} />
                            Recomendações
                          </h3>
                          <ul className="space-y-2">
                            {analysis.recommendations.map((rec) => (
                              <li key={rec} className="text-sm flex gap-2 p-2 bg-accent/5 rounded">
                                <span className="text-accent shrink-0">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.missingClauses.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-500">
                            <AlertCircle size={20} />
                            Cláusulas Ausentes
                          </h3>
                          <ul className="space-y-2">
                            {analysis.missingClauses.map((clause) => (
                              <li
                                key={clause}
                                className="text-sm flex gap-2 p-2 bg-yellow-500/5 rounded"
                              >
                                <span className="text-yellow-500 shrink-0">•</span>
                                <span>{clause}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.keyTerms.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Termos-Chave</h3>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keyTerms.map((term) => (
                              <Badge key={term} variant="outline">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glassmorphic">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <ShieldAlert size={64} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  A análise de riscos aparecerá aqui após processar o contrato
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

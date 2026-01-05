import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { geminiGenerateJSON } from "@/lib/gemini-client";
import { BookOpen, FileText, Scale, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Precedent {
  id: string;
  tribunal: string;
  numero: string;
  data: string;
  relator: string;
  ementa: string;
  tema: string;
  relevancia: string;
}

interface LegalArgument {
  titulo: string;
  fundamentacao: string;
  precedentes: string[];
  doutrina: string[];
}

interface ResearchResult {
  precedents: Precedent[];
  legalArguments: LegalArgument[];
  keywords: string[];
  relatedThemes: string[];
}

export default function AILegalResearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  const handleResearch = async () => {
    if (!query.trim()) {
      toast.error("Por favor, descreva o tema da pesquisa");
      return;
    }

    setIsResearching(true);

    try {
      const prompt = `Você é um pesquisador jurídico especializado no ordenamento brasileiro. Faça uma pesquisa completa sobre o seguinte tema jurídico:

Tema: ${query}

Forneça:

1. Lista de precedentes relevantes (mínimo 5, com tribunal, número, data, relator, ementa resumida, tema e explicação de relevância)
2. Argumentos jurídicos estruturados (com fundamentação, precedentes citados e doutrina)
3. Palavras-chave relacionadas
4. Temas relacionados para pesquisas futuras

IMPORTANTE:
- Use apenas exemplos plausíveis; se inventar números de processos ou dados, mantenha consistência interna.
- Seja objetivo, mas tecnicamente fundamentado.

Responda EXCLUSIVAMENTE com um JSON VÁLIDO (sem comentários, sem texto antes ou depois) exatamente neste formato:

{
  "precedents": [
    {
      "id": "único id",
      "tribunal": "nome do tribunal",
      "numero": "número do processo/recurso",
      "data": "data da decisão",
      "relator": "nome do relator",
      "ementa": "resumo da ementa",
      "tema": "tema principal",
      "relevancia": "por que é relevante para o caso"
    }
  ],
  "legalArguments": [
    {
      "titulo": "título do argumento",
      "fundamentacao": "texto detalhado da fundamentação",
      "precedentes": ["precedente 1", "precedente 2"],
      "doutrina": ["autor 1 - obra", "autor 2 - obra"]
    }
  ],
  "keywords": ["palavra 1", "palavra 2"],
  "relatedThemes": ["tema relacionado 1", "tema relacionado 2"]
}`;

      const raw = await geminiGenerateJSON<ResearchResult>(prompt);

      // Hardening contra respostas parcialmente fora do esquema
      const safeResult: ResearchResult = {
        precedents: Array.isArray(raw.precedents) ? raw.precedents : [],
        legalArguments: Array.isArray(raw.legalArguments) ? raw.legalArguments : [],
        keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
        relatedThemes: Array.isArray(raw.relatedThemes) ? raw.relatedThemes : [],
      };

      setResult(safeResult);
      toast.success("Pesquisa concluída!");
    } catch (error) {
      console.error("Erro na pesquisa:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao realizar pesquisa");
    } finally {
      setIsResearching(false);
    }
  };

  const handleQuickSearch = (theme: string) => {
    setQuery(theme);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 gradient-text">
          <BookOpen size={32} className="text-primary neon-glow" />
          Pesquisa Jurídica IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Encontre precedentes, argumentos e fundamentação legal instantaneamente
        </p>
      </div>

      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle>Nova Pesquisa</CardTitle>
          <CardDescription>
            Descreva o tema ou questão jurídica que deseja pesquisar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                placeholder="Ex: Responsabilidade civil por dano moral em relações de consumo"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleResearch}
              disabled={isResearching || !query.trim()}
              className="button-gradient"
            >
              <Sparkles size={20} className={isResearching ? "animate-spin" : ""} />
              {isResearching ? "Pesquisando..." : "Pesquisar"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <p className="text-xs text-muted-foreground w-full">Pesquisas rápidas:</p>
            {[
              "Prescrição quinquenal trabalhista",
              "Dano moral em acidente de trânsito",
              "Execução fiscal - prescrição intercorrente",
              "Revisão de contrato - teoria da imprevisão",
              "Guarda compartilhada - interesse do menor",
            ].map((theme) => (
              <Badge
                key={theme}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleQuickSearch(theme)}
              >
                {theme}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Tabs defaultValue="precedents" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="precedents">
              <Scale size={16} className="mr-2" />
              Precedentes ({result.precedents.length})
            </TabsTrigger>
            <TabsTrigger value="arguments">
              <FileText size={16} className="mr-2" />
              Argumentos ({result.legalArguments.length})
            </TabsTrigger>
            <TabsTrigger value="keywords">Palavras-chave ({result.keywords.length})</TabsTrigger>
            <TabsTrigger value="related">Temas ({result.relatedThemes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="precedents" className="space-y-4">
            {result.precedents.map((prec) => (
              <Card key={prec.id} className="glassmorphic card-glow-hover">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {prec.tribunal} - {prec.numero}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {prec.data} · Rel. {prec.relator}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{prec.tema}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ementa</p>
                    <p className="text-sm leading-relaxed">{prec.ementa}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Relevância para o caso</p>
                    <p className="text-sm text-primary">{prec.relevancia}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {result.precedents.length === 0 && (
              <Card className="glassmorphic">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum precedente retornado pela IA.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="arguments" className="space-y-4">
            {result.legalArguments.map((arg) => (
              <Card key={arg.titulo} className="glassmorphic card-glow-hover">
                <CardHeader>
                  <CardTitle className="text-base">{arg.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Fundamentação</p>
                    <p className="text-sm leading-relaxed">{arg.fundamentacao}</p>
                  </div>

                  {arg.precedentes.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Precedentes citados</p>
                      <ul className="space-y-1">
                        {arg.precedentes.map((prec) => (
                          <li key={prec} className="text-sm flex gap-2">
                            <span className="text-primary shrink-0">•</span>
                            <span>{prec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {arg.doutrina.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Doutrina</p>
                      <ul className="space-y-1">
                        {arg.doutrina.map((doc) => (
                          <li key={doc} className="text-sm flex gap-2">
                            <span className="text-secondary shrink-0">•</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {result.legalArguments.length === 0 && (
              <Card className="glassmorphic">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum argumento retornado pela IA.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="keywords">
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle>Palavras-chave Relevantes</CardTitle>
                <CardDescription>Use essas palavras para refinar sua busca</CardDescription>
              </CardHeader>
              <CardContent>
                {result.keywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma palavra-chave retornada pela IA.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="related">
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle>Temas Relacionados</CardTitle>
                <CardDescription>Explore esses temas para aprofundar sua pesquisa</CardDescription>
              </CardHeader>
              <CardContent>
                {result.relatedThemes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum tema relacionado retornado pela IA.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.relatedThemes.map((theme) => (
                      <Button
                        key={theme}
                        variant="outline"
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => handleQuickSearch(theme)}
                      >
                        <Sparkles size={16} className="mr-2 shrink-0" />
                        <span className="text-left">{theme}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!result && !isResearching && (
        <Card className="glassmorphic">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen size={64} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Pronto para pesquisar</h3>
            <p className="text-muted-foreground max-w-md">
              Digite um tema jurídico acima ou clique em uma das pesquisas rápidas para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

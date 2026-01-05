import {
  CheckCircle,
  Copy,
  Database,
  Download,
  Info,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";
/**
 * Multi-Source Publications Component
 *
 * Interface unificada para buscar publicações jurídicas em múltiplas fontes:
 * - DJEN, DataJud, PJe, Diários Oficiais etc.
 *
 * Observações:
 * - Faz validação básica de critérios de busca
 * - Ordena resultados por data (mais recentes primeiro)
 * - Tipagem mais segura para estatísticas de busca
 * - Ícone de loading corrigido (RefreshCw em vez de Spinner)
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  getEnabledSources,
  searchPublications,
  type PublicationSearchParams,
  type PublicationSource,
  type UnifiedPublication,
} from "@/lib/multi-source-publications";
import { useState } from "react";
import { toast } from "sonner";

// Type aliases para evitar union overrides (S6571)
type SourceStatus = "success" | "error";

interface SourceStatsItem {
  source: string; // Aceita any string durante runtime
  status: SourceStatus;
  count: number;
  duration: number;
}

interface SearchStats {
  totalFound: number;
  sources: SourceStatsItem[];
  // Permite campos extra que o backend quiser adicionar (ex.: tempo total, paginação etc.)
  [key: string]: unknown;
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function MultiSourcePublications() {
  const [searchParams, setSearchParams] = useState<PublicationSearchParams>({
    startDate: getTodayISO(),
    endDate: getTodayISO(),
  });

  const [selectedSources, setSelectedSources] = useState<PublicationSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [publications, setPublications] = useState<UnifiedPublication[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);

  const enabledSources = getEnabledSources();

  const handleSearch = async () => {
    if (loading) return;

    // Validação de critérios mínimos
    const hasAnyFilter =
      !!searchParams.lawyerName ||
      !!searchParams.oabNumber ||
      !!searchParams.processNumber ||
      !!searchParams.partyName ||
      (searchParams.keywords && searchParams.keywords.length > 0);

    if (!hasAnyFilter) {
      toast.error(
        "Forneça pelo menos um critério de busca (advogado, OAB, processo, parte ou palavra-chave)."
      );
      return;
    }

    // Validação simples de intervalo de datas
    if (searchParams.startDate && searchParams.endDate) {
      const start = new Date(searchParams.startDate);
      const end = new Date(searchParams.endDate);
      if (start > end) {
        toast.error("Data inicial não pode ser maior que data final.");
        return;
      }
    }

    setLoading(true);

    try {
      const params: PublicationSearchParams = {
        ...searchParams,
        sources: selectedSources.length > 0 ? selectedSources : undefined,
      };

      const result = await searchPublications(params);

      // Garantimos que temos um array de publicações
      const pubs: UnifiedPublication[] = Array.isArray(result.publications)
        ? result.publications
        : [];

      // Ordenar por data (mais recente primeiro) se a data existir
      const sorted = [...pubs].sort((a, b) => {
        if (!a.publicationDate || !b.publicationDate) return 0;
        const da = new Date(a.publicationDate).getTime();
        const db = new Date(b.publicationDate).getTime();
        return db - da;
      });

      setPublications(sorted);

      // Extrai estatísticas de busca de forma segura
      const totalFoundValue = result.totalFound ?? sorted.length;
      const sourcesValue: SourceStatsItem[] = Array.isArray(result.sources)
        ? result.sources.map((s: unknown) => {
            if (typeof s === "object" && s !== null) {
              return s as SourceStatsItem;
            }
            return {
              source: String(s),
              status: "success" as SourceStatus,
              count: 0,
              duration: 0,
            };
          })
        : [];

      setSearchStats({
        totalFound: totalFoundValue,
        sources: sourcesValue,
      });

      toast.success(
        `${result.totalFound ?? sorted.length} publicações encontradas em ${
          Array.isArray(result.sources) ? result.sources.length : 0
        } fontes`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao buscar publicações";
      toast.error(message);
      console.error("Search error:", error);
      setSearchStats(null);
      setPublications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceToggle = (source: PublicationSource) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleCopyContent = (content: string) => {
    if (!navigator.clipboard) {
      toast.error("Clipboard não suportado neste navegador.");
      return;
    }

    navigator.clipboard
      .writeText(content)
      .then(() => toast.success("Conteúdo copiado!"))
      .catch((err) => {
        console.error("Erro ao copiar conteúdo:", err);
        toast.error("Não foi possível copiar o conteúdo.");
      });
  };

  const handleExportResults = () => {
    if (!publications.length) {
      toast.error("Não há resultados para exportar.");
      return;
    }

    const dataStr = JSON.stringify(publications, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `publicacoes_${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Resultados exportados!");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Publicações Multi-Fonte</h1>
        <p className="text-muted-foreground mt-1">
          Busca unificada em DJEN, DataJud, PJe, Diários Oficiais e outras fontes integradas.
        </p>
      </div>

      {/* Seleção de Fontes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Fontes de Dados Disponíveis
          </CardTitle>
          <CardDescription>
            Selecione as fontes que deseja consultar (ou deixe em branco para buscar em todas as
            fontes habilitadas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enabledSources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma fonte de dados está habilitada no momento. Verifique a configuração do módulo{" "}
              <code>multi-source-publications</code>.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enabledSources.map((source) => (
                <div key={source} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={source}
                    checked={selectedSources.includes(source)}
                    onCheckedChange={() => handleSourceToggle(source)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={source}
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      {source.toUpperCase()}
                      <Badge variant="secondary" className="text-xs">
                        Disponível
                      </Badge>
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fonte: <span className="uppercase">{source}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário de Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Critérios de Busca</CardTitle>
          <CardDescription>
            Forneça pelo menos um critério (advogado, OAB, processo, parte ou palavra-chave).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Advogado */}
            <div className="space-y-2">
              <Label htmlFor="lawyer-name">Nome do Advogado</Label>
              <Input
                id="lawyer-name"
                placeholder="Ex: João Silva"
                value={searchParams.lawyerName || ""}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    lawyerName: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oab-number">Número OAB</Label>
              <Input
                id="oab-number"
                placeholder="Ex: OAB/SP 123456"
                value={searchParams.oabNumber || ""}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    oabNumber: e.target.value,
                  }))
                }
              />
            </div>

            {/* Parte */}
            <div className="space-y-2">
              <Label htmlFor="party-name">Nome da Parte</Label>
              <Input
                id="party-name"
                placeholder="Ex: Maria Santos"
                value={searchParams.partyName || ""}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    partyName: e.target.value,
                  }))
                }
              />
            </div>

            {/* Processo */}
            <div className="space-y-2">
              <Label htmlFor="process-number">Número do Processo</Label>
              <Input
                id="process-number"
                placeholder="Ex: 0000000-00.0000.0.00.0000"
                value={searchParams.processNumber || ""}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    processNumber: e.target.value,
                  }))
                }
              />
            </div>

            {/* Palavras-chave */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
              <Input
                id="keywords"
                placeholder="Ex: intimação, sentença, recurso"
                value={searchParams.keywords?.join(", ") || ""}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    keywords: e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>

            {/* Intervalo de Datas */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={searchParams.startDate || ""}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={searchParams.endDate || ""}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Buscar Publicações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Estatísticas da Busca */}
      {searchStats && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas da Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{searchStats.totalFound}</div>
                <div className="text-sm text-muted-foreground">Publicações Encontradas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Array.isArray(searchStats.sources) ? searchStats.sources.length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Fontes Consultadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Array.isArray(searchStats.sources)
                    ? searchStats.sources.filter((s) => s.status === "success").length
                    : 0}
                </div>
                <div className="text-sm text-muted-foreground">Fontes com Sucesso</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Array.isArray(searchStats.sources)
                    ? searchStats.sources.filter((s) => s.status === "error").length
                    : 0}
                </div>
                <div className="text-sm text-muted-foreground">Fontes com Erro</div>
              </div>
            </div>

            {Array.isArray(searchStats.sources) && searchStats.sources.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="font-semibold">Detalhes por Fonte:</h4>
                  {searchStats.sources.map((source) => (
                    <div key={source.source} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {source.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <TriangleAlert className="w-4 h-4 text-red-500" />
                        )}
                        <span className="capitalize">
                          {String(source.source).replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{source.count} resultado(s)</span>
                        <span className="text-muted-foreground">{source.duration}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {publications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultados ({publications.length})</CardTitle>
                <CardDescription>
                  Publicações encontradas, ordenadas por data da mais recente para a mais antiga.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportResults}>
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {publications.map((pub, idx) => (
              <Card
                key={pub.id || `${pub.source}-${pub.processNumber || idx}`}
                className="border-l-4 border-l-primary"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pub.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {pub.source.replaceAll("_", " ")}
                        </Badge>
                        {pub.publicationType && (
                          <Badge variant="secondary">{pub.publicationType}</Badge>
                        )}
                        {pub.matchType && <Badge>{pub.matchType.replaceAll("_", " ")}</Badge>}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyContent(pub.content)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Data:</span>
                      <div className="font-medium">
                        {pub.publicationDate
                          ? new Date(pub.publicationDate).toLocaleDateString("pt-BR")
                          : "N/A"}
                      </div>
                    </div>
                    {pub.processNumber && (
                      <div>
                        <span className="text-muted-foreground">Processo:</span>
                        <div className="font-medium font-mono text-xs">{pub.processNumber}</div>
                      </div>
                    )}
                    {pub.tribunal && (
                      <div>
                        <span className="text-muted-foreground">Tribunal:</span>
                        <div className="font-medium">{pub.tribunal}</div>
                      </div>
                    )}
                    {pub.court && (
                      <div>
                        <span className="text-muted-foreground">Órgão:</span>
                        <div className="font-medium">{pub.court}</div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Conteúdo:</div>
                    <div className="text-sm bg-muted p-3 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {pub.content}
                    </div>
                  </div>

                  {pub.sourceUrl && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Fonte:{" "}
                        <a
                          href={pub.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {pub.sourceUrl}
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Nenhum resultado */}
      {!loading && searchStats && publications.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nenhuma publicação encontrada com os critérios fornecidos. Ajuste filtros (nome, OAB,
            processo, parte ou palavras-chave) ou amplie o período de datas.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

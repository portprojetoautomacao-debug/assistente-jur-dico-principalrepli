import DJENConsulta from "@/components/DJENConsulta";
import MultiSourcePublications from "@/components/MultiSourcePublications";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  consultarProcessoDatajud,
  extrairTribunalDoCNJ,
  isApiKeyConfigured,
  TRIBUNAIS_DATAJUD,
  validarNumeroCNJ,
  type DatajudProcesso,
} from "@/lib/datajud-api";
import { AlertTriangle, Database, Loader, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DatabaseQueries() {
  const [cnjQuery, setCnjQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [datajudResult, setDatajudResult] = useState<DatajudProcesso | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKeyConfigured = isApiKeyConfigured();

  const handleDatajudQuery = async () => {
    const raw = cnjQuery.trim();

    if (!raw) {
      toast.error("Digite um número CNJ válido");
      return;
    }

    const normalized = raw.replaceAll(/\s/g, "");

    if (!validarNumeroCNJ(normalized)) {
      toast.error("Formato de número CNJ inválido. Use: NNNNNNN-DD.AAAA.J.TR.OOOO");
      return;
    }

    if (!apiKeyConfigured) {
      const msg =
        "API Key do DataJud não configurada. Configure VITE_DATAJUD_API_KEY no arquivo .env";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);
    setDatajudResult(null);

    try {
      // Extrai o código do tribunal do número CNJ
      const codigoTribunal = extrairTribunalDoCNJ(normalized);
      if (!codigoTribunal) {
        throw new Error("Não foi possível identificar o tribunal do número CNJ");
      }

      // Determina o tribunal baseado no código
      let tribunalKey = "";
      for (const [key, info] of Object.entries(TRIBUNAIS_DATAJUD)) {
        if (info.codigo === codigoTribunal) {
          tribunalKey = key;
          break;
        }
      }

      if (!tribunalKey) {
        throw new Error(`Tribunal não suportado (código: ${codigoTribunal})`);
      }

      const resultado = await consultarProcessoDatajud({
        numeroProcesso: normalized,
        tribunal: tribunalKey,
      });

      setDatajudResult(resultado);
      toast.success("Processo encontrado no DataJud");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao consultar DataJud";
      setError(message);
      toast.error(message);
      console.error("Erro ao consultar DataJud:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateSafe = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Consultas a Bases de Dados</h1>
        <p className="text-muted-foreground mt-1">
          DataJud, DJEN e múltiplas fontes oficiais de publicações jurídicas
        </p>
      </div>

      <Tabs defaultValue="multi-source" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="multi-source">Multi-Fonte</TabsTrigger>
          <TabsTrigger value="datajud">DataJud</TabsTrigger>
          <TabsTrigger value="djen">DJEN</TabsTrigger>
        </TabsList>

        <TabsContent value="multi-source" className="space-y-4">
          <MultiSourcePublications />
        </TabsContent>

        <TabsContent value="datajud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Base Nacional de Dados do Poder Judiciário
              </CardTitle>
              <CardDescription>
                Consulte andamentos processuais oficiais pelo número CNJ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cnj-query">Número CNJ</Label>
                  <Input
                    id="cnj-query"
                    placeholder="0000000-00.0000.0.00.0000"
                    value={cnjQuery}
                    onChange={(e) => setCnjQuery(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDatajudQuery} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Consultando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Consultar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {!apiKeyConfigured && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    API Key do DataJud não configurada. Configure{" "}
                    <code className="mx-1 px-1 py-0.5 rounded bg-muted text-xs">
                      VITE_DATAJUD_API_KEY
                    </code>{" "}
                    no arquivo <code className="px-1 py-0.5 rounded bg-muted text-xs">.env</code>{" "}
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

              {datajudResult && (
                <div className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CNJ</p>
                      <p className="text-sm font-mono">{datajudResult.numeroProcesso}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tribunal</p>
                      <p className="text-sm">{datajudResult.tribunal}</p>
                    </div>
                    {datajudResult.classe && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Classe</p>
                        <p className="text-sm">{datajudResult.classe.nome}</p>
                      </div>
                    )}
                    {datajudResult.dataAjuizamento && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Distribuição</p>
                        <p className="text-sm">{formatDateSafe(datajudResult.dataAjuizamento)}</p>
                      </div>
                    )}
                    {datajudResult.assuntos && datajudResult.assuntos.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Assunto</p>
                        <p className="text-sm">
                          {datajudResult.assuntos.map((a) => a.nome).join(", ")}
                        </p>
                      </div>
                    )}
                    {datajudResult.orgaoJulgador && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Órgão Julgador</p>
                        <p className="text-sm">{datajudResult.orgaoJulgador.nome}</p>
                      </div>
                    )}
                  </div>

                  {datajudResult.movimentos && datajudResult.movimentos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Movimentações</h3>
                      <div className="space-y-2">
                        {datajudResult.movimentos.slice(0, 10).map((mov) => (
                          <div
                            key={`${mov.dataHora}-${mov.nome}`}
                            className="flex gap-3 p-3 bg-muted rounded-lg"
                          >
                            <div className="shrink-0 w-32">
                              <Badge variant="outline">{formatDateSafe(mov.dataHora)}</Badge>
                            </div>
                            <p className="text-sm flex-1">{mov.nome}</p>
                          </div>
                        ))}
                      </div>
                      {datajudResult.movimentos.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Mostrando os 10 movimentos mais recentes de{" "}
                          {datajudResult.movimentos.length} total
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="djen" className="space-y-4">
          <DJENConsulta />
        </TabsContent>
      </Tabs>
    </div>
  );
}

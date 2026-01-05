import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKV } from "@/hooks/use-kv";
import {
  consultarDJEN,
  getTribunaisDisponiveis,
  validarFormatoData,
  validarNumeroOAB,
  type DJENConfig,
  type DJENFilteredResult,
} from "@/lib/djen-api";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Loader2,
  Newspaper,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DJENSearchHistory {
  id: string;
  timestamp: string;
  nomeAdvogado?: string;
  numeroOAB?: string;
  tribunais: string[];
  totalResultados: number;
}

export default function DJENConsulta() {
  const [nomeAdvogado, setNomeAdvogado] = useState("");
  const [numeroOAB, setNumeroOAB] = useState("");
  const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split("T")[0]);
  const [tribunaisSelecionados, setTribunaisSelecionados] =
    useState<string[]>(getTribunaisDisponiveis());
  const [isLoading, setIsLoading] = useState(false);
  const [resultados, setResultados] = useState<DJENFilteredResult[]>([]);
  const [erros, setErros] = useState<Array<{ tribunal: string; erro: string }>>([]);
  const [totalConsultado, setTotalConsultado] = useState(0);
  const [_searchHistory, setSearchHistory] = useKV<DJENSearchHistory[]>("djen-search-history", []);

  const toggleTribunal = (tribunal: string) => {
    setTribunaisSelecionados((current) =>
      current.includes(tribunal) ? current.filter((t) => t !== tribunal) : [...current, tribunal]
    );
  };

  const toggleTodosTribunais = () => {
    if (tribunaisSelecionados.length === getTribunaisDisponiveis().length) {
      setTribunaisSelecionados([]);
    } else {
      setTribunaisSelecionados(getTribunaisDisponiveis());
    }
  };

  const validarFormulario = (): string | null => {
    if (!nomeAdvogado.trim() && !numeroOAB.trim()) {
      return "Informe pelo menos o nome do advogado ou número da OAB";
    }

    if (numeroOAB.trim() && !validarNumeroOAB(numeroOAB)) {
      return "Formato de OAB inválido. Use o formato: OAB/UF 12345";
    }

    if (!validarFormatoData(dataConsulta)) {
      return "Data inválida. Use o formato AAAA-MM-DD";
    }

    if (tribunaisSelecionados.length === 0) {
      return "Selecione pelo menos um tribunal";
    }

    return null;
  };

  const handleConsultar = async () => {
    const validationError = validarFormulario();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    setResultados([]);
    setErros([]);
    setTotalConsultado(0);

    try {
      const config: DJENConfig = {
        tribunais: tribunaisSelecionados,
        searchTerms: {
          nomeAdvogado: nomeAdvogado.trim() || undefined,
          numeroOAB: numeroOAB.trim() || undefined,
        },
        dataInicio: dataConsulta,
        dataFim: dataConsulta,
        timeout: 60000,
        delayBetweenRequests: 1500,
      };

      const resultado = await consultarDJEN(config);

      setResultados(resultado.resultados);
      setErros(resultado.erros);
      setTotalConsultado(resultado.totalConsultado);

      const newHistoryEntry: DJENSearchHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        nomeAdvogado: nomeAdvogado.trim() || undefined,
        numeroOAB: numeroOAB.trim() || undefined,
        tribunais: tribunaisSelecionados,
        totalResultados: resultado.resultados.length,
      };

      setSearchHistory((current) => [newHistoryEntry, ...(current || []).slice(0, 49)]);

      if (resultado.resultados.length === 0 && resultado.erros.length === 0) {
        toast.info("Nenhuma publicação encontrada para os termos informados");
      } else if (resultado.resultados.length > 0) {
        toast.success(`${resultado.resultados.length} publicação(ões) encontrada(s)`);
      } else if (resultado.erros.length > 0) {
        toast.warning("Consulta finalizada com alguns erros. Verifique os detalhes.");
      }
    } catch (error) {
      console.error("Erro ao consultar DJEN:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao consultar DJEN");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  const exportResultados = () => {
    const jsonData = JSON.stringify(resultados, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `djen-resultados-${dataConsulta}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Resultados exportados com sucesso");
  };

  const getMatchTypeBadge = (matchType: string) => {
    switch (matchType) {
      case "ambos":
        return <Badge className="bg-green-500">Nome + OAB</Badge>;
      case "nome":
        return <Badge variant="secondary">Nome</Badge>;
      case "oab":
        return <Badge variant="outline">OAB</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Newspaper size={32} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consulta DJEN</h1>
          <p className="text-sm text-muted-foreground">
            Diário de Justiça Eletrônico Nacional - API Comunica PJe
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Parâmetros de Busca</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-advogado">Nome do Advogado</Label>
                <Input
                  id="nome-advogado"
                  placeholder="Ex: Thiago Bodevan"
                  value={nomeAdvogado}
                  onChange={(e) => setNomeAdvogado(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero-oab">Número da OAB</Label>
                <Input
                  id="numero-oab"
                  placeholder="Ex: OAB/MG 123456"
                  value={numeroOAB}
                  onChange={(e) => setNumeroOAB(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Formato: OAB/UF 12345</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-consulta">Data de Publicação</Label>
                <Input
                  id="data-consulta"
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Tribunais</h3>
              <Button variant="ghost" size="sm" onClick={toggleTodosTribunais} disabled={isLoading}>
                {tribunaisSelecionados.length === getTribunaisDisponiveis().length
                  ? "Desmarcar todos"
                  : "Selecionar todos"}
              </Button>
            </div>

            <div className="space-y-2">
              {getTribunaisDisponiveis().map((tribunal) => (
                <div key={tribunal} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tribunal-${tribunal}`}
                    checked={tribunaisSelecionados.includes(tribunal)}
                    onCheckedChange={() => toggleTribunal(tribunal)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`tribunal-${tribunal}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {tribunal}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleConsultar} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Consultando...
              </>
            ) : (
              <>
                <Search className="mr-2" />
                Consultar DJEN
              </>
            )}
          </Button>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Resultados</h2>
            {resultados.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportResultados}>
                <Download className="mr-2" size={16} />
                Exportar JSON
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 size={40} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Consultando tribunais selecionados...</p>
            </div>
          )}

          {!isLoading && resultados.length === 0 && erros.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <Newspaper size={48} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma consulta realizada ainda.
                <br />
                Preencha os parâmetros e clique em Consultar.
              </p>
            </div>
          )}

          {!isLoading && (resultados.length > 0 || erros.length > 0) && (
            <div className="space-y-4">
              {totalConsultado > 0 && (
                <Alert>
                  <AlertDescription>
                    {totalConsultado} publicação(ões) consultada(s) | {resultados.length}{" "}
                    relevante(s) encontrada(s)
                  </AlertDescription>
                </Alert>
              )}

              {erros.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Erros ao consultar alguns tribunais:</div>
                    <ul className="text-xs space-y-1">
                      {erros.map((erro) => (
                        <li key={`${erro.tribunal}-${erro.erro.substring(0, 50)}`}>
                          <strong>{erro.tribunal}:</strong> {erro.erro}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {resultados.length > 0 && (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {resultados.map((resultado) => (
                      <Card
                        key={`${resultado.tribunal}-${resultado.numeroProcesso || resultado.data}`}
                        className="p-4 space-y-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{resultado.tribunal}</Badge>
                            <Badge variant="secondary">{resultado.tipo}</Badge>
                            {getMatchTypeBadge(resultado.matchType)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(resultado.teor)}
                          >
                            <Copy size={16} />
                          </Button>
                        </div>

                        {resultado.numeroProcesso && (
                          <div className="text-sm">
                            <span className="font-medium">Processo:</span>{" "}
                            <code className="bg-muted px-1 rounded text-xs">
                              {resultado.numeroProcesso}
                            </code>
                          </div>
                        )}

                        {resultado.orgao && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Órgão:</span> {resultado.orgao}
                          </div>
                        )}

                        <div className="bg-muted p-3 rounded text-sm">
                          <div className="font-medium mb-1">Teor da Publicação:</div>
                          <div className="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {resultado.teor.substring(0, 500)}
                            {resultado.teor.length > 500 && "..."}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Publicado em: {new Date(resultado.data).toLocaleDateString("pt-BR")}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {resultados.length === 0 && erros.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle size={48} className="text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma publicação encontrada para os termos informados.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

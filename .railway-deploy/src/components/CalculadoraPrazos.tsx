import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LabelWithTooltip } from "@/components/ui/info-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKV } from "@/hooks/use-kv";
import {
  calcularPrazoCLT,
  calcularPrazoCPC,
  formatarData,
  getFeriadosNacionais,
} from "@/lib/prazos";
import type { Expediente, Prazo, Process } from "@/types";
import { Info } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// Helper: retorna placeholder para SelectValue de expediente (S3358)
function getExpedientePlaceholder(
  selectedProcessId: string | null,
  expedientesCount: number
): string {
  if (!selectedProcessId) return "Selecione primeiro um processo";
  if (expedientesCount === 0) return "Nenhuma intimação vinculada a este processo";
  return "Selecione uma intimação";
}

/**
 * Formata a data de um expediente, priorizando dataRecebimento > data
 */
function formatExpedienteDate(e: Expediente): string {
  if (e.dataRecebimento) {
    return formatarData(e.dataRecebimento);
  }
  if (e.data) {
    return formatarData(e.data);
  }
  return "Data não informada";
}

export default function CalculadoraPrazos() {
  const [processes, setProcesses] = useKV<Process[]>("processes", []);
  const [expedientes] = useKV<Expediente[]>("expedientes", []);

  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string>("");

  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [diasCorridos, setDiasCorridos] = useState("15");
  const [tipoPrazo, setTipoPrazo] = useState<"cpc" | "clt">("cpc");
  const [descricao, setDescricao] = useState("");
  const [resultado, setResultado] = useState<Date | null>(null);

  const feriados = getFeriadosNacionais();

  const processosAtivos = useMemo(
    () => (processes || []).filter((p) => p.status === "ativo"),
    [processes]
  );

  const expedientesDoProcesso = useMemo(
    () => (expedientes || []).filter((e) => e.processId === selectedProcessId && !e.arquivado),
    [expedientes, selectedProcessId]
  );

  const handleCalcular = () => {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    const dias = Number.parseInt(diasCorridos, 10);

    if (Number.isNaN(dias) || dias <= 0) {
      toast.error("Dias inválidos", {
        description: "Informe um número válido de dias",
      });
      return;
    }

    const dataFinal =
      tipoPrazo === "cpc" ? calcularPrazoCPC(inicio, dias) : calcularPrazoCLT(inicio, dias);

    setResultado(dataFinal);
  };

  const handleSelecionarProcesso = (processId: string) => {
    setSelectedProcessId(processId);
    setSelectedExpedienteId("");
    // ao trocar de processo, se não houver descrição ainda, já sugere algo
    const proc = (processes || []).find((p) => p.id === processId);
    if (proc && !descricao.trim()) {
      setDescricao(`Prazo - ${proc.numeroCNJ || proc.titulo}`);
    }
  };

  const handleSelecionarExpediente = (expedienteId: string) => {
    setSelectedExpedienteId(expedienteId);
    const exp = expedientesDoProcesso.find((e) => e.id === expedienteId);
    if (!exp) return;

    // Data de início automática a partir da intimação
    const dataBase =
      exp.dataRecebimento ||
      exp.data || // alguns pipelines usam "data" como string yyyy-MM-dd
      exp.receivedAt ||
      exp.createdAt;

    if (dataBase) {
      try {
        const d = new Date(dataBase);
        if (!Number.isNaN(d.getTime())) {
          setDataInicio(d.toISOString().split("T")[0]);
        }
      } catch {
        // se vier zoado, ignora silenciosamente
      }
    }

    // Descrição padrão a partir do expediente / intimação
    if (!descricao.trim()) {
      const tituloBase = exp.titulo || exp.tipo || "Intimação";
      setDescricao(`Prazo - ${tituloBase}`);
    }

    // Se já tiver quantidade de dias válida, dispara cálculo automaticamente
    const dias = Number.parseInt(diasCorridos, 10);
    if (!Number.isNaN(dias) && dias > 0) {
      handleCalcular();
    }
  };

  const handleSalvarPrazo = () => {
    if (!resultado) {
      toast.error("Calcule o prazo antes de salvar", {
        description: 'Clique em "Calcular Prazo" para gerar a data final',
      });
      return;
    }

    if (!selectedProcessId) {
      toast.error("Selecione um processo", {
        description: "Vincule o prazo a um processo do Acervo",
      });
      return;
    }

    if (!descricao.trim()) {
      toast.error("Descrição obrigatória", {
        description: "Adicione uma descrição para o prazo (ex: Contestação)",
      });
      return;
    }

    const dias = Number.parseInt(diasCorridos, 10);
    if (Number.isNaN(dias) || dias <= 0) {
      toast.error("Dias inválidos", {
        description: "Informe um número válido de dias",
      });
      return;
    }

    const novoPrazo: Prazo = {
      id: `prazo_${Date.now()}`,
      processId: selectedProcessId,
      descricao: descricao.trim(),
      dataInicio,
      diasCorridos: dias,
      tipoPrazo,
      dataFinal: format(resultado, "yyyy-MM-dd"),
      concluido: false,
      urgente: false,
      createdAt: new Date().toISOString(),
    };

    setProcesses((current) => {
      const processesList = current || [];
      const processIndex = processesList.findIndex((p) => p.id === selectedProcessId);

      if (processIndex === -1) {
        toast.error("Processo não encontrado");
        return processesList;
      }

      const updated = [...processesList];
      const process = updated[processIndex];

      updated[processIndex] = {
        ...process,
        prazos: [...(process.prazos || []), novoPrazo],
        updatedAt: new Date().toISOString(),
      };

      return updated;
    });

    toast.success("Prazo salvo no processo", {
      description:
        "O prazo agora aparece vinculado ao processo no Acervo e pode ser usado pelos outros agentes.",
    });

    setDescricao("");
    setResultado(null);
    setSelectedExpedienteId("");
  };

  const prazoDescription =
    tipoPrazo === "cpc"
      ? "Conta apenas dias úteis (exclui sábados, domingos e feriados). Se o prazo final cair em dia não útil, prorroga para o próximo dia útil."
      : "Conta dias corridos a partir da data de início. Se o prazo final cair em dia não útil, prorroga para o próximo dia útil.";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Calculadora de Prazos</h1>
        <p className="text-muted-foreground">
          Calcule prazos processuais com base nas intimações recebidas nos expedientes e salve
          diretamente no Acervo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LADO ESQUERDO: Cálculo e vínculo com processo/expediente */}
        <Card>
          <CardHeader>
            <CardTitle>Calcular Prazo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Processo */}
            <div className="flex flex-col gap-2">
              <LabelWithTooltip
                label="Processo"
                tooltip="Selecione o processo do Acervo ao qual o prazo será vinculado."
                required
              />
              <Select value={selectedProcessId} onValueChange={handleSelecionarProcesso}>
                <SelectTrigger id="processo">
                  <SelectValue placeholder="Selecione um processo" />
                </SelectTrigger>
                <SelectContent>
                  {processosAtivos.length === 0 && (
                    <SelectItem value="__none" disabled>
                      Nenhum processo ativo cadastrado
                    </SelectItem>
                  )}
                  {processosAtivos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.titulo} {p.numeroCNJ ? `- ${p.numeroCNJ}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Intimação / Expediente de origem */}
            <div className="flex flex-col gap-2">
              <LabelWithTooltip
                label="Intimação / Expediente"
                tooltip="Selecione a intimação recebida. A data de início será preenchida automaticamente com a data de recebimento."
              />
              <Select
                value={selectedExpedienteId}
                onValueChange={handleSelecionarExpediente}
                disabled={!selectedProcessId || expedientesDoProcesso.length === 0}
              >
                <SelectTrigger id="expediente">
                  <SelectValue
                    placeholder={getExpedientePlaceholder(
                      selectedProcessId,
                      expedientesDoProcesso.length
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {expedientesDoProcesso.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.titulo || e.tipo || "Intimação"} • {formatExpedienteDate(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de início */}
            <div className="flex flex-col gap-2">
              <LabelWithTooltip
                label="Data de Início"
                tooltip="Data em que o prazo começa a contar (ex: data da intimação, ciência ou publicação)."
                required
              />
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            {/* Quantidade de dias */}
            <div className="flex flex-col gap-2">
              <LabelWithTooltip
                label="Quantidade de Dias"
                tooltip="Número de dias do prazo conforme a legislação processual ou a intimação."
                required
              />
              <Input
                id="diasCorridos"
                type="number"
                min="1"
                value={diasCorridos}
                onChange={(e) => setDiasCorridos(e.target.value)}
              />
            </div>

            {/* Tipo de prazo */}
            <div className="flex flex-col gap-2">
              <LabelWithTooltip
                label="Tipo de Prazo"
                tooltip="CPC: conta apenas dias úteis. CLT: conta dias corridos incluindo finais de semana."
                required
              />
              <Select value={tipoPrazo} onValueChange={(v) => setTipoPrazo(v as "cpc" | "clt")}>
                <SelectTrigger id="tipoPrazo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpc">CPC (apenas dias úteis)</SelectItem>
                  <SelectItem value="clt">CLT (dias corridos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info size={16} />
              <AlertDescription className="text-xs">{prazoDescription}</AlertDescription>
            </Alert>

            <Button onClick={handleCalcular} className="w-full">
              Calcular Prazo
            </Button>

            {/* Resultado + descrição + salvar */}
            {resultado && (
              <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Prazo Final</p>
                  <p className="text-2xl font-bold">
                    {formatarData(format(resultado, "yyyy-MM-dd"))}
                  </p>
                  <p className="text-sm text-muted-foreground">{format(resultado, "dd/MM/yyyy")}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Label htmlFor="descricao">Descrição do Prazo</Label>
                  <Input
                    id="descricao"
                    placeholder="Ex: Contestação, Embargos à Execução..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />

                  <Button
                    onClick={handleSalvarPrazo}
                    variant="secondary"
                    className="w-full mt-2"
                    disabled={!selectedProcessId}
                  >
                    Salvar Prazo no Processo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LADO DIREITO: Feriados / contexto */}
        <Card>
          <CardHeader>
            <CardTitle>Feriados Nacionais 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {feriados.map((feriado) => (
                <div
                  key={feriado.data}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{feriado.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatarData(feriado.data)}</p>
                  </div>
                  <Badge variant="outline">{feriado.tipo}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

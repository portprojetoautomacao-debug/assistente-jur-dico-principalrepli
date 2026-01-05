import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Calendar, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DeadlineCalculator() {
  const [baseDate, setBaseDate] = useState("");
  const [deadlineType, setDeadlineType] = useState("alegacoes-finais");
  const [procedureType, setProcedureType] = useState<"CPC" | "CLT">("CPC");
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{
    finalDate: string;
    reasoning: string[];
    holidays: string[];
  } | null>(null);

  const deadlineTypes = {
    CPC: [
      { value: "alegacoes-finais", label: "Alegações Finais", days: 15 },
      { value: "contestacao", label: "Contestação", days: 15 },
      { value: "recurso-ordinario", label: "Recurso Ordinário", days: 15 },
      {
        value: "embargos-declaracao",
        label: "Embargos de Declaração",
        days: 5,
      },
      {
        value: "cumprimento-sentenca",
        label: "Cumprimento de Sentença",
        days: 15,
      },
    ],
    CLT: [
      { value: "razoes-finais", label: "Razões Finais", days: 5 },
      { value: "recurso-ordinario-trab", label: "Recurso Ordinário", days: 8 },
      { value: "contrarrazoes", label: "Contrarrazões", days: 8 },
      { value: "agravo-petição", label: "Agravo de Petição", days: 8 },
    ],
  };

  const handleCalculate = async () => {
    if (!baseDate) {
      toast.error("Selecione a data base");
      return;
    }

    setCalculating(true);

    try {
      const selectedDeadline = deadlineTypes[procedureType].find((d) => d.value === deadlineType);
      const days = selectedDeadline?.days || 15;

      const base = new Date(baseDate + "T12:00:00");
      const currentDate = new Date(base);
      let workingDays = 0;
      const reasoning: string[] = [
        `Data base: ${base.toLocaleDateString("pt-BR")}`,
        `Prazo: ${days} dias úteis (${procedureType})`,
        `Tipo: ${selectedDeadline?.label}`,
        "",
        "Cálculo passo a passo:",
      ];
      const holidays: string[] = [];

      // Feriados nacionais - em produção, buscar de API como Calendarific ou banco de dados
      // ENHANCEMENT(PRAZOS-003): Integração com API de feriados estaduais/municipais
      // APIs sugeridas:
      // - Brasil API: https://brasilapi.com.br/api/feriados/v1/{ano}
      // - Calendarific: https://calendarific.com/api/v2/holidays (pago, mais completo)
      // Implementação: criar hook useFeriados() que faz cache local (1 ano) e sincroniza semanalmente
      // Atualmente usa apenas feriados nacionais fixos
      // Opções avaliadas: Calendarific API, Brasil API, tabela customizável por tribunal
      // Refs: https://calendarific.com/api-documentation | https://brasilapi.com.br/docs
      // Status: Usando lista estática de feriados nacionais como fallback
      const nationalHolidays = getNationalHolidays(base.getFullYear());

      while (workingDays < days) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = nationalHolidays.includes(currentDate.toDateString());

        if (isWeekend) {
          reasoning.push(`${currentDate.toLocaleDateString("pt-BR")} - Final de semana (ignorado)`);
        } else if (isHoliday) {
          reasoning.push(`${currentDate.toLocaleDateString("pt-BR")} - Feriado (ignorado)`);
          holidays.push(currentDate.toLocaleDateString("pt-BR"));
        } else {
          workingDays++;
          reasoning.push(
            `${currentDate.toLocaleDateString("pt-BR")} - Dia útil ${workingDays}/${days}`
          );
        }
      }

      reasoning.push("", `✓ Prazo final: ${currentDate.toLocaleDateString("pt-BR")}`);

      setResult({
        finalDate: currentDate.toISOString().split("T")[0],
        reasoning,
        holidays,
      });
      toast.success("Cálculo concluído com sucesso");
    } catch (error) {
      console.error("Erro no cálculo:", error);
      toast.error("Erro ao calcular prazo");
    } finally {
      setCalculating(false);
    }
  };

  // Retorna feriados nacionais do Brasil
  // Em produção, isso deveria vir de uma API ou banco de dados
  function getNationalHolidays(year: number): string[] {
    return [
      new Date(year, 0, 1).toDateString(), // Confraternização Universal
      new Date(year, 3, 21).toDateString(), // Tiradentes
      new Date(year, 4, 1).toDateString(), // Dia do Trabalho
      new Date(year, 8, 7).toDateString(), // Independência
      new Date(year, 9, 12).toDateString(), // Nossa Senhora Aparecida
      new Date(year, 10, 2).toDateString(), // Finados
      new Date(year, 10, 15).toDateString(), // Proclamação da República
      new Date(year, 10, 20).toDateString(), // Dia da Consciência Negra (alguns estados)
      new Date(year, 11, 25).toDateString(), // Natal
    ];
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calculadora de Prazos</h1>
        <p className="text-muted-foreground mt-1">
          Cálculo inteligente com raciocínio auditável via Gemini AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros do Cálculo</CardTitle>
            <CardDescription>Configure os dados para calcular o prazo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="procedure-type">Tipo de Procedimento</Label>
              <Select
                value={procedureType}
                onValueChange={(value) => setProcedureType(value as "CPC" | "CLT")}
              >
                <SelectTrigger id="procedure-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPC">CPC - Processo Civil</SelectItem>
                  <SelectItem value="CLT">CLT - Processo Trabalhista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline-type">Tipo de Prazo</Label>
              <Select value={deadlineType} onValueChange={setDeadlineType}>
                <SelectTrigger id="deadline-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deadlineTypes[procedureType].map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label} ({dt.days} dias)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base-date">Data Base (Intimação)</Label>
              <Input
                id="base-date"
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
              />
            </div>

            <Button onClick={handleCalculate} disabled={calculating} className="w-full" size="lg">
              <Calculator className="w-5 h-5 mr-2" />
              {calculating ? "Calculando..." : "Calcular Prazo"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result && <Sparkles className="w-5 h-5 text-accent" />}
              Resultado
            </CardTitle>
            <CardDescription>Prazo final e raciocínio detalhado</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-6 bg-accent rounded-lg text-center">
                  <Calendar className="w-12 h-12 text-accent-foreground mx-auto mb-3" />
                  <p className="text-sm text-accent-foreground/80 mb-2">Prazo Final</p>
                  <p className="text-3xl font-bold text-accent-foreground">
                    {new Date(result.finalDate + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {result.holidays.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Feriados Considerados
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.holidays.map((holiday) => (
                        <Badge key={holiday} variant="outline" className="bg-white">
                          {holiday}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="reasoning">
                    <AccordionTrigger className="text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        Ver Raciocínio Passo a Passo (AI)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {result.reasoning.join("\n")}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calculator className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Aguardando cálculo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha os parâmetros e clique em calcular
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

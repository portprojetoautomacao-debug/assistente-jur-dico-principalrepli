import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKV } from "@/hooks/use-kv";
import type { Prazo, Process, ViewType } from "@/types";
import {
  ArrowUp,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Trophy,
} from "lucide-react";
import { memo, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardAdvboxProps {
  readonly onNavigate: (view: ViewType) => void;
}

function DashboardAdvbox({ onNavigate: _onNavigate }: DashboardAdvboxProps) {
  const [processes] = useKV<Process[]>("processes", []);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Ref para capturar timestamp na montagem (evita violação de pureza React Compiler)
  const initialTimestampRef = useRef(Date.now());

  const stats = useMemo(() => {
    const processesList = processes || [];

    const todosPrazos: (Prazo & { processoTitulo: string })[] = [];
    processesList.forEach((process) => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach((prazo) => {
          todosPrazos.push({
            ...prazo,
            processoTitulo: process.titulo,
          });
        });
      }
    });

    const tarefasFinalizadas = todosPrazos.filter((p) => p.concluido).length;
    const tarefasPendentes = todosPrazos.filter((p) => !p.concluido).length;
    const pontosAcumulados = tarefasFinalizadas * 10; // 10 pontos por tarefa

    return {
      tarefasFinalizadas,
      tarefasPendentes,
      pontosAcumulados,
      todosPrazos: todosPrazos.filter((p) => !p.concluido).slice(0, 5),
    };
  }, [processes]);

  // Performance data for line chart (Meu Desempenho)
  const performanceData = useMemo(() => {
    const processesList = processes || [];
    const monthlyStats: {
      [key: string]: { entradas: number; meta: number; tarefas: number };
    } = {};

    // Últimos 6 meses
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("pt-BR", { month: "short" });
      months.push(monthKey);
      monthlyStats[monthKey] = { entradas: 0, meta: 100, tarefas: 0 };
    }

    // Contar processos por mês
    processesList.forEach((p) => {
      if (!p.createdAt) return;
      const created = new Date(p.createdAt);
      if (Number.isNaN(created.getTime())) return;

      const monthKey = created.toLocaleDateString("pt-BR", { month: "short" });
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].entradas += 1;
        monthlyStats[monthKey].tarefas += p.prazos?.length || 0;
      }
    });

    return months.map((month) => ({
      month,
      "ESTE MÊS": monthlyStats[month].entradas,
      "METAS/OUTROS": monthlyStats[month].meta,
      META: 50,
    }));
  }, [processes]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [selectedMonth]);

  // Captura timestamp fora do useMemo para evitar violação de pureza
  const nowTimestamp = initialTimestampRef.current;
  const intimacoes = useMemo(() => {
    const processesList = processes || [];
    // Use a fixed reference date instead of Date.now() to avoid impurity
    // We get time once when array changes via dependency
    const umMesMs = 30 * 24 * 60 * 60 * 1000;
    const now = new Date(nowTimestamp);
    const limite = new Date(now.getTime() - umMesMs);

    return processesList.slice(0, 4).map((p) => {
      const temMov = !!p.dataUltimaMovimentacao;
      let atrasado = false;

      if (temMov && p.dataUltimaMovimentacao) {
        const mov = new Date(p.dataUltimaMovimentacao);
        if (!Number.isNaN(mov.getTime())) {
          atrasado = mov < limite;
        }
      }

      return {
        tipo: "INTIMAÇÃO JUDICIAL",
        status: temMov ? "1 mês atrás" : "não informado",
        parte1: p.autor || "Parte não informada",
        parte2: p.reu || "Não informado",
        numero: p.numeroCNJ,
        atrasado,
      };
    });
  }, [processes, nowTimestamp]);

  // Mapeamento de prazos por dia do mês selecionado
  const prazosPorDia = useMemo(() => {
    const processesList = processes || [];
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const map: Record<number, { count: number; urgente: boolean; descricoes: string[] }> = {};

    processesList.forEach((process) => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach((prazo) => {
          if (prazo.concluido) return;
          const dataFinal = new Date(prazo.dataFinal);
          if (dataFinal.getFullYear() === year && dataFinal.getMonth() === month) {
            const day = dataFinal.getDate();
            const hoje = new Date();
            const diasRestantes = Math.ceil(
              (dataFinal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
            );
            const urgente = diasRestantes <= 5 && diasRestantes >= 0;

            if (!map[day]) {
              map[day] = { count: 0, urgente: false, descricoes: [] };
            }
            map[day].count++;
            if (urgente) map[day].urgente = true;
            map[day].descricoes.push(`${prazo.descricao || "Prazo"} - ${process.titulo}`);
          }
        });
      }
    });
    return map;
  }, [processes, selectedMonth]);

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto bg-linear-to-br from-background via-background to-[#1a1d29]">
      {/* Header with Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nome, cpf, cnj, e-mail, tag ou pasta"
            className="w-full px-4 py-3 pl-12 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Button className="bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 rounded-xl px-6 py-3 font-semibold transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-105">
          NOVA TAREFA
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden bg-linear-to-br from-card via-card to-card/80 border-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 rounded-2xl group">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-linear-to-br from-green-500/20 to-green-500/5 rounded-xl shadow-lg">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-bold text-foreground mb-1 bg-linear-to-r from-foreground to-foreground/80 bg-clip-text">
                  {stats.tarefasFinalizadas}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Tarefas finalizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-linear-to-br from-card via-card to-card/80 border-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 rounded-2xl group">
          <div className="absolute inset-0 bg-linear-to-br from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-linear-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl shadow-lg">
                <Clock size={32} className="text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-bold text-foreground mb-1">{stats.tarefasPendentes}</p>
                <p className="text-sm text-muted-foreground font-medium">Tarefas pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-linear-to-br from-card via-card to-card/80 border-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 rounded-2xl group">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-linear-to-br from-primary/20 to-primary/5 rounded-xl shadow-lg">
                <Trophy size={32} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-4xl font-bold text-foreground mb-1">{stats.pontosAcumulados}</p>
                <p className="text-sm text-muted-foreground font-medium">Pontos acumulados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart - Left Side (2 columns) */}
        <div className="lg:col-span-2">
          <Card className="bg-linear-to-br from-card via-card to-card/80 border-border/50 h-full shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-linear-to-r from-card/50 to-transparent">
              <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
                <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                  MEU DESEMPENHO
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 rounded-lg"
                    aria-label="Ver detalhes"
                  >
                    <ArrowUp size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 rounded-lg"
                    aria-label="Alternar visualização"
                  >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2 2h4v4H2V2zm6 0h6v4H8V2zM2 8h4v6H2V8zm6 0h6v6H8V8z" />
                    </svg>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] min-h-[300px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={300}>
                  <LineChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorEste" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52b788" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#52b788" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMetas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#48cae4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#48cae4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="month"
                      stroke="#6b7280"
                      tick={{
                        fill: "#9ca3af",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "#2a2d3e" }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{
                        fill: "#9ca3af",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                      axisLine={{ stroke: "#2a2d3e" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1d29",
                        border: "1px solid #00b4d8",
                        borderRadius: "12px",
                        color: "#e8eaed",
                        boxShadow: "0 8px 24px rgba(0, 180, 216, 0.2)",
                      }}
                      cursor={{
                        stroke: "#00b4d8",
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        color: "#e8eaed",
                        fontWeight: 600,
                      }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="ESTE MÊS"
                      stroke="#52b788"
                      strokeWidth={3}
                      dot={{
                        fill: "#52b788",
                        r: 5,
                        strokeWidth: 2,
                        stroke: "#0f1117",
                      }}
                      activeDot={{
                        r: 7,
                        fill: "#52b788",
                        stroke: "#0f1117",
                        strokeWidth: 3,
                      }}
                      fill="url(#colorEste)"
                    />
                    <Line
                      type="monotone"
                      dataKey="METAS/OUTROS"
                      stroke="#48cae4"
                      strokeWidth={3}
                      dot={{
                        fill: "#48cae4",
                        r: 5,
                        strokeWidth: 2,
                        stroke: "#0f1117",
                      }}
                      activeDot={{
                        r: 7,
                        fill: "#48cae4",
                        stroke: "#0f1117",
                        strokeWidth: 3,
                      }}
                      fill="url(#colorMetas)"
                    />
                    <Line
                      type="monotone"
                      dataKey="META"
                      stroke="#6b7280"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar - Right Side */}
        <div>
          <Card className="bg-linear-to-br from-card via-card to-card/80 border-border/50 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-linear-to-r from-card/50 to-transparent">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">
                  {selectedMonth
                    .toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 rounded-lg"
                    onClick={prevMonth}
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 rounded-lg"
                    onClick={nextMonth}
                    aria-label="Próximo mês"
                  >
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-7 gap-2 mb-3">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((day) => (
                  <div key={day} className="text-center text-xs text-primary/70 font-bold">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const isToday =
                    day !== null &&
                    day === todayDay &&
                    selectedMonth.getMonth() === todayMonth &&
                    selectedMonth.getFullYear() === todayYear;

                  const prazoInfo = day === null ? null : prazosPorDia[day];
                  const temPrazo = prazoInfo && prazoInfo.count > 0;
                  const prazoUrgente = prazoInfo?.urgente;

                  // Função para determinar classes CSS do dia do calendário
                  const getDayClassName = (): string => {
                    const baseClasses =
                      "aspect-square flex flex-col items-center justify-center text-sm rounded-lg font-semibold transition-all relative";

                    if (day === null) {
                      return `${baseClasses} text-transparent pointer-events-none`;
                    }
                    if (isToday) {
                      return `${baseClasses} bg-linear-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 scale-110`;
                    }
                    if (prazoUrgente) {
                      return `${baseClasses} bg-linear-to-br from-red-500/20 to-red-600/10 text-red-400 border border-red-500/30 cursor-pointer hover:scale-105`;
                    }
                    if (temPrazo) {
                      return `${baseClasses} bg-linear-to-br from-yellow-500/20 to-yellow-600/10 text-yellow-400 border border-yellow-500/30 cursor-pointer hover:scale-105`;
                    }
                    return `${baseClasses} text-foreground hover:bg-linear-to-br hover:from-primary/10 hover:to-accent/10 cursor-pointer hover:scale-105`;
                  };

                  const keyForDay =
                    day === null
                      ? `empty-${index}`
                      : `day-${selectedMonth.getFullYear()}-${String(
                          selectedMonth.getMonth() + 1
                        ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  return (
                    <div
                      key={keyForDay}
                      title={prazoInfo?.descricoes?.join("\n")}
                      className={getDayClassName()}
                    >
                      {day}
                      {temPrazo && (
                        <span
                          className={`absolute -top-1 -right-1 w-4 h-4 text-[10px] flex items-center justify-center rounded-full ${
                            prazoUrgente ? "bg-red-500 text-white" : "bg-yellow-500 text-black"
                          }`}
                        >
                          {prazoInfo.count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intimações/Compromissos List */}
      <Card className="bg-linear-to-br from-card via-card to-card/80 border-border/50 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-linear-to-r from-card/50 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground">COMPROMISSOS</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold hover:bg-primary/10 rounded-lg"
              >
                Tarefa
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold hover:bg-primary/10 rounded-lg"
              >
                Pesquisar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-1">
            {/* Categories */}
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                className="text-xs h-9 bg-primary/10 hover:bg-primary/20 rounded-lg font-semibold"
              >
                <FileText size={16} className="mr-2" />
                Intimações
              </Button>
              <Badge variant="secondary" className="text-xs rounded-lg px-3 py-1">
                Não lidas
              </Badge>
            </div>

            {/* List Items */}
            {intimacoes.map((item, index) => {
              const initial = (item.parte1 || "?").charAt(0).toUpperCase();

              return (
                <div
                  key={`${item.numero || item.parte1}-${index}`}
                  className="flex items-center justify-between py-3 px-4 hover:bg-linear-to-r hover:from-primary/5 hover:to-transparent rounded-xl cursor-pointer group transition-all border-b border-border/30 last:border-b-0"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-2 border-border cursor-pointer checked:bg-primary checked:border-primary transition-all"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <FileText size={16} className="text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{item.tipo}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.parte1} x {item.parte2}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={item.atrasado ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">{initial}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(DashboardAdvbox);

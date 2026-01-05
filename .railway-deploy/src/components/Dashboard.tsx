import DJENPublicationsWidget from "@/components/DJENPublicationsWidget";
import { HybridAgentsStatsPanel } from "@/components/HybridAgentsStatsPanel";
import { PJeDocumentWidget, PJeStatusBadge } from "@/components/PJeDocumentWidget";
import { PjeImageImporter } from "@/components/PjeImageImporter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKV } from "@/hooks/use-kv";
import { calcularDiasRestantes, formatarData, isUrgente } from "@/lib/prazos";
import type { Prazo, Process, ViewType } from "@/types";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  ChartPie,
  CheckCircle,
  Clock,
  Gavel,
  TrendingUp,
  Upload,
} from "lucide-react";
import { lazy, Suspense, useMemo } from "react";

// Lazy load dashboard sections for better code splitting
const StatusChart = lazy(() =>
  import("@/components/DashboardCharts").then((m) => ({
    default: m.StatusChart,
  }))
);
const VaraChart = lazy(() =>
  import("@/components/DashboardCharts").then((m) => ({ default: m.VaraChart }))
);
const TrendChart = lazy(() =>
  import("@/components/DashboardCharts").then((m) => ({
    default: m.TrendChart,
  }))
);

// Funções auxiliares para evitar ternários aninhados
function formatDiasRestantes(diasRestantes: number): string {
  if (diasRestantes < 0) return "Vencido";
  if (diasRestantes === 0) return "Hoje";
  if (diasRestantes === 1) return "Amanhã";
  return `${diasRestantes} dias`;
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ativo") return "default";
  if (status === "concluido") return "secondary";
  if (status === "suspenso") return "outline";
  return "destructive";
}

interface DashboardProps {
  readonly onNavigate: (view: ViewType) => void;
}

function getSafeDate(value?: string) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export default function Dashboard({ onNavigate }: Readonly<DashboardProps>) {
  const [processes] = useKV<Process[]>("processes", []);

  const stats = useMemo(() => {
    const processesList = processes || [];
    const ativos = processesList.filter((p) => p.status === "ativo").length;
    const concluidos = processesList.filter((p) => p.status === "concluido").length;

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

    const prazosPendentes = todosPrazos.filter((p) => !p.concluido).length;
    const prazosUrgentes = todosPrazos.filter((p) => {
      if (p.concluido) return false;
      const dias = calcularDiasRestantes(p.dataFinal);
      return isUrgente(dias);
    }).length;

    return {
      ativos,
      concluidos,
      prazosPendentes,
      prazosUrgentes,
      todosPrazos: todosPrazos.filter((p) => !p.concluido).slice(0, 5),
    };
  }, [processes]);

  const prazosProximos = useMemo(() => {
    const todosPrazos: (Prazo & { processoTitulo: string })[] = [];
    const processesList = processes || [];

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

    return todosPrazos
      .filter((p) => !p.concluido)
      .sort((a, b) => {
        const diasA = calcularDiasRestantes(a.dataFinal);
        const diasB = calcularDiasRestantes(b.dataFinal);
        return diasA - diasB;
      })
      .slice(0, 5);
  }, [processes]);

  const processosRecentes = useMemo(() => {
    return [...(processes || [])]
      .sort(
        (a, b) => getSafeDate(b.updatedAt || b.createdAt) - getSafeDate(a.updatedAt || a.createdAt)
      )
      .slice(0, 5);
  }, [processes]);

  const chartData = useMemo(() => {
    const processesList = processes || [];

    const statusData = [
      {
        name: "Ativo",
        value: processesList.filter((p) => p.status === "ativo").length,
        color: "#3b82f6", // blue-500
      },
      {
        name: "Concluído",
        value: processesList.filter((p) => p.status === "concluido").length,
        color: "#22c55e", // green-500
      },
      {
        name: "Suspenso",
        value: processesList.filter((p) => p.status === "suspenso").length,
        color: "#f59e0b", // amber-500
      },
      {
        name: "Arquivado",
        value: processesList.filter((p) => p.status === "arquivado").length,
        color: "#6b7280", // gray-500
      },
    ].filter((item) => item.value > 0);

    const varaData: { [key: string]: number } = {};
    processesList.forEach((p) => {
      const vara = p.vara || "Não especificada";
      varaData[vara] = (varaData[vara] || 0) + 1;
    });
    const varaChartData = Object.entries(varaData)
      .map(([name, value]) => ({
        name: name.length > 25 ? name.substring(0, 25) + "..." : name,
        value,
      }))
      .slice(0, 5);

    const monthlyData: {
      [key: string]: { ativos: number; concluidos: number };
    } = {};

    processesList.forEach((p) => {
      if (!p.createdAt) return;
      const created = new Date(p.createdAt);
      if (Number.isNaN(created.getTime())) return;

      const month = created.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      if (!monthlyData[month]) {
        monthlyData[month] = { ativos: 0, concluidos: 0 };
      }
      if (p.status === "concluido") {
        monthlyData[month].concluidos++;
      } else {
        monthlyData[month].ativos++;
      }
    });

    const trendData = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);

    return { statusData, varaChartData, trendData };
  }, [processes]);

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da sua gestão processual</p>
          </div>

          <div className="flex items-center gap-2">
            <PJeStatusBadge />
            <PJeDocumentWidget />
            <PjeImageImporter />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-glow-hover status-gradient-active">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <Gavel className="text-secondary neon-glow" size={24} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
          </CardContent>
        </Card>

        <Card className="card-glow-hover status-gradient-completed">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Concluídos</CardTitle>
            <CheckCircle className="text-accent neon-glow" size={24} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.concluidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados</p>
          </CardContent>
        </Card>

        <Card className="card-glow-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Pendentes</CardTitle>
            <Clock className="text-primary neon-glow" size={24} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.prazosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Não concluídos</p>
          </CardContent>
        </Card>

        <Card
          className={`card-glow-hover ${
            stats.prazosUrgentes > 0 ? "status-gradient-urgent border-destructive/50" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Urgentes</CardTitle>
            <AlertCircle
              className={stats.prazosUrgentes > 0 ? "text-destructive neon-glow" : "text-primary"}
              size={24}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                stats.prazosUrgentes > 0 ? "text-destructive" : "gradient-text"
              }`}
            >
              {stats.prazosUrgentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 5 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Estatísticas de Agentes Híbridos */}
      <HybridAgentsStatsPanel />

      {/* DJEN Publications Widget + Upload PDF */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="card-glow border-primary/30 bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 gradient-text">
                <Upload size={24} />
                Nova Funcionalidade: Upload de PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Agora você pode fazer upload de procurações e contratos em PDF para extrair
                automaticamente os dados do cliente usando IA!
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle size={14} />
                  Extração automática
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle size={14} />
                  Powered by Gemini 2.5 Pro
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle size={14} />
                  Salva automaticamente
                </Badge>
              </div>
              <Button
                onClick={() => onNavigate("upload-pdf")}
                className="button-gradient w-full sm:w-auto"
                size="lg"
              >
                <Upload size={20} />
                Testar Upload de PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        <DJENPublicationsWidget
          onViewAll={() => onNavigate("expedientes")}
          compact={true}
          maxItems={4}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="card-glow-hover glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <ChartPie size={24} />
              Processos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  Carregando gráfico...
                </div>
              }
            >
              <StatusChart chartData={chartData} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <Gavel size={24} />
              Top 5 Varas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  Carregando gráfico...
                </div>
              }
            >
              <VaraChart chartData={chartData} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <TrendingUp size={24} />
              Evolução (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  Carregando gráfico...
                </div>
              }
            >
              <TrendChart chartData={chartData} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Prazos e Processos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-glow-hover glassmorphic">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="gradient-text">Próximos Prazos</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("prazos")}
              className="hover:button-gradient hover:text-primary-foreground"
            >
              Ver todos
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            {prazosProximos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarCheck size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum prazo pendente</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {prazosProximos.map((prazo) => {
                  const diasRestantes = calcularDiasRestantes(prazo.dataFinal);
                  const urgente = isUrgente(diasRestantes);

                  return (
                    <div
                      key={prazo.id}
                      className={`flex items-start justify-between gap-3 pb-3 border-b last:border-0 p-3 rounded-lg transition-all ${
                        urgente ? "status-gradient-urgent" : "hover:bg-card/50"
                      }`}
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{prazo.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prazo.processoTitulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(prazo.dataFinal)}
                        </p>
                      </div>
                      <Badge
                        variant={urgente ? "destructive" : "default"}
                        className={`shrink-0 ${urgente ? "neon-glow" : ""}`}
                      >
                        {formatDiasRestantes(diasRestantes)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="gradient-text">Processos Recentes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("processos")}
              className="hover:button-gradient hover:text-primary-foreground"
            >
              Ver todos
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            {processosRecentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Gavel size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum processo cadastrado</p>
                <Button
                  size="sm"
                  className="mt-3 button-gradient"
                  onClick={() => onNavigate("processos")}
                >
                  Adicionar Processo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {processosRecentes.map((process) => (
                  <div
                    key={process.id}
                    className={`flex items-start justify-between gap-3 pb-3 border-b last:border-0 p-3 rounded-lg transition-all hover:bg-card/50 ${
                      process.status === "ativo" ? "status-gradient-active" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{process.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{process.numeroCNJ}</p>
                    </div>
                    <Badge variant={getStatusVariant(process.status)} className="shrink-0">
                      {process.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Prazos Urgentes */}
      {stats.prazosUrgentes > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle size={24} />
              Atenção: Prazos Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Você tem {stats.prazosUrgentes} prazo
              {stats.prazosUrgentes > 1 ? "s" : ""} vencendo nos próximos 5 dias. Certifique-se de
              tomar as providências necessárias.
            </p>
            <Button variant="destructive" size="sm" onClick={() => onNavigate("prazos")}>
              Ver Prazos Urgentes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

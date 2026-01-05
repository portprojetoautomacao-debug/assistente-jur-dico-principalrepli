// ✅ DADOS REAIS: Este componente recebe dados reais via props do Dashboard
// Os gráficos exibem estatísticas calculadas a partir de processos, expedientes e dados financeiros reais
// ✅ OTIMIZAÇÃO: Imports específicos de Recharts para melhor tree-shaking
// (um único import já é suficiente; o bundler tree-shakeia pelos símbolos usados)
import { ChartPie, Gavel, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Altura padrão dos gráficos para consistência visual
const CHART_HEIGHT = 250;

interface ChartData {
  statusData: {
    name: string;
    value: number;
    color: string;
  }[];
  varaChartData: { name: string; value: number }[];
  trendData: {
    month: string;
    ativos: number;
    concluidos: number;
  }[];
}

interface DashboardChartsProps {
  readonly chartData: ChartData;
}

export function StatusChart({ chartData }: Readonly<DashboardChartsProps>) {
  try {
    if (!chartData?.statusData || chartData.statusData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ChartPie size={48} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </div>
      );
    }

    return (
      <div style={{ width: "100%", minHeight: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <PieChart>
            <Pie
              data={Array.from(chartData.statusData)}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {chartData.statusData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    console.error("Error rendering StatusChart:", error);
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ChartPie size={48} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Erro ao carregar gráfico</p>
      </div>
    );
  }
}

export function VaraChart({ chartData }: Readonly<DashboardChartsProps>) {
  try {
    if (!chartData?.varaChartData || chartData.varaChartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Gavel size={48} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </div>
      );
    }

    return (
      <div style={{ width: "100%", minHeight: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={Array.from(chartData.varaChartData)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              className="text-muted-foreground"
              tick={{ fill: "currentColor" }}
              stroke="currentColor"
              fontSize={12}
            />
            <YAxis
              className="text-muted-foreground"
              tick={{ fill: "currentColor" }}
              stroke="currentColor"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    console.error("Error rendering VaraChart:", error);
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Gavel size={48} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Erro ao carregar gráfico</p>
      </div>
    );
  }
}

export function TrendChart({ chartData }: Readonly<DashboardChartsProps>) {
  try {
    if (!chartData?.trendData || chartData.trendData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp size={48} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </div>
      );
    }

    return (
      <div style={{ width: "100%", minHeight: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={Array.from(chartData.trendData)}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis
              dataKey="month"
              className="text-muted-foreground"
              tick={{ fill: "currentColor" }}
              stroke="currentColor"
              fontSize={12}
            />
            <YAxis
              className="text-muted-foreground"
              tick={{ fill: "currentColor" }}
              stroke="currentColor"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ativos"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Ativos"
            />
            <Line
              type="monotone"
              dataKey="concluidos"
              stroke="#22c55e"
              strokeWidth={2}
              name="Concluídos"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    console.error("Error rendering TrendChart:", error);
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <TrendingUp size={48} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Erro ao carregar gráfico</p>
      </div>
    );
  }
}

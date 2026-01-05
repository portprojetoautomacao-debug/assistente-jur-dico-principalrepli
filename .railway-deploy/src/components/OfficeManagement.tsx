import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKV } from "@/hooks/use-kv";
import { useMemo, useState } from "react";
// ✅ OTIMIZAÇÃO: Imports separados para melhor tree-shaking
import type { FinancialEntry, Process } from "@/types";
import { AlertTriangle, Clock, DollarSign, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SafraData {
  ano: number;
  fechamentos: number;
  emProducao: number;
  transitoJulgado: number;
  emExecucao: number;
  concluidos: number;
  ganho: number;
  perdido: number;
}

interface NoDataMessageProps {
  readonly message: string;
}

// Componente para exibir quando não há dados
function NoDataMessage({ message }: Readonly<NoDataMessageProps>) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle size={48} className="text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">{message}</p>
      <p className="text-sm text-muted-foreground/70 mt-2">
        Adicione dados através do sistema para visualizar as estatísticas
      </p>
    </div>
  );
}

export default function OfficeManagement() {
  const [activeTab, setActiveTab] = useState("produtividade");
  const [processes] = useKV<Process[]>("processes", []);
  const [financialRecords] = useKV<FinancialEntry[]>("financialEntries", []);

  // Calcular dados de produtividade a partir dos processos REAIS
  const produtividadeData = useMemo(() => {
    const processesList = processes || [];
    return {
      totalProcessos: processesList.length,
      processosAtivos: processesList.filter((p) => p.status === "ativo").length,
      processosConcluidos: processesList.filter((p) => p.status === "concluido").length,
      processosArquivados: processesList.filter((p) => p.status === "arquivado").length,
      processosSuspensos: processesList.filter((p) => p.status === "suspenso").length,
      taxa:
        processesList.length > 0
          ? Math.round(
              (processesList.filter((p) => p.status === "concluido").length /
                processesList.length) *
                100
            )
          : 0,
    };
  }, [processes]);

  // Calcular dados de estoque/status a partir dos processos REAIS
  const estoqueData = useMemo(() => {
    const processesList = processes || [];
    if (processesList.length === 0) return [];

    return [
      {
        name: "Ativos",
        value: processesList.filter((p) => p.status === "ativo").length,
        color: "#00b4d8",
      },
      {
        name: "Suspensos",
        value: processesList.filter((p) => p.status === "suspenso").length,
        color: "#fbbf24",
      },
      {
        name: "Concluídos",
        value: processesList.filter((p) => p.status === "concluido").length,
        color: "#52b788",
      },
      {
        name: "Arquivados",
        value: processesList.filter((p) => p.status === "arquivado").length,
        color: "#6b7280",
      },
    ].filter((item) => item.value > 0);
  }, [processes]);

  // Calcular dados financeiros mensais a partir das entradas REAIS
  const financeiroData = useMemo(() => {
    const records = financialRecords || [];
    if (records.length === 0) return [];

    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const currentYear = new Date().getFullYear();

    const byMonth: { [key: number]: { receita: number; despesa: number } } = {};

    records.forEach((record) => {
      const date = new Date(record.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        if (!byMonth[month]) {
          byMonth[month] = { receita: 0, despesa: 0 };
        }
        if (record.type === "income") {
          byMonth[month].receita += record.amount;
        } else {
          byMonth[month].despesa += record.amount;
        }
      }
    });

    return Object.entries(byMonth)
      .map(([month, data]) => ({
        mes: meses[Number.parseInt(month)],
        receita: data.receita,
        despesa: data.despesa,
        saldo: data.receita - data.despesa,
      }))
      .sort((a, b) => meses.indexOf(a.mes) - meses.indexOf(b.mes));
  }, [financialRecords]);

  // Calcular resumo de custos por categoria a partir das despesas REAIS
  const custosData = useMemo(() => {
    const records = financialRecords || [];
    const despesas = records.filter((r) => r.type === "expense");

    if (despesas.length === 0) return [];

    const byCategory: { [key: string]: number } = {};

    despesas.forEach((record) => {
      const categoria = record.category || "Outros";
      byCategory[categoria] = (byCategory[categoria] || 0) + record.amount;
    });

    const total = Object.values(byCategory).reduce((sum, val) => sum + val, 0);

    return Object.entries(byCategory)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        percentual: total > 0 ? Math.round((valor / total) * 100) : 0,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [financialRecords]);

  // Calcular dados de "safra" (processos por ano) a partir dos processos REAIS
  const safrasData: SafraData[] = useMemo(() => {
    const processesList = processes || [];
    if (processesList.length === 0) return [];

    const byYear: { [key: number]: Process[] } = {};
    // Use current year as fallback instead of Date.now() for purity
    const currentYear = new Date().getFullYear();
    const fallbackDate = `${currentYear}-01-01`;

    processesList.forEach((process) => {
      // Usar dataDistribuicao ou createdAt como data de referência
      const year = new Date(
        process.dataDistribuicao || process.createdAt || fallbackDate
      ).getFullYear();
      if (!byYear[year]) {
        byYear[year] = [];
      }
      byYear[year].push(process);
    });

    return Object.entries(byYear)
      .map(([year, procs]) => ({
        ano: Number.parseInt(year),
        fechamentos: procs.length,
        emProducao: procs.filter((p) => p.status === "ativo").length,
        transitoJulgado: procs.filter((p) => p.fase === "transitoJulgado").length,
        emExecucao: procs.filter((p) => p.fase === "execucao").length,
        concluidos: procs.filter((p) => p.status === "concluido").length,
        // Resultado não está no tipo Process, então sempre 0 por enquanto
        ganho: 0,
        perdido: 0,
      }))
      .sort((a, b) => b.ano - a.ano);
  }, [processes]);

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão do escritório</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise de produtividade e qualidade dos processos (dados reais)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="estoque">Status dos Processos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="custos">Despesas</TabsTrigger>
          <TabsTrigger value="safra">Safra por Ano</TabsTrigger>
        </TabsList>

        {/* Tab: Produtividade */}
        <TabsContent value="produtividade" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{produtividadeData.totalProcessos}</p>
                      <p className="text-xs text-muted-foreground">Total de Processos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <TrendingUp size={24} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{produtividadeData.processosAtivos}</p>
                      <p className="text-xs text-muted-foreground">Processos Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Clock size={24} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{produtividadeData.processosConcluidos}</p>
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <DollarSign size={24} className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{produtividadeData.taxa}%</p>
                      <p className="text-xs text-muted-foreground">Taxa de Conclusão</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Fluxo Financeiro Mensal</CardTitle>
                <CardDescription>Receitas e despesas do ano atual</CardDescription>
              </CardHeader>
              <CardContent>
                {financeiroData.length === 0 ? (
                  <NoDataMessage message="Nenhum registro financeiro encontrado" />
                ) : (
                  <div className="h-[300px] min-h-[300px]">
                    <ResponsiveContainer width="99%" height="100%" minHeight={300}>
                      <BarChart data={financeiroData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                        <XAxis dataKey="mes" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e2130",
                            border: "1px solid #2a2d3e",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`}
                        />
                        <Legend />
                        <Bar dataKey="receita" fill="#52b788" name="Receita" />
                        <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Status dos Processos */}
        <TabsContent value="estoque" className="mt-6">
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Processos por Status</CardTitle>
                <CardDescription>Visão geral do status atual dos processos</CardDescription>
              </CardHeader>
              <CardContent>
                {estoqueData.length === 0 ? (
                  <NoDataMessage message="Nenhum processo cadastrado" />
                ) : (
                  <div className="h-[300px] min-h-[300px]">
                    <ResponsiveContainer width="99%" height="100%" minHeight={300}>
                      <PieChart>
                        <Pie
                          data={estoqueData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {estoqueData.map((entry) => (
                            <Cell key={`cell-${entry.name}-${entry.value}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e2130",
                            border: "1px solid #2a2d3e",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {estoqueData.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Detalhamento por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Percentual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estoqueData.map((item) => (
                        <TableRow key={item.name}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">{item.value}</TableCell>
                          <TableCell className="text-right">
                            {Math.round(
                              (item.value / estoqueData.reduce((sum, i) => sum + i.value, 0)) * 100
                            )}
                            %
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Financeiro */}
        <TabsContent value="financeiro" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Receita x Despesa</CardTitle>
              <CardDescription>Comparativo mensal do fluxo financeiro</CardDescription>
            </CardHeader>
            <CardContent>
              {financeiroData.length === 0 ? (
                <NoDataMessage message="Nenhum registro financeiro encontrado" />
              ) : (
                <div className="h-[400px] min-h-[400px]">
                  <ResponsiveContainer width="99%" height="100%" minHeight={400}>
                    <BarChart data={financeiroData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                      <XAxis dataKey="mes" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e2130",
                          border: "1px solid #2a2d3e",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`}
                      />
                      <Legend />
                      <Bar dataKey="receita" fill="#52b788" name="Receita (R$)" />
                      <Bar dataKey="despesa" fill="#ef4444" name="Despesa (R$)" />
                      <Bar dataKey="saldo" fill="#00b4d8" name="Saldo (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Despesas */}
        <TabsContent value="custos" className="mt-6">
          {custosData.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <NoDataMessage message="Nenhuma despesa registrada" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Distribuição de Despesas por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] min-h-[250px]">
                      <ResponsiveContainer width="99%" height="100%" minHeight={250}>
                        <PieChart>
                          <Pie
                            data={custosData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props) => {
                              const payload = (props?.payload || {}) as {
                                categoria?: string;
                                percentual?: number;
                              };
                              const categoria = payload?.categoria ?? "";
                              const percentual = payload?.percentual ?? "";
                              return `${categoria} ${percentual}%`;
                            }}
                            outerRadius={80}
                            dataKey="valor"
                            nameKey="categoria"
                          >
                            {custosData.map((entry) => {
                              // Use categoria hash to determine color index
                              const colorIndex =
                                entry.categoria
                                  .split("")
                                  .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6;
                              const colors = [
                                "#ef4444",
                                "#f97316",
                                "#fbbf24",
                                "#84cc16",
                                "#22c55e",
                                "#14b8a6",
                              ];
                              return (
                                <Cell
                                  key={`cell-custo-${entry.categoria}-${entry.valor}`}
                                  fill={colors[colorIndex]}
                                />
                              );
                            })}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1e2130",
                              border: "1px solid #2a2d3e",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Total de Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {custosData.map((item) => (
                        <div key={item.categoria} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.categoria}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.percentual}% do total
                            </p>
                          </div>
                          <p className="text-lg font-bold">
                            R$ {item.valor.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <p className="font-bold">Total</p>
                          <p className="text-xl font-bold text-primary">
                            R${" "}
                            {custosData
                              .reduce((sum, item) => sum + item.valor, 0)
                              .toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab: Safra por Ano */}
        <TabsContent value="safra" className="mt-6">
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Safras de Processos por Ano</CardTitle>
                <CardDescription>Processos agrupados pelo ano de abertura</CardDescription>
              </CardHeader>
              <CardContent>
                {safrasData.length === 0 ? (
                  <NoDataMessage message="Nenhum processo cadastrado" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="bg-primary/20 font-semibold">ANO</TableHead>
                          <TableHead className="bg-primary/20 font-semibold text-center">
                            TOTAL
                          </TableHead>
                          <TableHead className="bg-primary/20 font-semibold text-center">
                            ATIVOS
                          </TableHead>
                          <TableHead className="bg-primary/20 font-semibold text-center">
                            TR. JULGADO
                          </TableHead>
                          <TableHead className="bg-primary/20 font-semibold text-center">
                            EXECUÇÃO
                          </TableHead>
                          <TableHead className="bg-primary/20 font-semibold text-center">
                            CONCLUÍDOS
                          </TableHead>
                          <TableHead className="bg-primary/20 font-semibold text-center">
                            GANHOS
                          </TableHead>
                          <TableHead className="bg-primary/20 font-semibold text-center">
                            PERDIDOS
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {safrasData.map((safra, index) => (
                          <TableRow
                            key={safra.ano}
                            className={`border-border ${
                              index % 2 === 0 ? "bg-muted/30" : "bg-muted/10"
                            } hover:bg-muted/50`}
                          >
                            <TableCell className="font-medium">{safra.ano}</TableCell>
                            <TableCell className="text-center">{safra.fechamentos}</TableCell>
                            <TableCell className="text-center">{safra.emProducao}</TableCell>
                            <TableCell className="text-center">{safra.transitoJulgado}</TableCell>
                            <TableCell className="text-center">{safra.emExecucao}</TableCell>
                            <TableCell className="text-center">{safra.concluidos}</TableCell>
                            <TableCell className="text-center text-green-500">
                              {safra.ganho > 0
                                ? `${safra.ganho} (${Math.round(
                                    (safra.ganho / safra.fechamentos) * 100
                                  )}%)`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center text-red-500">
                              {safra.perdido > 0
                                ? `${safra.perdido} (${Math.round(
                                    (safra.perdido / safra.fechamentos) * 100
                                  )}%)`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filtros para relatório detalhado */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filtrar Processos</CardTitle>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-1 bg-background border border-border rounded text-sm">
                      <option>Todos os anos</option>
                      {safrasData.map((s) => (
                        <option key={s.ano} value={s.ano}>
                          {s.ano}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm">
                      Aplicar Filtro
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use os filtros acima para visualizar processos específicos por ano.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

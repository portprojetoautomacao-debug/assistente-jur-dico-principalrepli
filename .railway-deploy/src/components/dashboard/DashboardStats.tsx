/**
 * Dashboard Statistics Cards
 * Separated for better code splitting and performance
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, Gavel } from "lucide-react";

interface DashboardStatsProps {
  readonly stats: Readonly<{
    ativos: number;
    concluidos: number;
    prazosPendentes: number;
    prazosUrgentes: number;
  }>;
}

export function DashboardStats({ stats }: Readonly<DashboardStatsProps>) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-linear-to-br from-accent-3 to-accent-4 border-accent-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-accent-11">Processos Ativos</CardTitle>
          <Gavel className="h-4 w-4 text-accent-9" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent-12">{stats.ativos}</div>
          <p className="text-xs text-accent-11">Em andamento</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-accent-secondary-3 to-accent-secondary-4 border-accent-secondary-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-accent-secondary-11">Concluídos</CardTitle>
          <CheckCircle className="h-4 w-4 text-accent-secondary-9" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent-secondary-12">{stats.concluidos}</div>
          <p className="text-xs text-accent-secondary-11">Finalizados</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-neutral-3 to-neutral-4 border-neutral-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-neutral-11">Prazos Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-neutral-9" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neutral-12">{stats.prazosPendentes}</div>
          <p className="text-xs text-neutral-11">A vencer</p>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-br from-red-500/10 to-red-600/10 border-red-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-300">Prazos Urgentes</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-200">{stats.prazosUrgentes}</div>
          <p className="text-xs text-red-300">Atenção imediata</p>
        </CardContent>
      </Card>
    </div>
  );
}

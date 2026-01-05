import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { FileText, Paperclip, Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
// ✅ OTIMIZAÇÃO: Imports separados para melhor tree-shaking
import { formatCurrency } from "@/lib/utils";
import type { FinancialEntry } from "@/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export default function FinancialManagementAdvbox() {
  const [entries, setEntries] = useKV<FinancialEntry[]>("financialEntries", []);
  const [showDialog, setShowDialog] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newEntry, setNewEntry] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const stats = useMemo(() => {
    const entriesList = entries || [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const thisMonthEntries = entriesList.filter((e) => {
      const entryDate = new Date(e.date);
      return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
    });

    const thisWeekEntries = entriesList.filter((e) => {
      const entryDate = new Date(e.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    const valorPrevisto = thisMonthEntries
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);

    const aReceberSemana = thisWeekEntries
      .filter((e) => e.type === "income" && new Date(e.date) >= new Date())
      .reduce((sum, e) => sum + e.amount, 0);

    const aPagarSemana = thisWeekEntries
      .filter((e) => e.type === "expense" && new Date(e.date) >= new Date())
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      valorPrevisto,
      aReceberSemana,
      aPagarSemana,
    };
  }, [entries]);

  // Chart data for Revenue vs Expenses
  const chartData = useMemo(() => {
    const entriesList = entries || [];
    const monthlyData: { [key: string]: { receitas: number; despesas: number } } = {};

    // Generate last 6 months
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      months.push(monthKey);
      monthlyData[monthKey] = { receitas: 0, despesas: 0 };
    }

    // Aggregate data
    entriesList.forEach((entry) => {
      const monthKey = new Date(entry.date).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      if (monthlyData[monthKey]) {
        if (entry.type === "income") {
          monthlyData[monthKey].receitas += entry.amount;
        } else {
          monthlyData[monthKey].despesas += entry.amount;
        }
      }
    });

    return months.map((month) => ({
      month,
      Receitas: monthlyData[month].receitas,
      Despesas: monthlyData[month].despesas,
    }));
  }, [entries]);

  const handleAddEntry = () => {
    if (!newEntry.amount || !newEntry.category || !newEntry.date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const entry: FinancialEntry = {
      id: crypto.randomUUID(),
      type: newEntry.type,
      amount: Number.parseFloat(newEntry.amount),
      category: newEntry.category,
      description: newEntry.description,
      date: newEntry.date,
    };

    setEntries((current) => [...(current || []), entry]);
    setShowDialog(false);
    setAttachments([]);
    setNewEntry({
      type: "income",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });

    if (attachments.length > 0) {
      toast.success(`Lançamento adicionado com ${attachments.length} anexo(s)`);
    } else {
      toast.success("Lançamento adicionado");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments: FileAttachment[] = Array.from(files).map((fileItem) => ({
        id: crypto.randomUUID(),
        name: fileItem.name,
        size: fileItem.size,
        type: fileItem.type,
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
      toast.success(`${files.length} arquivo(s) anexado(s)`);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    toast.info("Anexo removido");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de receitas e despesas</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
              <DialogDescription>Adicione uma nova receita ou despesa</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={newEntry.type}
                  onValueChange={(value: "income" | "expense") =>
                    setNewEntry({ ...newEntry, type: value })
                  }
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  placeholder="Ex: Honorários, Custas processuais..."
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Descrição do lançamento"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="bg-background border-border"
                />
              </div>

              {/* File Attachments */}
              <div>
                <Label>Anexar Documentos</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Paperclip size={16} className="mr-2" />
                    Escolher Arquivos
                  </Button>
                </div>

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText size={16} className="text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeAttachment(attachment.id)}
                          aria-label="Remover anexo"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddEntry} className="flex-1">
                  Adicionar
                </Button>
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Valor previsto este mês</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-500" size={20} />
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.valorPrevisto)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">A receber esta semana</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-500" size={20} />
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.aReceberSemana)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">A pagar esta semana</p>
              <div className="flex items-center gap-2">
                <TrendingDown className="text-red-500" size={20} />
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.aPagarSemana)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">
            Receitas x Despesas (Últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e2130",
                    border: "1px solid #2a2d3e",
                    borderRadius: "8px",
                    color: "#e8eaed",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ color: "#e8eaed" }} />
                <Bar dataKey="Receitas" fill="#52b788" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">
            Lançamentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(entries || []).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum lançamento cadastrado</p>
            ) : (
              <div className="space-y-2">
                {[...(entries || [])]
                  .reverse()
                  .slice(0, 10)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{entry.description || entry.category}</p>
                        <p className="text-xs text-muted-foreground">{entry.category}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("pt-BR")}
                        </span>
                        <span
                          className={`font-semibold ${
                            entry.type === "income" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {entry.type === "income" ? "+" : "-"} {formatCurrency(entry.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

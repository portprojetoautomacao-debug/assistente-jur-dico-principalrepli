import { useState, useEffect } from "react";
import type { Process } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validarNumeroCNJ, formatarNumeroCNJ } from "@/lib/prazos";
import { toast } from "sonner";

interface ProcessDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly process?: Process;
  readonly onSave: (process: Process) => void;
}

// Helper to create initial form data
function createInitialFormData(process?: Process) {
  if (process) {
    return {
      numeroCNJ: process.numeroCNJ,
      titulo: process.titulo,
      autor: process.autor,
      reu: process.reu,
      comarca: process.comarca,
      vara: process.vara,
      status: process.status,
      valor: process.valor?.toString() || "",
      dataDistribuicao: process.dataDistribuicao,
      notas: process.notas || "",
    };
  }
  return {
    numeroCNJ: "",
    titulo: "",
    autor: "",
    reu: "",
    comarca: "",
    vara: "",
    status: "ativo" as Process["status"],
    valor: "",
    dataDistribuicao: new Date().toISOString().split("T")[0],
    notas: "",
  };
}

export default function ProcessDialog({ open, onOpenChange, process, onSave }: ProcessDialogProps) {
  // Initialize form data with lazy initialization
  const [formData, setFormData] = useState(() => createInitialFormData(process));

  // Sync form data when process changes and dialog is opened
  useEffect(() => {
    if (!open) return; // Não atualiza quando o diálogo está fechado

    // Schedule to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setFormData(createInitialFormData(process));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [process, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarNumeroCNJ(formData.numeroCNJ)) {
      toast.error("Número CNJ inválido", {
        description: "O número CNJ deve conter 20 dígitos",
      });
      return;
    }

    if (!formData.titulo.trim() || !formData.autor.trim() || !formData.reu.trim()) {
      toast.error("Campos obrigatórios", {
        description: "Preencha todos os campos obrigatórios",
      });
      return;
    }

    const now = new Date().toISOString();
    const processData: Process = {
      id: process?.id || `proc_${Date.now()}`,
      numeroCNJ: formatarNumeroCNJ(formData.numeroCNJ),
      titulo: formData.titulo.trim(),
      autor: formData.autor.trim(),
      reu: formData.reu.trim(),
      comarca: formData.comarca.trim(),
      vara: formData.vara.trim(),
      status: formData.status,
      valor: formData.valor ? Number.parseFloat(formData.valor) : undefined,
      dataDistribuicao: formData.dataDistribuicao,
      dataUltimaMovimentacao: now,
      notas: formData.notas.trim(),
      prazos: process?.prazos || [],
      createdAt: process?.createdAt || now,
      updatedAt: now,
    };

    onSave(processData);
    toast.success(process ? "Processo atualizado" : "Processo criado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{process ? "Editar Processo" : "Novo Processo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="numeroCNJ">Número CNJ *</Label>
              <Input
                id="numeroCNJ"
                placeholder="0000000-00.0000.0.00.0000"
                value={formData.numeroCNJ}
                onChange={(e) => setFormData((f) => ({ ...f, numeroCNJ: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="titulo">Título/Assunto *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Ação de Cobrança"
                value={formData.titulo}
                onChange={(e) => setFormData((f) => ({ ...f, titulo: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="autor">Autor *</Label>
              <Input
                id="autor"
                placeholder="Nome do autor"
                value={formData.autor}
                onChange={(e) => setFormData((f) => ({ ...f, autor: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reu">Réu *</Label>
              <Input
                id="reu"
                placeholder="Nome do réu"
                value={formData.reu}
                onChange={(e) => setFormData((f) => ({ ...f, reu: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="comarca">Comarca</Label>
              <Input
                id="comarca"
                placeholder="Ex: São Paulo"
                value={formData.comarca}
                onChange={(e) => setFormData((f) => ({ ...f, comarca: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="vara">Vara</Label>
              <Input
                id="vara"
                placeholder="Ex: 1ª Vara Cível"
                value={formData.vara}
                onChange={(e) => setFormData((f) => ({ ...f, vara: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((f) => ({
                    ...f,
                    status: value as Process["status"],
                  }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="dataDistribuicao">Data Distribuição</Label>
              <Input
                id="dataDistribuicao"
                type="date"
                value={formData.dataDistribuicao}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    dataDistribuicao: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="valor">Valor da Causa (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor}
                onChange={(e) => setFormData((f) => ({ ...f, valor: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="notas">Observações</Label>
              <Textarea
                id="notas"
                placeholder="Adicione notas ou observações sobre o processo..."
                value={formData.notas}
                onChange={(e) => setFormData((f) => ({ ...f, notas: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{process ? "Salvar Alterações" : "Criar Processo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

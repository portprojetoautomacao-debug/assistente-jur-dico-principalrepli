import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly onConfirm: () => void | boolean | Promise<void | boolean>;
  readonly variant?: "default" | "destructive";
  readonly confirmDisabled?: boolean;
  readonly autoCloseOnConfirmResult?: boolean;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default",
  confirmDisabled = false,
  autoCloseOnConfirmResult = true,
}: ConfirmDialogProps) {
  const [confirming, setConfirming] = useState(false);

  const isDestructive = variant === "destructive";

  const handleConfirmClick = () => {
    try {
      const res = onConfirm();
      if (res instanceof Promise) {
        setConfirming(true);
        res
          .then((value) => {
            if (autoCloseOnConfirmResult && value === true) {
              onOpenChange(false);
            }
          })
          .catch((err) => {
            console.error("[ConfirmDialog] Erro no onConfirm:", err);
          })
          .finally(() => setConfirming(false));
      } else if (autoCloseOnConfirmResult && res === true) {
        // Resultado síncrono: fechar se autoClose habilitado e resultado true
        onOpenChange(false);
      }
    } catch (err) {
      console.error("[ConfirmDialog] Erro no onConfirm (sync):", err);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glassmorphic">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDestructive && <AlertTriangle className="text-destructive" size={20} />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={confirming}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClick}
            disabled={confirmDisabled || confirming}
            className={
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "button-gradient"
            }
          >
            {confirming ? "Processando..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

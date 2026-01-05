import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Command } from "lucide-react";

interface ShortcutItemProps {
  readonly keys: string[];
  readonly description: string;
}

function ShortcutItem({ keys, description }: Readonly<ShortcutItemProps>) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key) => (
          <Badge key={key} variant="outline" className="font-mono">
            {key}
          </Badge>
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

type ShortcutConfig = {
  keys: string[];
  description: string;
};

type ShortcutGroup = {
  title: string;
  items: ShortcutConfig[];
};

// Grupos de atalhos configuráveis (mais fácil de manter/evoluir)
const NAVIGATION_SHORTCUTS: ShortcutConfig[] = [
  { keys: ["{CTRL}", "D"], description: "Ir para Dashboard" },
  { keys: ["{CTRL}", "P"], description: "Ir para Processos" },
  { keys: ["{CTRL}", "K"], description: "Buscar processos" },
];

const QUICK_ACTION_SHORTCUTS: ShortcutConfig[] = [
  { keys: ["{CTRL}", "N"], description: "Novo processo (mostra dica)" },
  {
    keys: ["{CTRL}", "Shift", "C"],
    description: "Abrir Calculadora de Prazos",
  },
];

const GENERAL_SHORTCUTS: ShortcutConfig[] = [
  { keys: ["Esc"], description: "Fechar diálogos" },
  { keys: ["Tab"], description: "Navegar entre campos" },
  { keys: ["Shift", "Tab"], description: "Navegar para trás" },
];

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navegação",
    items: NAVIGATION_SHORTCUTS,
  },
  {
    title: "Ações Rápidas",
    items: QUICK_ACTION_SHORTCUTS,
  },
  {
    title: "Geral",
    items: GENERAL_SHORTCUTS,
  },
];

export default function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  // SSR-safe: navigator pode não existir no build / server
  // Usar userAgent ao invés de navigator.platform (deprecated)
  const isMac =
    typeof navigator !== "undefined" &&
    (navigator.userAgent.includes("Mac") ||
      navigator.userAgent.includes("iPhone") ||
      navigator.userAgent.includes("iPad"));

  const ctrlKeyLabel = isMac ? "⌘" : "Ctrl";

  // Substitui marcador {CTRL} pela tecla apropriada
  const resolveKeys = (keys: string[]) =>
    keys.map((key) => (key === "{CTRL}" ? ctrlKeyLabel : key));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command size={24} />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Use estes atalhos para navegar mais rapidamente pelo sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {SHORTCUT_GROUPS.map((group, idx) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold mb-2">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => (
                  <ShortcutItem
                    key={`${group.title}-${itemIdx}`}
                    keys={resolveKeys(item.keys)}
                    description={item.description}
                  />
                ))}
              </div>
              {idx < SHORTCUT_GROUPS.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          <Separator />

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Dica:</strong> Você pode pressionar{" "}
              <Badge variant="outline" className="font-mono mx-1">
                ?
              </Badge>{" "}
              a qualquer momento para ver esta lista de atalhos.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

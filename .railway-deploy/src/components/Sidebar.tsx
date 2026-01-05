import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { User, ViewType } from "@/types";
import {
  BookOpen,
  Bot,
  Briefcase,
  Calculator,
  Calendar,
  Database,
  DollarSign,
  FileText,
  FolderOpen,
  Home,
  Inbox,
  LogOut,
  Mic,
  Newspaper,
  PenLine,
} from "lucide-react";

interface SidebarProps {
  readonly currentView: string;
  readonly onViewChange: (view: ViewType) => void;
  readonly user: User | null;
  readonly onLogout: () => void;
}

const NAVIGATION_ITEMS = [
  { id: "dashboard", label: "Meu Painel", icon: Home },
  { id: "donna", label: "Harvey Specter", icon: Bot, featured: true },
  { id: "ai-agents", label: "Agentes de IA", icon: Bot },
  { id: "acervo", label: "Acervo PJe", icon: FolderOpen },
  { id: "processes", label: "Acervo (CRM)", icon: Briefcase },
  { id: "expedientes", label: "Expedientes", icon: Inbox },
  { id: "minutas", label: "Minutas", icon: PenLine },
  { id: "batch", label: "Análise em Lote", icon: FileText },
  { id: "audio", label: "Transcrição", icon: Mic },
  { id: "calculator", label: "Calc. Prazos", icon: Calculator },
  { id: "queries", label: "Consultas", icon: Database },
  { id: "datajud", label: "DataJud Checklist", icon: Newspaper },
  { id: "calendar", label: "Agenda", icon: Calendar },
  { id: "financial", label: "Financeiro", icon: DollarSign },
  { id: "knowledge", label: "Base Conhecimento", icon: BookOpen },
];

export default function Sidebar({
  currentView,
  onViewChange,
  user,
  onLogout,
}: Readonly<SidebarProps>) {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">PJe Assistente</h2>
        </div>
        <p className="text-sm text-muted-foreground">Agentes IA Autônomos 24/7</p>
        <Badge className="mt-2 bg-green-500/10 text-green-700 border-green-500/20">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
          {"Gemini AI Ativo"}
        </Badge>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1" data-testid="sidebar-nav">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isFeatured = "featured" in item && item.featured;

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  isFeatured &&
                    !isActive &&
                    "border border-purple-500/30 bg-linear-to-r from-purple-500/5 to-pink-500/5"
                )}
                data-testid={`nav-${item.id}`}
                onClick={() => {
                  // Atualiza estado e URL hash para fallback de roteamento
                  const view = item.id as ViewType;
                  try {
                    if (globalThis.window !== undefined) {
                      globalThis.window.location.hash = `#${view}`;
                    }
                  } catch {
                    // ignore ambientes sem window
                  }
                  onViewChange(view);
                }}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
                {isFeatured && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-xs bg-linear-to-r from-purple-500 to-pink-500 text-white border-0"
                  >
                    Novo
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-3">
        {user && (
          <>
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <Separator />
          </>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
}

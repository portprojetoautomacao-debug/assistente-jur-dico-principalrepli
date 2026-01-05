/**
 * GlobalSearch - Busca global com atalho "/"
 *
 * Funcionalidades:
 * - Atalho "/" para abrir
 * - Busca em processos, clientes, minutas, expedientes
 * - Categorias: Tudo, Processos, Pessoas, Minutas
 * - Resultados em tempo real
 * - Navegação por teclado
 */

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKV } from "@/hooks/use-kv";
import type { Expediente, Minuta, Process } from "@/types";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Command,
  FileText,
  Folder,
  Inbox,
  Search,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Tipo para cliente (simplificado)
interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpfCnpj?: string;
}

// Tipo para resultado de busca
interface SearchResult {
  id: string;
  type: "processo" | "cliente" | "minuta" | "expediente";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data: unknown;
}

// Categorias de busca
type SearchCategory = "all" | "processos" | "clientes" | "minutas" | "expedientes";

interface GlobalSearchProps {
  readonly onNavigate?: (view: string, data?: unknown) => void;
}

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dados do KV
  const [processes] = useKV<Process[]>("processes", []);
  const [clientes] = useKV<Cliente[]>("clientes", []);
  const [minutas] = useKV<Minuta[]>("minutas", []);
  const [expedientes] = useKV<Expediente[]>("expedientes", []);

  // Atalho "/" para abrir busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em um input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Função para fechar o modal com reset
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setCategory("all");
    setSelectedIndex(0);
    setResults([]);
  }, []);

  // Focar input quando abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Função de busca
  const performSearch = useCallback(
    (searchQuery: string, searchCategory: SearchCategory) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      const q = searchQuery.toLowerCase().trim();
      const newResults: SearchResult[] = [];

      // Buscar em processos
      if (searchCategory === "all" || searchCategory === "processos") {
        const matchedProcesses = (processes || [])
          .filter(
            (p) =>
              p.numeroCNJ?.toLowerCase().includes(q) ||
              p.titulo?.toLowerCase().includes(q) ||
              p.autor?.toLowerCase().includes(q) ||
              p.reu?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((p) => ({
            id: p.id,
            type: "processo" as const,
            title: p.titulo || p.numeroCNJ || "Processo sem título",
            subtitle: `${p.numeroCNJ || "Sem número"} • ${p.status || "Ativo"}`,
            icon: <Folder className="w-4 h-4 text-blue-500" />,
            data: p,
          }));
        newResults.push(...matchedProcesses);
      }

      // Buscar em clientes
      if (searchCategory === "all" || searchCategory === "clientes") {
        const matchedClientes = (clientes || [])
          .filter(
            (c) =>
              c.nome?.toLowerCase().includes(q) ||
              c.email?.toLowerCase().includes(q) ||
              c.cpfCnpj?.includes(q)
          )
          .slice(0, 5)
          .map((c) => ({
            id: c.id,
            type: "cliente" as const,
            title: c.nome || "Cliente sem nome",
            subtitle: c.email || c.telefone || "Sem contato",
            icon: <User className="w-4 h-4 text-green-500" />,
            data: c,
          }));
        newResults.push(...matchedClientes);
      }

      // Buscar em minutas
      if (searchCategory === "all" || searchCategory === "minutas") {
        const matchedMinutas = (minutas || [])
          .filter(
            (m) => m.titulo?.toLowerCase().includes(q) || m.conteudo?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((m) => ({
            id: m.id,
            type: "minuta" as const,
            title: m.titulo || "Minuta sem título",
            subtitle: `${m.tipo} • ${m.status}`,
            icon: <FileText className="w-4 h-4 text-purple-500" />,
            data: m,
          }));
        newResults.push(...matchedMinutas);
      }

      // Buscar em expedientes
      if (searchCategory === "all" || searchCategory === "expedientes") {
        const matchedExpedientes = (expedientes || [])
          .filter(
            (e) =>
              e.numeroProcesso?.toLowerCase().includes(q) ||
              e.summary?.toLowerCase().includes(q) ||
              e.tribunal?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((e) => ({
            id: e.id,
            type: "expediente" as const,
            title: e.numeroProcesso || "Expediente",
            subtitle: e.summary?.slice(0, 60) + "..." || e.tribunal || "Sem resumo",
            icon: <Inbox className="w-4 h-4 text-orange-500" />,
            data: e,
          }));
        newResults.push(...matchedExpedientes);
      }

      setResults(newResults);
      setSelectedIndex(0);
    },
    [processes, clientes, minutas, expedientes]
  );

  // Efeito para busca com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, category);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, category, performSearch]);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        closeSearch();
        break;
    }
  };

  // Selecionar resultado
  const handleSelect = (result: SearchResult) => {
    closeSearch();

    // Navegar para a view correspondente
    switch (result.type) {
      case "processo":
        onNavigate?.("processos", result.data);
        break;
      case "cliente":
        onNavigate?.("processos", result.data);
        break;
      case "minuta":
        onNavigate?.("minutas", result.data);
        break;
      case "expediente":
        onNavigate?.("expedientes", result.data);
        break;
    }
  };

  // Categorias
  const categories: { id: SearchCategory; label: string; count: number }[] = [
    { id: "all", label: "Tudo", count: results.length },
    {
      id: "processos",
      label: "Processos",
      count: results.filter((r) => r.type === "processo").length,
    },
    {
      id: "clientes",
      label: "Pessoas",
      count: results.filter((r) => r.type === "cliente").length,
    },
    {
      id: "minutas",
      label: "Minutas",
      count: results.filter((r) => r.type === "minuta").length,
    },
    {
      id: "expedientes",
      label: "Expedientes",
      count: results.filter((r) => r.type === "expediente").length,
    },
  ];

  return (
    <>
      {/* Botão de atalho (opcional, pode ser usado na navbar) */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 rounded-md border border-border hover:bg-muted transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Buscar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-background rounded border">
          /
        </kbd>
      </button>

      {/* Dialog de busca */}
      <Dialog
        open={isOpen}
        onOpenChange={(isDialogOpen) => {
          if (!isDialogOpen) {
            closeSearch();
          }
        }}
      >
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Busca Global</DialogTitle>
          </VisuallyHidden>
          {/* Header com input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar processos, clientes, minutas..."
              className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1 hover:bg-muted rounded">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-muted rounded">
              ESC
            </kbd>
          </div>

          {/* Categorias */}
          <div className="flex items-center gap-1 px-4 py-2 border-b bg-muted/30">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  category === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {cat.label}
                {query && cat.count > 0 && (
                  <span className="ml-1 text-xs opacity-70">({cat.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Resultados */}
          <ScrollArea className="max-h-[400px]">
            {(() => {
              if (!query) {
                return (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Digite para pesquisar em todo o sistema</p>
                    <p className="text-xs mt-1 opacity-70">
                      Processos, clientes, minutas, expedientes...
                    </p>
                  </div>
                );
              }

              if (results.length === 0) {
                return (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">Nenhum resultado para "{query}"</p>
                    <p className="text-xs mt-1 opacity-70">Tente outro termo de busca</p>
                  </div>
                );
              }

              return (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-background rounded-lg border">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {result.type}
                      </Badge>
                      {index === selectedIndex && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              );
            })()}
          </ScrollArea>

          {/* Footer com atalhos */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <ArrowDown className="w-3 h-3" />
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">↵</kbd>{" "}
                selecionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">esc</kbd> fechar
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>Pressione / para abrir</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GlobalSearch;

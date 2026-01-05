/**
 * NotificationCenter - Sistema de notificações em tempo real
 *
 * Funcionalidades:
 * - Notificações push em tempo real
 * - Badge de contagem na navbar
 * - Lista de notificações com "Limpar todas"
 * - Sons de notificação (hook pronto para integrar)
 * - Persistência via useKV (localStorage / IndexedDB)
 * - Categorias: prazos, agentes, sistema etc.
 */

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useExpedientes } from "@/hooks/use-expedientes";
import { useKV } from "@/hooks/use-kv";
import type { Expediente } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Bot,
  CheckCircle,
  Clock,
  FileText,
  Inbox,
  Info,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

// Tipos de notificação
export type NotificationType =
  | "prazo_urgente" // Prazo vencendo
  | "prazo_vencido" // Prazo vencido
  | "agente_tarefa" // Agente completou tarefa
  | "nova_intimacao" // Nova intimação detectada
  | "minuta_criada" // Nova minuta criada por agente
  | "sistema" // Notificação do sistema
  | "sucesso" // Ação concluída com sucesso
  | "erro"; // Erro ocorreu

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data?: Record<string, unknown>;
  action?: {
    label: string;
    view: string;
    payload?: unknown;
  };
}

// Configuração de ícones e cores por tipo
const notificationConfig: Record<
  NotificationType,
  {
    icon: ReactNode;
    color: string;
    bgColor: string;
  }
> = {
  prazo_urgente: {
    icon: <Clock className="w-4 h-4" />,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  prazo_vencido: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  agente_tarefa: {
    icon: <Bot className="w-4 h-4" />,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  nova_intimacao: {
    icon: <Inbox className="w-4 h-4" />,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  minuta_criada: {
    icon: <FileText className="w-4 h-4" />,
    color: "text-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  sistema: {
    icon: <Info className="w-4 h-4" />,
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
  },
  sucesso: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  erro: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

interface NotificationCenterProps {
  onNavigate?: (view: string, data?: unknown) => void;
}

// Fallback seguro para IDs caso crypto.randomUUID não exista
function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NotificationCenter({ onNavigate }: Readonly<NotificationCenterProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useKV<Notification[]>("notifications", []);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const prevCountRef = useRef(0);
  const { expedientes } = useExpedientes(); // ✅ Expedientes reais para notificações
  const prevExpedientesCountRef = useRef(0);

  // Contagem de não lidas
  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  // Detectar novas notificações
  useEffect(() => {
    const currentCount = notifications?.length || 0;

    if (currentCount > prevCountRef.current && prevCountRef.current > 0) {
      // Schedule state update to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setHasNewNotifications(true);
      }, 0);
      // Atualiza ref dentro do if e retorna cleanup
      prevCountRef.current = currentCount;
      return () => clearTimeout(timeoutId);
    }

    // Atualiza ref apenas quando não houve notificação nova
    prevCountRef.current = currentCount;
  }, [notifications]);

  // Função para adicionar notificação (usada pelo sistema)
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: generateId(),
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications(
        (current) => [newNotification, ...(current || [])].slice(0, 100) // limite de 100 últimas
      );
    },
    [setNotifications]
  );

  // Marcar como lida
  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((current) =>
        (current || []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [setNotifications]
  );

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications((current) => (current || []).map((n) => ({ ...n, read: true })));
    setHasNewNotifications(false);
  }, [setNotifications]);

  // Remover notificação
  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((current) => (current || []).filter((n) => n.id !== id));
    },
    [setNotifications]
  );

  // Limpar todas
  const clearAll = useCallback(() => {
    setNotifications([]);
    setHasNewNotifications(false);
  }, [setNotifications]);

  // Handler de clique na notificação
  const handleClick = (notification: Notification) => {
    if (notification.read === false) {
      markAsRead(notification.id);
    }

    if (notification.action) {
      setIsOpen(false);
      onNavigate?.(notification.action.view, notification.action.payload);
    }
  };

  // Criar notificações automáticas para novos expedientes
  useEffect(() => {
    const currentCount = expedientes?.length || 0;

    if (currentCount > prevExpedientesCountRef.current && prevExpedientesCountRef.current > 0) {
      const novosExpedientes =
        expedientes?.slice(0, currentCount - prevExpedientesCountRef.current) || [];

      novosExpedientes.forEach((exp: Expediente) => {
        addNotification({
          type: "nova_intimacao",
          title: "Nova Intimação Detectada",
          message:
            exp.descricao ||
            exp.conteudo ||
            exp.summary ||
            "Nova intimação processada automaticamente",
          data: { expedienteId: exp.id },
          action: {
            label: "Ver detalhes",
            view: "processos",
            payload: { expedienteId: exp.id },
          },
        });
      });
    }

    prevExpedientesCountRef.current = currentCount;
  }, [expedientes, addNotification]);

  // Expor função global para adicionar notificações (útil para agentes / websockets)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).addNotification = addNotification;
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).addNotification;
    };
  }, [addNotification]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title={unreadCount > 0 ? `${unreadCount} notificação(ões) não lida(s)` : "Notificações"}
        >
          {hasNewNotifications || unreadCount > 0 ? (
            <BellRing className="w-5 h-5 animate-pulse" />
          ) : (
            <Bell className="w-5 h-5" />
          )}

          {/* Badge de contagem */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notificações</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                Marcar como lidas
              </Button>
            )}
            {(notifications?.length || 0) > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-7 w-7"
                title="Limpar todas"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Lista de notificações */}
        <ScrollArea className="max-h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs mt-1 opacity-70">
                Você será notificado sobre prazos, intimações e tarefas dos agentes.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = notificationConfig[notification.type] || notificationConfig.sistema;

                let relativeTime = "";
                try {
                  relativeTime = formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  });
                } catch {
                  relativeTime = "";
                }

                return (
                  <button
                    key={notification.id}
                    className={`group relative flex gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      notification.read ? "" : "bg-muted/30"
                    }`}
                    onClick={() => handleClick(notification)}
                    type="button"
                  >
                    {/* Indicador de não lida */}
                    {!notification.read && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                    )}

                    {/* Ícone */}
                    <div
                      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${config.bgColor} ${config.color}`}
                    >
                      {config.icon}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          notification.read ? "text-muted-foreground" : ""
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      {relativeTime && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{relativeTime}</p>
                      )}
                    </div>

                    {/* Botão remover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {(notifications?.length || 0) > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              {notifications?.length} notificação(ões) • {unreadCount} não lida(s)
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;

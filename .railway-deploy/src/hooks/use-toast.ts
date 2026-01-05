import { useCallback, useRef, useState } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  // Use ref to avoid circular dependency between toast and dismiss
  // Ref pode iniciar nulo até atribuirmos função dismiss
  // Ajuste: fornecer valor inicial compatível com assinatura de useRef<T>(initialValue: T)
  const dismissRef = useRef<(toastId?: string) => void>(() => {});

  const dismiss = useCallback((toastId?: string) => {
    setState((prev) => ({
      toasts: toastId ? prev.toasts.filter((t) => t.id !== toastId) : [],
    }));
  }, []);

  // Update ref when dismiss changes
  dismissRef.current = dismiss;

  const toast = useCallback(
    ({ title, description, variant = "default", duration = 3000 }: Omit<Toast, "id">) => {
      const id = String(toastCount++);
      const newToast: Toast = { id, title, description, variant, duration };

      setState((prev) => ({
        toasts: [...prev.toasts, newToast],
      }));

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          dismissRef.current?.(id);
        }, duration);
      }

      return id;
    },
    []
  );

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
}

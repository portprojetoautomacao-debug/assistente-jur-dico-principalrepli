import { useKV } from "@/hooks/use-kv";
import type { Prazo, Process } from "@/types";
import { useEffect, useMemo } from "react";

interface NotificationPreferences {
  enabled: boolean;
  prazoAlerts: boolean;
  agentAlerts: boolean;
  financialAlerts: boolean;
}

/**
 * Build notification body with prazo info
 */
function buildPrazoBody(prazo: Prazo, suffix: string): string {
  const processInfo = prazo.processId ? ` (${prazo.processId})` : "";
  return `${prazo.descricao}${processInfo} ${suffix}`;
}

export function useNotifications() {
  // CORRIGIDO: Buscar prazos dos PROCESSOS (onde realmente estão salvos)
  const [processes] = useKV<Process[]>("processes", []);
  const [preferences, setPreferences] = useKV<NotificationPreferences>("notification-preferences", {
    enabled: true,
    prazoAlerts: true,
    agentAlerts: true,
    financialAlerts: true,
  });

  // Extrair todos os prazos de todos os processos
  const prazos = useMemo(() => {
    const allPrazos: (Prazo & { processoNumero?: string })[] = [];
    processes?.forEach((process) => {
      process.prazos?.forEach((prazo) => {
        allPrazos.push({
          ...prazo,
          processoNumero: process.numeroCNJ,
        });
      });
    });
    return allPrazos;
  }, [processes]);

  useEffect(() => {
    if (!preferences?.enabled) return;

    if ("Notification" in globalThis && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("🔔 Notificações Ativadas", {
            body: "Você receberá alertas sobre prazos importantes",
            icon: "/icon-192.png",
          });
        }
      });
    }
  }, [preferences?.enabled]);

  useEffect(() => {
    if (!preferences?.enabled || !preferences?.prazoAlerts) return;
    if (Notification.permission !== "granted") return;

    const checkPrazos = () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const prazosAtivos = (prazos || []).filter((p) => !p.concluido);

      prazosAtivos.forEach((prazo) => {
        const vencimento = new Date(prazo.dataFinal);
        vencimento.setHours(0, 0, 0, 0);

        const diffTime = vencimento.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diasRestantes === 7) {
          new Notification("⚖️ Prazo em 7 dias", {
            body: buildPrazoBody(prazo, "vence em uma semana"),
            icon: "/icon-192.png",
            tag: `prazo-7-${prazo.id}`,
            requireInteraction: false,
          });
        } else if (diasRestantes === 2) {
          new Notification("⚠️ Prazo em 2 dias!", {
            body: buildPrazoBody(prazo, "vence em 2 dias"),
            icon: "/icon-192.png",
            tag: `prazo-2-${prazo.id}`,
            requireInteraction: true,
          });
        } else if (diasRestantes === 1) {
          new Notification("🚨 Prazo AMANHÃ!", {
            body: buildPrazoBody(prazo, "vence amanhã!"),
            icon: "/icon-192.png",
            tag: `prazo-1-${prazo.id}`,
            requireInteraction: true,
          });
        } else if (diasRestantes === 0) {
          new Notification("🔴 PRAZO HOJE!", {
            body: buildPrazoBody(prazo, "vence HOJE!"),
            icon: "/icon-192.png",
            tag: `prazo-0-${prazo.id}`,
            requireInteraction: true,
          });
        }
      });
    };

    checkPrazos();
    const interval = setInterval(checkPrazos, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [prazos, preferences]);

  const requestPermission = async () => {
    if (!("Notification" in globalThis)) {
      return "not-supported";
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPreferences((current) => ({
        enabled: true,
        prazoAlerts: current?.prazoAlerts ?? true,
        agentAlerts: current?.agentAlerts ?? true,
        financialAlerts: current?.financialAlerts ?? true,
      }));
    }
    return permission;
  };

  const testNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("🧪 Teste de Notificação", {
        body: "As notificações estão funcionando corretamente!",
        icon: "/icon-192.png",
      });
    }
  };

  const updatePreferences = (
    updater: (current: NotificationPreferences) => NotificationPreferences
  ) => {
    setPreferences((current) => {
      const currentPrefs: NotificationPreferences = current || {
        enabled: false,
        prazoAlerts: true,
        agentAlerts: true,
        financialAlerts: true,
      };
      return updater(currentPrefs);
    });
  };

  return {
    preferences: preferences || {
      enabled: false,
      prazoAlerts: true,
      agentAlerts: true,
      financialAlerts: true,
    },
    setPreferences: updatePreferences,
    requestPermission,
    testNotification,
    isSupported: "Notification" in globalThis.window,
    permission: "Notification" in globalThis.window ? Notification.permission : "denied",
  };
}

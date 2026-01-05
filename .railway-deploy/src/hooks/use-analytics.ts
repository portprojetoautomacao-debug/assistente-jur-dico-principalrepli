import { useKV } from "@/hooks/use-kv";

interface AnalyticsEvent {
  id: string;
  type: "pageview" | "action" | "error";
  timestamp: number;
  data: {
    path?: string;
    action?: string;
    category?: string;
    label?: string;
    value?: number;
    error?: string;
    userAgent?: string;
    viewport?: {
      width: number;
      height: number;
    };
  };
}

export function useAnalytics() {
  const [events, setEvents] = useKV<AnalyticsEvent[]>("analytics-events", []);

  const trackPageView = (path: string) => {
    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      type: "pageview",
      timestamp: Date.now(),
      data: {
        path,
        userAgent: navigator.userAgent,
        viewport: {
          width: globalThis.window.innerWidth,
          height: globalThis.window.innerHeight,
        },
      },
    };

    setEvents((currentEvents) => {
      const eventsList = currentEvents || [];
      const newEvents = [...eventsList, event];
      return newEvents.slice(-1000);
    });
  };

  const trackAction = (action: string, category?: string, label?: string, value?: number) => {
    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      type: "action",
      timestamp: Date.now(),
      data: {
        action,
        category,
        label,
        value,
        userAgent: navigator.userAgent,
        viewport: {
          width: globalThis.window.innerWidth,
          height: globalThis.window.innerHeight,
        },
      },
    };

    setEvents((currentEvents) => {
      const eventsList = currentEvents || [];
      const newEvents = [...eventsList, event];
      return newEvents.slice(-1000);
    });
  };

  const trackError = (error: string, path?: string) => {
    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      type: "error",
      timestamp: Date.now(),
      data: {
        error,
        path,
        userAgent: navigator.userAgent,
        viewport: {
          width: globalThis.window.innerWidth,
          height: globalThis.window.innerHeight,
        },
      },
    };

    setEvents((currentEvents) => {
      const eventsList = currentEvents || [];
      const newEvents = [...eventsList, event];
      return newEvents.slice(-1000);
    });
  };

  const clearEvents = () => {
    setEvents(() => []);
  };

  const getAnalytics = () => {
    const eventsList = events || [];
    const now = Date.now();
    const last24h = eventsList.filter((e) => now - e.timestamp < 24 * 60 * 60 * 1000);
    const last7d = eventsList.filter((e) => now - e.timestamp < 7 * 24 * 60 * 60 * 1000);

    const pageViews = last24h.filter((e) => e.type === "pageview");
    const actions = last24h.filter((e) => e.type === "action");
    const errors = last24h.filter((e) => e.type === "error");

    const popularPages = Object.entries(
      pageViews.reduce(
        (acc, e) => {
          const path = e.data.path || "unknown";
          acc[path] = (acc[path] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topActions = Object.entries(
      actions.reduce(
        (acc, e) => {
          const action = e.data.action || "unknown";
          acc[action] = (acc[action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      last24h: {
        total: last24h.length,
        pageViews: pageViews.length,
        actions: actions.length,
        errors: errors.length,
        popularPages,
        topActions,
      },
      last7d: {
        total: last7d.length,
        pageViews: last7d.filter((e) => e.type === "pageview").length,
        actions: last7d.filter((e) => e.type === "action").length,
        errors: last7d.filter((e) => e.type === "error").length,
      },
      allEvents: eventsList,
    };
  };

  return {
    trackPageView,
    trackAction,
    trackError,
    clearEvents,
    getAnalytics,
    events: events || [],
  };
}

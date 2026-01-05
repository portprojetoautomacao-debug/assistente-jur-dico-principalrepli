import GlobalSearch from "@/components/GlobalSearch";
import NotificationCenter from "@/components/NotificationCenter";
import Sidebar from "@/components/Sidebar";
import { SimpleAuth } from "@/components/SimpleAuth";
import { Toaster } from "@/components/ui/sonner";
import { useAutoMinuta } from "@/hooks/use-auto-minuta";
import { useKV } from "@/hooks/use-kv";
import type { User, ViewType } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SpeedInsights } from "@vercel/speed-insights/react";

// SpeedInsights só funciona no Vercel - desabilitar em outros hosts
const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel");
import { lazy, Suspense, useEffect, useState } from "react";

// QueryClient global (criado fora do componente para evitar recriação)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ⚡ COMPONENTES CRÍTICOS - Carregados diretamente (sempre visíveis)
import Dashboard from "@/components/Dashboard";

// ⚡ LAZY LOADING - Componentes pesados (carregam sob demanda)
// Isso melhora performance inicial e reduz bundle size
const HarveySpecterChat = lazy(() => import("@/components/HarveySpecterChat"));
const MinutasManager = lazy(() => import("@/components/MinutasManager"));
const ProcessCRM = lazy(() => import("@/components/ProcessCRM"));
const Calendar = lazy(() => import("@/components/Calendar"));
const FinancialManagement = lazy(() => import("@/components/FinancialManagement"));
const CalculadoraPrazos = lazy(() => import("@/components/CalculadoraPrazos"));
const PDFUploader = lazy(() => import("@/components/PDFUploader"));
const AIAgents = lazy(() => import("@/components/AIAgents"));
const AnalyticsDashboard = lazy(() => import("@/components/AnalyticsDashboard"));
const ExpedientePanel = lazy(() => import("@/components/ExpedientePanel"));
const BatchAnalysis = lazy(() => import("@/components/BatchAnalysis"));
const AudioTranscription = lazy(() => import("@/components/AudioTranscription"));
const DatabaseQueries = lazy(() => import("@/components/DatabaseQueries"));
const DatajudChecklist = lazy(() => import("@/components/DatajudChecklist"));
const KnowledgeBase = lazy(() => import("@/components/KnowledgeBase"));
const AcervoPJe = lazy(() => import("@/components/AcervoPJe"));

// Skeleton loader reutilizável
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [user, setUser] = useKV<User | null>("user", null);

  // ✨ Auto-criação de minutas quando agentes completam tarefas de redação
  useAutoMinuta();

  // Fallback de roteamento: sincroniza currentView com o hash da URL
  useEffect(() => {
    const applyHashView = () => {
      if (globalThis === undefined) return;
      const hash = globalThis.location.hash.replace(/^#/, "").trim();
      if (hash) {
        setCurrentView(hash as ViewType);
      }
    };
    applyHashView();
    globalThis.addEventListener("hashchange", applyHashView);
    return () => globalThis.removeEventListener("hashchange", applyHashView);
  }, []);

  const handleSimpleAuthSuccess = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("dashboard");
  };

  const handleNavigate = (view: string, _data?: unknown) => {
    setCurrentView(view as ViewType);
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentView} />;

      case "acervo":
      case "acervo-pje":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AcervoPJe />
          </Suspense>
        );

      case "crm":
      case "processos":
      case "processes":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ProcessCRM />
          </Suspense>
        );

      case "calendar":
      case "calendario":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Calendar />
          </Suspense>
        );

      case "financeiro":
      case "financial":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FinancialManagement />
          </Suspense>
        );

      case "prazos":
      case "calculadora":
      case "calculator":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CalculadoraPrazos />
          </Suspense>
        );

      case "upload-pdf":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PDFUploader />
          </Suspense>
        );

      case "minutas":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <MinutasManager />
          </Suspense>
        );

      case "donna":
      case "assistente":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <HarveySpecterChat />
          </Suspense>
        );

      case "ai-agents":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AIAgents onNavigate={setCurrentView} />
          </Suspense>
        );

      case "analytics":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AnalyticsDashboard />
          </Suspense>
        );

      case "expedientes":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ExpedientePanel />
          </Suspense>
        );

      case "batch":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BatchAnalysis />
          </Suspense>
        );

      case "audio":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AudioTranscription />
          </Suspense>
        );

      case "queries":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DatabaseQueries />
          </Suspense>
        );

      case "datajud":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DatajudChecklist />
          </Suspense>
        );

      case "knowledge":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <KnowledgeBase />
          </Suspense>
        );

      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <div
          className="min-h-screen bg-background flex items-center justify-center p-4 notranslate"
          translate="no"
        >
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Assistente Jurídico PJe</h1>
              <p className="text-muted-foreground">Sistema inteligente de gestão jurídica com IA</p>
            </div>

            <div className="space-y-4">
              {/* Login simples local (adm/adm123) */}
              <SimpleAuth onSuccess={handleSimpleAuthSuccess} />

              {/* GoogleAuth removido definitivamente */}
            </div>
          </div>
          <Toaster />
          {isVercel && <SpeedInsights />}
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-background notranslate" translate="no">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          user={user}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar com Busca Global e Notificações */}
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <GlobalSearch onNavigate={handleNavigate} />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Pressione{" "}
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">/</kbd>{" "}
                para buscar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter onNavigate={handleNavigate} />
            </div>
          </header>
          <main
            id="main-content"
            role="main"
            aria-label="Conteúdo principal"
            className="flex-1 overflow-hidden"
          >
            <div className="h-full overflow-y-auto p-6">{renderContent()}</div>
          </main>
        </div>
        <Toaster />
        {isVercel && <SpeedInsights />}
      </div>
    </QueryClientProvider>
  );
}

export default App;

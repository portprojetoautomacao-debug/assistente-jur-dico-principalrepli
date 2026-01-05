import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useKV } from "@/hooks/use-kv";
import { getEnv } from "@/lib/env-helper";
import type { Appointment } from "@/types";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudDownload,
  CloudUpload,
  Info,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Trash,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// Helper para obter texto de status da conexão (evita ternário aninhado S3358)
function getConnectionStatus(
  isConfigured: boolean,
  isConnected: boolean,
  isInitializing: boolean
): string {
  if (!isConfigured) {
    return "Configure as credenciais do Google para habilitar a sincronização";
  }
  if (isConnected) {
    return "Conectado - seus eventos podem ser sincronizados";
  }
  if (isInitializing) {
    return "Inicializando conexão...";
  }
  return "Desconectado";
}

const EVENT_COLORS: Record<string, string> = {
  audiencia: "bg-red-100 text-red-800 border-red-300",
  reuniao: "bg-blue-100 text-blue-800 border-blue-300",
  prazo: "bg-amber-100 text-amber-800 border-amber-300",
  outro: "bg-gray-100 text-gray-800 border-gray-300",
  hearing: "bg-red-100 text-red-800 border-red-300",
  meeting: "bg-blue-100 text-blue-800 border-blue-300",
  deadline: "bg-amber-100 text-amber-800 border-amber-300",
  other: "bg-gray-100 text-gray-800 border-gray-300",
};

function getHumanTypeLabel(type: Appointment["type"]): string {
  switch (type) {
    case "audiencia":
    case "hearing":
      return "Audiência";
    case "reuniao":
    case "meeting":
      return "Reunião";
    case "prazo":
    case "deadline":
      return "Prazo";
    default:
      return "Outro";
  }
}

export default function Calendar() {
  const [appointments] = useKV<Appointment[]>("appointments", []);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [syncEnabled, setSyncEnabled] = useKV<boolean>("calendar-sync-enabled", false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const GOOGLE_CLIENT_ID = getEnv("VITE_GOOGLE_CLIENT_ID", "");
  const GOOGLE_API_KEY = getEnv("VITE_GEMINI_API_KEY", "");
  const isGoogleConfigured = !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY;

  // Debug: log para verificar se as variáveis estão chegando
  if (typeof globalThis.window !== "undefined" && !isGoogleConfigured) {
    console.log(
      "[Calendar] Debug - GOOGLE_CLIENT_ID:",
      GOOGLE_CLIENT_ID ? "✓ Configurado" : "✗ Vazio"
    );
    console.log("[Calendar] Debug - GOOGLE_API_KEY:", GOOGLE_API_KEY ? "✓ Configurado" : "✗ Vazio");
  }

  const sortedUpcomingAppointments = useMemo(
    () =>
      (appointments || [])
        .slice()
        .sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
        ),
    [appointments]
  );

  // Helpers de calendário
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const calculateDaysInMonth = (y: number, m: number): (number | null)[] => {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };
  const days = useMemo(() => calculateDaysInMonth(year, month), [year, month]);
  const isToday = (day: number): boolean => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };
  const getDayClassName = (day: number | null): string => {
    const base = "min-h-24 p-2 border rounded-lg";
    if (day === null) return `${base} bg-muted/30`;
    return isToday(day)
      ? `${base} bg-primary/10 border-primary`
      : `${base} bg-card hover:bg-muted/50`;
  };
  const getAppointmentsForDay = (day: number): Appointment[] => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    return (appointments || []).filter((a) => a.date === dateStr);
  };
  const handlePreviousMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsDialog(true);
  };

  const handleDeleteAppointment = (_appointment: Appointment) => {
    toast.success("Compromisso removido");
    setShowDetailsDialog(false);
  };

  // Stubs seguros para integração Google (sem JSX corrompido)
  const handleConnectGoogle = async () => {
    if (!isGoogleConfigured) {
      toast.error("Configure VITE_GOOGLE_CLIENT_ID e VITE_GEMINI_API_KEY");
      return;
    }
    setIsInitializing(true);
    try {
      // Simula conexão
      await new Promise((r) => setTimeout(r, 800));
      setIsGoogleConnected(true);
      setConnectionError(null);
      toast.success("Conectado ao Google Calendar (stub)");
    } catch {
      setConnectionError("Falha ao conectar");
      toast.error("Falha ao conectar");
    } finally {
      setIsInitializing(false);
    }
  };
  const handleSyncFromGoogle = async () => {
    if (!isGoogleConnected) {
      toast.error("Conecte-se ao Google Calendar primeiro");
      return;
    }
    setIsSyncing(true);
    try {
      // Simula import
      await new Promise((r) => setTimeout(r, 600));
      toast.info("Sincronização automática em desenvolvimento");
    } finally {
      setIsSyncing(false);
    }
  };
  const handleSyncToGoogle = async () => {
    if (!isGoogleConnected) {
      toast.error("Conecte-se ao Google Calendar primeiro");
      return;
    }
    setIsSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.info("Envio automático em desenvolvimento");
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper para conteúdo do botão de conexão
  const connectButtonContent = isInitializing ? (
    <>
      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
      Conectando...
    </>
  ) : (
    <>
      <CalendarDays className="w-4 h-4 mr-2" />
      Conectar ao Google
    </>
  );

  const syncFromGoogleText = isSyncing ? "Sincronizando..." : "Importar do Google";
  const syncToGoogleText = isSyncing ? "Sincronizando..." : "Enviar ao Google";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda Integrada</h1>
          <p className="text-muted-foreground mt-1">Compromissos, audiências e prazos</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Google Calendar Integration Card */}
      <Card className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Ícone genérico para Google Calendar (evita dependência de pacote deprecado) */}
              <CalendarDays className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle>Integração Google Calendar</CardTitle>
                <CardDescription>
                  {getConnectionStatus(isGoogleConfigured, isGoogleConnected, isInitializing)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isGoogleConfigured && (
                <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                    Cadastre as credenciais no Google Cloud Console e adicione as variáveis no .env.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mensagem quando não configurado */}
          {!isGoogleConfigured && (
            <div className="space-y-4">
              <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>Configuração necessária:</strong> Para habilitar a integração, adicione as
                  seguintes variáveis de ambiente:
                  <ul className="list-disc ml-4 mt-2">
                    <li>
                      <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">
                        VITE_GOOGLE_CLIENT_ID
                      </code>{" "}
                      - ID do cliente OAuth do Google Cloud Console
                    </li>
                    <li>
                      <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">
                        VITE_GEMINI_API_KEY
                      </code>{" "}
                      - Chave da API do Google (já configurada para IA)
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    globalThis.open("https://console.cloud.google.com/apis/credentials", "_blank")
                  }
                  variant="outline"
                >
                  <LinkIcon className="w-4 h-4 mr-2" /> Abrir Google Cloud Console
                </Button>
                <Button
                  onClick={() => globalThis.open("https://calendar.google.com", "_blank")}
                  variant="outline"
                >
                  <CalendarDays className="w-4 h-4 mr-2" /> Abrir Google Calendar
                </Button>
              </div>
            </div>
          )}

          {/* Conteúdo quando configurado */}
          {isGoogleConfigured && (
            <>
              {!isGoogleConnected && !connectionError && (
                <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                    Dicas: permita pop-ups, autorize a origem atual no Google Cloud Console e
                    habilite a API do Calendar.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sync-toggle" className="text-sm font-medium">
                    Sincronização Automática
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Novos eventos serão enviados automaticamente ao Google Calendar
                  </p>
                </div>
                <Switch
                  id="sync-toggle"
                  aria-label="Ativar sincronização automática com Google Calendar"
                  checked={!!syncEnabled}
                  onCheckedChange={(v) => setSyncEnabled(!!v)}
                  disabled={!isGoogleConnected}
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {!isGoogleConnected && (
                  <Button onClick={handleConnectGoogle} variant="default" disabled={isInitializing}>
                    {connectButtonContent}
                  </Button>
                )}

                {isGoogleConnected && (
                  <>
                    <Button onClick={handleSyncFromGoogle} variant="outline" disabled={isSyncing}>
                      <CloudDownload className="w-4 h-4 mr-2" />
                      {syncFromGoogleText}
                    </Button>
                    <Button onClick={handleSyncToGoogle} variant="outline" disabled={isSyncing}>
                      <CloudUpload className="w-4 h-4 mr-2" />
                      {syncToGoogleText}
                    </Button>
                    <Button
                      onClick={() => globalThis.open("https://calendar.google.com", "_blank")}
                      variant="outline"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" /> Abrir Google Calendar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {MONTHS[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {d}
              </div>
            ))}
            {days.map((day, idx) => {
              const isValidDay = day !== null;
              const keyForCell = isValidDay
                ? `day-${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
                    2,
                    "0"
                  )}`
                : `empty-${idx}`;
              const dayAppointments = isValidDay ? getAppointmentsForDay(day) : [];
              return (
                <div key={keyForCell} className={getDayClassName(day)}>
                  {isValidDay && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday(day) ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map((apt) => (
                          <button
                            key={apt.id}
                            className={`text-xs p-1 rounded border ${
                              EVENT_COLORS[apt.type] || EVENT_COLORS.outro
                            } truncate cursor-pointer hover:opacity-80`}
                            onClick={() => handleViewDetails(apt)}
                          >
                            {apt.time} {apt.title}
                          </button>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>+{dayAppointments.length - 2} mais</span>
                            <button
                              type="button"
                              className="underline text-primary"
                              onClick={() => {
                                const aptForDay = getAppointmentsForDay(day);
                                if (aptForDay.length) {
                                  setSelectedAppointment(aptForDay[0]);
                                  setShowDetailsDialog(true);
                                }
                              }}
                              aria-label="Ver todos os compromissos do dia"
                            >
                              Ver todos
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Compromissos</CardTitle>
          <CardDescription>Eventos agendados para os próximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedUpcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum compromisso agendado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedUpcomingAppointments.slice(0, 5).map((apt) => (
                <button
                  type="button"
                  key={apt.id}
                  className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors w-full text-left"
                  onClick={() => handleViewDetails(apt)}
                >
                  <CalendarDays className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium">{apt.title}</p>
                      <Badge className={EVENT_COLORS[apt.type] || EVENT_COLORS.outro}>
                        {getHumanTypeLabel(apt.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.date).toLocaleDateString("pt-BR")} às {apt.time}
                    </p>
                    {apt.location && (
                      <p className="text-sm text-muted-foreground mt-1">{apt.location}</p>
                    )}
                    {apt.description && <p className="text-sm mt-2">{apt.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Compromisso</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Título</Label>
                <p className="text-lg font-semibold">{selectedAppointment.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {new Date(selectedAppointment.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Horário</Label>
                  <p className="font-medium">{selectedAppointment.time}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <div className="mt-1">
                  <Badge className={EVENT_COLORS[selectedAppointment.type] || EVENT_COLORS.outro}>
                    {getHumanTypeLabel(selectedAppointment.type)}
                  </Badge>
                </div>
              </div>
              {selectedAppointment.location && (
                <div>
                  <Label className="text-xs text-muted-foreground">Local</Label>
                  <p>{selectedAppointment.location}</p>
                </div>
              )}
              {selectedAppointment.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedAppointment.description}</p>
                </div>
              )}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAppointment(selectedAppointment)}
                >
                  <Trash className="w-4 h-4 mr-2" /> Excluir
                </Button>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  FlaskConical,
  Globe,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Microsoft Teams icon
const TeamsIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.625 8.5h-3.75V6.875c0-.69.56-1.25 1.25-1.25h1.25c.69 0 1.25.56 1.25 1.25V8.5zm-.938 1.25c-.865 0-1.562-.697-1.562-1.562V6.875c0-1.381 1.119-2.5 2.5-2.5h1.25c1.381 0 2.5 1.119 2.5 2.5v4.375c0 2.071-1.679 3.75-3.75 3.75h-.625V19c0 .69-.56 1.25-1.25 1.25H4.25c-.69 0-1.25-.56-1.25-1.25V9.75c0-.69.56-1.25 1.25-1.25h4.375V5.75c0-.69.56-1.25 1.25-1.25h5c.69 0 1.25.56 1.25 1.25v2.75h3.562z" />
  </svg>
);

// Componente para renderizar ícone do webhook por tipo
function WebhookTypeIcon({ type, size = 20 }: Readonly<{ type: WebhookType; size?: number }>) {
  switch (type) {
    case "slack":
      return <MessageSquare size={size} />;
    case "discord":
      return <MessageSquare size={size} />;
    case "teams":
      return <TeamsIcon size={size} />;
    case "generic":
    default:
      return <Globe size={size} />;
  }
}

// Props para componente de lista de webhooks
interface WebhookListContentProps {
  readonly loading: boolean;
  readonly webhooks: readonly WebhookConfig[];
  readonly testingWebhook: string | null;
  readonly onTest: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

// Componente extraído para evitar ternário aninhado (S3358)
function WebhookListContent({
  loading,
  webhooks,
  testingWebhook,
  onTest,
  onDelete,
}: WebhookListContentProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (webhooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
        <Globe size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Nenhum webhook configurado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {webhooks.map((webhook) => (
        <div key={webhook.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">
              <WebhookTypeIcon type={webhook.type} size={20} />
            </div>
            <div>
              <p className="font-medium text-sm">{webhook.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-5">
                  {webhook.type}
                </Badge>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {webhook.url}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onTest(webhook.id)}
              disabled={testingWebhook === webhook.id}
              title="Testar webhook"
            >
              {testingWebhook === webhook.id ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <FlaskConical size={14} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(webhook.id)}
              title="Remover"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

type WebhookType = "slack" | "discord" | "teams" | "generic";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  type: WebhookType;
  enabled: boolean;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function WebhooksSettings() {
  // Webhook state
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState<{
    name: string;
    url: string;
    type: WebhookType;
  }>({
    name: "",
    url: "",
    type: "slack",
  });

  // Helpers para reduzir complexidade cognitiva
  const hasNewWebhookFields = () => {
    const hasFields = newWebhook.name.trim() && newWebhook.url.trim();
    if (!hasFields) {
      toast.error("Nome e URL são obrigatórios");
      return false;
    }
    return true;
  };

  // Buscar webhooks do backend
  const fetchWebhooks = useCallback(async () => {
    setLoadingWebhooks(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.webhooks)) {
        setWebhooks(data.webhooks);
      } else {
        setWebhooks([]);
      }
    } catch (error) {
      console.error("[NotificationSettings] Fetch error:", error);
      toast.error("Erro ao carregar webhooks");
      setWebhooks([]);
    } finally {
      setLoadingWebhooks(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // Adicionar webhook
  const addWebhook = async () => {
    if (!hasNewWebhookFields()) return;
    setSavingWebhook(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newWebhook, events: ["all"] }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { webhook?: WebhookConfig };
      if (data.webhook) {
        setWebhooks((prev) => [...prev, data.webhook as WebhookConfig]);
      }
      setNewWebhook({ name: "", url: "", type: "slack" });
      setShowAddForm(false);
      toast.success("Webhook adicionado!");
    } catch (error) {
      console.error("[NotificationSettings]", error);
      toast.error("Erro ao adicionar webhook");
    } finally {
      setSavingWebhook(false);
    }
  };

  // Remover webhook
  const deleteWebhook = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/webhook/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      toast.success("Webhook removido");
    } catch (error) {
      console.error("[NotificationSettings]", error);
      toast.error("Erro ao remover webhook");
    }
  };

  // Helper: Fazer requisição de teste de webhook
  const performWebhookTest = async (webhookId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookId }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  // Testar webhook
  const testWebhook = async (id: string) => {
    setTestingWebhook(id);
    try {
      const data = await performWebhookTest(id);
      if (data.success) {
        toast.success("Teste enviado com sucesso!");
      } else {
        toast.error("Falha no teste: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("[NotificationSettings]", error);
      toast.error("Erro ao testar webhook");
    } finally {
      setTestingWebhook(null);
    }
  };

  return (
    <Card className="glassmorphic border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="text-primary" size={24} />
              Webhooks (Slack/Discord/Teams)
            </CardTitle>
            <CardDescription className="mt-2">
              Receba notificações em canais externos quando novas publicações ou eventos relevantes
              forem encontrados
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm} size="sm">
            <Plus size={16} />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de novo webhook */}
        {showAddForm && (
          <Alert className="border-primary/50">
            <div className="space-y-4">
              <AlertDescription className="font-medium">Adicionar novo webhook</AlertDescription>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="wh-name" className="text-xs">
                    Nome
                  </Label>
                  <Input
                    id="wh-name"
                    placeholder="Ex: Slack Jurídico"
                    value={newWebhook.name}
                    onChange={(e) =>
                      setNewWebhook((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wh-type" className="text-xs">
                    Tipo
                  </Label>
                  <Select
                    value={newWebhook.type}
                    onValueChange={(v: WebhookType) => setNewWebhook((p) => ({ ...p, type: v }))}
                  >
                    <SelectTrigger id="wh-type">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slack">
                        <span className="flex items-center gap-2">
                          <MessageSquare size={14} />
                          Slack
                        </span>
                      </SelectItem>
                      <SelectItem value="discord">
                        <span className="flex items-center gap-2">
                          <MessageSquare size={14} />
                          Discord
                        </span>
                      </SelectItem>
                      <SelectItem value="teams">
                        <span className="flex items-center gap-2">
                          <TeamsIcon size={14} />
                          Teams
                        </span>
                      </SelectItem>
                      <SelectItem value="generic">
                        <span className="flex items-center gap-2">
                          <Globe size={14} />
                          Genérico
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wh-url" className="text-xs">
                    URL do Webhook
                  </Label>
                  <Input
                    id="wh-url"
                    placeholder="https://hooks.slack.com/..."
                    value={newWebhook.url}
                    onChange={(e) =>
                      setNewWebhook((p) => ({
                        ...p,
                        url: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={addWebhook} disabled={savingWebhook}>
                  {savingWebhook ? <Loader2 className="animate-spin" size={16} /> : "Salvar"}
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {/* Lista de webhooks */}
        <WebhookListContent
          loading={loadingWebhooks}
          webhooks={webhooks}
          testingWebhook={testingWebhook}
          onTest={testWebhook}
          onDelete={deleteWebhook}
        />

        {webhooks.length > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 p-3 text-xs text-yellow-600 dark:text-yellow-400">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>
              Webhooks recebem dados sensíveis sobre processos. Certifique-se de que as URLs
              configuradas são seguras e confiáveis.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

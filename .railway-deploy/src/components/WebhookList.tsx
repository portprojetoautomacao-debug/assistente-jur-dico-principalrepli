import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, FlaskConical, Globe, Loader2, MessageSquare, Trash2 } from "lucide-react";

// Microsoft Teams icon
export const TeamsIcon = ({ size = 20 }: { size?: number }) => (
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

export type WebhookType = "slack" | "discord" | "teams" | "generic";

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  type: WebhookType;
  enabled: boolean;
  createdAt: string;
}

interface WebhookListProps {
  readonly webhooks: WebhookConfig[];
  readonly loading: boolean;
  readonly testingWebhookId: string | null;
  readonly onTest: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function WebhookList({
  webhooks,
  loading,
  testingWebhookId,
  onTest,
  onDelete,
}: Readonly<WebhookListProps>) {
  const getWebhookIcon = (type: WebhookType) => {
    switch (type) {
      case "slack":
        return <MessageSquare size={18} />;
      case "discord":
        return <MessageSquare size={18} />;
      case "teams":
        return <TeamsIcon size={18} />;
      default:
        return <Globe size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Globe size={40} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum webhook configurado</p>
        <p className="text-xs">
          Configure webhooks para receber notificações no Slack, Discord ou Teams
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {webhooks.map((wh) => (
        <div
          key={wh.id}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg border",
            wh.enabled ? "bg-card" : "bg-muted/50 opacity-70"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10">{getWebhookIcon(wh.type)}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{wh.name}</span>
                <Badge variant="outline" className="text-xs px-1">
                  {wh.type}
                </Badge>
                {wh.enabled && (
                  <Badge className="bg-green-500/20 text-green-600 text-xs px-1">
                    <CheckCircle size={8} className="mr-0.5" />
                    Ativo
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[220px]">{wh.url}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => onTest(wh.id)}
              disabled={testingWebhookId === wh.id}
              title="Testar webhook"
            >
              {testingWebhookId === wh.id ? (
                <Loader2 className="animate-spin" size={12} />
              ) : (
                <FlaskConical size={12} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive"
              onClick={() => onDelete(wh.id)}
              title="Excluir webhook"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

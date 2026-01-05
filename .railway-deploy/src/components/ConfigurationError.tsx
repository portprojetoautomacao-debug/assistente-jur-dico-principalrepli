import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, AlertTriangle } from "lucide-react";

export function ConfigurationError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle size={32} className="text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Erro de Configuração</CardTitle>
              <CardDescription>
                O aplicativo não está configurado corretamente nas variáveis de ambiente da Vercel
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro 401 - Não Autorizado</AlertTitle>
            <AlertDescription>
              As variáveis de ambiente necessárias para o backend de IA não estão configuradas no
              projeto da Vercel.
              <br />O aplicativo não consegue se conectar à API do Gemini 2.5 Pro (serviço de IA).
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Como Corrigir (3 passos):</h3>

            <div className="space-y-4">
              {/* PASSO 1 */}
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Criar chave de API do Gemini</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Acesse o Google AI Studio e gere uma chave de API para utilizar o modelo{" "}
                    <code className="px-1 py-0.5 rounded bg-muted text-xs">gemini-2.5-pro</code>.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      globalThis.window?.open("https://aistudio.google.com/app/apikey", "_blank")
                    }
                  >
                    <ExternalLink size={16} />
                    Abrir AI Studio
                  </Button>
                </div>
              </div>

              {/* PASSO 2 */}
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Configurar variáveis no Vercel</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    No painel do Vercel, acesse{" "}
                    <span className="font-semibold">Settings → Environment Variables</span> e
                    adicione as variáveis abaixo:
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg text-xs font-mono space-y-1">
                    <div>
                      GEMINI_API_KEY=
                      <span className="italic">sua_chave_aqui</span>
                    </div>
                    <div>GEMINI_MODEL=gemini-2.5-pro</div>
                    <div>
                      VITE_BACKEND_API_URL={" "}
                      <span className="italic">https://seu-projeto.vercel.app</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Marque <strong>Production</strong>, <strong>Preview</strong> e{" "}
                    <strong>Development</strong> para cada variável.
                  </p>
                </div>
              </div>

              {/* PASSO 3 */}
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Redeploy do projeto</h4>
                  <p className="text-sm text-muted-foreground">
                    No painel do Vercel, vá em <span className="font-semibold">Deployments</span>,
                    clique nos 3 pontos (<code>...</code>) ao lado do último deployment e selecione{" "}
                    <span className="font-semibold">Redeploy</span> para aplicar as novas variáveis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2 text-sm">Documentação do projeto:</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  globalThis.window?.open(
                    "https://github.com/thiagos-projects-9834ca6f/assistente-juridico-p/blob/main/LEIA_URGENTE.md",
                    "_blank"
                  )
                }
              >
                <ExternalLink size={16} />
                Guia Rápido
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  globalThis.window?.open(
                    "https://github.com/thiagos-projects-9834ca6f/assistente-juridico-p/blob/main/CORRECAO_ERRO_401.md",
                    "_blank"
                  )
                }
              >
                <ExternalLink size={16} />
                Guia Completo
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              💡 <strong>Dica:</strong> Execute{" "}
              <code className="px-1 py-0.5 rounded bg-muted">npm run check-config</code> localmente
              para validar se todas as variáveis de ambiente obrigatórias estão definidas antes do
              próximo deploy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

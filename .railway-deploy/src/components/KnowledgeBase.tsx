import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Search, Sparkles, User } from "lucide-react";
import { useState, type KeyboardEvent, type SVGProps } from "react";
import { toast } from "sonner";

/**
 * KnowledgeBase - Sistema RAG (Retrieval-Augmented Generation)
 *
 * Este componente usa IA REAL (via backend /api/gemini/legal-rag)
 * para responder perguntas sobre documentos jurídicos.
 *
 * IMPORTANTE:
 * - O frontend NÃO chama diretamente o Gemini; quem fala com o modelo é o backend.
 * - Ainda NÃO há indexação real (embeddings). As contagens de documentos são ilustrativas.
 * - Futura integração: backend de RAG (embeddings + search) para substituir números fixos.
 */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Prompt de sistema enviado para o backend junto com a pergunta.
 * O backend deve usar isso como contexto no `callGemini`.
 */
const SYSTEM_PROMPT = `Você é um assistente jurídico especializado em direito trabalhista brasileiro.

Você tem acesso conceitual a uma base de conhecimento com:
- Petições modelo do escritório
- Doutrina de Maurício Godinho Delgado e outros autores
- Jurisprudência do TST, TRTs e STF
- Anotações internas do escritório

Regras IMPORTANTES:
- Responda de forma clara, estruturada e objetiva.
- Use tópicos, subtítulos e marcadores quando apropriado.
- Cite precedentes ou súmulas quando souber com segurança (ex.: "Súmula 85 do TST").
- Se não tiver certeza ou faltar contexto, diga isso explicitamente e indique quais dados faltam.
- Nunca invente número de processo, nome de parte, valor ou dado sensível.
- Se a pergunta não for jurídica, responda de forma educada, mas avise que seu foco é jurídico-trabalhista.`;

export default function KnowledgeBase() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Chama o backend Gemini (legal-rag) com a pergunta atual ou uma pergunta custom.
   */
  const handleQuery = async (customQuery?: string) => {
    const raw = (customQuery ?? query).trim();

    if (!raw) {
      toast.error("Digite uma pergunta");
      return;
    }

    if (loading) {
      // Evita múltiplas requisições concorrentes
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: raw,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Se veio de atalho, a caixa de texto pode ficar igual ou ser limpa.
    // Aqui vamos limpar para indicar que a pergunta foi enviada.
    setQuery("");
    setLoading(true);
    setError(null);

    try {
      /**
       * Esperado no backend (/api/gemini/legal-rag):
       *
       * body: { question: string, systemPrompt: string }
       * response: { text: string; error?: string }
       */
      const response = await fetch("/api/gemini/legal-rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: raw,
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data: { text?: string; error?: string } = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const content =
        typeof data.text === "string" && data.text.trim().length > 0
          ? data.text
          : "A IA não retornou nenhum conteúdo útil para esta pergunta.";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error("Erro ao consultar base de conhecimento:", err);

      const message = err instanceof Error ? err.message : "Erro desconhecido ao consultar IA.";

      setError(
        message.includes("Erro na API")
          ? "Falha ao contatar o serviço de IA. Tente novamente em alguns instantes."
          : message
      );

      toast.error("Erro ao consultar base de conhecimento");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleQuery();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Base de Conhecimento (RAG)</h1>
        <p className="text-muted-foreground mt-1">
          Sistema inteligente de recuperação e consulta de documentos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda — “estado” da biblioteca (por enquanto ilustrativo) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentos Indexados</CardTitle>
            <CardDescription>Biblioteca do escritório (visual demonstrativo)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Petições Modelo</p>
                    <p className="text-xs text-muted-foreground">
                      Contador ilustrativo — integrará com RAG futuro
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Doutrina</p>
                    <p className="text-xs text-muted-foreground">
                      Obras trabalhistas e anotações doutrinárias
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Jurisprudência</p>
                    <p className="text-xs text-muted-foreground">
                      Acórdãos e decisões selecionadas (TST, TRTs, STF)
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Anotações Internas</p>
                    <p className="text-xs text-muted-foreground">
                      Notas estratégicas e lições aprendidas do escritório
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4" type="button" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Documento (em breve)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coluna direita — Chat com a IA */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Assistente Inteligente
              </CardTitle>
              <CardDescription>
                Faça perguntas sobre documentos, doutrina e jurisprudência
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4 mb-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground">Como posso ajudar?</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      Pergunte sobre precedentes, modelos de petições, estratégias processuais ou
                      qualquer conteúdo jurídico relevante.
                    </p>
                    <div className="mt-6 space-y-2 w-full max-w-md">
                      <p className="text-xs text-muted-foreground text-left">Exemplos:</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() =>
                          void handleQuery(
                            "Quais são os principais precedentes sobre horas extras?"
                          )
                        }
                      >
                        <span className="text-sm">
                          Quais são os principais precedentes sobre horas extras?
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() =>
                          void handleQuery("Modelo de petição para reclamação trabalhista")
                        }
                      >
                        <span className="text-sm">
                          Modelo de petição para reclamação trabalhista
                        </span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-accent-foreground" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-4 rounded-lg ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-accent-foreground animate-pulse" />
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Buscando na base de conhecimento...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {error && (
                <div className="mb-3">
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Textarea
                    placeholder="Digite sua pergunta..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 resize-none"
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => void handleQuery()}
                  disabled={loading}
                  size="lg"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Plus(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
    </svg>
  );
}

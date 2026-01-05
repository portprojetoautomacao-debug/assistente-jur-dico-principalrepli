import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { geminiGenerateJSON } from "@/lib/gemini-client";
import { Copy, Mail, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type EmailType =
  | "cliente-inicial"
  | "cliente-atualizacao"
  | "adversa-negociacao"
  | "tribunal-peticao"
  | "perito-solicitacao"
  | "formal-profissional"
  | "informal-cliente";

interface EmailDraft {
  subject: string;
  body: string;
  tone: string;
  type: string;
}

export default function AIEmailDrafter() {
  const [emailType, setEmailType] = useState<EmailType>("cliente-atualizacao");
  const [context, setContext] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [processNumber, setProcessNumber] = useState("");
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  const emailTypes: Record<EmailType, string> = {
    "cliente-inicial": "Cliente - Primeiro Contato",
    "cliente-atualizacao": "Cliente - Atualização Processual",
    "adversa-negociacao": "Parte Adversa - Negociação",
    "tribunal-peticao": "Tribunal - Encaminhamento de Petição",
    "perito-solicitacao": "Perito - Solicitação de Laudo",
    "formal-profissional": "Formal Profissional",
    "informal-cliente": "Informal Cliente",
  };

  const handleDraft = async () => {
    if (!context.trim()) {
      toast.error("Por favor, forneça o contexto do email");
      return;
    }

    setIsDrafting(true);

    try {
      const typeDescription = emailTypes[emailType];

      const prompt = String.raw`Você é um assistente de redação de emails jurídicos. Redija um email profissional com as seguintes informações:

Tipo de email: ${typeDescription}
Nome do destinatário: ${recipientName || "não especificado"}
Número do processo: ${processNumber || "não especificado"}
Contexto e informações a incluir:
${context}

O email deve:
1. Ter um assunto (subject) claro e profissional
2. Usar um tom adequado ao tipo de email (${typeDescription})
3. Incluir todas as informações do contexto de forma organizada
4. Seguir as normas de cortesia e formalidade jurídica
5. Ser conciso mas completo
6. Se houver número de processo, referenciá-lo adequadamente
7. Se houver nome do destinatário, usar saudação personalizada

Responda EXCLUSIVAMENTE com um JSON VÁLIDO (sem comentários, sem texto antes ou depois), exatamente neste formato:

{
  "subject": "assunto do email",
  "body": "corpo completo do email com quebras de linha (use \\n)",
  "tone": "descrição breve do tom usado (ex: formal, cordial, técnico)",
  "type": "${typeDescription}"
}`;

      const result = await geminiGenerateJSON<EmailDraft>(prompt);

      const safeDraft: EmailDraft = {
        subject: result.subject || "Assunto do email",
        body: result.body || "",
        tone: result.tone || "formal",
        type: result.type || typeDescription,
      };

      setDraft(safeDraft);
      toast.success("Email rascunhado com sucesso!");
    } catch (error) {
      console.error("Erro ao rascunhar email:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao gerar rascunho");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;

    const fullEmail = `Assunto: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard
      .writeText(fullEmail)
      .then(() => {
        toast.success("Email copiado para área de transferência");
      })
      .catch(() => {
        toast.error("Não foi possível copiar o email");
      });
  };

  const handleCopyBody = () => {
    if (!draft) return;

    navigator.clipboard
      .writeText(draft.body)
      .then(() => {
        toast.success("Corpo do email copiado");
      })
      .catch(() => {
        toast.error("Não foi possível copiar o corpo do email");
      });
  };

  const handleCopySubject = () => {
    if (!draft) return;

    navigator.clipboard
      .writeText(draft.subject)
      .then(() => {
        toast.success("Assunto copiado");
      })
      .catch(() => {
        toast.error("Não foi possível copiar o assunto");
      });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 gradient-text">
          <Mail size={32} className="text-primary neon-glow" />
          Rascunho de Emails IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere emails profissionais automaticamente com IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle>Informações do Email</CardTitle>
            <CardDescription>Preencha os detalhes para gerar o rascunho</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Email</Label>
              <Select value={emailType} onValueChange={(value) => setEmailType(value as EmailType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de email" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(emailTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Nome do Destinatário (opcional)</Label>
              <Input
                id="recipient"
                placeholder="Ex: Dr. João Silva"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="process">Número do Processo (opcional)</Label>
              <Input
                id="process"
                placeholder="Ex: 1234567-89.2024.8.26.0100"
                value={processNumber}
                onChange={(e) => setProcessNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Contexto e Informações *</Label>
              <Textarea
                id="context"
                placeholder="Descreva o que precisa comunicar no email. Ex: 'Informar cliente sobre audiência marcada para dia 15/03 às 14h na 5ª Vara Cível. Solicitar que traga documentos originais e uma testemunha.'"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            <Button
              onClick={handleDraft}
              disabled={isDrafting || !context.trim()}
              className="w-full button-gradient"
            >
              <Sparkles size={20} className={isDrafting ? "animate-spin" : ""} />
              {isDrafting ? "Gerando..." : "Gerar Rascunho"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glassmorphic card-glow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Rascunho Gerado</span>
                {draft && (
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <Copy size={16} />
                    Copiar Tudo
                  </Button>
                )}
              </CardTitle>
              {draft && (
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{draft.type}</Badge>
                  <Badge variant="secondary">Tom: {draft.tone}</Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {draft ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-semibold">ASSUNTO</p>
                        <Button size="sm" variant="ghost" onClick={handleCopySubject}>
                          <Copy size={14} />
                        </Button>
                      </div>
                      <p className="font-semibold">{draft.subject}</p>
                    </div>

                    <div className="p-4 bg-card/50 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-semibold">
                          CORPO DO EMAIL
                        </p>
                        <Button size="sm" variant="ghost" onClick={handleCopyBody}>
                          <Copy size={14} />
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {draft.body.split("\n").map((line, index) => (
                          <p
                            key={`line-${index}-${line.substring(0, 10)}`}
                            className="text-sm leading-relaxed mb-2"
                          >
                            {line || <br />}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1" variant="outline">
                        <Send size={20} />
                        Abrir no Email
                      </Button>
                      <Button className="flex-1 button-gradient">
                        <Sparkles size={20} />
                        Refinar com IA
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail size={64} className="text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    O email aparecerá aqui após gerar o rascunho
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle>Exemplos de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="font-semibold text-sm mb-2">📧 Atualização para Cliente</p>
              <p className="text-xs text-muted-foreground">
                "Sentença favorável publicada hoje. Aguardando trânsito em julgado. Prazo recursal
                de 15 dias para parte adversa."
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="font-semibold text-sm mb-2">🤝 Proposta de Acordo</p>
              <p className="text-xs text-muted-foreground">
                "Propor acordo extrajudicial de R$ 50.000 parcelados em 10x. Renúncia mútua de
                honorários."
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="font-semibold text-sm mb-2">📋 Solicitação de Documentos</p>
              <p className="text-xs text-muted-foreground">
                "Solicitar ao perito envio do laudo até 20/03. Processo em fase de prova pericial
                técnica."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Mic, Sparkles, StopCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * AudioTranscription - Componente para transcrição de áudio com IA REAL
 *
 * IMPORTANTE: Este componente usa APIs reais para transcrição:
 * - Web Speech API para gravação em tempo real
 * - API Gemini para análise e sumarização do texto transcrito
 *
 * NÃO há dados simulados ou mock neste componente.
 */

interface TranscriptionAnalysis {
  summary: string;
  actionItems: string[];
}

export default function AudioTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioFileRef = useRef<File | null>(null);

  // Verifica suporte a Web Speech API
  const isSpeechSupported =
    typeof globalThis !== "undefined" &&
    ("SpeechRecognition" in globalThis || "webkitSpeechRecognition" in globalThis);

  const handleStartRecording = () => {
    if (!isSpeechSupported) {
      toast.error("Seu navegador não suporta gravação de áudio");
      setError("Web Speech API não suportada. Use Chrome ou Edge.");
      return;
    }

    setError(null);
    setTranscription("");
    setSummary("");
    setActionItems([]);

    const SpeechRecognitionClass =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass() as SpeechRecognition;

    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscription(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(`Erro na gravação: ${event.error}`);
      toast.error("Erro na gravação de áudio");
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        analyzeTranscription(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success("Gravação iniciada - fale agora");
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const audioFile = e.target.files?.[0];
    if (!audioFile) return;

    audioFileRef.current = audioFile;
    toast.info(`Arquivo "${audioFile.name}" selecionado`);

    // Para arquivos de áudio, informamos que precisaria de um serviço de transcrição
    setError(
      "Transcrição de arquivos de áudio requer integração com serviço de Speech-to-Text (ex: Google Cloud Speech, Azure Speech). Use a gravação em tempo real ou cole o texto manualmente."
    );
    toast.warning("Upload de arquivos ainda não implementado com API real");
  };

  const analyzeTranscription = async (text: string) => {
    if (!text.trim()) {
      toast.error("Nenhum texto para analisar");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Chama a API real do Gemini via proxy
      const response = await fetch("/api/llm-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Você é um assistente jurídico especializado em análise de audiências e reuniões.
Analise a transcrição fornecida e retorne um JSON com:
- summary: resumo executivo em 2-3 frases
- actionItems: array de 3-5 itens de ação específicos identificados

Responda APENAS com JSON válido, sem texto adicional.`,
            },
            {
              role: "user",
              content: `Analise esta transcrição de audiência/reunião jurídica:\n\n${text}`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const content = data.response || data.choices?.[0]?.message?.content || "";

      // Parse do JSON da resposta sem regex greedy
      const startIdx = content.indexOf("{");
      const endIdx = content.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonStr = content.substring(startIdx, endIdx + 1);
        const analysis: TranscriptionAnalysis = JSON.parse(jsonStr);
        setSummary(analysis.summary || "Não foi possível gerar sumário");
        setActionItems(analysis.actionItems || []);
        toast.success("Análise concluída com IA Gemini");
      } else {
        // Se não retornou JSON, usa o texto como sumário
        setSummary(content);
        setActionItems([]);
        toast.success("Análise concluída");
      }
    } catch (err) {
      console.error("Erro ao analisar transcrição:", err);
      setError("Erro ao analisar com IA. Verifique a conexão.");
      toast.error("Erro na análise com IA");
    } finally {
      setProcessing(false);
    }
  };

  // Permite análise manual de texto colado
  const handleManualAnalysis = () => {
    if (transcription.trim()) {
      analyzeTranscription(transcription.trim());
    } else {
      toast.error("Cole ou digite um texto para analisar");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transcrição de Áudio</h1>
        <p className="text-muted-foreground mt-1">
          Transcreva audiências e reuniões com análise inteligente (IA Real - Gemini)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isSpeechSupported && (
        <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            Gravação em tempo real não disponível neste navegador. Cole o texto manualmente na área
            de transcrição.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Captura de Áudio</CardTitle>
            <CardDescription>Grave em tempo real ou cole texto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-8">
              {isRecording ? (
                <div className="relative">
                  <div className="w-24 h-24 bg-destructive rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="w-12 h-12 text-destructive-foreground" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                  <Mic className="w-12 h-12 text-primary-foreground" />
                </div>
              )}

              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={processing || !isSpeechSupported}
                className="w-full"
              >
                {isRecording ? (
                  <>
                    <StopCircle className="w-5 h-5 mr-2" />
                    Parar Gravação
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Iniciar Gravação
                  </>
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild disabled={processing}>
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <Upload className="w-5 h-5 mr-2" />
                  Enviar Arquivo
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Transcrição
                {transcription && <Badge variant="default">Gemini AI</Badge>}
              </CardTitle>
              <CardDescription>Texto convertido do áudio ou colado manualmente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {processing ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Sparkles className="w-16 h-16 text-accent animate-pulse mb-4" />
                  <p className="text-lg font-medium text-foreground">Analisando com IA Gemini...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aguarde enquanto processamos o texto
                  </p>
                </div>
              ) : (
                <>
                  <Textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    className="min-h-[250px] document-content"
                    placeholder="Cole aqui o texto da audiência ou reunião para análise, ou use a gravação em tempo real..."
                  />
                  {transcription && (
                    <Button onClick={handleManualAnalysis} className="w-full">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analisar com IA
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {summary && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Sumário Executivo
                  </CardTitle>
                  <CardDescription>Resumo dos pontos principais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <p className="text-sm">{summary}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Itens de Ação
                  </CardTitle>
                  <CardDescription>Próximos passos identificados</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {actionItems.map((item, idx) => (
                      <li
                        key={`action-${idx}-${item.slice(0, 20).replaceAll(/\W/g, "")}`}
                        className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                      >
                        <span className="shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-sm flex-1">{item}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

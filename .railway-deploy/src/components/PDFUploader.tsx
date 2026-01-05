import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientesManager } from "@/hooks/use-clientes-manager";
import { useKV } from "@/hooks/use-kv";
import { geminiGenerateJSON } from "@/lib/gemini-client";
import type { PDFUploadHistory } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Clock, FileText, Loader2, Trash2, Upload, User, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Type alias para tipo de pessoa (S6571)
type TipoPessoa = "fisica" | "juridica";

interface ExtractedData {
  nome?: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipo?: TipoPessoa;
  numeroProcesso?: string;
  dataDocumento?: string;
  observacoes?: string;
}

export default function PDFUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [uploadHistory, setUploadHistory] = useKV<PDFUploadHistory[]>("pdf-upload-history", []);

  // Hook centralizado para cadastro de clientes
  const { clientes, createOrUpdateFromDocumento } = useClientesManager();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pdfFile = e.target.files?.[0];
    if (!pdfFile) return;

    if (pdfFile.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 10MB");
      return;
    }

    if (pdfFile.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos");
      return;
    }

    setSelectedFile(pdfFile);
    setExtractedData(null);
    setExtractionStatus("idle");
  };

  const readPDFAsText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = new TextDecoder("utf-8").decode(uint8Array);

      const cleanedText = text
        .replaceAll(/[^\x20-\x7E\n\r\u00C0-\u00FF]/g, " ")
        .replaceAll(/\s+/g, " ")
        .trim();

      return cleanedText;
    } catch {
      throw new Error("Erro ao ler arquivo");
    }
  };

  const extractDataWithAI = async (text: string): Promise<ExtractedData> => {
    const prompt = `Você é um assistente jurídico especializado em extrair dados de documentos legais.

Analise o texto abaixo extraído de uma procuração ou contrato e extraia as seguintes informações do CLIENTE (não do advogado):

${text}

Extraia APENAS as informações do cliente/contratante (a pessoa que está contratando os serviços jurídicos ou outorgando a procuração).

Retorne um JSON com a seguinte estrutura:
{
  "nome": "Nome completo do cliente",
  "cpfCnpj": "CPF ou CNPJ (apenas números)",
  "email": "Email se encontrado",
  "telefone": "Telefone com DDD (apenas números)",
  "endereco": "Endereço completo",
  "cidade": "Cidade",
  "estado": "Sigla do estado (ex: SP, RJ)",
  "cep": "CEP (apenas números)",
  "tipo": "fisica ou juridica",
  "numeroProcesso": "Número do processo CNJ se mencionado",
  "dataDocumento": "Data do documento no formato YYYY-MM-DD",
  "observacoes": "Qualquer informação relevante adicional sobre o cliente"
}

Regras importantes:
- Se não encontrar um campo, use null
- CPF/CNPJ: remova pontos, traços e barras
- Telefone: remova parênteses, espaços e traços
- CEP: remova traços
- Para "tipo": se encontrar CNPJ ou razão social, use "juridica", caso contrário "fisica"
- No campo "observacoes", inclua informações como: estado civil, profissão, nacionalidade, etc.

Retorne APENAS o JSON válido, sem explicações.`;

    try {
      const parsed = await geminiGenerateJSON<ExtractedData>(prompt);
      return parsed;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      throw new Error("Falha ao processar dados do documento");
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo PDF");
      return;
    }

    const historyId = `upload-${Date.now()}`;
    const newHistoryEntry: PDFUploadHistory = {
      id: historyId,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      uploadedAt: new Date().toISOString(),
      status: "processing",
    };

    setUploadHistory((current) => [newHistoryEntry, ...(current || [])]);
    setIsProcessing(true);
    setExtractionStatus("processing");

    try {
      const text = await readPDFAsText(selectedFile);

      if (!text || text.length < 50) {
        throw new Error("Documento vazio ou muito curto");
      }

      const data = await extractDataWithAI(text);

      setExtractedData(data);
      setExtractionStatus("success");

      setUploadHistory((current) =>
        (current || []).map((item) =>
          item.id === historyId
            ? {
                ...item,
                status: "success" as const,
                processedAt: new Date().toISOString(),
                extractedData: data,
              }
            : item
        )
      );

      toast.success("Dados extraídos com sucesso!");
    } catch (error) {
      console.error("Extraction error:", error);
      setExtractionStatus("error");

      setUploadHistory((current) =>
        (current || []).map((item) =>
          item.id === historyId
            ? {
                ...item,
                status: "error" as const,
                processedAt: new Date().toISOString(),
                errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
              }
            : item
        )
      );

      toast.error("Erro ao processar documento");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditField = (field: keyof ExtractedData, value: string) => {
    setExtractedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveClient = async () => {
    if (!extractedData?.nome || !extractedData?.cpfCnpj) {
      toast.error("Nome e CPF/CNPJ são obrigatórios");
      return;
    }

    // Verifica se já existe (o hook também faz upsert, mas é bom informar)
    const existingClient = clientes?.find((c) => c.cpfCnpj === extractedData.cpfCnpj);

    // Montar observações separadamente (SonarCloud S5765)
    const processoInfo = extractedData.numeroProcesso
      ? ` - Processo: ${extractedData.numeroProcesso}`
      : "";
    const documentoOrigem = `Extraído de documento: ${selectedFile?.name || "PDF"}${processoInfo}`;

    // Usa o hook centralizado para criar/atualizar cliente
    createOrUpdateFromDocumento({
      nomeCliente: extractedData.nome,
      cpfCnpj: extractedData.cpfCnpj,
      email: extractedData.email || "",
      telefone: extractedData.telefone || "",
      endereco: extractedData.endereco || "",
      cidade: extractedData.cidade || "",
      estado: extractedData.estado || "",
      cep: extractedData.cep || "",
      tipoPessoa: extractedData.tipo || "fisica",
      observacoes: extractedData.observacoes || documentoOrigem,
    });

    const action = existingClient ? "atualizado" : "cadastrado";
    toast.success(`Cliente ${extractedData.nome} ${action} com sucesso!`);

    // Atualiza histórico com referência ao cliente
    const currentHistory = uploadHistory || [];
    const latestUpload = currentHistory.find((h) => h.extractedData === extractedData);
    if (latestUpload) {
      setUploadHistory((current) =>
        (current || []).map((item) =>
          item.id === latestUpload.id
            ? {
                ...item,
                clienteId: existingClient?.id || `cliente-${extractedData.cpfCnpj}`,
              }
            : item
        )
      );
    }

    setSelectedFile(null);
    setExtractedData(null);
    setExtractionStatus("idle");

    const fileInput = document.getElementById("pdf-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleDeleteHistory = (id: string) => {
    setUploadHistory((current) => (current || []).filter((item) => item.id !== id));
    toast.success("Item removido do histórico");
  };

  const getStatusBadge = (status: PDFUploadHistory["status"]) => {
    switch (status) {
      case "processing":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 size={12} className="animate-spin" /> Processando
          </Badge>
        );
      case "success":
        return (
          <Badge variant="default" className="gap-1 bg-primary">
            <CheckCircle size={12} /> Sucesso
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle size={12} /> Erro
          </Badge>
        );
    }
  };

  const sortedHistory = [...(uploadHistory || [])].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Upload de Procuração/Contrato</h1>
        <p className="text-muted-foreground">
          Faça upload de uma procuração ou contrato em PDF para extrair automaticamente os dados do
          cliente
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">
            <Upload size={16} className="mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock size={16} className="mr-2" />
            Histórico ({sortedHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glassmorphic border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="text-primary" size={24} />
                  Upload de Documento
                </CardTitle>
                <CardDescription>Selecione um arquivo PDF (máximo 10MB)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf-file">Arquivo PDF</Label>
                  <Input
                    id="pdf-file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                    disabled={isProcessing}
                  />
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <FileText className="text-destructive" size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                <Button
                  onClick={handleExtract}
                  disabled={!selectedFile || isProcessing}
                  className="w-full button-gradient"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Extrair Dados
                    </>
                  )}
                </Button>

                {extractionStatus === "processing" && (
                  <Alert className="border-primary/50 bg-primary/5">
                    <Loader2 className="animate-spin text-primary" size={16} />
                    <AlertDescription>
                      Processando documento... Isso pode levar alguns segundos.
                    </AlertDescription>
                  </Alert>
                )}

                {extractionStatus === "success" && (
                  <Alert className="border-primary/50 bg-primary/5">
                    <CheckCircle className="text-primary" size={16} />
                    <AlertDescription>
                      Dados extraídos com sucesso! Revise os campos ao lado e salve o cliente.
                    </AlertDescription>
                  </Alert>
                )}

                {extractionStatus === "error" && (
                  <Alert className="border-destructive/50 bg-destructive/5">
                    <XCircle className="text-destructive" size={16} />
                    <AlertDescription>
                      Erro ao processar o documento. Tente novamente ou cadastre manualmente.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="glassmorphic border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="text-primary" size={24} />
                  Dados Extraídos
                </CardTitle>
                <CardDescription>Revise e edite os dados antes de salvar</CardDescription>
              </CardHeader>
              <CardContent>
                {extractedData ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        id="nome"
                        value={extractedData.nome || ""}
                        onChange={(e) => handleEditField("nome", e.target.value)}
                        placeholder="Nome do cliente"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo *</Label>
                        <select
                          id="tipo"
                          value={extractedData.tipo || "fisica"}
                          onChange={(e) => handleEditField("tipo", e.target.value as TipoPessoa)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="fisica">Pessoa Física</option>
                          <option value="juridica">Pessoa Jurídica</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cpfCnpj">
                          {extractedData.tipo === "juridica" ? "CNPJ" : "CPF"} *
                        </Label>
                        <Input
                          id="cpfCnpj"
                          value={extractedData.cpfCnpj || ""}
                          onChange={(e) => handleEditField("cpfCnpj", e.target.value)}
                          placeholder={extractedData.tipo === "juridica" ? "CNPJ" : "CPF"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={extractedData.email || ""}
                          onChange={(e) => handleEditField("email", e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={extractedData.telefone || ""}
                          onChange={(e) => handleEditField("telefone", e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        value={extractedData.endereco || ""}
                        onChange={(e) => handleEditField("endereco", e.target.value)}
                        placeholder="Rua, número, bairro"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={extractedData.cidade || ""}
                          onChange={(e) => handleEditField("cidade", e.target.value)}
                          placeholder="Cidade"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estado">UF</Label>
                        <Input
                          id="estado"
                          value={extractedData.estado || ""}
                          onChange={(e) => handleEditField("estado", e.target.value.toUpperCase())}
                          placeholder="UF"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={extractedData.cep || ""}
                        onChange={(e) => handleEditField("cep", e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>

                    {extractedData.numeroProcesso && (
                      <div className="space-y-2">
                        <Label htmlFor="numeroProcesso">Número do Processo</Label>
                        <Input
                          id="numeroProcesso"
                          value={extractedData.numeroProcesso || ""}
                          onChange={(e) => handleEditField("numeroProcesso", e.target.value)}
                          placeholder="0000000-00.0000.0.00.0000"
                          disabled
                        />
                      </div>
                    )}

                    {extractedData.observacoes && (
                      <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <textarea
                          id="observacoes"
                          value={extractedData.observacoes || ""}
                          onChange={(e) => handleEditField("observacoes", e.target.value)}
                          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Informações adicionais"
                        />
                      </div>
                    )}

                    <Separator />

                    <Button
                      onClick={handleSaveClient}
                      className="w-full button-gradient"
                      size="lg"
                      disabled={!extractedData.nome || !extractedData.cpfCnpj}
                    >
                      <CheckCircle size={20} />
                      Salvar Cliente
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      * Campos obrigatórios
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Faça upload de um PDF para extrair dados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {sortedHistory.length === 0 ? (
            <Card className="glassmorphic border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="text-muted-foreground/30 mb-4" size={64} />
                <p className="text-muted-foreground">Nenhum upload realizado ainda</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  O histórico de PDFs processados aparecerá aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((item) => (
                <Card
                  key={item.id}
                  className="glassmorphic border-border/50 hover:border-primary/30 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <FileText className="text-destructive shrink-0 mt-1" size={24} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">{item.fileName}</p>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.uploadedAt), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}{" "}
                            · {(item.fileSize / 1024).toFixed(2)} KB
                          </p>

                          {item.extractedData && (
                            <div className="mt-2 pt-2 border-t border-border/30">
                              <div className="flex items-center gap-2 text-xs">
                                <User size={14} className="text-primary" />
                                <span className="font-medium">
                                  {item.extractedData.nome || "Nome não extraído"}
                                </span>
                                {item.extractedData.cpfCnpj && (
                                  <span className="text-muted-foreground">
                                    · {item.extractedData.cpfCnpj}
                                  </span>
                                )}
                              </div>
                              {item.clienteId && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Cliente cadastrado
                                </Badge>
                              )}
                            </div>
                          )}

                          {item.errorMessage && (
                            <p className="text-xs text-destructive mt-2">{item.errorMessage}</p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteHistory(item.id)}
                        aria-label="Excluir item do histórico"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export interface Process {
  id: string;
  numeroCNJ: string;
  titulo: string;
  autor: string;
  reu: string;
  comarca: string;
  vara: string;
  status: "ativo" | "suspenso" | "arquivado" | "concluido";
  fase?: string;
  valor?: number;
  dataDistribuicao: string;
  dataUltimaMovimentacao: string;
  notas?: string;
  prazos: Prazo[];
  createdAt: string;
  updatedAt: string;
  // Contadores de documentos vinculados (atualizados automaticamente)
  expedientesCount?: number;
  intimacoesCount?: number;
  minutasCount?: number;
  documentosCount?: number;
  lastExpedienteAt?: string;
  lastMinutaAt?: string;
}

export interface Prazo {
  id: string;
  processId: string;
  descricao: string;
  dataInicio: string;
  diasCorridos: number;
  tipoPrazo: "cpc" | "clt";
  dataFinal: string;
  concluido: boolean;
  urgente: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Feriado {
  data: string;
  nome: string;
  tipo: "nacional" | "estadual" | "municipal";
}

export interface PremonicaoJuridica {
  processo_cnj: string;
  probabilidade_exito: number;
  analise_ia: string;
  estrategias_recomendadas: string[];
  precedentes_relevantes: {
    id: string;
    tribunal: string;
    numero: string;
    tema: string;
    resumo_relevancia: string;
    link: string;
  }[];
}

export interface Minuta {
  id: string;
  titulo: string;
  processId?: string;
  tipo: "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";
  conteudo: string;
  status: "rascunho" | "em-revisao" | "pendente-revisao" | "finalizada" | "arquivada";
  criadoEm: string;
  atualizadoEm: string;
  autor: string;
  googleDocsId?: string;
  googleDocsUrl?: string;
  ultimaSincronizacao?: string;
  // Campos para integração com agentes IA
  criadoPorAgente?: boolean;
  agenteId?: string;
  templateId?: string;
  expedienteId?: string;
  variaveis?: Record<string, string>;
}

export interface FinancialEntry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

// Type alias para tipos de expediente (S6571)
export type TipoExpediente = "intimacao" | "citacao" | "documento" | "outro";

export interface Expediente {
  id: string;
  processId?: string;
  tipo: TipoExpediente;
  type?: string;
  titulo?: string;
  conteudo?: string;
  content?: string;
  descricao?: string;
  dataRecebimento?: string;
  receivedAt?: string;
  prazoFatal?: string;
  deadline?:
    | string
    | {
        days?: number;
        type?: "úteis" | "corridos";
        startDate?: string;
        endDate?: string;
        description?: string;
      };
  lido?: boolean;
  arquivado?: boolean;
  analyzed?: boolean;
  processado?: boolean;
  urgente?: boolean;
  tags?: string[];
  summary?: string;
  suggestedAction?: string;
  pendingDocs?: string[];
  draftPetition?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  // Campos do DJEN
  tribunal?: string;
  numeroProcesso?: string;
  orgao?: string;
  teor?: string;
  lawyerName?: string;
  matchType?: "nome" | "oab" | "ambos";
  source?: string;
  createdAt?: string;
  data?: string;
  // Campos adicionais para validação
  status?: "pendente" | "em-analise" | "processado" | "arquivado" | "erro";
  prioridade?: "baixa" | "media" | "alta" | "urgente" | "critica";
  prazo?: {
    dataFinal: string;
    diasUteis?: number;
    diasCorridos?: number;
    tipo?: "uteis" | "corridos";
    urgente?: boolean;
  };
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  processId?: string;
  location?: string;
  // Aceita tanto pt-BR quanto inglês para compatibilidade com componentes existentes
  type: "audiencia" | "reuniao" | "prazo" | "outro" | "hearing" | "meeting" | "deadline" | "other";
  reminders?: number[];
  googleEventId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "advogado" | "assistente";
  avatarUrl?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  tipo: "fisica" | "juridica";
  status: "ativo" | "inativo";
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PDFUploadHistory {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  processedAt?: string;
  status: "processing" | "success" | "error";
  extractedData?: {
    nome?: string;
    cpfCnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    tipo?: "fisica" | "juridica";
    numeroProcesso?: string;
    dataDocumento?: string;
    observacoes?: string;
  };
  clienteId?: string;
  errorMessage?: string;
}

export type ViewType =
  | "dashboard"
  | "upload-pdf"
  | "cadastrar-cliente"
  | "clientes"
  | "processos"
  | "processes"
  | "prazos"
  | "calculadora"
  | "calculator"
  | "assistente"
  | "agentes"
  | "minutas"
  | "financeiro"
  | "financial"
  | "conhecimento"
  | "knowledge"
  | "crm"
  | "consultas"
  | "queries"
  | "analytics"
  | "ai-document-summarizer"
  | "ai-contract-analyzer"
  | "ai-legal-research"
  | "ai-email-drafter"
  | "fluent-animations"
  | "gestao"
  | "intimacoes"
  | "expedientes"
  | "batch"
  | "audio"
  | "datajud"
  | "agenda"
  | "calendar"
  | "calendario"
  | "donna"
  | "ai-agents"
  | "acervo"
  | "acervo-pje";

export interface DocumentoPJe {
  id: string;
  tipo: "certidao" | "mandado" | "despacho" | "sentenca" | "outro";
  conteudo: string;
  dataExtracao: string; // ISO 8601
  metadados: {
    numeroProcesso?: string;
    classe?: string;
    autor?: string;
    reu?: string;
    comarca?: string;
    vara?: string;
    cpfs?: string[];
    datas?: string[];
  };
}

/**
 * Evento da Linha do Tempo Processual (Timeline PJe)
 * Representa movimentações processuais exibidas na sidebar
 * Usado no componente ProcessTimelineViewer
 */
export interface ProcessEvent {
  id: string;
  processId: string;
  dataHora: string; // ISO string
  titulo: string; // Ex: "EXPEDIÇÃO DE CERTIDÃO", "PETIÇÃO JUNTADA"
  descricao?: string;
  tipo?:
    | "certidao"
    | "mandado"
    | "despacho"
    | "sentenca"
    | "peticao"
    | "intimacao"
    | "juntada"
    | "conclusos"
    | "outro";
  // Documento vinculado (PDF/HTML)
  documentoUrl?: string;
  documentoTipo?: "pdf" | "html" | "texto";
  // Metadados opcionais
  tribunal?: string;
  orgao?: string;
  numeroDocumento?: string;
  source?: "djen" | "datajud" | "pje" | "manual" | "ia";
  // Relacionamento com entidades existentes
  expedienteId?: string;
  minutaId?: string;
}

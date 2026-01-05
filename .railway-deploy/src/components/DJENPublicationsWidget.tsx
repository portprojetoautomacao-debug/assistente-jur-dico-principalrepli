/**
 * DJEN Publications Widget - Refatorado
 *
 * Versão otimizada com complexidade cognitiva reduzida (S3776)
 * Separação de responsabilidades em hooks customizados
 */

import { DJENErrorCard } from "@/components/djen/DJENErrorCard";
import { DJENLoadingCard } from "@/components/djen/DJENLoadingCard";
import { PublicationItem } from "@/components/PublicationItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDJENProcessRegistration } from "@/hooks/use-djen-process-registration";
import { useDJENPublications } from "@/hooks/use-djen-publications";
import { useDJENSync } from "@/hooks/use-djen-sync";
import { useKV } from "@/hooks/use-kv";
import { getRelativeDateDescription } from "@/lib/date-utils";
import { extractPartiesWithFallback } from "@/lib/extract-parties-service";
import { cn } from "@/lib/utils";
import type { Expediente, Process, TipoExpediente } from "@/types";
import { ArrowRight, Bot, CheckCircle, Clock, Filter, Newspaper, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// Tipos
interface DJENPublication {
  id: string;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  lawyerName: string;
  matchType: "nome" | "oab" | "ambos";
  source: string;
  createdAt: string;
  notified?: boolean;
}

// Interface ExpedientesResponse removida - não utilizada

interface PartiesResult {
  autor: string;
  reu: string;
  advogadoAutor?: string;
  advogadoReu?: string;
}

/**
 * Cria um novo processo a partir de uma publicação DJEN
 */
function createProcessFromPublication(
  pub: DJENPublication,
  parties: PartiesResult,
  now: string
): Process {
  return {
    id: crypto.randomUUID(),
    numeroCNJ: pub.numeroProcesso!,
    titulo: `${pub.tipo || "Intimação"} - ${pub.tribunal}`,
    autor: parties.autor || "Não identificado",
    reu: parties.reu || "Não identificado",
    comarca: pub.orgao || "",
    vara: pub.tribunal || "",
    status: "ativo",
    fase: "Inicial",
    dataDistribuicao: pub.data || now.split("T")[0],
    dataUltimaMovimentacao: now,
    notas: buildProcessNotes(pub, parties),
    prazos: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Monta as notas do processo
 */
function buildProcessNotes(pub: DJENPublication, parties: PartiesResult): string {
  const advAutor = parties.advogadoAutor ? `\nAdvogado Autor: ${parties.advogadoAutor}` : "";
  const advReu = parties.advogadoReu ? `\nAdvogado Réu: ${parties.advogadoReu}` : "";
  const teorTruncado = pub.teor.length > 500 ? pub.teor.substring(0, 500) + "..." : pub.teor;

  return `Origem: DJEN\nAdvogado: ${pub.lawyerName}\nTipo de match: ${pub.matchType}${advAutor}${advReu}\n\nTeor da intimação:\n${teorTruncado}`;
}

/**
 * Cria um expediente a partir de uma publicação DJEN
 */
function createExpedienteFromPublication(
  pub: DJENPublication,
  processId: string,
  now: string
): Expediente {
  return {
    id: crypto.randomUUID(),
    processId,
    tipo: (pub.tipo || "intimacao") as TipoExpediente,
    titulo: `${pub.tipo || "Intimação"} - ${pub.numeroProcesso}`,
    conteudo: pub.teor,
    content: pub.teor,
    teor: pub.teor,
    dataRecebimento: now,
    receivedAt: now,
    lido: false,
    arquivado: false,
    analyzed: false,
    tribunal: pub.tribunal,
    numeroProcesso: pub.numeroProcesso,
    orgao: pub.orgao,
    lawyerName: pub.lawyerName,
    matchType: pub.matchType,
    source: pub.source,
    createdAt: pub.createdAt,
    data: pub.data,
    priority: "high", // Intimações são sempre prioridade alta
  };
}

// ===== Registration Helpers (reduces S3776 Cognitive Complexity) =====

interface RegistrationContext {
  createOrUpdateFromDjenIntimacao: (data: {
    nomeCliente: string;
    cidade: string;
    estado: string;
    processo: string;
  }) => void;
}

/**
 * Extrai cidade e estado do campo orgão
 */
function parseOrgaoLocation(orgao?: string): {
  cidade: string;
  estado: string;
} {
  const parts = orgao?.split("/") || [];
  return {
    cidade: parts[0] || "",
    estado: parts[1] || "",
  };
}

/**
 * Registra cliente a partir das partes extraídas
 */
function registerClientFromParties(
  parties: PartiesResult,
  pub: DJENPublication,
  ctx: RegistrationContext
): void {
  if (!parties.autor || parties.autor === "Não identificado") return;

  const location = parseOrgaoLocation(pub.orgao);
  ctx.createOrUpdateFromDjenIntimacao({
    nomeCliente: parties.autor,
    cidade: location.cidade,
    estado: location.estado,
    processo: pub.numeroProcesso || "",
  });
}

/**
 * Processa uma única publicação para registro
 */
async function _processPublicationForRegistration(
  pub: DJENPublication,
  now: string,
  ctx: RegistrationContext
): Promise<{ process: Process; expediente: Expediente } | null> {
  if (!pub.numeroProcesso) return null;

  const parties = await extractPartiesWithFallback(pub.teor);
  registerClientFromParties(parties, pub, ctx);

  const newProcess = createProcessFromPublication(pub, parties, now);
  const newExpediente = createExpedienteFromPublication(pub, newProcess.id, now);

  return { process: newProcess, expediente: newExpediente };
}

interface DJENPublicationsWidgetProps {
  readonly onViewAll?: () => void;
  readonly compact?: boolean;
  readonly maxItems?: number;
}

// Interface para props do PublicationsHeader (reduz parâmetros para conformidade S107)
interface PublicationsHeaderProps {
  readonly publicationsCount: number;
  readonly filter: "all" | "unread";
  readonly setFilter: (fn: (f: "all" | "unread") => "all" | "unread") => void;
  readonly syncing: boolean;
  readonly handleSync: (fn?: () => void | Promise<void>) => Promise<void>;
  readonly fetchPublications: () => Promise<void>;
  readonly lastCheck: string | null;
  readonly lawyersCount: number;
}

// Helpers de renderização extraídos para reduzir complexidade (S3776)
function PublicationsHeader(props: Readonly<PublicationsHeaderProps>) {
  const {
    publicationsCount,
    filter,
    setFilter,
    syncing,
    handleSync,
    fetchPublications,
    lastCheck,
    lawyersCount,
  } = props;

  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm gradient-text">
          <Newspaper size={20} className="text-primary" />
          Publicações DJEN
          {publicationsCount > 0 && (
            <Button variant="secondary" className="ml-1 h-5 px-2 text-xs">
              {publicationsCount}
            </Button>
          )}
        </CardTitle>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter((f) => (f === "all" ? "unread" : "all"))}
                  className="h-8 w-8 p-0"
                  aria-label={
                    filter === "all"
                      ? "Filtrar: mostrar apenas não lidas"
                      : "Filtrar: mostrar todas"
                  }
                >
                  <Filter size={16} className={filter === "unread" ? "text-primary" : ""} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {filter === "all" ? "Mostrar não lidas" : "Mostrar todas"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleSync(fetchPublications).catch(console.error);
                  }}
                  disabled={syncing}
                  className="h-8 w-8 p-0"
                  aria-label="Sincronizar publicações agora"
                >
                  <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sincronizar agora</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
        {lastCheck && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Última verificação: {lastCheck}
          </span>
        )}
        {lawyersCount > 0 && (
          <span className="flex items-center gap-1">
            <CheckCircle size={12} className="text-green-500" />
            {lawyersCount} advogado(s) monitorado(s)
          </span>
        )}
      </div>
    </CardHeader>
  );
}

function PublicationsContent(content: React.ReactNode, footer: React.ReactNode) {
  return (
    <CardContent className="pt-2">
      {content}
      {footer}
    </CardContent>
  );
}

// Decisor puro de conteúdo (reduz condicionais e nesting)
function ContentDecider({
  publications,
  compact,
  expanded,
  setExpanded,
  handleRegisterProcess,
  isAlreadyRegistered,
  formatRelativeDate,
  emptyState,
}: Readonly<{
  publications: DJENPublication[];
  compact: boolean;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  handleRegisterProcess: (pub: DJENPublication) => void;
  isAlreadyRegistered: (pub: DJENPublication) => boolean;
  formatRelativeDate: (dateStr: string) => string;
  emptyState: React.ReactNode;
}>) {
  if (publications.length === 0) return emptyState as React.ReactElement;

  return (
    <ScrollArea className={compact ? "h-[250px]" : "h-[350px]"}>
      <div className="space-y-2 pr-2">
        {publications.map((pub) => (
          <PublicationItem
            key={pub.id}
            pub={pub}
            expanded={expanded}
            onToggleExpand={setExpanded}
            onRegister={handleRegisterProcess}
            isAlreadyRegistered={isAlreadyRegistered(pub)}
            formatRelativeDate={formatRelativeDate}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

// === HELPER COMPONENTS (extraídos para evitar S6478) ===

function FooterRegisterButton({
  show,
  autoRegistering,
  onRegisterAll,
}: Readonly<{
  show: boolean;
  autoRegistering: boolean;
  onRegisterAll: () => void;
}>) {
  if (!show) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="sm"
            onClick={onRegisterAll}
            disabled={autoRegistering}
            className="flex-1 button-gradient"
            aria-label="Cadastrar todas as intimações"
          >
            <Bot size={14} className={autoRegistering ? "animate-pulse" : ""} />
            {autoRegistering ? "Cadastrando..." : "Cadastrar Todas"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Cadastra automaticamente todas as intimações no Acervo</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FooterViewAllButton({
  show,
  compactLayout,
  onViewAll,
}: Readonly<{
  show: boolean;
  compactLayout: boolean;
  onViewAll?: () => void;
}>) {
  if (!show || !onViewAll) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onViewAll}
      className={cn(
        "hover:button-gradient hover:text-primary-foreground",
        compactLayout ? "flex-1" : "w-full"
      )}
      aria-label="Ver todas as publicações"
    >
      Ver todas
      <ArrowRight size={14} />
    </Button>
  );
}

function FooterButtonsSection({
  showRegisterAll,
  showViewAll,
  autoRegistering,
  onRegisterAll,
  onViewAll,
}: Readonly<{
  showRegisterAll: boolean;
  showViewAll: boolean;
  autoRegistering: boolean;
  onRegisterAll: () => void;
  onViewAll?: () => void;
}>) {
  const compactLayout = showRegisterAll;
  return (
    <div className="flex gap-2">
      <FooterRegisterButton
        show={showRegisterAll}
        autoRegistering={autoRegistering}
        onRegisterAll={onRegisterAll}
      />
      <FooterViewAllButton show={showViewAll} compactLayout={compactLayout} onViewAll={onViewAll} />
    </div>
  );
}

// === HELPER FUNCTIONS (extraídos para evitar S7721) ===

/**
 * Verifica se há publicações não cadastradas (decisor puro para exibição)
 */
function shouldShowRegisterAll(
  pubs: DJENPublication[],
  isAlreadyRegistered: (pub: DJENPublication) => boolean
): boolean {
  // S7745: some() já retorna false para arrays vazios, não precisa verificar length
  return pubs.some((p) => p.numeroProcesso && !isAlreadyRegistered(p));
}

/**
 * Verifica se deve exibir botão "Ver todas" (decisor puro para exibição)
 */
function shouldShowViewAll(pubs: DJENPublication[], onView?: () => void): boolean {
  // Simplificado: verifica apenas se há callback e publicações existem
  return pubs.length > 0 && onView !== undefined;
}

export default function DJENPublicationsWidget({
  onViewAll,
  compact = false,
  maxItems = 5,
}: Readonly<DJENPublicationsWidgetProps>) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Hooks customizados para reduzir complexidade
  const { publications, loading, error, lastCheck, lawyersCount, fetchPublications, isGeoBlocked } =
    useDJENPublications(maxItems, filter);

  const { syncing, handleSync } = useDJENSync();

  // KV storage para processos e expedientes
  const [processes, setProcesses] = useKV<Process[]>("processes", []);
  const [, setExpedientes] = useKV<Expediente[]>("expedientes", []);

  const { autoRegistering, isAlreadyRegistered, handleRegisterProcess, handleAutoRegisterAll } =
    useDJENProcessRegistration(processes, setProcesses, setExpedientes);

  // Carrega publicações ao montar
  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  // Auto-cadastro automático quando novas publicações são encontradas
  useEffect(() => {
    if (publications.length === 0 || autoRegistering) return;

    const unregisteredPubs = publications.filter(
      (pub) => pub.numeroProcesso && !isAlreadyRegistered(pub)
    );

    if (unregisteredPubs.length > 0) {
      console.log(
        `[DJEN Auto-Cadastro] Cadastrando ${unregisteredPubs.length} processo(s) automaticamente...`
      );
      handleAutoRegisterAll(publications).catch((err) =>
        console.error("[DJEN Auto-Cadastro] Erro:", err)
      );
    }
  }, [publications, isAlreadyRegistered, handleAutoRegisterAll, autoRegistering]);

  // Renderiza estado de loading
  const renderLoadingState = () => <DJENLoadingCard compact={compact} />;

  // Normaliza mensagem de erro para string
  const errorMessage: string | undefined =
    typeof error === "string"
      ? error
      : (error as unknown as { message?: string } | undefined)?.message || undefined;

  // Renderiza estado de erro
  const renderErrorState = () => (
    <DJENErrorCard
      compact={compact}
      error={errorMessage ?? "Erro desconhecido"}
      isGeoBlocked={isGeoBlocked}
      onRetry={() => {
        fetchPublications().catch((err) => console.error("[DJENWidget] Retry failed:", err));
      }}
    />
  );

  // Renderiza lista vazia
  const renderEmptyState = (): React.ReactNode => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Newspaper size={40} className="text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-1">Nenhuma publicação encontrada</p>
      <p className="text-xs text-muted-foreground">
        {lawyersCount === 0 ? "Configure advogados para monitorar" : "O monitoramento está ativo"}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await handleSync(fetchPublications);
          } catch (err) {
            console.error("[DJENWidget] Sync failed:", err);
          }
        }}
        className="mt-4"
        disabled={syncing}
      >
        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
        Verificar agora
      </Button>
    </div>
  );

  // Constrói seção de rodapé com botões
  function buildFooterSection(showFooter: boolean): React.ReactNode {
    if (!showFooter) return null;
    const showRegisterAll = shouldShowRegisterAll(publications, isAlreadyRegistered);
    const showViewAll = shouldShowViewAll(publications, onViewAll);
    return (
      <>
        <Separator className="my-3" />
        <FooterButtonsSection
          showRegisterAll={showRegisterAll}
          showViewAll={showViewAll}
          autoRegistering={autoRegistering}
          onRegisterAll={() => {
            handleAutoRegisterAll(publications).catch((err) =>
              console.error("[DJENWidget] Auto-register failed:", err)
            );
          }}
          onViewAll={onViewAll}
        />
      </>
    );
  }

  // Early return: Loading state
  if (loading) {
    return renderLoadingState();
  }

  // Early return: Error state
  if (error && publications.length === 0) {
    return renderErrorState();
  }

  // Renderiza header do card
  const renderCardHeader = () =>
    PublicationsHeader({
      publicationsCount: publications.length,
      filter,
      setFilter,
      syncing,
      handleSync: (onSuccess?: () => void) => handleSync(onSuccess),
      fetchPublications: () => fetchPublications(),
      lastCheck,
      lawyersCount,
    });

  // Renderiza conteúdo principal
  const showFooter = publications.length > 0;

  const contentNode = (
    <ContentDecider
      publications={publications}
      compact={compact}
      expanded={expanded}
      setExpanded={setExpanded}
      handleRegisterProcess={handleRegisterProcess}
      isAlreadyRegistered={isAlreadyRegistered}
      formatRelativeDate={getRelativeDateDescription}
      emptyState={renderEmptyState()}
    />
  );

  const renderCardContent = () => PublicationsContent(contentNode, buildFooterSection(showFooter));

  // Main render
  return (
    <Card className={cn("card-glow-hover glassmorphic", compact && "h-fit")}>
      {renderCardHeader()}
      {renderCardContent()}
    </Card>
  );
}

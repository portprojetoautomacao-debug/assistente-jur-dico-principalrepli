/**
 * Hook personalizado para gerenciar registro de processos DJEN
 * Reduz complexidade cognitiva do componente principal
 */

import { useClientesManager } from "@/hooks/use-clientes-manager";
import { extractPartiesWithFallback } from "@/lib/extract-parties-service";
import type { Expediente, Process, TipoExpediente } from "@/types";
import type { DJENPublication } from "@/types/djen-publication";
import { useState } from "react";
import { toast } from "sonner";

// Helper functions moved from component
function createProcessFromPublication(
  pub: DJENPublication,
  parties: {
    autor: string;
    reu: string;
    advogadoAutor?: string;
    advogadoReu?: string;
  },
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

function buildProcessNotes(
  pub: DJENPublication,
  parties: {
    autor: string;
    reu: string;
    advogadoAutor?: string;
    advogadoReu?: string;
  }
): string {
  const advAutor = parties.advogadoAutor ? `\nAdvogado Autor: ${parties.advogadoAutor}` : "";
  const advReu = parties.advogadoReu ? `\nAdvogado Réu: ${parties.advogadoReu}` : "";
  const teorTruncado = pub.teor.length > 500 ? pub.teor.substring(0, 500) + "..." : pub.teor;

  return `Origem: DJEN\nAdvogado: ${pub.lawyerName}\nTipo de match: ${pub.matchType}${advAutor}${advReu}\n\nTeor da intimação:\n${teorTruncado}`;
}

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
    priority: "high",
  };
}

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

function formatPartiesDescription(parties: { autor: string; reu: string }): string {
  if (parties.autor === "Não identificado") return "";
  return ` - ${parties.autor} x ${parties.reu}`;
}

export function useDJENProcessRegistration(
  processes: Process[] | null,
  setProcesses: (updater: (current: Process[] | null) => Process[]) => void,
  setExpedientes: (updater: (current: Expediente[] | null) => Expediente[]) => void
) {
  const [autoRegistering, setAutoRegistering] = useState(false);
  const { createOrUpdateFromDjenIntimacao } = useClientesManager();

  const checkProcessExists = (numeroProcesso: string | undefined): boolean => {
    if (!numeroProcesso) return false;
    const currentProcesses = processes || [];
    return currentProcesses.some(
      (p) =>
        p.numeroCNJ === numeroProcesso ||
        p.numeroCNJ.replaceAll(/\D/g, "") === numeroProcesso.replaceAll(/\D/g, "")
    );
  };

  const isAlreadyRegistered = (pub: DJENPublication): boolean => {
    return checkProcessExists(pub.numeroProcesso);
  };

  const registerClientFromParties = (
    parties: {
      autor: string;
      reu: string;
      advogadoAutor?: string;
      advogadoReu?: string;
    },
    pub: DJENPublication
  ): void => {
    if (!parties.autor || parties.autor === "Não identificado") return;

    const location = parseOrgaoLocation(pub.orgao);
    createOrUpdateFromDjenIntimacao({
      nomeCliente: parties.autor,
      cidade: location.cidade,
      estado: location.estado,
      processo: pub.numeroProcesso || "",
    });
  };

  const processPublicationForRegistration = async (
    pub: DJENPublication,
    now: string
  ): Promise<{ process: Process; expediente: Expediente } | null> => {
    if (!pub.numeroProcesso) return null;

    const parties = await extractPartiesWithFallback(pub.teor);
    registerClientFromParties(parties, pub);

    const newProcess = createProcessFromPublication(pub, parties, now);
    const newExpediente = createExpedienteFromPublication(pub, newProcess.id, now);

    return { process: newProcess, expediente: newExpediente };
  };

  const handleRegisterProcess = async (pub: DJENPublication) => {
    if (!pub.numeroProcesso) {
      toast.error("Processo sem número CNJ", {
        description: "Não é possível cadastrar sem número do processo",
      });
      return;
    }

    if (isAlreadyRegistered(pub)) {
      toast.info("Processo já cadastrado", {
        description: `O processo ${pub.numeroProcesso} já está no Acervo`,
      });
      return;
    }

    toast.info("Extraindo partes do processo...", {
      description: "Analisando teor da publicação com IA",
    });

    const now = new Date().toISOString();
    const result = await processPublicationForRegistration(pub, now);

    if (!result) return;

    setProcesses((current) => [...(current || []), result.process]);
    setExpedientes((current) => [...(current || []), result.expediente]);

    const parties = await extractPartiesWithFallback(pub.teor);
    toast.success("Processo cadastrado!", {
      description: `${pub.numeroProcesso} adicionado ao Acervo${formatPartiesDescription(parties)}`,
    });
  };

  const handleAutoRegisterAll = async (publications: DJENPublication[]) => {
    if (autoRegistering) return;
    setAutoRegistering(true);

    try {
      const unregisteredPubs = publications.filter(
        (pub) => pub.numeroProcesso && !isAlreadyRegistered(pub)
      );

      if (unregisteredPubs.length === 0) {
        toast.info("Nenhuma publicação nova", {
          description: "Todas as publicações já estão no Acervo",
        });
        return;
      }

      const now = new Date().toISOString();
      const newProcesses: Process[] = [];
      const newExpedientes: Expediente[] = [];

      toast.info(`Processando ${unregisteredPubs.length} publicações...`, {
        description: "Extraindo partes dos processos com IA",
      });

      for (const pub of unregisteredPubs) {
        const result = await processPublicationForRegistration(pub, now);
        if (result) {
          newProcesses.push(result.process);
          newExpedientes.push(result.expediente);
        }
      }

      setProcesses((current) => [...(current || []), ...newProcesses]);
      setExpedientes((current) => [...(current || []), ...newExpedientes]);

      toast.success(`${newProcesses.length} processo(s) cadastrado(s)!`, {
        description: "As intimações foram adicionadas ao Acervo e Expedientes",
      });
    } finally {
      setAutoRegistering(false);
    }
  };

  return {
    autoRegistering,
    isAlreadyRegistered,
    handleRegisterProcess,
    handleAutoRegisterAll,
  };
}

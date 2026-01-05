/**
 * Hook centralizado para gestão de clientes
 *
 * Uso:
 * - createClienteManual() para cadastro via formulário
 * - createOrUpdateFromDjenIntimacao() para importação de intimações DJEN
 * - createOrUpdateFromDocumento() para importação de documentos/PDFs
 *
 * @example
 * const { clientes, createOrUpdateFromDjenIntimacao } = useClientesManager()
 * createOrUpdateFromDjenIntimacao({ nomeCliente: 'João Silva', cpfCnpj: '123.456.789-00' })
 */

import { useKV } from "@/hooks/use-kv";
import type { Cliente } from "@/types";

// ============================================
// TIPOS PARA INTEGRAÇÃO
// ============================================

export interface DjenIntimacaoPayload {
  nomeCliente: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  numeroProcesso?: string;
  processo?: string; // alias para numeroProcesso
  cidade?: string;
  estado?: string;
  tipoPessoa?: "fisica" | "juridica";
  observacoes?: string;
}

export interface DocumentoClientePayload {
  nomeCliente: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipoPessoa?: "fisica" | "juridica";
  observacoes?: string;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useClientesManager() {
  const [clientes, setClientes] = useKV<Cliente[]>("clientes", []);

  /**
   * Função interna de upsert (create or update)
   * Busca por CPF/CNPJ ou email para determinar se atualiza ou cria
   */
  const upsertCliente = (data: Partial<Cliente> & { nome: string }): Cliente | null => {
    if (!data.nome?.trim()) {
      console.warn("[useClientesManager] Nome do cliente é obrigatório");
      return null;
    }

    const existingByDoc = data.cpfCnpj
      ? (clientes || []).find((c) => c.cpfCnpj === data.cpfCnpj)
      : null;
    const existingByEmail = data.email
      ? (clientes || []).find((c) => c.email === data.email)
      : null;
    const existing = existingByDoc || existingByEmail;

    if (existing) {
      // UPDATE - atualiza dados existentes
      const updated: Cliente = {
        ...existing,
        nome: data.nome || existing.nome,
        email: data.email || existing.email,
        telefone: data.telefone || existing.telefone,
        endereco: data.endereco || existing.endereco,
        cidade: data.cidade || existing.cidade,
        estado: data.estado || existing.estado,
        cep: data.cep || existing.cep,
        tipo: data.tipo || existing.tipo,
        observacoes: data.observacoes
          ? `${existing.observacoes || ""}\n${data.observacoes}`.trim()
          : existing.observacoes,
        updatedAt: new Date().toISOString(),
      };
      setClientes((current = []) => current.map((c) => (c.id === existing.id ? updated : c)));
      return updated;
    } else {
      // CREATE - novo cliente
      const novo: Cliente = {
        id: `cliente-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome: data.nome,
        cpfCnpj: data.cpfCnpj || "",
        email: data.email || "",
        telefone: data.telefone || "",
        endereco: data.endereco || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        cep: data.cep || "",
        tipo: data.tipo || "fisica",
        status: "ativo",
        observacoes: data.observacoes || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setClientes((current = []) => [...current, novo]);
      return novo;
    }
  };

  /**
   * Cadastro manual via formulário
   */
  const createClienteManual = (formData: {
    nome: string;
    cpfCnpj: string;
    email: string;
    telefone: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    tipo: "fisica" | "juridica";
    observacoes: string;
  }) => {
    const cliente = upsertCliente({
      nome: formData.nome,
      cpfCnpj: formData.cpfCnpj,
      email: formData.email,
      telefone: formData.telefone,
      endereco: formData.endereco,
      cidade: formData.cidade,
      estado: formData.estado,
      cep: formData.cep,
      tipo: formData.tipo,
      observacoes: formData.observacoes,
    });
    return cliente;
  };

  /**
   * Importação a partir de intimação DJEN
   * Chamado automaticamente pelos agentes de monitoramento
   */
  const createOrUpdateFromDjenIntimacao = (payload: DjenIntimacaoPayload) => {
    if (!payload.nomeCliente?.trim()) {
      console.warn("[useClientesManager] Intimação sem nome de cliente válido");
      return null;
    }

    // processo é alias para numeroProcesso
    const numProcesso = payload.numeroProcesso || payload.processo;

    const obs =
      payload.observacoes ||
      (numProcesso
        ? `Importado de intimação DJEN - Processo: ${numProcesso}`
        : "Importado de intimação DJEN");

    const cliente = upsertCliente({
      nome: payload.nomeCliente,
      cpfCnpj: payload.cpfCnpj || "",
      email: payload.email || "",
      telefone: payload.telefone || "",
      cidade: payload.cidade || "",
      estado: payload.estado || "",
      tipo: payload.tipoPessoa || "fisica",
      observacoes: obs,
    });

    if (cliente) {
      console.log("[useClientesManager] Cliente importado de intimação DJEN:", cliente.nome);
    }

    return cliente;
  };

  /**
   * Importação a partir de documento/PDF analisado
   * Chamado pelo PDFUploader e BatchAnalysis
   */
  const createOrUpdateFromDocumento = (payload: DocumentoClientePayload) => {
    if (!payload.nomeCliente?.trim() || !payload.cpfCnpj?.trim()) {
      console.warn("[useClientesManager] Documento sem nome ou CPF/CNPJ válido");
      return null;
    }

    const cliente = upsertCliente({
      nome: payload.nomeCliente,
      cpfCnpj: payload.cpfCnpj,
      email: payload.email || "",
      telefone: payload.telefone || "",
      endereco: payload.endereco || "",
      cidade: payload.cidade || "",
      estado: payload.estado || "",
      cep: payload.cep || "",
      tipo: payload.tipoPessoa || "fisica",
      observacoes: payload.observacoes || "Importado de documento",
    });

    if (cliente) {
      console.log("[useClientesManager] Cliente importado de documento:", cliente.nome);
    }

    return cliente;
  };

  return {
    clientes,
    setClientes,
    createClienteManual,
    createOrUpdateFromDjenIntimacao,
    createOrUpdateFromDocumento,
    upsertCliente,
  };
}

export default useClientesManager;

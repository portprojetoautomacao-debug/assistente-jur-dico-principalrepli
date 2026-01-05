/**
 * Hook otimizado para gest�o de clientes com valida��o Zod
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useKV } from "./use-kv";
import {
  validateCliente,
  isValidCPF,
  isValidCNPJ,
  type ClienteValidated as _ClienteValidated,
} from "@/schemas/process.schema";

// Tipo Cliente (compat�vel com o sistema)
export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export function useClientesValidated() {
  const [clientes, setClientes] = useKV<Cliente[]>("clientes", []);

  // Adicionar cliente com valida��o completa
  const addCliente = useCallback(
    (clienteData: Omit<Cliente, "id" | "criadoEm" | "atualizadoEm">) => {
      const now = new Date().toISOString();
      const newCliente = {
        ...clienteData,
        id: crypto.randomUUID(),
        criadoEm: now,
        atualizadoEm: now,
      };

      // Valida��o de schema
      const validation = validateCliente(newCliente);
      if (!validation.isValid) {
        console.error("Valida��o de schema falhou:", validation.errors);
        toast.error("Dados do cliente inv�lidos. Verifique os campos obrigat�rios.");
        return null;
      }

      // Valida��o espec�fica de CPF/CNPJ
      const cleanDoc = newCliente.cpfCnpj.replace(/\D/g, "");
      const isCPF = cleanDoc.length === 11;
      const isCNPJ = cleanDoc.length === 14;

      if (isCPF && !isValidCPF(newCliente.cpfCnpj)) {
        toast.error("CPF inv�lido. Verifique os d�gitos verificadores.");
        return null;
      }

      if (isCNPJ && !isValidCNPJ(newCliente.cpfCnpj)) {
        toast.error("CNPJ inv�lido. Verifique os d�gitos verificadores.");
        return null;
      }

      setClientes((prev) => [...prev, validation.data as Cliente]);
      toast.success("Cliente adicionado com sucesso!");
      return validation.data as Cliente;
    },
    [setClientes]
  );

  // Atualizar cliente com valida��o
  const updateCliente = useCallback(
    (id: string, updates: Partial<Cliente>) => {
      let updated: Cliente | null = null;

      setClientes((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const updatedCliente = {
              ...c,
              ...updates,
              atualizadoEm: new Date().toISOString(),
            };

            const validation = validateCliente(updatedCliente);
            if (!validation.isValid) {
              console.error("Valida��o falhou:", validation.errors);
              toast.error("Dados inv�lidos. Atualiza��o cancelada.");
              return c;
            }

            // Se CPF/CNPJ foi alterado, validar
            if (updates.cpfCnpj) {
              const cleanDoc = updatedCliente.cpfCnpj.replace(/\D/g, "");
              const isCPF = cleanDoc.length === 11;
              const isCNPJ = cleanDoc.length === 14;

              if (isCPF && !isValidCPF(updatedCliente.cpfCnpj)) {
                toast.error("CPF inv�lido. Atualiza��o cancelada.");
                return c;
              }

              if (isCNPJ && !isValidCNPJ(updatedCliente.cpfCnpj)) {
                toast.error("CNPJ inv�lido. Atualiza��o cancelada.");
                return c;
              }
            }

            updated = validation.data as Cliente;
            toast.success("Cliente atualizado!");
            return updated;
          }
          return c;
        })
      );

      return updated;
    },
    [setClientes]
  );

  // Remover cliente
  const deleteCliente = useCallback(
    (id: string) => {
      setClientes((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cliente removido!");
    },
    [setClientes]
  );

  // Buscar cliente por ID
  const getClienteById = useCallback(
    (id: string) => {
      return clientes.find((c) => c.id === id);
    },
    [clientes]
  );

  // Buscar cliente por CPF/CNPJ
  const getClienteByCpfCnpj = useCallback(
    (cpfCnpj: string) => {
      const cleanSearch = cpfCnpj.replace(/\D/g, "");
      return clientes.find((c) => c.cpfCnpj.replace(/\D/g, "") === cleanSearch);
    },
    [clientes]
  );

  // Buscar clientes por nome (busca parcial)
  const searchClientesByName = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return clientes.filter((c) => c.nome.toLowerCase().includes(lowerQuery));
    },
    [clientes]
  );

  return {
    clientes,
    setClientes,
    addCliente,
    updateCliente,
    deleteCliente,
    getClienteById,
    getClienteByCpfCnpj,
    searchClientesByName,
  };
}

// lib/ai/tools.ts
// Ferramentas REAIS conectadas às APIs do sistema
// Substituem completamente os dados simulados
// Circuit Breaker Pattern para resiliência

import type { Tool, ToolContext } from "./core-agent";
import { CircuitBreakerRegistry } from "./circuit-breaker";

export interface GlobalToolContext extends ToolContext {
  baseUrl: string;          // URL base do app (ex: https://assistente-juridico-github.vercel.app)
  evolutionApiUrl: string;  // URL da Evolution API
  evolutionApiKey: string;
}

/**
 * 1) Buscar intimação pendente (PJe / DJEN / DataJud)
 * Conecta com /api/djen/check - DADOS REAIS
 * Circuit Breaker: 5 falhas = OPEN, 60s timeout
 */
export const buscarIntimacaoPendente: Tool = {
  name: "buscarIntimacaoPendente",
  description:
    "Busca a próxima intimação pendente de análise no sistema (PJe / DJEN / DataJud). Retorna dados REAIS das APIs jurídicas.",
  async run(args, ctx: ToolContext) {
    const globalCtx = ctx as GlobalToolContext;
    const url = `${globalCtx.baseUrl}/api/djen/check`;
    const breaker = CircuitBreakerRegistry.get('djen-api', {
      failureThreshold: 5,
      timeout: 60000, // 60s
    });
    
    try {
      return await breaker.execute(async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "next-pending", ...args }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        return await res.json();
      });
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[buscarIntimacaoPendente] Erro:`, error);
      throw new Error(`Erro ao buscar intimação: ${error.message}`);
    }
  },
};

/**
 * 2) Criar tarefa (Todoist / CRM interno)
 * Conecta com /api/todoist - TAREFAS REAIS
 */
export const criarTarefa: Tool = {
  name: "criarTarefa",
  description:
    "Cria uma tarefa jurídica REAL no sistema de tarefas (Todoist/CRM). Retorna o ID da tarefa criada.",
  async run(args, ctx: GlobalToolContext) {
    const url = `${ctx.baseUrl}/api/todoist`;
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-task",
          ...args,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      return data;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[criarTarefa] Erro:`, error);
      throw new Error(`Erro ao criar tarefa: ${error.message}`);
    }
  },
};

/**
 * 3) Calcular prazos processuais REAIS
 * Conecta com /api/deadline/calculate - CÁLCULOS REAIS
 */
export const calcularPrazos: Tool = {
  name: "calcularPrazos",
  description:
    "Calcula prazos processuais REAIS a partir de uma data base, tipo de prazo e tribunal. Considera feriados e dias úteis.",
  async run(args, ctx: GlobalToolContext) {
    const url = `${ctx.baseUrl}/api/deadline/calculate`;
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      return data;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[calcularPrazos] Erro:`, error);
      throw new Error(`Erro ao calcular prazo: ${error.message}`);
    }
  },
};

/**
 * 4) Consultar processo REAL no PJe / serviços-legais
 * Conecta com /api/serviços-legais - PROCESSOS REAIS
 */
export const consultarProcessoPJe: Tool = {
  name: "consultarProcessoPJe",
  description:
    "Consulta dados REAIS de um processo (PJe / DJEN / DataJud) pelo número CNJ. Retorna andamentos, partes e status atualizados.",
  async run(args, ctx: GlobalToolContext) {
    const url = `${ctx.baseUrl}/api/legal-services`;
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "consultar-processo", ...args }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      return data;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[consultarProcessoPJe] Erro:`, error);
      throw new Error(`Erro ao consultar processo: ${error.message}`);
    }
  },
};

/**
 * 5) Enviar mensagem REAL via WhatsApp (Evolution API)
 * Conecta com Evolution API - MENSAGENS REAIS
 */
export const enviarMensagemWhatsApp: Tool = {
  name: "enviarMensagemWhatsApp",
  description:
    "Envia uma mensagem de texto REAL via WhatsApp usando a Evolution API. Retorna status de envio.",
  async run(args, ctx: GlobalToolContext) {
    const { numero, mensagem } = args ?? {};
    
    if (!numero || !mensagem) {
      throw new Error("Campos 'numero' e 'mensagem' são obrigatórios.");
    }

    if (!ctx.evolutionApiUrl || !ctx.evolutionApiKey) {
      throw new Error("Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY.");
    }

    try {
      const res = await fetch(`${ctx.evolutionApiUrl}/message/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ctx.evolutionApiKey,
        },
        body: JSON.stringify({
          number: numero,
          textMessage: { text: mensagem },
          options: { delay: 0 },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      return data;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[enviarMensagemWhatsApp] Erro:`, error);
      throw new Error(`Erro ao enviar WhatsApp: ${error.message}`);
    }
  },
};

/**
 * 6) Registrar log de execução REAL do agente em KV/Redis
 * Conecta com /api/kv - LOGS REAIS
 */
export const registrarLogAgente: Tool = {
  name: "registrarLogAgente",
  description:
    "Registra log estruturado REAL da execução do agente em KV/Redis para auditoria e telemetria.",
  async run(args, ctx: GlobalToolContext) {
    const url = `${ctx.baseUrl}/api/kv`;
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log-agent",
          payload: {
            timestamp: new Date().toISOString(),
            ...args,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      return data;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[registrarLogAgente] Erro:`, error);
      throw new Error(`Erro ao registrar log: ${error.message}`);
    }
  },
};

/**
 * Lista de TODAS as ferramentas disponíveis
 * Cada agente escolhe quais pode usar via toolNames
 */
export const ALL_TOOLS: Tool[] = [
  buscarIntimacaoPendente,
  criarTarefa,
  calcularPrazos,
  consultarProcessoPJe,
  enviarMensagemWhatsApp,
  registrarLogAgente,
];

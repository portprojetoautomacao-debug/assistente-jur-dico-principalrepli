/**
 * Custom KV (Key-Value) storage hook - OTIMIZADO V2
 *
 * Implementa:
 * - Batching de requisições (agrupa múltiplas chaves em uma chamada)
 * - Cache local com TTL
 * - Debounce para evitar rajadas
 * - Circuit breaker para desabilitar API em caso de muitos erros
 *
 * Usa localStorage como fallback e Upstash Redis em produção.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// CACHE E BATCHING
// ============================================================================

// Cache em memória com TTL
const memoryCache = new Map<string, { value: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 60 segundos (aumentado para reduzir requests)
const BATCH_DELAY_MS = 150; // Aguarda 150ms para agrupar requisições (aumentado)
const MAX_BATCH_SIZE = 50; // Máximo de chaves por batch (aumentado)

// Fila de chaves pendentes para carregar
const pendingKeys = new Set<string>();
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
const pendingResolvers = new Map<string, Array<(value: unknown) => void>>();

// Fila de escritas pendentes
const pendingWrites = new Map<string, { value: unknown; timestamp: number }>();
let writeTimeout: ReturnType<typeof setTimeout> | null = null;
const WRITE_DEBOUNCE_MS = 2000; // Aguarda 2s antes de enviar escritas (aumentado)

// Circuit breaker para desabilitar API temporariamente
let circuitBreakerTripped = false;
let circuitBreakerResetTime = 0;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 3;
const CIRCUIT_BREAKER_COOLDOWN = 60000; // 60 segundos de cooldown

// Flag para verificar se estamos em produção
const isProd =
  globalThis.window !== undefined &&
  (globalThis.window.location.hostname.includes("vercel.app") ||
    globalThis.window.location.hostname !== "localhost");

/**
 * Verifica se o circuit breaker está ativo
 */
function isCircuitOpen(): boolean {
  if (!circuitBreakerTripped) return false;

  // Verifica se o cooldown passou
  if (Date.now() > circuitBreakerResetTime) {
    circuitBreakerTripped = false;
    consecutiveErrors = 0;
    console.log("[KV] Circuit breaker reset - tentando API novamente");
    return false;
  }

  return true;
}

/**
 * Registra um erro e ativa circuit breaker se necessário
 */
function recordApiError(): void {
  consecutiveErrors++;
  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    circuitBreakerTripped = true;
    circuitBreakerResetTime = Date.now() + CIRCUIT_BREAKER_COOLDOWN;
    console.warn("[KV] Circuit breaker ativado - usando localStorage por 60s");
  }
}

/**
 * Registra sucesso e reseta contador
 */
function recordApiSuccess(): void {
  consecutiveErrors = 0;
}

/**
 * Verifica se o valor em cache ainda é válido
 */
function isCacheValid(key: string): boolean {
  const cached = memoryCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL_MS;
}

/**
 * Obtém valor do cache
 */
function getFromCache<T>(key: string): T | null {
  if (isCacheValid(key)) {
    return memoryCache.get(key)!.value as T;
  }
  return null;
}

/**
 * Salva no cache
 */
function setInCache<T>(key: string, value: T): void {
  memoryCache.set(key, { value, timestamp: Date.now() });
}

/**
 * Carrega valores do localStorage para as chaves especificadas
 */
function loadFromLocalStorage(keys: string[]): Map<string, unknown> {
  const results = new Map<string, unknown>();
  for (const key of keys) {
    try {
      const item = globalThis.window.localStorage.getItem(key);
      if (item) {
        const value = JSON.parse(item);
        results.set(key, value);
        setInCache(key, value);
      }
    } catch {
      // Ignora erros de parse
    }
  }
  return results;
}

/**
 * Processa resposta bem sucedida da API
 */
function processApiResponse(
  data: { values?: Record<string, unknown> },
  results: Map<string, unknown>
): void {
  if (data.values && typeof data.values === "object") {
    for (const [k, v] of Object.entries(data.values)) {
      results.set(k, v);
      setInCache(k, v);
    }
  }
}

/**
 * Carrega múltiplas chaves em uma única requisição
 */
async function batchLoadFromVercelKV(keys: string[]): Promise<Map<string, unknown>> {
  const results = new Map<string, unknown>();

  if (keys.length === 0) return results;

  // Se circuit breaker estiver ativo, use localStorage
  if (isCircuitOpen()) {
    return loadFromLocalStorage(keys);
  }

  try {
    // Usa o endpoint de batch
    const batchKeys = keys.slice(0, MAX_BATCH_SIZE);

    const response = await fetch("/api/kv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "batch-get", keys: batchKeys }),
    });

    if (response.ok) {
      recordApiSuccess();
      const data = await response.json();
      processApiResponse(data, results);
    } else if (response.status === 429) {
      recordApiError();
      // Rate limit - usar localStorage como fallback silenciosamente
      return loadFromLocalStorage(batchKeys);
    } else {
      recordApiError();
    }
  } catch {
    recordApiError();
    // Fallback para localStorage
    return loadFromLocalStorage(keys);
  }

  return results;
}

/**
 * Processa o batch de requisições pendentes
 */
async function processBatch(): Promise<void> {
  const keys = Array.from(pendingKeys);
  pendingKeys.clear();
  batchTimeout = null;

  if (keys.length === 0) return;

  const results = await batchLoadFromVercelKV(keys);

  // Resolve todas as promises pendentes
  for (const key of keys) {
    const resolvers = pendingResolvers.get(key);
    if (resolvers) {
      const value = results.get(key) ?? null;
      for (const resolve of resolvers) {
        resolve(value);
      }
      pendingResolvers.delete(key);
    }
  }
}

/**
 * Agenda uma chave para carregamento em batch
 */
function scheduleLoad(key: string): Promise<unknown> {
  // Verifica cache primeiro
  const cached = getFromCache(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    pendingKeys.add(key);

    // Adiciona resolver para esta chave
    if (!pendingResolvers.has(key)) {
      pendingResolvers.set(key, []);
    }
    pendingResolvers.get(key)!.push(resolve);

    // Agenda o batch se não estiver agendado
    batchTimeout ??= setTimeout(() => {
      processBatch();
    }, BATCH_DELAY_MS);
  });
}

/**
 * Processa escritas pendentes em batch
 */
async function processWriteBatch(): Promise<void> {
  const writes = new Map(pendingWrites);
  pendingWrites.clear();
  writeTimeout = null;

  if (writes.size === 0) return;

  // Se circuit breaker estiver ativo, não envia para API
  if (isCircuitOpen()) {
    return;
  }

  try {
    const entries = Array.from(writes.entries()).map(([key, { value }]) => ({
      key,
      value,
    }));

    // AbortController com timeout de 5s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("/api/kv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "batch-set", entries }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      recordApiSuccess();
    } else if (response.status === 429 || response.status === 413) {
      // 429 = Rate limit, 413 = Payload muito grande
      if (response.status === 413 && import.meta.env.DEV) {
        console.warn("[KV] Payload excede limite do Upstash - considere reduzir tamanho dos dados");
      }
      recordApiError();
    }
  } catch (error) {
    // Silenciar erros de rede em dev
    if (error instanceof Error && error.name !== "AbortError") {
      console.debug("[KV] API não disponível (normal em dev):", error.message);
    }
    recordApiError();
  }
}

/**
 * Agenda uma escrita para o batch
 */
function scheduleWrite<T>(key: string, value: T): void {
  // Sempre salva no localStorage imediatamente
  try {
    globalThis.window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage cheio ou indisponível
  }

  // Atualiza cache
  setInCache(key, value);

  // Agenda escrita para Vercel KV (apenas em produção)
  if (isProd) {
    pendingWrites.set(key, { value, timestamp: Date.now() });

    writeTimeout ??= setTimeout(() => {
      processWriteBatch();
    }, WRITE_DEBOUNCE_MS);
  }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Custom hook for key-value storage - OTIMIZADO
 *
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns [value, setValue] - Current value and setter function
 */
export function useKV<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Inicializa com valor do cache ou localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Verifica cache em memória primeiro
    const cached = getFromCache<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Tenta localStorage
    try {
      const item = globalThis.window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setInCache(key, parsed);
        return parsed;
      }
    } catch {
      // Ignora erros
    }

    return initialValue;
  });

  // Ref para evitar re-renders desnecessários
  const isLoadingRef = useRef(false);
  const keyRef = useRef(key);

  // Update keyRef in effect to avoid accessing ref during render
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Setter otimizado
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((currentStoredValue) => {
        const valueToStore =
          typeof value === "function" ? (value as (prev: T) => T)(currentStoredValue) : value;

        // Agenda escrita (debounced)
        scheduleWrite(keyRef.current, valueToStore);

        return valueToStore;
      });
    },
    [] // scheduleWrite é função estável, não precisa estar nas dependências
  );

  // Carrega do Vercel KV em produção (batched)
  useEffect(() => {
    if (!isProd || isLoadingRef.current) return;

    isLoadingRef.current = true;

    scheduleLoad(key)
      .then((value) => {
        if (value !== null && value !== undefined) {
          setStoredValue(value as T);
        }
        isLoadingRef.current = false;
      })
      .catch(() => {
        isLoadingRef.current = false;
      });
  }, [key]);

  return [storedValue, setValue];
}

// Re-export para compatibilidade
export default useKV;

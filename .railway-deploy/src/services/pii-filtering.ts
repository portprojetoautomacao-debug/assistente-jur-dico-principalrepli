/**
 * PII (Personally Identifiable Information) Filtering Service
 *
 * Servi�o de sanitiza��o de dados pessoais para conformidade com LGPD
 * (Lei Geral de Prote��o de Dados - Lei 13.709/2018)
 *
 * Remove ou mascara dados sens�veis antes de enviar para servi�os de monitoramento
 *
 * @see https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
 */

/**
 * Tipos de dados pessoais cobertos pela LGPD (Art. 5�)
 */
export enum PIIType {
  CPF = "cpf",
  EMAIL = "email",
  TELEFONE = "telefone",
  ENDERECO = "endereco",
  CONTA_BANCARIA = "conta_bancaria",
  CARTAO_CREDITO = "cartao_credito",
  RG = "rg",
  CNH = "cnh",
  PASSPORT = "passport",
  OAB = "oab",
  NOME_COMPLETO = "nome_completo",
}

/**
 * Configura��o de PII filtering
 */
export interface PIIFilterConfig {
  /** Habilitar sanitiza��o (default: true em produ��o) */
  enabled: boolean;

  /** Tipos de PII para detectar e mascarar */
  detectedTypes: PIIType[];

  /** Caractere de m�scara (default: '*') */
  maskChar: string;

  /** Manter primeiros N caracteres vis�veis */
  keepFirst: number;

  /** Manter �ltimos N caracteres vis�veis */
  keepLast: number;

  /** Substitui��o customizada por tipo */
  customReplacements?: Partial<Record<PIIType, string>>;
}

/**
 * Configura��o padr�o para produ��o
 */
export const DEFAULT_PII_CONFIG: PIIFilterConfig = {
  // Habilitar por padr�o em todos os ambientes (incluindo testes) para garantir compliance LGPD
  enabled: true,
  detectedTypes: [
    PIIType.CPF,
    PIIType.EMAIL,
    PIIType.TELEFONE,
    PIIType.ENDERECO,
    PIIType.CONTA_BANCARIA,
    PIIType.CARTAO_CREDITO,
    PIIType.RG,
    PIIType.CNH,
    PIIType.OAB,
  ],
  maskChar: "*",
  keepFirst: 2,
  keepLast: 2,
  customReplacements: {
    [PIIType.CPF]: "[CPF_REDACTED]",
    [PIIType.EMAIL]: "[EMAIL_REDACTED]",
    [PIIType.TELEFONE]: "[PHONE_REDACTED]",
    [PIIType.CONTA_BANCARIA]: "[ACCOUNT_REDACTED]",
    [PIIType.CARTAO_CREDITO]: "[CARD_REDACTED]",
  },
};

/**
 * Regex patterns para detec��o de dados sens�veis
 */
export const PII_PATTERNS: Record<PIIType, RegExp> = {
  // CPF: 123.456.789-09 ou 12345678909
  [PIIType.CPF]: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/g,

  // Email: usuario@dominio.com
  [PIIType.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,

  // Telefone: (11) 98765-4321, 11987654321, +55 11 98765-4321, 11 98765-4321
  [PIIType.TELEFONE]: /(?:\+55\s{0,1})?(?:\(?\d{2}\)?\s{0,1})?\d{4,5}[\s-]{0,1}\d{4}\b/g,

  // Endere�o: Rua/Av + nome + n�mero
  [PIIType.ENDERECO]:
    /(?:Rua|Avenida|Av\.|R\.|Travessa|Trav\.)\s{1,3}[A-Za-zà-ú\s]{1,100},?\s{0,2}\d+/gi,

  // Conta banc�ria: Ag 1234 C/C 12345-6
  [PIIType.CONTA_BANCARIA]: /(?:Ag|Agência|Conta|C\/C)[\s:]{0,3}\d{3,6}-?\d?/gi,

  // Cart�o de cr�dito: 1234 5678 9012 3456
  [PIIType.CARTAO_CREDITO]: /\b\d{4}[\s-]{0,1}\d{4}[\s-]{0,1}\d{4}[\s-]{0,1}\d{4}\b/g,

  // RG: 12.345.678-9 ou 123456789
  [PIIType.RG]: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9X]\b/g,

  // CNH: 12345678901
  [PIIType.CNH]: /\bCNH:?\s*\d{11}\b/gi,

  // Passaporte: AB123456
  [PIIType.PASSPORT]: /\b[A-Z]{2}\d{6}\b/g,

  // OAB: OAB/SP 123.456
  [PIIType.OAB]: /\bOAB\/[A-Z]{2}\s{0,2}\d{3,6}\.?\d{0,3}\b/gi,

  // Nome completo (heur�stica: Nome Sobrenome com mai�sculas)
  [PIIType.NOME_COMPLETO]:
    /\b[A-ZÀ-Ü][a-zà-ü]{1,30}\s{1,2}(?:[A-ZÀ-Ü][a-zà-ü]{1,30}[\s]{0,2}){1,5}\b/g,
};

/**
 * Mascara um valor detectado
 */
function maskValue(value: string, config: PIIFilterConfig): string {
  const { maskChar, keepFirst, keepLast } = config;

  if (value.length <= keepFirst + keepLast) {
    return maskChar.repeat(value.length);
  }

  const first = value.substring(0, keepFirst);
  const last = value.substring(value.length - keepLast);
  const middle = maskChar.repeat(value.length - keepFirst - keepLast);

  return `${first}${middle}${last}`;
}

/**
 * Sanitiza texto removendo/mascarando PII
 */
export function sanitizePII(text: string, config: PIIFilterConfig = DEFAULT_PII_CONFIG): string {
  if (!config.enabled) {
    return text;
  }

  let sanitized = text;

  for (const type of config.detectedTypes) {
    const pattern = PII_PATTERNS[type];
    const customReplacement = config.customReplacements?.[type];

    // Reset lastIndex para garantir que regex global funcione corretamente
    pattern.lastIndex = 0;

    if (customReplacement) {
      // Substituição customizada
      sanitized = sanitized.replace(pattern, customReplacement);
    } else {
      // Mascaramento padrão
      sanitized = sanitized.replace(pattern, (match) => maskValue(match, config));
    }
  }

  // Redactar padrões de senha comuns (senha seguida de números/letras)
  sanitized = sanitized.replace(/senha[\w\d]+/gi, "[REDACTED]");
  sanitized = sanitized.replace(/password[\w\d]+/gi, "[REDACTED]");

  return sanitized;
}

/**
 * Sanitiza objeto recursivamente (para JSON/spans do Sentry)
 */
export function sanitizeObject<T>(obj: T, config: PIIFilterConfig = DEFAULT_PII_CONFIG): T {
  if (!config.enabled) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizePII(obj, config) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, config)) as T;
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};

    const isSensitiveKey = (key: string): boolean => {
      const sensibleKeys = [
        "password",
        "senha",
        "pass",
        "pwd",
        "token",
        "apikey",
        "api_key",
        "secret",
        "authorization",
        "auth",
        "cookie",
        "session",
      ];

      const keyLower = key.toLowerCase();

      return sensibleKeys.some((k) => {
        if (keyLower === k) return true;

        const separators = ["_", "-"];
        return separators.some(
          (sep) =>
            keyLower.startsWith(k + sep) ||
            keyLower.endsWith(sep + k) ||
            keyLower.includes(sep + k + sep)
        );
      });
    };

    const shouldRedactValueString = (value: unknown): boolean =>
      typeof value === "string" && /senha\d+/gi.test(value);

    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        // Sanitizar o valor recursivamente
        const sanitizedValue = sanitizeObject(value, config);

        if (shouldRedactValueString(sanitizedValue)) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = sanitizedValue;
        }
      }
    }

    return sanitized as T;
  }

  return obj;
}

/**
 * Valida se um CPF � v�lido (usado para reduzir falsos positivos)
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // 111.111.111-11

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;

  if (digit !== Number.parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;

  return digit === Number.parseInt(cleaned.charAt(10));
}

/**
 * Detecta tipos de PII presentes em um texto
 */
export function detectPII(text: string): PIIType[] {
  const detected: PIIType[] = [];

  const hasValidCpf = (matches: string[]) => matches.some(isValidCPF);

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    // Reset lastIndex para evitar problemas com regex global
    pattern.lastIndex = 0;

    // Usa match() diretamente ao invés de test() + match() para CPF
    const matches = text.match(pattern);

    if (matches && matches.length > 0) {
      // Validação especial para CPF (reduzir falsos positivos)
      if (type === PIIType.CPF) {
        if (hasValidCpf(matches)) detected.push(type as PIIType);
      } else {
        detected.push(type as PIIType);
      }
    }
  }

  return detected;
}

/**
 * Estat�sticas de sanitiza��o (para auditoria LGPD)
 */
export interface PIISanitizationStats {
  totalProcessed: number;
  totalSanitized: number;
  byType: Record<PIIType, number>;
  lastSanitized: string;
}

let stats: PIISanitizationStats = {
  totalProcessed: 0,
  totalSanitized: 0,
  byType: {} as Record<PIIType, number>,
  lastSanitized: "",
};

/**
 * Registra estat�sticas de sanitiza��o
 */
export function recordPIISanitization(types: PIIType[]): void {
  stats.totalProcessed++;

  if (types.length > 0) {
    stats.totalSanitized++;
    stats.lastSanitized = new Date().toISOString();

    for (const type of types) {
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }
  }
}

/**
 * Obt�m estat�sticas de sanitiza��o
 */
export function getPIIStats(): PIISanitizationStats {
  return { ...stats };
}

/**
 * Reseta estat�sticas (para testes)
 */
export function resetPIIStats(): void {
  stats = {
    totalProcessed: 0,
    totalSanitized: 0,
    byType: {} as Record<PIIType, number>,
    lastSanitized: "",
  };
}

/**
 * Exemplo de uso com Sentry beforeSend
 */
export type MinimalSentryEvent = {
  message?: string;
  exception?: { values?: { value?: string }[] };
  breadcrumbs?: { message?: string; data?: unknown }[];
  contexts?: unknown;
  extra?: unknown;
};

export function createPIIFilteredBeforeSend(config: PIIFilterConfig = DEFAULT_PII_CONFIG) {
  return (event: unknown): MinimalSentryEvent => {
    const _event = event as MinimalSentryEvent;
    if (!config.enabled) {
      return event as MinimalSentryEvent;
    }

    // Sanitiza mensagem de erro
    if (_event.message) {
      const detected = detectPII(_event.message);
      _event.message = sanitizePII(_event.message, config);
      recordPIISanitization(detected);
    }

    // Sanitiza exception
    if (_event.exception?.values) {
      for (const exception of _event.exception.values) {
        if (exception.value) {
          const detected = detectPII(exception.value);
          exception.value = sanitizePII(exception.value, config);
          recordPIISanitization(detected);
        }
      }
    }

    // Sanitiza breadcrumbs
    if (_event.breadcrumbs) {
      for (const breadcrumb of _event.breadcrumbs) {
        if (breadcrumb.message) {
          breadcrumb.message = sanitizePII(breadcrumb.message, config);
        }
        if (breadcrumb.data) {
          breadcrumb.data = sanitizeObject(breadcrumb.data, config);
        }
      }
    }

    // Sanitiza contexts
    if (_event.contexts) {
      _event.contexts = sanitizeObject(_event.contexts, config);
    }

    // Sanitiza extra
    if (_event.extra) {
      _event.extra = sanitizeObject(_event.extra, config);
    }
    return _event as MinimalSentryEvent;
  };
}

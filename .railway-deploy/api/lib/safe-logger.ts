/**
 * Utilitários para sanitização de logs e dados sensíveis
 * Remove informações confidenciais antes do logging
 */

export interface SanitizeOptions {
  maxLength?: number
  maskFields?: string[]
  removeFields?: string[]
}

/**
 * Campos sensíveis que devem ser mascarados ou removidos
 */
const SENSITIVE_FIELDS: string[] = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'auth',
  'credential',
  'oauth',
  'client_secret',
  'api_key',
  'access_token',
  'refresh_token',
  'bearer',
  'x-api-key',
  'x-auth-token'
]

/**
 * Campos que contêm dados pessoais (PII)
 */
const PII_FIELDS: string[] = [
  'email',
  'cpf',
  'cnpj',
  'rg',
  'telefone',
  'celular',
  'endereco',
  'cep',
  'nome_completo',
  'data_nascimento',
  'numero_oab',
  'uf_oab'
]

/**
 * Mascara uma string sensível
 */
export function maskSensitive(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length)
  }

  const start = value.substring(0, visibleChars)
  const end = value.substring(value.length - visibleChars)
  const masked = '*'.repeat(value.length - visibleChars * 2)

  return `${start}${masked}${end}`
}

// ===== Helper functions for sanitizeObject (reduces S3776) =====

function isPrimitive(obj: unknown): boolean {
  return obj === null || obj === undefined || 
         typeof obj === 'number' || typeof obj === 'boolean'
}

function looksLikeToken(str: string): boolean {
  return str.length > 20 && /^[A-Za-z0-9+/=.\-_]+$/.test(str)
}

function sanitizeString(str: string): string {
  return looksLikeToken(str) ? maskSensitive(str) : str
}

function shouldRemoveField(key: string, options: SanitizeOptions): boolean {
  const lowerKey = key.toLowerCase()
  return (
    options.removeFields?.includes(lowerKey) ||
    SENSITIVE_FIELDS.some(field => lowerKey.includes(field))
  )
}

function shouldMaskAsPII(key: string): boolean {
  const lowerKey = key.toLowerCase()
  return PII_FIELDS.some(field => lowerKey.includes(field))
}

function shouldMaskExplicitly(key: string, options: SanitizeOptions): boolean {
  const lowerKey = key.toLowerCase()
  return options.maskFields?.includes(lowerKey) || false
}

function sanitizeValue(value: unknown, forPII: boolean): unknown {
  if (typeof value === 'string') {
    return maskSensitive(value)
  }
  return forPII ? '[REDACTED]' : value
}

function sanitizeObjectFields(
  input: Record<string, unknown>,
  options: SanitizeOptions
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    if (shouldRemoveField(key, options)) continue

    if (shouldMaskAsPII(key)) {
      sanitized[key] = sanitizeValue(value, true)
      continue
    }

    if (shouldMaskExplicitly(key, options)) {
      sanitized[key] = sanitizeValue(value, false)
      continue
    }

    sanitized[key] = sanitizeObject(value, options)
  }

  return sanitized
}

/**
 * Sanitiza um valor removendo ou mascarando campos sensíveis
 * Refactored to reduce cognitive complexity (S3776)
 */
export function sanitizeObject(
  obj: unknown,
  options: SanitizeOptions = {}
): unknown {
  if (isPrimitive(obj)) return obj

  if (typeof obj === 'string') return sanitizeString(obj)

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options))
  }

  if (typeof obj === 'object') {
    return sanitizeObjectFields(obj as Record<string, unknown>, options)
  }

  return obj
}

/**
 * Sanitiza uma mensagem de erro
 */
export function sanitizeError(error: unknown): unknown {
  if (!error) return error

  return sanitizeObject(error, {
    removeFields: ['stack', 'cause'],
    maskFields: ['message']
  })
}

/**
 * Logger seguro que sanitiza automaticamente
 */
export class SafeLogger {
  private readonly context: string

  constructor(context: string) {
    this.context = context
  }

  private sanitizeArgs(args: unknown[]): unknown[] {
    return args.map(arg => sanitizeObject(arg))
  }

  info(message: string, ...args: unknown[]): void {
     
    console.log(`[${this.context}] ${message}`, ...this.sanitizeArgs(args))
  }

  warn(message: string, ...args: unknown[]): void {
     
    console.warn(`[${this.context}] ${message}`, ...this.sanitizeArgs(args))
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    const sanitizedError = error ? sanitizeError(error) : undefined
     
    console.error(
      `[${this.context}] ${message}`,
      sanitizedError,
      ...this.sanitizeArgs(args)
    )
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
       
      console.debug(`[${this.context}] ${message}`, ...this.sanitizeArgs(args))
    }
  }
}

/**
 * Sanitiza headers HTTP
 */
export function sanitizeHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()

    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = maskSensitive(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Sanitiza URL removendo query parameters sensíveis
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams

    params.forEach((value, param) => {
      if (SENSITIVE_FIELDS.some(field => param.toLowerCase().includes(field))) {
        params.set(param, maskSensitive(value || ''))
      }
    })

    return urlObj.toString()
  } catch {
    // Se não for uma URL válida, devolve como veio
    return url
  }
}

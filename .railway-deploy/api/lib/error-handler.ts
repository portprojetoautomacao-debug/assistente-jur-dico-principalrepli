/**
 * Tratamento padronizado de erros
 * Centraliza formatação e logging de erros
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SafeLogger } from './safe-logger.js';

const logger = new SafeLogger('ErrorHandler');

export interface ErrorResponse {
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

export interface SuccessResponse<T = unknown> {
  ok: true;
  data?: T;
  message?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Códigos de erro padronizados
 */
export const ErrorCodes = {
  // Validação
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Autenticação
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',

  // Autorização
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Recursos
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // Serviços externos
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',

  // Sistema
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Agentes
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_BUSY: 'AGENT_BUSY',
  TASK_FAILED: 'TASK_FAILED'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Classe base para erros da aplicação
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Erros específicos
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorCodes.VALIDATION_FAILED, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Autenticação obrigatória') {
    super(message, ErrorCodes.AUTH_REQUIRED, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, ErrorCodes.FORBIDDEN, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, ErrorCodes.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit excedido', retryAfter?: number) {
    super(message, ErrorCodes.RATE_LIMIT_EXCEEDED, 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: unknown) {
    super(
      `Erro no serviço externo: ${service}`,
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      502,
      details
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * Trata erros e retorna resposta padronizada
 */
export function handleError(
  error: unknown,
  res: VercelResponse,
  context?: string
): void {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    // Erro genérico
    appError = new AppError(
      error.message,
      ErrorCodes.INTERNAL_ERROR,
      500,
      { originalError: error.name }
    );
  } else {
    // Erro desconhecido
    appError = new AppError(
      'Erro interno do servidor',
      ErrorCodes.INTERNAL_ERROR,
      500,
      { originalError: String(error) }
    );
  }

  // Log do erro - refatorado para evitar template literal aninhado (SonarCloud S5765)
  const contextPrefix = context ? `em ${context}` : '';
  const logMessage = contextPrefix
    ? `Erro ${contextPrefix}: ${appError.message}`
    : `Erro: ${appError.message}`;

  logger.error(
    logMessage,
    appError,
    {
      code: appError.code,
      statusCode: appError.statusCode,
      details: appError.details
    }
  );

  // Resposta de erro
  const errorResponse: ErrorResponse = {
    ok: false,
    error: appError.message,
    code: appError.code,
    details: process.env.NODE_ENV === 'development' ? appError.details : undefined,
    timestamp: new Date().toISOString()
  };

  res.status(appError.statusCode).json(errorResponse);
}

/**
 * Wrapper para handlers com tratamento automático de erros
 */
export function withErrorHandler(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void> | void,
  context?: string
) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      handleError(error, res, context);
    }
  };
}

/**
 * Cria resposta de sucesso padronizada
 */
export function createSuccessResponse<T = unknown>(
  data?: T,
  message?: string,
  metadata?: Record<string, unknown>
): SuccessResponse<T> {
  return {
    ok: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    metadata
  };
}

/**
 * Envia resposta de sucesso
 */
export function sendSuccess<T = unknown>(
  res: VercelResponse,
  data?: T,
  message?: string,
  statusCode: number = 200,
  metadata?: Record<string, unknown>
): void {
  res.status(statusCode).json(createSuccessResponse(data, message, metadata));
}

/**
 * Middleware de CORS padronizado
 */
export function addCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
}

/**
 * Trata requests OPTIONS (CORS preflight)
 */
export function handleOptions(res: VercelResponse): void {
  addCorsHeaders(res);
  res.status(200).end();
}
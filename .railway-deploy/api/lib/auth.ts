import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

/**
 * Middleware para checar Authorization: Bearer <TOKEN>
 * Faz comparação em tempo-constante (timingSafeEqual) para prevenir timing attacks
 */
export function requireApiKey(
  req: VercelRequest,
  res: VercelResponse,
  envVarName = "EMAIL_API_KEY"
) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  const expected = process.env[envVarName] ?? "";
  // If API key is not configured, allow requests in development/test to simplify local testing
  if (!expected && (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development")) {
    console.debug(
      `[Auth] ${envVarName} not set - allowing request in ${process.env.NODE_ENV} mode`
    );
    return true;
  }
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);

    // Prevent short-circuit if different length
    if (a.length !== b.length) {
      // Use constant-time compare with zero-padded buffers
      const padded = Buffer.alloc(Math.max(a.length, b.length));
      a.copy(padded);
      const cmp = crypto.timingSafeEqual(padded, padded);
      // deliberately fail
      if (!cmp) {
        // fallthrough
      }
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }

    const ok = crypto.timingSafeEqual(a, b);
    if (!ok) {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }

    return true;
  } catch (_e) {
    // Any error should deny access
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
}

export default requireApiKey;
/**
 * Middleware de autenticação para endpoints sensíveis
 * Valida tokens de acesso e autoriza operações
 */

import { SafeLogger } from "./safe-logger.js";

const logger = new SafeLogger("Auth");

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
  code?: string;
}

/**
 * Extrai token de autorização do request
 */
function extractToken(req: VercelRequest): string | null {
  // Header Authorization
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Query parameter (para desenvolvimento/testing)
  const token = req.query.token as string;
  if (token) {
    return token;
  }

  // Body (para POST requests)
  if (req.method === "POST" && req.body?.token) {
    return req.body.token;
  }

  return null;
}

/**
 * Valida token de autenticação
 */
export async function validateAuthToken(token: string): Promise<AuthResult> {
  try {
    // Token vazio ou inválido
    if (!token || typeof token !== "string" || token.length < 10) {
      return {
        authenticated: false,
        error: "Token inválido ou ausente",
        code: "INVALID_TOKEN",
      };
    }

    // Para desenvolvimento: aceitar tokens de teste
    if (process.env.NODE_ENV === "development") {
      const testTokens = [process.env.TEST_AUTH_TOKEN, "test-token-123", "dev-token-456"].filter(
        Boolean
      );

      if (testTokens.includes(token)) {
        return {
          authenticated: true,
          userId: "dev-user",
        };
      }
    }

    // SECURITY(HIGH): Implementar validação JWT completa com refresh tokens
    // Bibliotecas: jsonwebtoken + express-jwt + rate-limiter
    // Fluxo:
    // 1. Access token (exp: 15min) + Refresh token (exp: 7d, HttpOnly cookie)
    // 2. Validar assinatura com RS256 (chave pública/privada)
    // 3. Verificar claims: iss, aud, exp, jti (token ID para revogação)
    // 4. Implementar blacklist de tokens revogados no Redis (TTL = token exp)
    // 5. Rate limiting: 5 tentativas/min por IP
    // Ref: https://github.com/thiagobodevan-a11y/assistente-juridico-p/issues/security-001
    // ⚠️ IMPORTANTE: Implementação temporária - aceita qualquer token em produção
    // Ação necessária: Usar jsonwebtoken para validar signature + claims
    // Prazo sugerido: Sprint de segurança antes de lançamento público
    // Documentação: docs/SECURITY_AUTH_ROADMAP.md

    logger.warn("Usando validação de token temporária - implementar JWT real");

    return {
      authenticated: true,
      userId: "authenticated-user",
    };
  } catch (error) {
    logger.error("Erro na validação de token", error);
    return {
      authenticated: false,
      error: "Erro interno na validação",
      code: "VALIDATION_ERROR",
    };
  }
}

/**
 * Middleware de autenticação obrigatório
 */
export async function requireAuth(req: VercelRequest, _res: VercelResponse): Promise<AuthResult> {
  const token = extractToken(req);

  if (!token) {
    logger.warn("Tentativa de acesso sem token", {
      method: req.method,
      url: req.url,
      ip: req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown",
    });

    return {
      authenticated: false,
      error: "Autenticação obrigatória",
      code: "AUTH_REQUIRED",
    };
  }

  const authResult = await validateAuthToken(token);

  if (!authResult.authenticated) {
    logger.warn("Token inválido rejeitado", {
      method: req.method,
      url: req.url,
      error: authResult.error,
    });
  }

  return authResult;
}

/**
 * Middleware de autenticação opcional
 */
export async function optionalAuth(req: VercelRequest): Promise<AuthResult> {
  const token = extractToken(req);

  if (!token) {
    return {
      authenticated: false,
      userId: undefined,
    };
  }

  return await validateAuthToken(token);
}

/**
 * Helper para responder com erro de autenticação
 */
export function sendAuthError(res: VercelResponse, result: AuthResult): void {
  const statusCode = result.code === "AUTH_REQUIRED" ? 401 : 403;

  res.status(statusCode).json({
    ok: false,
    error: result.error || "Não autorizado",
    code: result.code,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Wrapper para handlers que requerem autenticação
 */
export function withAuth(
  handler: (req: VercelRequest, res: VercelResponse, userId: string) => Promise<void> | void
) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    const auth = await requireAuth(req, res);

    if (!auth.authenticated) {
      sendAuthError(res, auth);
      return;
    }

    await handler(req, res, auth.userId!);
  };
}

/**
 * Environment Variable Utilities
 *
 * Helper functions to safely access environment variables in both
 * Vite (frontend/browser) and Node.js (backend) contexts.
 */

type EnvKey = string;

/**
 * Safely get an environment variable from either process.env (Node.js) or import.meta.env (Vite).
 * Handles the VITE_ prefix convention automatically.
 *
 * @param key - The environment variable key (without VITE_ prefix)
 * @param fallback - Optional fallback value if the variable is not found
 * @returns The environment variable value or fallback
 */
export function getEnvVar(key: EnvKey, fallback?: string): string | undefined {
  // Try process.env first (Node.js / backend)
  if (typeof process !== "undefined" && process.env) {
    // Try both with and without VITE_ prefix
    let value = process.env[key] || process.env[`VITE_${key}`];
    if (value) return value;

    // Special handling for GEMINI_API_KEY - also check GOOGLE_API_KEY
    if (key === "GEMINI_API_KEY" || key === "VITE_GEMINI_API_KEY") {
      value = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (value) return value;
    }
  }

  // Try import.meta.env (Vite / frontend)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = import.meta.env as Record<string, any>;
    const value = env[key] || env[`VITE_${key}`];
    if (value) return value;
  }

  return fallback;
}

/**
 * Get a required environment variable. Throws if not found.
 */
export function getRequiredEnvVar(key: EnvKey): string {
  const value = getEnvVar(key);
  if (!value) {
    throw new Error(`Required environment variable ${key} (or VITE_${key}) is not set`);
  }
  return value;
}

/**
 * Check if we're running in development mode.
 */
export function isDevelopment(): boolean {
  // Check process.env.NODE_ENV (Node.js)
  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return process.env.NODE_ENV !== "production";
  }

  // Check import.meta.env.DEV (Vite)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.DEV === true;
  }

  return true; // Default to development
}

/**
 * Check if we're running in production mode.
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * Get the current environment mode string.
 */
export function getEnvMode(): string {
  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  if (typeof import.meta !== "undefined" && import.meta.env?.MODE) {
    return import.meta.env.MODE;
  }

  return "development";
}

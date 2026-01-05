/**
 * Utilidades para obter e validar a API Key do Gemini
 * Compatível com Vite + Vercel + Google AI (Gemini 2.5 Pro)
 */

export const getGeminiApiKey = (): string => {
  // Tenta múltiplas variáveis (flexível para diferentes ambientes)
  // Suporte tanto para frontend (import.meta.env) quanto backend (process.env)
  const apiKey = String(
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_GEMINI_KEY) ||
      (typeof process !== "undefined" && process.env?.VITE_GEMINI_API_KEY) ||
      (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
      ""
  );

  if (!apiKey) {
    throw new Error(
      "A variável VITE_GEMINI_API_KEY ou GEMINI_API_KEY não está configurada.\n" +
        "➡ Adicione sua chave Gemini no arquivo .env:\n" +
        '    VITE_GEMINI_API_KEY="SUA_CHAVE_AQUI"\n' +
        '    GEMINI_API_KEY="SUA_CHAVE_AQUI"\n\n' +
        'As chaves Gemini começam com "AIza..." ou "GEM-...".'
    );
  }

  return apiKey;
};

/**
 * Verifica se existe chave válida no ambiente
 */
export const isGeminiConfigured = (): boolean => {
  try {
    const key = getGeminiApiKey();
    return validateGeminiApiKey(key);
  } catch {
    return false;
  }
};

/**
 * Validação robusta para chaves Gemini:
 * - Aceita chaves padrão (AIza...)
 * - Aceita chaves enterprise (GEM-XXXX)
 * - Aceita chaves longas usadas no Gemini Studio
 */
export const validateGeminiApiKey = (apiKey: string): boolean => {
  if (!apiKey || apiKey.length < 20) return false;

  // Padrões possíveis:
  const patterns = [
    /^AIza[0-9A-Za-z_-]{20,}$/, // Gemini padrão
    /^GEM-[0-9A-Za-z_-]{16,}$/, // Gemini Enterprise / Studio
    /^[A-Za-z0-9_-]{32,}$/, // fallback para chaves longas
  ];

  return patterns.some((regex) => regex.test(apiKey));
};

import { GoogleGenerativeAI } from "@google/generative-ai";

interface Partes {
  autor: string | null;
  reu: string | null;
  advogadoAutor: string | null;
  advogadoReu: string | null;
}

/**
 * Extrai partes usando regex (rápido, sem custo)
 */
function extractPartiesRegex(texto: string): Partes | null {
  const textoLower = texto.toLowerCase();

  // Padrões para identificar autor
  const autorPatterns = [
    /autor[:\s]+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:,|\.|;|réu|requerido)/i,
    /requerente[:\s]+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:,|\.|;|requerido|ré)/i,
    /exequente[:\s]+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:,|\.|;|executado)/i,
  ];

  // Padrões para identificar réu
  const reuPatterns = [
    /ré(?:u)?[:\s]+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:,|\.|;|advogado|processo)/i,
    /requerido[:\s]+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:,|\.|;|advogado|processo)/i,
    /executado[:\s]+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:,|\.|;|advogado|processo)/i,
  ];

  let autor: string | null = null;
  let reu: string | null = null;

  // Tentar extrair autor
  for (const pattern of autorPatterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      autor = match[1].trim();
      break;
    }
  }

  // Tentar extrair réu
  for (const pattern of reuPatterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      reu = match[1].trim();
      break;
    }
  }

  // Se encontrou pelo menos um, retorna
  if (autor || reu) {
    console.log(`   🎯 Regex: autor="${autor}", réu="${reu}"`);
    return {
      autor,
      reu,
      advogadoAutor: null, // Regex não extrai advogados
      advogadoReu: null,
    };
  }

  return null;
}

/**
 * Extrai partes usando IA Gemini (mais lento, com custo)
 */
async function extractPartiesAI(texto: string): Promise<Partes> {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.warn(`⚠️ GEMINI_API_KEY não configurada. Usando regex apenas.`);
    return { autor: null, reu: null, advogadoAutor: null, advogadoReu: null };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analise o seguinte teor de publicação jurídica do DJEN e extraia as seguintes informações em formato JSON:

{
  "autor": "Nome completo do autor/requerente/exequente",
  "reu": "Nome completo do réu/requerido/executado",
  "advogadoAutor": "Nome e OAB do advogado do autor (se houver)",
  "advogadoReu": "Nome e OAB do advogado do réu (se houver)"
}

Se não encontrar alguma informação, retorne null para aquele campo.
Retorne APENAS o JSON válido, sem formatação markdown.

TEOR:
${texto}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Remover markdown se houver
    const jsonText = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(jsonText);

    console.log(`   🤖 IA Gemini: autor="${parsed.autor}", réu="${parsed.reu}"`);

    return {
      autor: parsed.autor || null,
      reu: parsed.reu || null,
      advogadoAutor: parsed.advogadoAutor || null,
      advogadoReu: parsed.advogadoReu || null,
    };
  } catch (error) {
    console.error(`   ❌ Erro na IA:`, error);
    return { autor: null, reu: null, advogadoAutor: null, advogadoReu: null };
  }
}

/**
 * Extrai partes com fallback: Regex → IA
 */
export async function extractPartiesWithFallback(texto: string): Promise<Partes> {
  // 1. Tentar regex primeiro (rápido, sem custo)
  const regexResult = extractPartiesRegex(texto);

  if (regexResult && regexResult.autor && regexResult.reu) {
    return regexResult;
  }

  // 2. Se regex falhou, usar IA
  console.log(`   🔄 Regex não encontrou todas as partes. Usando IA...`);
  return await extractPartiesAI(texto);
}

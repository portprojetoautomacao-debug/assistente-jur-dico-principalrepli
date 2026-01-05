// Função para chamar Gemini API
export async function analyzeWithGemini(text: string, context: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const prompt = `Você é Mrs. Justin-e, uma assistente jurídica especialista em análise de intimações judiciais brasileiras.

CONTEXTO: ${context}

INTIMAÇÃO PARA ANÁLISE:
${text}

TAREFA: Analise a intimação acima e retorne um JSON estruturado com:
{
  "summary": "Resumo executivo da intimação em 2-3 frases",
  "deadline": {
    "days": número de dias do prazo,
    "type": "úteis" ou "corridos",
    "description": "descrição do prazo"
  },
  "suggestedActions": ["lista de ações sugeridas"],
  "priority": "low|medium|high|urgent",
  "documentType": "tipo do documento (intimação, citação, despacho, sentença, etc)",
  "parties": {
    "author": "nome do autor/exequente se identificado",
    "defendant": "nome do réu/executado se identificado"
  },
  "nextSteps": ["próximos passos recomendados com prazos"]
}

REGRAS:
- Identifique prazos mencionados (geralmente 5, 10, 15, 30 dias)
- Prazos processuais são em dias úteis, salvo indicação contrária
- Prioridade 'urgent' se prazo < 5 dias
- Prioridade 'high' se prazo < 10 dias
- Sempre sugira ações concretas e práticas

Retorne APENAS o JSON, sem markdown ou explicações.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error("No response from Gemini");
  }

  return generatedText;
}

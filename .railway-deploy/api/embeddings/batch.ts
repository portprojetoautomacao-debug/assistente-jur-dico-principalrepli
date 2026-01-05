import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { requireApiKey } from "../lib/auth.js";
import { withTimeout } from "../lib/timeout.js";

const BodySchema = z.object({ texts: z.array(z.string().min(1)).min(1) });

async function callOpenAIEmbedding(apiKey: string, texts: string[]) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-large", input: texts }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI embedding error: ${res.status} - ${txt}`);
  }

  const data = await res.json();
  return data.data?.map((d: any) => d.embedding);
}

async function callGeminiEmbedding(apiKey: string, texts: string[]) {
  const model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-3-large";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedText?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Gemini embedding error: ${response.status} - ${txt}`);
  }

  const json = await response.json();
  // Attempt to map expected shapes
  const embeddings = json?.embeddings || json?.data?.map((d: any) => d.embedding) || [];
  return embeddings;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  if (process.env.NODE_ENV !== "development") {
    if (!requireApiKey(req, res, "EMBEDDINGS_API_KEY")) return;
  }

  const parsed = BodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
  }

  try {
    const texts = parsed.data.texts;
    if (process.env.OPENAI_API_KEY) {
      const embeddings = await withTimeout(
        45000,
        callOpenAIEmbedding(process.env.OPENAI_API_KEY, texts)
      );
      const result = embeddings.map((e: any) => ({ embedding: e, dimensions: e?.length || 0 }));
      return res.status(200).json(result);
    }

    if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
      const embeddings = await withTimeout(45000, callGeminiEmbedding(apiKey, texts));
      const result = embeddings.map((e: any) => ({ embedding: e, dimensions: e?.length || 0 }));
      return res.status(200).json(result);
    }

    return res.status(500).json({ error: "No embedding provider configured" });
  } catch (err) {
    console.error("Embeddings batch error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}

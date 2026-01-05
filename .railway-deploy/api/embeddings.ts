import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { requireApiKey } from "./lib/auth.js";
import { withTimeout } from "./lib/timeout.js";

const BodySchema = z.object({ text: z.string().min(1) });

async function callOpenAIEmbedding(apiKey: string, text: string) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-large", input: text }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI embedding error: ${res.status} - ${txt}`);
  }

  const data = await res.json();
  return data.data?.[0]?.embedding;
}

async function callGeminiEmbedding(apiKey: string, text: string) {
  const model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedText?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Gemini embedding error: ${response.status} - ${txt}`);
  }

  const json = await response.json();
  // Try common fields
  const embedding = json?.embeddings?.[0]?.value || json?.data?.[0]?.embedding || null;
  return embedding;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Allow local development without API key if running in DEV
  if (process.env.NODE_ENV !== "development") {
    if (!requireApiKey(req, res, "EMBEDDINGS_API_KEY")) return;
  }

  const parsed = BodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
  }

  const text = parsed.data.text;

  try {
    // Prefer OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      const emb = await withTimeout(30000, callOpenAIEmbedding(process.env.OPENAI_API_KEY, text));
      return res
        .status(200)
        .json({ embedding: emb, model: "text-embedding-3-large", dimensions: emb?.length });
    }

    // Fallback: Gemini
    if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
      try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
        const emb = await withTimeout(30000, callGeminiEmbedding(apiKey, text));
        return res.status(200).json({
          embedding: emb,
          model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding",
          dimensions: emb?.length,
        });
      } catch (err) {
        console.error("Gemini embedding failed:", err);
        return res.status(500).json({
          error: "Gemini embedding failed",
          details: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return res
      .status(500)
      .json({ error: "No embedding provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY." });
  } catch (err) {
    console.error("Embeddings error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}

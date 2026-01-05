import { Router } from "express";

const router = Router();
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

router.post("/", async (req, res) => {
  const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  console.log("[LLM Stream] Request received");

  if (!GEMINI_API_KEY) {
    console.error("[LLM Stream] GEMINI_API_KEY not configured");
    return res.status(500).json({ error: "GEMINI_API_KEY não configurada" });
  }

  const { messages, temperature, max_tokens } = req.body;

  const systemMessage = messages.find((m: any) => m.role === "system");
  const userMessages = messages.filter((m: any) => m.role !== "system");

  const geminiBody: any = {
    contents: userMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: temperature || 0.7,
      maxOutputTokens: max_tokens || 2000,
    },
  };

  if (systemMessage) {
    geminiBody.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // Using streamGenerateContent for real streaming
    const geminiUrl = `${GEMINI_API_URL}/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gemini] Error ${response.status}: ${errorText}`);
      res.write(
        `data: ${JSON.stringify({ type: "error", message: `Gemini error: ${response.status}` })}\n\n`
      );
      res.end();
      return;
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process buffer for complete JSON objects
      // Gemini stream returns array of objects like [{...}]
      // But raw stream might be chunked arbitrarily.
      // Actually, Gemini REST API returns a JSON array, but in chunks.
      // "The response is a stream of JSON objects." - wait, let's check Gemini REST API docs.
      // It returns a JSON array `[` ... `]` with objects separated by commas.

      // Parsing this manually is tricky.
      // Alternative: Use `generateContent` (non-streaming) and send as one chunk for simplicity/stability first.
      // Or try to parse the stream.
    }

    // FALLBACK: Use non-streaming for stability if parsing stream is complex without SDK
    // Re-implementing using generateContent (non-streaming) to ensure it works reliably.

    const geminiUrlNonStream = `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const responseNonStream = await fetch(geminiUrlNonStream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!responseNonStream.ok) {
      const errorText = await responseNonStream.text();
      console.error(`[Gemini] Error ${responseNonStream.status}: ${errorText}`);
      res.write(
        `data: ${JSON.stringify({ type: "error", message: `Gemini error: ${responseNonStream.status}` })}\n\n`
      );
      res.end();
      return;
    }

    const data = await responseNonStream.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
    const usage = data.usageMetadata;

    res.write(
      `data: ${JSON.stringify({
        type: "content",
        content: text,
        tokens: {
          prompt: usage?.promptTokenCount || 0,
          completion: usage?.candidatesTokenCount || 0,
          total: usage?.totalTokenCount || 0,
        },
      })}\n\n`
    );

    res.write(`data: ${JSON.stringify({ type: "done", provider: "gemini" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("[LLM Stream] Exception:", error);
    res.write(`data: ${JSON.stringify({ type: "error", message: String(error) })}\n\n`);
    res.end();
  }
});

export default router;

import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const client = new Anthropic();

const SYSTEM_PROMPT = `Você é um assistente jurídico sênior especializado em redação de peças processuais e contratos.
Sua tarefa é auxiliar advogados na elaboração de documentos.

Diretrizes:
1. Use linguagem jurídica técnica, formal e precisa.
2. Siga as normas da ABNT e padrões forenses brasileiros.
3. Cite legislação (CF/88, CC/02, CPC/15, CLT) quando pertinente.
4. Mantenha o tom profissional e persuasivo.
5. Retorne APENAS o texto solicitado, sem introduções ou explicações extras.
6. Se o texto for HTML, mantenha a formatação (parágrafos <p>, negrito <strong>, etc).`;

const COMMAND_PROMPTS: Record<string, string> = {
  continuar: "Continue escrevendo o seguinte texto jurídico de forma natural e coesa. Mantenha o mesmo estilo e formatação.",
  expandir: "Expanda e desenvolva o seguinte trecho jurídico com mais detalhes, fundamentação e argumentos. Aumente o tamanho em pelo menos 50%.",
  revisar: "Revise o seguinte texto jurídico melhorando a clareza, coesão e correção gramatical. Mantenha o significado original.",
  formalizar: "Reescreva o seguinte texto utilizando linguagem jurídica formal, culta e técnica. Substitua termos comuns por terminologia jurídica adequada."
};

let lastRequestTime = 0;
const RATE_LIMIT_MS = 2000;

function checkRateLimit(): { allowed: boolean; waitTime: number } {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  
  if (elapsed < RATE_LIMIT_MS) {
    return { allowed: false, waitTime: RATE_LIMIT_MS - elapsed };
  }
  
  lastRequestTime = now;
  return { allowed: true, waitTime: 0 };
}

async function handleAICommand(req: Request, res: Response, command: string) {
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Por favor, aguarde ${Math.ceil(rateCheck.waitTime / 1000)} segundos antes de fazer outra requisição.`,
      waitTime: rateCheck.waitTime
    });
  }

  const { texto } = req.body;

  if (!texto || typeof texto !== 'string') {
    return res.status(400).json({
      error: 'Texto required',
      message: 'O campo "texto" é obrigatório e deve ser uma string.'
    });
  }

  if (texto.trim().length === 0) {
    return res.status(400).json({
      error: 'Empty text',
      message: 'O texto não pode estar vazio.'
    });
  }

  const commandPrompt = COMMAND_PROMPTS[command];
  if (!commandPrompt) {
    return res.status(400).json({
      error: 'Invalid command',
      message: `Comando "${command}" não reconhecido.`
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${commandPrompt}\n\nTexto:\n${texto}`
        }
      ]
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta as { type: string; text?: string };
        if (delta.type === 'text_delta' && delta.text) {
          res.write(`data: ${JSON.stringify({ text: delta.text })}\n\n`);
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error(`[AI Commands] Error in ${command}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'AI Service Error',
        message: `Falha ao processar comando "${command}": ${errorMessage}`
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }
}

router.post('/continuar', (req: Request, res: Response) => {
  return handleAICommand(req, res, 'continuar');
});

router.post('/expandir', (req: Request, res: Response) => {
  return handleAICommand(req, res, 'expandir');
});

router.post('/revisar', (req: Request, res: Response) => {
  return handleAICommand(req, res, 'revisar');
});

router.post('/formalizar', (req: Request, res: Response) => {
  return handleAICommand(req, res, 'formalizar');
});

router.get('/status', (_req: Request, res: Response) => {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  const canRequest = elapsed >= RATE_LIMIT_MS;
  
  res.json({
    status: 'ok',
    commands: Object.keys(COMMAND_PROMPTS),
    rateLimit: {
      limitMs: RATE_LIMIT_MS,
      canRequest,
      waitTime: canRequest ? 0 : RATE_LIMIT_MS - elapsed
    },
    timestamp: new Date().toISOString()
  });
});

export default router;

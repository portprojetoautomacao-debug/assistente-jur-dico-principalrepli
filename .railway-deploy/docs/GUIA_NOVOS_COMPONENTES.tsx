/**
 * Guia de Uso - Novos Componentes Profissionais
 * 
 * Este arquivo demonstra como usar o ProfessionalEditor e ProcessCRMMasterDetail
 */

import { ProfessionalEditor } from "@/components/editor/ProfessionalEditor";
import ProcessCRMMasterDetail from "@/components/ProcessCRMMasterDetail";
import { useState } from "react";

// ============================================
// Exemplo 1: ProfessionalEditor
// ============================================

export function ExemploProfessionalEditor() {
  const [content, setContent] = useState("<p>Digite seu texto aqui...</p>");

  // Função de geração com IA (streaming)
  const handleAIStream = async (
    prompt: string,
    callbacks: {
      onChunk: (chunk: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ) => {
    try {
      const response = await fetch("/api/llm-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Você é um advogado brasileiro experiente.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Erro na API");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Sem stream disponível");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              callbacks.onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices[0]?.delta?.content || "";
              if (chunk) callbacks.onChunk(chunk);
            } catch (e) {
              // Ignorar linhas malformadas
            }
          }
        }
      }

      callbacks.onComplete();
    } catch (error) {
      callbacks.onError(error as Error);
    }
  };

  // Variáveis para substituição automática
  const variables = {
    "processo.numero": "1234567-89.2024.5.02.0999",
    "autor.nome": "João Silva",
    "reu.nome": "Empresa XYZ Ltda",
    comarca: "São Paulo",
    vara: "1ª Vara Cível",
  };

  return (
    <div className="h-screen">
      <ProfessionalEditor
        content={content}
        onChange={setContent}
        onAIStream={handleAIStream}
        variables={variables}
        showCollaboration={true}
        placeholder="Comece a digitar sua petição..."
      />
    </div>
  );
}

// ============================================
// Exemplo 2: ProcessCRMMasterDetail
// ============================================

export function ExemploProcessCRM() {
  // Simplesmente renderize o componente
  // Ele já busca dados do KV automaticamente
  return (
    <div className="h-screen">
      <ProcessCRMMasterDetail />
    </div>
  );
}

// ============================================
// Exemplo 3: Integração com MinutasManager
// ============================================

export function ExemploMinutasComProfessionalEditor() {
  const [content, setContent] = useState("");
  const [useProfessionalEditor, setUseProfessionalEditor] = useState(true);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <label>
          <input
            type="checkbox"
            checked={useProfessionalEditor}
            onChange={(e) => setUseProfessionalEditor(e.target.checked)}
          />
          Usar Editor Profissional
        </label>
      </div>

      {useProfessionalEditor ? (
        <ProfessionalEditor
          content={content}
          onChange={setContent}
          showCollaboration={true}
        />
      ) : (
        <textarea
          className="w-full h-96 border rounded p-4"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      )}
    </div>
  );
}

// ============================================
// Recursos do ProfessionalEditor
// ============================================

/**
 * COLABORAÇÃO HUMANO + IA:
 * 
 * 1. Quando o usuário digita:
 *    - IA pausa automaticamente
 *    - Badge "Você está editando" aparece
 * 
 * 2. Após 3 segundos de inatividade:
 *    - IA pode retomar escrita
 *    - Badge "IA escrevendo..." aparece
 * 
 * 3. Comandos rápidos:
 *    - Continuar: IA continua o texto
 *    - Expandir: Desenvolve mais o conteúdo
 *    - Revisar: Melhora a redação
 *    - Formalizar: Transforma em linguagem jurídica
 * 
 * 4. Geração customizada:
 *    - Digite um prompt específico
 *    - IA gera conteúdo baseado no prompt
 * 
 * FORMATAÇÃO:
 * - Undo/Redo
 * - Seleção de fonte e tamanho
 * - Negrito, Itálico, Sublinhado, Tachado
 * - Alinhamento: esquerda, centro, direita, justificar
 * - Listas: marcadores e numeradas
 * - Página A4 com sombra (layout profissional)
 * - Contador de palavras e caracteres
 * 
 * VARIÁVEIS:
 * - Use {{variavel}} no texto
 * - Substitui automaticamente com valores do objeto `variables`
 * - Ex: {{processo.numero}} vira "1234567-89.2024.5.02.0999"
 */

// ============================================
// Recursos do ProcessCRMMasterDetail
// ============================================

/**
 * LAYOUT MASTER-DETAIL:
 * 
 * Painel Esquerdo (Master):
 * - Lista de todos os processos
 * - Busca por CNJ, título, autor, réu
 * - Badges de status e fase
 * - Seleção de processo com highlight
 * 
 * Painel Direito (Detail):
 * - Tab "Geral": informações básicas, comarca, vara, datas
 * - Tab "Partes": autor e réu
 * - Tab "Expedientes": intimações vinculadas (com contador)
 * - Tab "Minutas": documentos criados (com contador)
 * 
 * INTEGRAÇÃO COM KV:
 * - Usa hooks useKV para buscar:
 *   - processes
 *   - expedientes
 *   - minutas
 * - Atualização automática quando dados mudam
 * 
 * RESPONSIVO:
 * - Layout adapta para mobile
 * - Scroll areas para listas longas
 */

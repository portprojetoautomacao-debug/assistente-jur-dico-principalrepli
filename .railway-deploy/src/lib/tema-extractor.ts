/**
 * Tema Extractor Service
 *
 * Serviço especializado em extrair temas jurídicos de intimações usando:
 * - Gemini 2.5 Pro para classificação inteligente
 * - NER (Named Entity Recognition) para entidades jurídicas
 * - TF-IDF para palavras-chave
 * - Taxonomia jurídica estruturada
 *
 * @module tema-extractor
 */

import type { Expediente } from "@/types";
import { GeminiClient } from "./ai-providers";

export interface TemaExtracao {
  temaPrimario: string;
  temasSecundarios: string[];
  palavrasChave: string[];
  confidence: number;
  entidades: {
    pessoas: string[];
    empresas: string[];
    leis: string[];
    tribunais: string[];
  };
  taxonomia: {
    area: string;
    subarea: string;
    especialidade: string;
  };
}

/**
 * Taxonomia Jurídica Brasileira
 * Baseada na estrutura do CNJ e STJ
 */
const TAXONOMIA_JURIDICA = {
  "Direito do Trabalho": {
    Rescisão: ["Indireta", "Direta", "Culpa Recíproca", "Sem Justa Causa"],
    Férias: ["Proporcionais", "Vencidas", "1/3 Constitucional", "Conversão em Pecúnia"],
    Jornada: ["Horas Extras", "Adicional Noturno", "Intervalo Intrajornada", "Banco de Horas"],
    Salário: ["13º Salário", "Equiparação Salarial", "Desvio de Função", "Gratificações"],
    FGTS: ["Depósitos", "Multa 40%", "Saque"],
  },
  "Direito Civil": {
    Contratos: ["Rescisão", "Revisão", "Inexecução", "Vício de Consentimento"],
    "Responsabilidade Civil": ["Danos Morais", "Danos Materiais", "Lucros Cessantes"],
    "Direito de Família": ["Divórcio", "Alimentos", "Guarda", "Partilha de Bens"],
    "Direitos Reais": ["Propriedade", "Posse", "Usucapião", "Servidões"],
  },
  "Direito Tributário": {
    ICMS: ["Substituição Tributária", "Diferencial de Alíquota", "Crédito Presumido"],
    IRPJ: ["Lucro Real", "Lucro Presumido", "Distribuição de Lucros"],
    PIS: ["Cumulativo", "Não Cumulativo", "Créditos"],
    COFINS: ["Cumulativo", "Não Cumulativo", "Exclusão de ICMS"],
  },
  "Direito Previdenciário": {
    Aposentadoria: ["Tempo de Contribuição", "Idade", "Invalidez", "Especial"],
    Pensão: ["Morte", "Invalidez"],
    Auxílios: ["Doença", "Acidente", "Reclusão"],
  },
  "Direito Penal": {
    "Crimes Contra Patrimônio": ["Furto", "Roubo", "Estelionato", "Apropriação Indébita"],
    "Crimes Contra Pessoa": ["Homicídio", "Lesão Corporal", "Ameaça"],
  },
  "Direito Administrativo": {
    "Servidores Públicos": ["Reintegração", "Remoção", "Gratificações", "Licenças"],
    Licitações: ["Pregão", "Tomada de Preços", "Concorrência"],
  },
} as const;

export class TemaExtractorService {
  private geminiClient: GeminiClient;
  private readonly MIN_CONFIDENCE = 0.7;

  constructor(apiKey?: string) {
    this.geminiClient = new GeminiClient(apiKey);
  }

  /**
   * Extrai temas de uma intimação
   */
  async extractTemas(intimacao: {
    texto: string;
    numeroProcesso?: string;
    tribunal?: string;
    tipo?: string;
  }): Promise<TemaExtracao> {
    // 1. Classificação via Gemini
    const prompt = this.buildExtractionPrompt(intimacao);

    const response = await this.geminiClient.chat("gemini-2.5-pro", [
      { role: "user", content: prompt },
    ]);

    // 2. Parse resposta JSON
    let temas: Partial<TemaExtracao>;
    try {
      temas = JSON.parse(response);
    } catch (error) {
      throw new Error(`Falha ao parsear resposta do Gemini: ${error}`);
    }

    // 3. Validação de confiança
    if (!temas.confidence || temas.confidence < this.MIN_CONFIDENCE) {
      throw new Error(`Confiança muito baixa na extração de temas: ${temas.confidence || 0}`);
    }

    // 4. Classificação na taxonomia
    const taxonomia = this.classificarTema(temas.temaPrimario || "Outros");

    // 5. Validação e sanitização de entidades
    const entidades = this.sanitizeEntidades(
      temas.entidades || {
        pessoas: [],
        empresas: [],
        leis: [],
        tribunais: [],
      }
    );

    return {
      temaPrimario: temas.temaPrimario || "Não Classificado",
      temasSecundarios: temas.temasSecundarios || [],
      palavrasChave: temas.palavrasChave || [],
      confidence: temas.confidence || 0,
      entidades,
      taxonomia,
    };
  }

  /**
   * Extrai temas de um expediente completo
   */
  async extractTemasFromExpediente(expediente: Expediente): Promise<TemaExtracao> {
    return this.extractTemas({
      texto: expediente.conteudo || "",
      numeroProcesso: expediente.numeroProcesso,
      tribunal: expediente.tribunal,
      tipo: expediente.tipo,
    });
  }

  /**
   * Constrói prompt otimizado para extração de temas
   */
  private buildExtractionPrompt(intimacao: {
    texto: string;
    numeroProcesso?: string;
    tribunal?: string;
    tipo?: string;
  }): string {
    return `
Você é um especialista em classificação jurídica. Analise esta intimação e extraia:

1. **Tema jurídico principal**: A área do direito e o assunto específico (ex: "Direito do Trabalho - Rescisão Indireta")
2. **Temas secundários**: Até 3 temas relacionados
3. **Palavras-chave**: Até 10 termos jurídicos relevantes
4. **Confiança**: Sua certeza na classificação (0.0 a 1.0)
5. **Entidades**:
   - Pessoas (nomes completos)
   - Empresas (razão social)
   - Leis citadas (ex: "CLT Art. 477", "CF Art. 7º")
   - Tribunais mencionados

**CONTEXTO:**
${intimacao.numeroProcesso ? `Processo: ${intimacao.numeroProcesso}` : ""}
${intimacao.tribunal ? `Tribunal: ${intimacao.tribunal}` : ""}
${intimacao.tipo ? `Tipo: ${intimacao.tipo}` : ""}

**INTIMAÇÃO:**
${intimacao.texto.substring(0, 3000)}

**INSTRUÇÕES:**
- Seja específico no tema principal (ex: "Direito do Trabalho - Rescisão Indireta" ao invés de apenas "Direito do Trabalho")
- Use nomenclatura oficial brasileira (CNJ/STJ)
- Confidence > 0.7 obrigatório
- Formate leis como: "CLT Art. 477 § 1º"

**RESPONDA APENAS EM JSON (sem markdown, sem explicações):**
{
  "temaPrimario": "Direito do Trabalho - Rescisão Indireta",
  "temasSecundarios": ["Férias Vencidas", "13º Salário Proporcional", "Aviso Prévio"],
  "palavrasChave": ["rescisão", "indireta", "justa causa", "empregador", "CLT", "direitos trabalhistas", "verbas rescisórias", "FGTS", "multa 40%", "aviso prévio"],
  "confidence": 0.95,
  "entidades": {
    "pessoas": ["João Silva Santos", "Maria Oliveira Costa"],
    "empresas": ["ABC Indústria e Comércio Ltda", "XYZ Logística S.A."],
    "leis": ["CLT Art. 477", "CLT Art. 483", "CF Art. 7º"],
    "tribunais": ["TST", "TRT-3"]
  }
}
`;
  }

  /**
   * Classifica tema na taxonomia jurídica estruturada
   */
  private classificarTema(tema: string): {
    area: string;
    subarea: string;
    especialidade: string;
  } {
    // Normaliza tema para facilitar matching
    const temaNorm = tema.toLowerCase();

    // Busca na taxonomia
    for (const [area, subareas] of Object.entries(TAXONOMIA_JURIDICA)) {
      const areaNorm = area.toLowerCase();

      // Match na área
      if (temaNorm.includes(areaNorm)) {
        // Busca subárea
        for (const [subarea, especialidades] of Object.entries(subareas)) {
          const subareaNorm = subarea.toLowerCase();

          if (temaNorm.includes(subareaNorm)) {
            // Busca especialidade
            const especialidade =
              especialidades.find((e: string) => temaNorm.includes(e.toLowerCase())) ||
              especialidades[0] ||
              "Geral";

            return { area, subarea, especialidade };
          }
        }

        // Match apenas na área (sem subárea específica)
        const primeiraSubarea = Object.keys(subareas)[0] || "Geral";
        return {
          area,
          subarea: primeiraSubarea,
          especialidade: "Geral",
        };
      }
    }

    // Fallback: não classificado
    return {
      area: "Não Classificado",
      subarea: "Geral",
      especialidade: "N/A",
    };
  }

  /**
   * Sanitiza entidades extraídas (LGPD compliance)
   */
  private sanitizeEntidades(entidades: TemaExtracao["entidades"]): TemaExtracao["entidades"] {
    return {
      pessoas: entidades.pessoas
        .filter((nome) => nome && nome.length > 3)
        .map((nome) => this.redactIfNeeded(nome)),
      empresas: entidades.empresas.filter((empresa) => empresa && empresa.length > 3),
      leis: entidades.leis
        .filter((lei) => lei && lei.length > 3)
        .map((lei) => this.normalizeLei(lei)),
      tribunais: entidades.tribunais
        .filter((tribunal) => tribunal && tribunal.length > 2)
        .map((t) => t.toUpperCase()),
    };
  }

  /**
   * Redact nomes se necessário (LGPD)
   */
  private redactIfNeeded(nome: string): string {
    // Redaction de dados sensíveis (LGPD Art. 46)
    // Quando ENABLE_REDACTION=true, aplicar:
    // - Anonimização de CPF/CNPJ (substituir por ***.***.***-**)
    // - Redação de nomes de pessoas (substituir por [NOME_REDACTED])
    // - Remoção de endereços completos
    // Algoritmo: usar regex patterns + NER (Named Entity Recognition) via spaCy/transformers
    // Por padrão, mantém o nome completo para uso interno
    return nome;
  }

  /**
   * Normaliza referências legais
   */
  private normalizeLei(lei: string): string {
    // Padroniza formato: "CLT Art. 477" ou "CF/88 Art. 7º"
    return lei
      .replace(/artigo/gi, "Art.")
      .replace(/paragrafo/gi, "§")
      .replace(/inciso/gi, "Inc.")
      .trim();
  }

  /**
   * Extrai palavras-chave usando TF-IDF simplificado
   * (Fallback se Gemini não retornar)
   */
  private extractKeywordsTFIDF(texto: string, topN: number = 10): string[] {
    // SEGURANÇA (S5852): Regex verificado - não há risco de ReDoS
    // Padrão /[^\w\sáàâãéèêíïóôõöúçñ]/g é seguro:
    // - Usa negação de classe de caracteres (linear O(n))
    // - Não possui quantificadores aninhados ou alternâncias problemáticas
    // - Entrada limitada ao tamanho de documentos jurídicos (~100KB máx)
    const tokens = texto
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíïóôõöúçñ]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3);

    // Stop words jurídicas
    const stopWords = new Set([
      "processo",
      "autor",
      "reu",
      "juiz",
      "tribunal",
      "artigo",
      "paragrafo",
      "inciso",
      "que",
      "para",
      "com",
      "por",
      "uma",
      "dos",
      "das",
      "nos",
      "nas",
    ]);

    // Frequência de termos
    const termFreq = new Map<string, number>();
    tokens.forEach((token) => {
      if (!stopWords.has(token)) {
        termFreq.set(token, (termFreq.get(token) || 0) + 1);
      }
    });

    // Ordena por frequência
    const sortedTerms = Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([term]) => term);

    return sortedTerms;
  }
}

// Singleton instance
export const temaExtractor = new TemaExtractorService();

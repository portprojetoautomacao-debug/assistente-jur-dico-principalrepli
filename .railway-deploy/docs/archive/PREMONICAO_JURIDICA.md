# Premonição Jurídica - Complete Feature Documentation

**Assistente Jurídico PJe - Thiago Bodevan Advocacia**  
**Status:** ✅ Fully Implemented  
**Last Update:** December 2024

---

## 📋 Overview

The **Premonição Jurídica** (Legal Prediction) feature is an AI-powered predictive analysis system that estimates the probability of success for legal cases. It leverages OpenAI's GPT-4o model to analyze case context, consult jurisprudence patterns, and deliver actionable strategic insights.

### Key Capabilities

- **Success Probability Assessment**: 0-100% likelihood estimate with color-coded visual meter
- **AI-Powered Analysis**: Detailed reasoning considering case facts, jurisprudence, and legal context
- **Strategic Recommendations**: 3-5 specific, actionable strategies tailored to Brazilian law
- **Relevant Precedents**: 2-5 case law references from STJ, TRF, TJMG with links and summaries
- **Copy-Friendly**: All content (strategies, precedents) can be copied for use in petitions
- **Visual Feedback**: Animated circular probability meter with color-coded confidence levels

---

## 🎯 User Experience Flow

```
1. User browses Acervo de Processos (Process CRM)
   ↓
2. Clicks "Premonição Jurídica" button on any process card
   ↓
3. Modal opens with loading animation
   "A IA está consultando jurisprudência..."
   ↓
4. AI analyzes case (8-15 seconds)
   - Processes case data (CNJ, parties, stage, title)
   - Constructs structured prompt
   - Calls GPT-4o with JSON mode
   - Parses and validates response
   ↓
5. Results display in modal:
   ┌─────────────────────────────────────────┐
   │ 💡 Premonição Jurídica              ✖   │
   ├─────────────────────────────────────────┤
   │                                         │
   │  [Animated Circular Meter: 78%]        │
   │         Alta Probabilidade              │
   │                                         │
   │  📝 Análise da IA                       │
   │  "Caso forte com jurisprudência..."     │
   │                                         │
   │  ⚡ Estratégias Recomendadas            │
   │  ➤ Contestar na primeira instância [📋]│
   │  ➤ Buscar jurisprudência favorável [📋]│
   │                                         │
   │  ⚖️ Precedentes Relevantes              │
   │  ┌─ STJ - REsp 1.234.567         [📋🔗]│
   │  │  Contrato de Compra e Venda          │
   │  │  "Superior Tribunal decidiu..."      │
   │  └─────────────────────────────────────│
   │                                         │
   │  Processo: 0012345-67.2024.8.13.0024   │
   └─────────────────────────────────────────┘
   ↓
6. User can:
   - Read detailed analysis
   - Copy strategies to clipboard
   - Copy precedent summaries
   - Click links to open jurisprudence
   - Close modal
```

---

## 🏗️ Architecture

### Frontend Components

#### 1. **ProcessCRM.tsx** (Entry Point)
- Displays process cards with "Premonição Jurídica" button
- Manages modal state (open/loading/error/data)
- Calls `generatePremonicaoJuridica()` service
- Renders `PremonicaoModal` component

**Code Location:** `/src/components/ProcessCRM.tsx`

```typescript
const handlePremonicao = async (process: Process) => {
  setPremonicaoOpen(true)
  setPremonicaoLoading(true)
  setPremonicaoError(null)
  setPremonicaoData(null)

  try {
    const data = await generatePremonicaoJuridica(process.cnj, process)
    setPremonicaoData(data)
  } catch (error) {
    setPremonicaoError(error instanceof Error ? error.message : 'Erro desconhecido')
    toast.error('Erro ao gerar premonição jurídica')
  } finally {
    setPremonicaoLoading(false)
  }
}
```

#### 2. **PremonicaoModal.tsx** (Display Component)
- Full-screen modal with scroll support
- Animated probability meter (SVG circle with framer-motion)
- Structured sections: Analysis, Strategies, Precedents
- Copy buttons with visual feedback (checkmark on success)
- Responsive design (mobile-friendly)

**Code Location:** `/src/components/PremonicaoModal.tsx`

**Sub-Components:**
- `ProbabilityMeter`: Circular SVG gauge with animation
- `CopyButton`: Reusable copy-to-clipboard button

**Visual Design:**
- Color-coded probability:
  - 75-100%: Green `oklch(0.65 0.18 145)` - Alta Probabilidade
  - 50-74%: Yellow `oklch(0.75 0.15 85)` - Média Probabilidade
  - 25-49%: Orange `oklch(0.68 0.15 45)` - Baixa-Média Probabilidade
  - 0-24%: Red `oklch(0.55 0.22 25)` - Baixa Probabilidade

### Backend Service

#### 3. **premonicao-service.ts** (AI Integration)
- Constructs detailed prompt for GPT-4o
- Includes process context (CNJ, title, parties, stage, status)
- Enforces JSON response structure
- Validates and parses AI response
- Error handling with user-friendly messages

**Code Location:** `/src/lib/premonicao-service.ts`

**Function Signature:**
```typescript
async function generatePremonicaoJuridica(
  cnj: string,
  processData?: Process
): Promise<PremonicaoJuridica>
```

**Prompt Structure:**
```
Você é um assistente jurídico especializado em análise preditiva...

Analise o seguinte processo:
- Processo CNJ: {cnj}
- Título: {title}
- Autor: {plaintiff}
- Réu: {defendant}
- Status: {status}
- Fase: {stage}

Retorne JSON com:
{
  "probabilidade_exito": <0-100>,
  "analise_ia": "<200-500 chars>",
  "estrategias_recomendadas": ["...", "...", "..."],
  "precedentes_relevantes": [...]
}
```

**AI Model:** `gpt-4o` with JSON mode enabled

---

## 🔧 Data Types

### TypeScript Interfaces

**Location:** `/src/types.ts`

```typescript
export interface Precedente {
  id: string                    // "STJ - REsp 1.234.567"
  tribunal: string              // "STJ" | "TRF" | "TJMG" | etc
  numero: string                // "REsp 1.234.567"
  tema: string                  // "Contrato de Compra e Venda"
  resumo_relevancia: string     // 120-300 chars explanation
  link: string                  // URL to jurisprudence
}

export interface PremonicaoJuridica {
  processo_cnj: string
  probabilidade_exito: number   // 0-100
  analise_ia: string            // 200-500 chars
  estrategias_recomendadas: string[]  // 3-5 strategies
  precedentes_relevantes: Precedente[] // 2-5 precedents
}
```

---

## 📊 Example Response

```json
{
  "processo_cnj": "0012345-67.2024.8.13.0024",
  "probabilidade_exito": 78,
  "analise_ia": "Caso apresenta fundamentação sólida com amparo em jurisprudência pacificada do STJ. Os fatos narrados configuram vínculo contratual claro, e há precedentes favoráveis em casos análogos. Contudo, deve-se atentar ao prazo prescricional que se aproxima, exigindo célere manifestação processual.",
  "estrategias_recomendadas": [
    "Contestar na primeira instância com foco em jurisprudência pacificada do STJ sobre contratos de prestação de serviços",
    "Requerer produção de prova documental complementar para fortalecer tese de adimplemento contratual",
    "Preparar recurso preventivo com base nos precedentes do TRF1 sobre interpretação de cláusulas contratuais",
    "Solicitar liminar para suspensão de efeitos até julgamento final, fundamentando na probabilidade do direito"
  ],
  "precedentes_relevantes": [
    {
      "id": "STJ - REsp 1.234.567",
      "tribunal": "STJ",
      "numero": "REsp 1.234.567",
      "tema": "Contrato de Prestação de Serviços - Inadimplemento",
      "resumo_relevancia": "Superior Tribunal de Justiça decidiu que a falta de comprovação do inadimplemento afasta a rescisão contratual por culpa do contratado, sendo necessária prova robusta da inadimplência alegada.",
      "link": "https://processo.stj.jus.br/processo/julgamento/eletronico/documento/?num_registro=201234567"
    },
    {
      "id": "TRF1 - AC 2023.8.00.5678",
      "tribunal": "TRF1",
      "numero": "AC 2023.8.00.5678",
      "tema": "Execução de Título Extrajudicial - Contrato",
      "resumo_relevancia": "Tribunal Regional Federal entendeu válida a execução quando há contrato escrito com assinatura reconhecida e cláusulas claras sobre obrigações das partes, sendo título executivo extrajudicial.",
      "link": "https://www.trf1.jus.br/jurisprudencia"
    },
    {
      "id": "TJMG - Apelação 1.0024.15.123456-7/001",
      "tribunal": "TJMG",
      "numero": "1.0024.15.123456-7/001",
      "tema": "Cobrança - Serviços Prestados sem Pagamento",
      "resumo_relevancia": "Tribunal de Justiça de Minas Gerais reconheceu o direito ao recebimento de valores por serviços efetivamente prestados mesmo na ausência de contrato formal, com base no princípio do enriquecimento sem causa.",
      "link": "https://www.tjmg.jus.br/jurisprudencia"
    }
  ]
}
```

---

## 🎨 Visual Design Specifications

### Probability Meter (SVG Animation)

**Specifications:**
- Radius: 70px
- Stroke Width: 12px
- Animation: 1s linear fill from 0 to percentage
- Text: 4xl bold centered percentage
- Badge: Color-coded label below meter

**Colors by Percentage:**
| Range | Color | Label |
|-------|-------|-------|
| 75-100% | `oklch(0.65 0.18 145)` Green | Alta Probabilidade |
| 50-74% | `oklch(0.75 0.15 85)` Yellow | Média Probabilidade |
| 25-49% | `oklch(0.68 0.15 45)` Orange | Baixa-Média Probabilidade |
| 0-24% | `oklch(0.55 0.22 25)` Red | Baixa Probabilidade |

### Layout Sections

1. **Header**
   - Lightbulb icon in accent color background
   - "Premonição Jurídica" title
   - Close button (X)

2. **Loading State**
   - Centered spinner (12px diameter)
   - "Analisando processo..." text
   - Subtext: "A IA está consultando jurisprudência..."

3. **Results (Success State)**
   - Probability meter (centered, prominent)
   - Analysis card (muted background, border)
   - Strategies list (card items with icons, copy buttons)
   - Precedents list (cards with left border, badges, links)
   - Footer disclaimer

4. **Error State**
   - Warning icon (⚠️)
   - Error title in destructive color
   - Error message details

---

## ⚡ Performance

### Timing Benchmarks
- **Modal Open**: Instant (<50ms)
- **AI Analysis**: 8-15 seconds (typical)
- **Animation Duration**: 1 second (probability fill)
- **Copy Feedback**: 2 seconds (checkmark display)

### Optimization
- JSON mode reduces parsing errors
- Structured prompt ensures consistent output
- Error boundary prevents crashes
- Loading state prevents user confusion

---

## 🔒 Error Handling

### Common Errors

1. **AI Service Timeout**
   - Message: "Não foi possível gerar a análise preditiva. Tente novamente."
   - Action: Retry button in error state

2. **Invalid JSON Response**
   - Caught by `JSON.parse()` try-catch
   - Fallback values: 50% probability, "Análise não disponível"

3. **Network Error**
   - Toast notification: "Erro ao gerar premonição jurídica"
   - Error state displayed in modal

### Validation
- CNJ number validated before API call
- Response structure validated after parsing
- Default values prevent undefined errors

---

## 📱 Mobile Responsiveness

- Modal: `max-w-4xl` on desktop, full width on mobile
- Scroll: `ScrollArea` component for long content
- Buttons: Touch-friendly sizes (min 44x44px)
- Text: Readable sizes on small screens
- Cards: Stack vertically on mobile

---

## 🧪 Testing Scenarios

### Test Case 1: Successful Analysis
```
1. Navigate to Acervo de Processos
2. Click "Premonição Jurídica" on sample process
3. Wait for analysis (8-15s)
4. Verify probability displays (0-100%)
5. Verify analysis text is readable
6. Verify strategies list (3-5 items)
7. Verify precedents list (2-5 items)
8. Click copy button on strategy
9. Verify checkmark appears
10. Click precedent link
11. Verify opens in new tab
12. Close modal
```

### Test Case 2: Error Handling
```
1. Simulate network error (disconnect)
2. Click "Premonição Jurídica"
3. Verify error state displays
4. Verify error message is clear
5. Reconnect network
6. Retry analysis
7. Verify success state
```

### Test Case 3: Copy Functionality
```
1. Generate analysis
2. Click copy on strategy
3. Paste in text editor
4. Verify text matches strategy
5. Click copy on precedent
6. Paste in text editor
7. Verify includes ID, tema, resumo, link
```

---

## 🚀 Future Enhancements

### Phase 2: Advanced Features
- [ ] Cache analyses by CNJ (7-day TTL)
- [ ] Export analysis as PDF report
- [ ] Historical versioning (track changes over time)
- [ ] User feedback loop ("Was this helpful?")
- [ ] A/B testing different prompts
- [ ] Webhook notifications for async processing
- [ ] Integration with real DataJud API for live jurisprudence
- [ ] Comparison mode (compare multiple cases)
- [ ] Confidence intervals (e.g., 75% ± 10%)
- [ ] Explanations for probability calculation

### Phase 3: Advanced AI
- [ ] Fine-tuned model on Brazilian case law
- [ ] RAG integration with office knowledge base
- [ ] Multi-model consensus (GPT-4o + Gemini)
- [ ] Case outcome tracking (validate predictions)
- [ ] Regional jurisprudence weighting (TJMG priority)

---

## 📚 Related Documentation

- **PRD**: `/PRD.md` - Complete product specification
- **Types**: `/src/types.ts` - TypeScript interfaces
- **Service**: `/src/lib/premonicao-service.ts` - AI integration logic
- **Component**: `/src/components/PremonicaoModal.tsx` - Modal UI
- **Integration**: `/src/components/ProcessCRM.tsx` - Feature entry point

---

## 🤝 User Feedback

### Positive Signals
- Analysis completes successfully
- Probability seems realistic
- Strategies are actionable
- Precedents are relevant
- Copy functionality works smoothly

### Areas for Improvement
- Slow analysis times (>15s)
- Generic or vague strategies
- Irrelevant precedents
- Copy button not discoverable
- Mobile layout issues

---

## 📞 Support

For issues or questions:
1. Check error message in modal
2. Review browser console for details
3. Verify network connection
4. Retry analysis
5. Contact development team with:
   - Process CNJ
   - Error message
   - Browser/device info
   - Screenshot

---

**Version:** 2.0  
**Status:** ✅ Production Ready  
**Last Tested:** December 2024

---

## 🎓 Conclusion

The Premonição Jurídica feature successfully delivers AI-powered predictive analysis to legal professionals, helping them:
- Assess case strength objectively
- Identify winning strategies
- Find relevant precedents quickly
- Set realistic client expectations
- Draft better petitions with cited jurisprudence

The implementation leverages cutting-edge AI (GPT-4o) with a polished, professional UI that integrates seamlessly into the Assistente Jurídico PJe platform.

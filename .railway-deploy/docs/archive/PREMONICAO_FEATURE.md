# Premonição Jurídica - Legal Case Prediction Feature

## Overview

The **Premonição Jurídica** (Legal Prediction) feature is an AI-powered predictive analysis system that estimates the probability of success for legal cases. It provides lawyers with data-driven insights including:

- **Success Probability (0-100%)**: AI-calculated likelihood of favorable outcome
- **Detailed Analysis**: Contextual explanation considering Brazilian jurisprudence and case facts
- **Strategic Recommendations**: 3-4 actionable legal strategies specific to the case
- **Relevant Precedents**: 2-4 similar cases from superior courts (STJ, STF, TRF) with summaries and links

## Architecture

### Frontend Components

**PremonicaoModal.tsx**
- Full-screen modal dialog displaying analysis results
- Animated circular progress meter for probability visualization
- Color-coded probability ranges:
  - 🟢 Green (75-100%): High Probability
  - 🟡 Yellow (50-74%): Moderate Probability
  - 🟠 Orange (25-49%): Low Probability
  - 🔴 Red (0-24%): Very Low Probability
- Copyable strategy items and precedent cards
- Loading and error states with graceful fallbacks

**ProcessCRM.tsx**
- Integration point: "Premonição Jurídica" button on each process card
- Handles modal state and API calls
- Passes process data to AI service for context-aware analysis

### Backend Service

**premonicao-service.ts**
- Uses Spark's `spark.llm` API with GPT-4o model
- JSON mode for structured output
- Comprehensive prompt engineering for Brazilian legal context
- Error handling and fallback values

### Data Types

```typescript
interface Precedente {
  id: string                    // e.g., "STJ - REsp 1.234.567"
  tribunal: string              // e.g., "STJ", "TRF1", "STF"
  numero: string                // e.g., "REsp 1.234.567"
  tema: string                  // Legal theme/topic
  resumo_relevancia: string     // Why this precedent matters (120-300 chars)
  link: string                  // URL to jurisprudence database
}

interface PremonicaoJuridica {
  processo_cnj: string                      // CNJ process number
  probabilidade_exito: number               // 0-100
  analise_ia: string                        // AI analysis (200-500 chars)
  estrategias_recomendadas: string[]        // 3-4 strategies
  precedentes_relevantes: Precedente[]      // 2-4 precedents
}
```

## User Flow

1. **Trigger**: User clicks "✨ Premonição Jurídica" button on a process card in the Acervo (Process CRM)
2. **Loading**: Modal opens showing animated loading spinner with status message
3. **AI Analysis**: System calls GPT-4o with structured prompt including:
   - Process CNJ number
   - Case title, parties, status, and procedural stage
   - Instructions for Brazilian legal context
4. **Display Results**:
   - Animated probability meter appears
   - AI analysis text displays
   - Strategy cards render with copy buttons
   - Precedent cards show with tribunal badges and links
5. **User Actions**:
   - Copy individual strategies or precedents
   - Click links to view full jurisprudence
   - Close modal or run another analysis

## Key Features

### Probability Visualization
- Smooth SVG animation (1s duration)
- Dynamic color coding based on percentage
- Large, readable percentage display
- Descriptive label below meter

### Copyable Content
All text elements include copy functionality:
- Strategy items have individual copy buttons
- Precedent summaries can be copied
- Visual feedback on copy (checkmark animation)
- Toast notification on successful copy

### Error Handling
- Network errors: Clear message with retry suggestion
- AI parsing errors: Fallback to default values
- Invalid responses: Error card with descriptive message
- Loading timeout: User can close and retry

### Mobile Responsive
- Modal adapts to mobile screens
- Probability meter scales appropriately
- Strategy and precedent cards stack vertically
- Touch-friendly copy buttons

## AI Prompt Engineering

The service constructs a detailed prompt that:

1. **Sets Context**: Identifies AI as Brazilian legal specialist
2. **Provides Case Data**: Includes all available process information
3. **Defines Output Structure**: Specifies exact JSON schema
4. **Sets Quality Standards**:
   - Realistic probabilities
   - Balanced analysis (strengths AND weaknesses)
   - Actionable strategies
   - Real tribunal references
   - Accessible legal language
5. **Handles Edge Cases**: Considers statutes of limitations, procedural deadlines

## Sample Output

```json
{
  "processo_cnj": "0012345-67.2024.8.13.0024",
  "probabilidade_exito": 78,
  "analise_ia": "Caso apresenta fundamentos sólidos com jurisprudência favorável do STJ. A documentação probatória está bem estruturada, porém atenção ao prazo prescricional que se aproxima. Recomenda-se ação célere para preservar direitos.",
  "estrategias_recomendadas": [
    "Contestar alegações preliminares com foco na jurisprudência pacificada do STJ",
    "Requerer produção de prova pericial para fortalecer argumentação técnica",
    "Preparar memorial com precedentes favoráveis para fase decisória",
    "Monitorar prazo prescricional e protocolar medidas cautelares se necessário"
  ],
  "precedentes_relevantes": [
    {
      "id": "STJ - REsp 1.234.567",
      "tribunal": "STJ",
      "numero": "REsp 1.234.567",
      "tema": "Contrato de Prestação de Serviços",
      "resumo_relevancia": "Superior Tribunal de Justiça decidiu que inadimplemento contratual não afasta responsabilidade pela prestação de serviços já realizados, sendo devida a remuneração proporcional.",
      "link": "https://processo.stj.jus.br/processo/julgamento/eletronico/documento/?num_registro=1234567"
    }
  ]
}
```

## Performance Considerations

- **AI Response Time**: Typically 5-10 seconds with GPT-4o
- **Caching**: Future enhancement - cache analyses for 7 days
- **Rate Limiting**: Consider implementing usage quotas per user
- **Cost Management**: Monitor token usage, use gpt-4o-mini for non-critical analyses

## Future Enhancements

1. **Historical Tracking**: Store past analyses to track prediction accuracy
2. **User Feedback Loop**: Allow lawyers to rate analysis quality
3. **Export to PDF**: Generate professional report for clients
4. **Batch Analysis**: Analyze multiple processes simultaneously
5. **Update Notifications**: Re-analyze when process status changes
6. **Custom Weights**: Let users adjust factors (jurisprudence weight, deadline urgency)
7. **Integration with Knowledge Base**: Cross-reference with office's own precedents

## Testing

### Manual Testing Checklist
- [ ] Click "Premonição Jurídica" button opens modal
- [ ] Loading state displays with spinner
- [ ] Probability meter animates smoothly
- [ ] All strategies have copy buttons
- [ ] Precedent links open in new tab
- [ ] Copy functionality shows success toast
- [ ] Error states display correctly
- [ ] Modal closes properly
- [ ] Mobile layout is usable

### Sample Test Cases
1. **Valid Process**: Run analysis on sample process "0012345-67.2024.8.13.0024"
2. **Empty Process**: Test with minimal process data (CNJ only)
3. **Network Error**: Simulate offline mode
4. **AI Timeout**: Test with slow connection

## Security & Privacy

- No process data is permanently stored by AI service
- Analyses are client-side only (no backend database)
- User must be authenticated to access feature
- CNJ numbers are public information in Brazil

## Dependencies

- `spark.llm`: Spark runtime AI API (GPT-4o)
- `framer-motion`: Animation library for smooth transitions
- `sonner`: Toast notifications
- `@phosphor-icons/react`: Icon library

## File Structure

```
src/
├── components/
│   ├── PremonicaoModal.tsx        # Main modal component
│   └── ProcessCRM.tsx             # Integration point
├── lib/
│   ├── premonicao-service.ts      # AI service logic
│   └── sample-data.ts             # Sample processes for testing
└── types.ts                        # TypeScript interfaces
```

## Contributing

When modifying this feature:
1. Maintain Brazilian legal context in prompts
2. Test with various probability ranges (0-25, 26-50, 51-75, 76-100)
3. Ensure mobile responsiveness
4. Update this documentation with changes
5. Consider token costs when modifying prompts

## Support

For issues or questions about this feature:
- Check console for error messages
- Verify `spark.llm` is available in runtime
- Test with sample processes first
- Review AI response structure matches schema

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Status**: ✅ Production Ready

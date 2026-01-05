# Guia Completo: Usando Seus Orçamentos GitHub

## 📊 Status Atual dos Orçamentos

| Orçamento | Limite | Gasto | Disponível | Status |
|-----------|--------|-------|------------|---------|
| **SKUs Premium** | $20 | $0 | $20 | ✅ Disponível |
| **Models (IA)** | $10 | $0.38 | $9.62 | ✅ Usando |
| **Packages** | $10 | $0 | $10 | ✅ Configurado |
| **Git LFS** | $10 | $0 | $10 | ✅ Configurado |

---

## 1️⃣ Git LFS - CONFIGURADO ✅

### O que foi feito:
- ✅ Git LFS inicializado
- ✅ Tipos de arquivo configurados (PDF, DOCX, imagens, vídeos)
- ✅ Componente `DocumentTemplates.tsx` criado
- ✅ Diretório `public/templates/` criado

### Como usar agora:

```bash
# 1. Adicionar um PDF de template
cp seu-template.pdf public/templates/
git add public/templates/seu-template.pdf
git commit -m "Add: Template de petição via LFS"
git push

# 2. Verificar arquivos LFS
git lfs ls-files

# 3. Ver quanto foi usado
gh api /repos/thiagobodevan-a11y/assistente-jurdico-p/stats/lfs
```

### Integração no App:

Adicione ao `App.tsx`:

```tsx
import { DocumentTemplates } from './components/DocumentTemplates';

// No seu router ou tabs
<DocumentTemplates />
```

---

## 2️⃣ GitHub Packages - Publicar Bibliotecas

### Criar pacote de utils jurídicos:

```bash
# 1. Criar estrutura de pacote
mkdir -p packages/legal-utils
cd packages/legal-utils

# 2. Inicializar package
npm init -y

# 3. Configurar package.json
```

**packages/legal-utils/package.json:**
```json
{
  "name": "@thiagobodevan-a11y/legal-utils",
  "version": "1.0.0",
  "description": "Utilitários jurídicos reutilizáveis",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": {
    "type": "git",
    "url": "https://github.com/thiagobodevan-a11y/assistente-jurdico-p"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/"
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**packages/legal-utils/src/index.ts:**
```typescript
// Calculadora de prazos
export function calcularPrazo(
  dataPublicacao: Date,
  prazoEmDias: number,
  tipo: 'corridos' | 'uteis' = 'corridos'
): Date {
  // Sua lógica aqui
  return new Date();
}

// Validador de CPF/CNPJ
export function validarCPF(cpf: string): boolean {
  // Sua lógica
  return true;
}

export function validarCNPJ(cnpj: string): boolean {
  // Sua lógica
  return true;
}
```

**Publicar:**
```bash
# 1. Autenticar (use token com permissão packages:write)
export GITHUB_TOKEN="seu_token_aqui"
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc

# 2. Build e publicar
cd packages/legal-utils
npm run build
npm publish
```

**Usar no projeto principal:**
```bash
# Instalar
npm install @thiagobodevan-a11y/legal-utils

# Usar
import { calcularPrazo, validarCPF } from '@thiagobodevan-a11y/legal-utils';
```

---

## 3️⃣ Models (IA) - Expandir Harvey Specter

### Você já está usando! ($0.38 gastos)

O Copilot Chat que você está usando consome desse orçamento. Para usar programaticamente:

**src/hooks/use-harvey-ai.ts:**
```typescript
import { useLLM } from '@github/spark';

export function useHarveyAI() {
  const llm = useLLM({
    model: 'gpt-4o', // ou 'claude-3.5-sonnet'
    temperature: 0.7,
    maxTokens: 2000
  });

  const analyzeCase = async (caseDetails: string) => {
    const response = await llm.complete({
      systemPrompt: `Você é Harvey Specter, advogado corporativo de elite.
                     Analise casos com foco em:
                     1. Pontos fortes e fracos
                     2. Estratégia processual
                     3. Chances de sucesso`,
      prompt: caseDetails
    });
    return response.text;
  };

  const draftPetition = async (facts: string, objective: string) => {
    const response = await llm.complete({
      systemPrompt: 'Você é especialista em petições jurídicas.',
      prompt: `Redija uma petição inicial com:
               Fatos: ${facts}
               Objetivo: ${objective}`
    });
    return response.text;
  };

  return { analyzeCase, draftPetition };
}
```

**Usar no componente:**
```tsx
import { useHarveyAI } from '@/hooks/use-harvey-ai';

export function LegalAssistant() {
  const { analyzeCase } = useHarveyAI();
  
  const handleAnalysis = async () => {
    const analysis = await analyzeCase('Descrição do caso...');
    console.log(analysis);
  };
}
```

---

## 4️⃣ SKUs Premium - Advanced Security

⚠️ **Requer GitHub Enterprise ou Organization**

Features disponíveis com Enterprise:
- **Code Scanning** - Análise automática de segurança
- **Secret Scanning** - Detecta credenciais vazadas
- **Dependabot Alerts** - Vulnerabilidades em dependências
- **Security Overview** - Dashboard de segurança

**Alternativa para conta pessoal:**
```bash
# Você pode usar ferramentas similares gratuitas:

# 1. ESLint para segurança
npm install -D eslint-plugin-security

# 2. npm audit (já incluso)
npm audit --audit-level=moderate

# 3. Snyk (versão gratuita)
npx snyk test
```

---

## 📈 Monitorar Uso

### Via GitHub CLI:
```bash
unset GITHUB_TOKEN

# Ver uso de LFS
gh api /repos/thiagobodevan-a11y/assistente-jurdico-p/stats/lfs

# Ver uso de Packages
gh api /user/settings/billing/packages

# Ver uso de Models
gh api /user/settings/billing/copilot
```

### Via Web:
https://github.com/settings/billing

---

## 🎯 Próximos Passos Recomendados

### Curto Prazo (Hoje):
1. ✅ Git LFS configurado
2. ⬜ Adicionar templates PDF reais em `public/templates/`
3. ⬜ Integrar `DocumentTemplates` no Dashboard
4. ⬜ Testar upload de documentos

### Médio Prazo (Esta Semana):
1. ⬜ Criar pacote `@thiagobodevan-a11y/legal-utils`
2. ⬜ Expandir Harvey AI com `use-harvey-ai.ts`
3. ⬜ Adicionar análise de casos com IA
4. ⬜ Implementar gerador de petições

### Longo Prazo (Este Mês):
1. ⬜ Publicar 3-5 templates completos via LFS
2. ⬜ Criar biblioteca de validadores jurídicos
3. ⬜ Implementar chat avançado com Harvey
4. ⬜ Documentar uso dos orçamentos

---

## 💡 Dicas de Economia

### Git LFS ($10/mês):
- Incluso: 1 GB armazenamento + 1 GB banda
- Adicional: $0.07/GB armazenamento, $0.10/GB banda
- **Dica**: Comprima PDFs antes de fazer upload

### Models ($10/mês):
- ~$0.03 por 1K tokens (GPT-4)
- ~$0.003 por 1K tokens (GPT-3.5)
- **Dica**: Use GPT-3.5 para tarefas simples

### Packages ($10/mês):
- Incluso: 500 MB armazenamento + 1 GB transferência
- Adicional: $0.25/GB
- **Dica**: Publique apenas código, não assets

---

## ❓ FAQ

**Q: Posso usar Git LFS para imagens do site?**
A: Sim! Mas use compressão. Alternativa: hospede em CDN (Cloudflare, Vercel).

**Q: Quanto custa uma chamada ao Harvey AI?**
A: ~$0.002-0.006 por pergunta (depende do tamanho).

**Q: Posso publicar packages públicos?**
A: Sim! Gratuito para packages públicos.

**Q: O que acontece se exceder o orçamento?**
A: Uso é interrompido até o próximo ciclo (configurável em Settings).

---

**Criado em:** 21/11/2025  
**Última atualização:** 21/11/2025

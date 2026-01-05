# ?? GUIA COMPLETO: Configurar Instruções Fixas do GitHub Copilot

> **Objetivo**: Garantir que o GitHub Copilot sempre leia e siga as instruções em `.github/copilot-instructions.md`

---

## ? **Status Atual da Configuração**

### **Arquivo de Instruções**
- ? Localização: `.github/copilot-instructions.md`
- ? Front Matter YAML: `applyTo: "**"` (aplica a todos os arquivos)
- ? Tamanho: ~95KB com toda documentação do projeto

### **Configuração do VS Code**
- ? `.vscode/settings.json` configurado corretamente
- ? `github.copilot.chat.useInstructionFiles: true` ativado

---

## ?? **Passo a Passo: Verificar e Ativar**

### **1. Verificar Extensão GitHub Copilot**

Certifique-se de ter a extensão instalada e atualizada:

```
Ctrl + Shift + X (abrir Extensions)
Procurar: "GitHub Copilot"
Versão mínima: 1.142.0+
Status: ? Instalado e Ativado
```

**Extensões necessárias:**
- `GitHub.copilot` - Sugestões inline
- `GitHub.copilot-chat` - Chat e instruções

### **2. Verificar Configuração Global vs Workspace**

**Configuração Workspace** (recomendado - já configurado):
```
Arquivo: .vscode/settings.json
Linha 7: "github.copilot.chat.useInstructionFiles": true
```

**Configuração Global** (opcional):
```
Ctrl + Shift + P ? Preferences: Open Settings (JSON)
Adicionar:
{
  "github.copilot.chat.useInstructionFiles": true
}
```

### **3. Reiniciar Servidores do Copilot**

Após qualquer alteração em `.github/copilot-instructions.md`:

```
Ctrl + Shift + P
> GitHub Copilot: Restart Language Server
> GitHub Copilot: Restart MCP Servers
```

**Atalho rápido:**
1. `Ctrl + Shift + P`
2. Digite "restart copilot"
3. Selecione ambas opções

### **4. Testar se Instruções Estão Ativas**

**Teste no Copilot Chat:**

```
# No chat do Copilot (Ctrl + I ou Ctrl + Alt + I)
@workspace Qual é o modo atual do projeto?
```

**Resposta esperada:**
```
O projeto está em MODO MANUTENÇÃO. O desenvolvimento de novas 
funcionalidades está encerrado. O foco é exclusivamente manter 
o sistema funcionando de forma estável.
```

**Se responder corretamente:** ? Instruções estão ativas!

---

## ?? **Estrutura do Arquivo de Instruções**

### **Front Matter Obrigatório**

```yaml
---
applyTo: "**"
---
```

**Opções de `applyTo`:**
- `"**"` - Aplica a todos os arquivos (recomendado)
- `"src/**/*.ts"` - Apenas arquivos TypeScript em src/
- `"api/**/*.ts"` - Apenas arquivos de API

### **Seções Recomendadas**

```markdown
---
applyTo: "**"
---

# ?? OBJETIVO ATUAL
Modo MANUTENÇÃO - descrição clara

# ?? Visão Geral do Projeto
Contexto geral

# ?? Sistema de Agentes
Documentação dos agentes

# ?? Regras Técnicas
Padrões de código

# ?? Referências
Links úteis
```

---

## ?? **Configurações Avançadas**

### **Instruções Contextuais de Geração de Código**

Já configurado em `.vscode/settings.json`:

```json
"github.copilot.chat.codeGeneration.instructions": [
  {
    "text": "Sempre siga as instruções em .github/copilot-instructions.md"
  },
  {
    "text": "Modo MANUTENÇÃO: Apenas corrigir bugs, não adicionar features"
  },
  {
    "text": "Antes de qualquer mudança, execute verificação diária"
  },
  {
    "text": "Use TypeScript strict mode e valide tipos"
  },
  {
    "text": "Siga padrões React 19 com componentes funcionais"
  },
  {
    "text": "Mantenha compatibilidade com Vercel serverless (Node.js 22.x)"
  }
]
```

**Benefícios:**
- ? Copilot segue regras mesmo sem `@workspace`
- ? Sugestões inline respeitam padrões
- ? Geração de código consistente

### **Modelos Alternativos**

```json
"github.copilot.advanced": {
  "debug.overrideEngine": "gpt-4o",  // Modelo mais inteligente
  "inlineSuggestCount": 3,            // 3 sugestões inline
  "listCount": 10                     // 10 opções no chat
}
```

**Opções de modelo:**
- `gpt-4o` - Mais inteligente (recomendado)
- `gpt-4-turbo` - Rápido e preciso
- `gpt-3.5-turbo` - Mais rápido, menos preciso

---

## ?? **Troubleshooting**

### **Problema 1: Copilot não lê instruções**

**Sintomas:**
- Copilot não segue regras em `.github/copilot-instructions.md`
- Sugere código fora do padrão
- Não respeita modo MANUTENÇÃO

**Soluções:**

1. **Verificar configuração:**
   ```json
   // .vscode/settings.json
   "github.copilot.chat.useInstructionFiles": true  // DEVE SER TRUE
   ```

2. **Reiniciar servidores:**
   ```
   Ctrl + Shift + P ? GitHub Copilot: Restart Language Server
   ```

3. **Recarregar VS Code:**
   ```
   Ctrl + Shift + P ? Developer: Reload Window
   ```

4. **Verificar front matter:**
   ```yaml
   ---
   applyTo: "**"  # OBRIGATÓRIO
   ---
   ```

### **Problema 2: Instruções aplicadas parcialmente**

**Causa:** Front matter com filtro muito específico

**Solução:**
```yaml
# ? ERRADO - muito restritivo
---
applyTo: "src/**/*.ts"
---

# ? CORRETO - aplica a tudo
---
applyTo: "**"
---
```

### **Problema 3: Copilot lento após adicionar instruções**

**Causa:** Arquivo de instruções muito grande (> 100KB)

**Soluções:**

1. **Dividir instruções:**
   ```
   .github/copilot-instructions.md (principal - 50KB)
   .github/copilot-instructions-agents.md (agentes - 30KB)
   .github/copilot-instructions-api.md (API - 20KB)
   ```

2. **Usar links para docs externas:**
   ```markdown
   ## Documentação Completa
   Ver: docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md
   ```

3. **Remover seções não essenciais:**
   - Manter: Objetivo, Regras, Comandos
   - Remover: Histórico detalhado, Exemplos extensos

---

## ?? **Verificação de Saúde das Instruções**

### **Checklist Diário**

```bash
# 1. Verificar tamanho do arquivo
ls -lh .github/copilot-instructions.md
# Ideal: < 100KB

# 2. Validar YAML front matter
head -n 3 .github/copilot-instructions.md
# Esperado:
# ---
# applyTo: "**"
# ---

# 3. Testar Copilot
# Abrir qualquer arquivo .ts
# Ctrl + I
# Digite: "Qual é o modo atual do projeto?"
# Esperado: Resposta mencionando "MODO MANUTENÇÃO"
```

### **Comandos de Teste**

```
# No Copilot Chat (Ctrl + Alt + I)

1. @workspace Qual é o objetivo atual do projeto?
   ? Deve mencionar: MODO MANUTENÇÃO

2. @workspace Posso adicionar uma nova funcionalidade?
   ? Deve responder: NÃO, apenas correções de bugs

3. @workspace Como executar o checklist diário?
   ? Deve responder: npm run daily-check

4. @workspace Quantos agentes IA temos?
   ? Deve responder: 15 agentes especializados

5. @workspace Qual é a arquitetura de agentes?
   ? Deve mencionar: Híbrida com 8 camadas
```

---

## ?? **Dicas de Otimização**

### **1. Manter Instruções Atualizadas**

```bash
# Sempre que alterar copilot-instructions.md:
git add .github/copilot-instructions.md
git commit -m "docs: atualizar instruções do Copilot"
git push

# Reiniciar Copilot no VS Code:
Ctrl + Shift + P ? GitHub Copilot: Restart Language Server
```

### **2. Usar Seções Curtas e Objetivas**

```markdown
# ? EVITAR - muito verboso
## Sistema de Agentes
O sistema possui 15 agentes de inteligência artificial que foram 
desenvolvidos para automatizar tarefas jurídicas complexas. Cada 
agente tem responsabilidades específicas e trabalha de forma autônoma...
(500 palavras)

# ? PREFERIR - conciso e direto
## Sistema de Agentes
15 agentes IA especializados:
- Harvey Specter: Estratégia
- Mrs. Justin-e: Análise de intimações
- [Ver lista completa: docs/TODOS_OS_15_AGENTES.md]
```

### **3. Priorizar Informações Críticas**

**Ordem recomendada:**
1. ?? Objetivo/Modo Atual (topo)
2. ?? Restrições e Proibições
3. ? Comandos e Procedimentos
4. ?? Documentação Complementar (links)

---

## ?? **Recursos Adicionais**

### **Documentação Oficial**

| Recurso | Link |
|---------|------|
| **Copilot Instruction Files** | https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot |
| **VS Code Settings** | https://code.visualstudio.com/docs/getstarted/settings |
| **Copilot Chat** | https://docs.github.com/en/copilot/using-github-copilot/asking-github-copilot-questions-in-your-ide |

### **Exemplos de Projetos**

- **Next.js**: https://github.com/vercel/next.js/.github/copilot-instructions.md
- **TypeScript**: https://github.com/microsoft/TypeScript/.github/copilot-instructions.md

---

## ? **Checklist Final**

Verifique se todos os itens estão ?:

- [ ] Extensão `GitHub.copilot` instalada e atualizada
- [ ] Extensão `GitHub.copilot-chat` instalada e atualizada
- [ ] Arquivo `.github/copilot-instructions.md` existe
- [ ] Front matter `applyTo: "**"` presente
- [ ] `.vscode/settings.json` com `useInstructionFiles: true`
- [ ] Copilot reiniciado após mudanças
- [ ] Teste no chat passou (responde sobre MODO MANUTENÇÃO)
- [ ] Instruções atualizadas no repositório (git push)

---

## ?? **Conclusão**

Com essa configuração, o GitHub Copilot **SEMPRE** lerá e seguirá as instruções em `.github/copilot-instructions.md` automaticamente, sem necessidade de usar `@workspace` em cada comando.

**Benefícios:**
- ? Sugestões inline consistentes com padrões do projeto
- ? Chat já contextualizado com regras
- ? Geração de código seguindo modo MANUTENÇÃO
- ? Redução de erros e inconsistências

**Última atualização**: 09/12/2024  
**Responsável**: Thiago Bodevan

# 🤖 Configuração do Agente de Codificação GitHub Copilot

Este repositório está otimizado para trabalhar com o **Agente de Codificação do GitHub Copilot**.

## ✅ Configuração Concluída

### 📋 Arquivos Configurados

1. **`.github/copilot-instructions.md`** ✅
   - Instruções contextuais completas para o Copilot
   - Diretrizes de manutenção do projeto
   - Padrões de código e arquitetura
   - Sistema de 15 agentes IA documentado

2. **`.vscode/settings.json`** ✅
   - `github.copilot.chat.useInstructionFiles: true` - Usa copilot-instructions.md
   - `github.copilot.chat.codeGeneration.instructions` - Instruções contextuais
   - Auto-save, format on save, ESLint auto-fix
   - TypeScript otimizado com inlay hints
   - Tasks automáticas habilitadas

3. **`.vscode/extensions.json`** ✅
   - GitHub Copilot e Copilot Chat
   - ESLint, Prettier, TypeScript
   - SonarLint para qualidade de código
   - Extensões recomendadas instaladas

## 🎯 Como Usar o Agente de Codificação

### 1️⃣ Abrir o Copilot Chat

```
Ctrl+Shift+I (Windows/Linux)
Cmd+Shift+I (macOS)
```

### 2️⃣ Comandos Úteis do Agente

#### 🔧 Correção de Bugs
```
@workspace encontre e corrija todos os erros TypeScript
```

#### 📝 Refatoração (apenas bugs, sem novas features)
```
@workspace corrija o bug no componente ProcessDialog
```

#### 🧪 Testes
```
@workspace execute os testes e corrija falhas
```

#### 📊 Análise de Código
```
@workspace analise problemas de performance no código
```

#### 🔍 Busca Inteligente
```
@workspace onde está a lógica de autenticação das APIs?
```

### 3️⃣ Comandos Slash Disponíveis

| Comando | Descrição |
|---------|-----------|
| `/explain` | Explica código selecionado |
| `/fix` | Corrige erros no código |
| `/tests` | Gera testes unitários |
| `/doc` | Gera documentação |
| `/review` | Revisa código com sugestões |

## 🚀 Fluxo de Trabalho Otimizado

### Modo MANUTENÇÃO (Atual)

O projeto está em **modo manutenção** - apenas correções de bugs:

1. **Identificar bug**: Use `@workspace` para localizar o problema
2. **Correção cirúrgica**: Copilot sugere fix mínimo sem afetar outras partes
3. **Testar**: Testes automáticos rodam em watch mode
4. **Commit**: Mensagens geradas pelo Copilot

### Verificação Diária Automática

O Copilot executa automaticamente:
- ✅ Verificação de configurações VSCode
- ✅ Status de tasks automáticas (25+ tasks)
- ✅ Build e testes passando
- ✅ Lint sem erros críticos

## 📚 Recursos do Agente

### 🧠 Contexto do Repositório

O agente conhece:
- **Arquitetura**: React 19 + TypeScript + Vite + Vercel
- **15 Agentes IA**: Harvey, Mrs. Justin-e, Monitor DJEN, etc.
- **Integrações**: DJEN, DataJud, Google Calendar, Upstash Redis
- **Padrões**: Componentes funcionais, hooks, Tailwind CSS
- **Testes**: Vitest (138/150 passing)
- **API**: Vercel Functions serverless

### 🎨 Padrões de Código Conhecidos

```typescript
// ✅ Padrão React correto
interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  const [state, setState] = useState();
  return <div>{title}</div>;
}
```

### 🔐 Segurança

- Nunca commita secrets (.env em .gitignore)
- Valida autenticação em APIs
- Segue LGPD e compliance

## 📊 Métricas de Qualidade

O Copilot monitora automaticamente:

| Métrica | Target | Status |
|---------|--------|--------|
| Build | ✅ Passa | ✅ OK |
| TypeScript | 0 erros | ✅ OK |
| Testes | 138/150 | ✅ 92% |
| Lint | < 150 warnings | ✅ 31 |
| Bundle size | Otimizado | ✅ Code splitting |

## 🔄 Integração com PR Workflow

Quando você cria uma PR, o Copilot:

1. **Revisa código** automaticamente
2. **Sugere melhorias** sem quebrar funcionalidades
3. **Valida testes** passando
4. **Verifica build** Vercel

## 💡 Dicas de Produtividade

### Perguntar ao Invés de Procurar

❌ **Antes**: Procurar 10 minutos por um arquivo
```bash
find . -name "*auth*"
```

✅ **Agora**: Perguntar ao Copilot
```
@workspace onde está o código de autenticação das APIs?
```

### Gerar Testes Automaticamente

❌ **Antes**: Escrever testes manualmente
✅ **Agora**: 
```
@workspace /tests gere testes para o hook use-autonomous-agents
```

### Entender Código Complexo

❌ **Antes**: Ler 500 linhas de código
✅ **Agora**:
```
@workspace /explain explique como funciona o sistema de agentes IA
```

## 🎯 Exemplos Práticos

### 1. Corrigir Bug em Produção

```
@workspace analise os logs da Vercel e identifique o erro 401 em /api/agents
```

Copilot vai:
1. Ler logs
2. Identificar falta de CORS
3. Sugerir fix
4. Gerar commit message

### 2. Adicionar Testes Faltantes

```
@workspace quais arquivos não têm testes? gere testes para os 3 mais críticos
```

### 3. Otimizar Performance

```
@workspace encontre componentes React sem React.memo que deveriam ter
```

## 🔧 Troubleshooting

### Copilot não está seguindo as instruções?

1. Verifique se `.github/copilot-instructions.md` existe
2. Confirme `github.copilot.chat.useInstructionFiles: true` em settings.json
3. Recarregue VSCode: `Ctrl+Shift+P` → "Reload Window"

### Copilot está muito lento?

1. Verifique conexão com internet
2. Confirme subscription ativa do Copilot
3. Desabilite temporariamente outras extensões pesadas

### Sugestões não aparecem?

1. Verifique se Copilot está habilitado (ícone no canto inferior direito)
2. Confirme que extensão está atualizada
3. Tente `Ctrl+Enter` para forçar sugestões

## 📖 Documentação Adicional

- [GitHub Copilot Docs](https://docs.github.com/copilot)
- [Copilot Instructions Format](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [VSCode Copilot Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)

## ✨ Próximos Passos

Agora que o Agente de Codificação está configurado:

1. **Teste o @workspace**: Faça perguntas sobre o código
2. **Use /fix**: Corrija bugs automaticamente
3. **Gere testes**: Use /tests para cobertura
4. **Deixe o agente trabalhar**: Ele vai aprender com o seu código

---

🎉 **Configuração concluída!** O Copilot agora está otimizado para o seu repositório.

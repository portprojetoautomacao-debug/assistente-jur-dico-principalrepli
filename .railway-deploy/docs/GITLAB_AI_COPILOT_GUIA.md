# 🤖 Agentes de IA no GitLab - Guia Completo

## 📊 Comparação: GitHub Copilot vs GitLab AI

### GitHub Copilot (já tem)
- ✅ Sugestões de código em tempo real
- ✅ Geração de testes
- ✅ Explicação de código
- ✅ Conversação via chat

### GitLab AI Features

| Feature | GitLab Free | GitLab Premium | GitLab Ultimate |
|---------|:-----------:|:--------------:|:---------------:|
| Code Suggestions | ❌ | ✅ | ✅ |
| GitLab Duo | ❌ | ✅ | ✅ |
| AI-Powered Features | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ |

---

## 🎯 Opções de IA para GitLab Free (Sua Conta)

Como você tem GitLab Free, aqui estão as opções:

### Opção 1️⃣: GitHub Copilot + GitLab (Recomendado ✨)

Você já tem GitHub Copilot! Use ele no VS Code enquanto trabalha com GitLab:

**Já está configurado:**
- ✅ GitHub Copilot ativo no VS Code
- ✅ Funciona com arquivos do repositório GitLab
- ✅ Chat, sugestões, explanations tudo funciona

**Limitações:**
- Sugestões podem ser menores (limitação do Copilot)
- Chat não integra com GitLab web interface

---

### Opção 2️⃣: GitLab Web Native AI (Requer Upgrade)

Se quiser usar IA diretamente na interface do GitLab:

- **Requires:** GitLab Premium (começa em ~$29/mês)
- **Features:**
  - Code suggestions while viewing code
  - Merge request summaries
  - Commit message generation
  - Issue/Discussion summaries
  - Test generation

---

### Opção 3️⃣: Integração Open Source (Gratuita)

Use modelos de IA open-source:

#### A) Ollama + Llama2 (Local)
```bash
# Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Baixar modelo Llama2
ollama pull llama2

# Usar no VS Code com extensão Continue
# Extensão: Continue.dev
```

#### B) Open WebUI (Interface gráfica)
```bash
# Docker
docker run -d \
  -p 3000:8080 \
  -e OLLAMA_API_BASE_URL=http://127.0.0.1:11434/api \
  --name open-webui \
  ghcr.io/open-webui/open-webui:latest
```

---

## ✅ Configuração Recomendada para Você

### Usar GitHub Copilot (Já Ativo)

**Você já tem tudo pronto!** O GitHub Copilot funciona 100% com repositórios GitLab.

**Como usar no VS Code:**
1. Abra um arquivo do repositório
2. Pressione `Ctrl+I` ou `Cmd+I` para inline edits
3. Pressione `Ctrl+K` ou `Cmd+K` para chat
4. Ou simplesmente digite e veja as sugestões aparecerem

**Vantagens:**
- ✅ Funciona agora, sem configuração
- ✅ Mesma IA que você já usa
- ✅ Sincroniza com GitHub quando necessário

---

## 🚀 Como Usar GitHub Copilot com GitLab

### 1. Sugestões Automáticas

Enquanto você digita código:
```typescript
// Copilot sugere automaticamente
function buildDeploymentManifest(app: string) {
  // Copilot oferece sugestões aqui
}
```

**Atalhos:**
- `Tab` - Aceitar sugestão
- `Esc` - Rejeitar
- `Alt+[` / `Alt+]` - Navegar sugestões

### 2. Chat com Copilot

Pressione `Ctrl+Shift+I` (ou clique no ícone do Copilot):

```
Você: "Crie um deployment para staging com 2 replicas"
Copilot: [Gera manifesto YAML]

Você: "Adicione health checks"
Copilot: [Atualiza manifesto]
```

### 3. Explicar Código

Selecione código e pressione `Ctrl+Shift+/`:

```yaml
# Selecione este bloco e peça explicação
deploy_staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/...
```

Copilot explica o que cada linha faz.

### 4. Gerar Testes

No seu arquivo de testes:
```typescript
// Cursor aqui
// Copilot: "Escrever testes para esta função?"
// Pressione Tab para aceitar
```

### 5. Refatorar Código

Selecione código e peça:
```
"Refatore para use async/await"
"Melhore a performance"
"Adicione tratamento de erro"
"Simplifique esta lógica"
```

---

## 📝 Atalhos Úteis do GitHub Copilot

| Ação | Windows/Linux | Mac |
|------|---------------|-----|
| Abrir Chat | `Ctrl+Shift+I` | `Cmd+Shift+I` |
| Inline Edit | `Ctrl+K` | `Cmd+K` |
| Aceitar sugestão | `Tab` | `Tab` |
| Rejeitar | `Esc` | `Esc` |
| Próxima sugestão | `Alt+]` | `Option+]` |
| Sugestão anterior | `Alt+[` | `Option+[` |
| Explicar seleção | `Ctrl+Shift+/` | `Cmd+Shift+/` |
| Documentar função | Chat: "Document this" | Chat: "Document this" |

---

## 🎓 Ideias de Uso com seu GitLab

### 1. Gerar Manifests Kubernetes
```
Chat: "Create a production Kubernetes deployment with 3 replicas, health checks, and resource limits"
Copilot: [Gera manifesto completo]
```

### 2. Melhorar Pipeline
```
Chat: "Adicione security scanning ao meu .gitlab-ci.yml"
Copilot: [Atualiza pipeline com SAST, dependency check, etc.]
```

### 3. Escrever Documentação
```
Chat: "Gere documentação sobre como usar o GitLab Agent"
Copilot: [Cria markdown com instruções completas]
```

### 4. Debug de Erros
```
Selecione: logs de erro
Chat: "O que significa este erro? Como resolver?"
Copilot: [Explica e sugere solução]
```

### 5. Code Review
```
Chat: "Revise este código e sugira melhorias"
Copilot: [Faz review detalhado]
```

---

## 💡 Dicas Pro

### Prompt Engineering para GitLab

**❌ Ruim:**
```
"Crie um deployment"
```

**✅ Melhor:**
```
"Crie um deployment Kubernetes para a aplicação 'assistente-juridico' com:
- 2 replicas em staging
- 3 replicas em production
- Health checks (liveness/readiness)
- Resource limits: 512Mi RAM, 200m CPU
- Variable ambiente NODE_ENV
- Usar imagem do GitLab Registry"
```

### Context é Importante

Antes de fazer uma pergunta ao Copilot:
1. Abra o arquivo relevante (`.gitlab-ci.yml`, `Dockerfile`, etc.)
2. O Copilot vai considerar o contexto
3. Faça a pergunta com mais detalhes

### Usar Comentários

```typescript
// Tarefa: Gerar função que valida token JWT
// Requisitos: 
// - Usar biblioteca jose
// - Retornar payload ou erro
// - Expiração de 24 horas

// Copilot vai completar a função automaticamente
```

---

## 🔮 Futuro: Se Fizer Upgrade para Premium

Se em algum momento quiser o GitLab Premium:

```bash
# GitLab Premium traz:
# ✅ Code Suggestions nativa no navegador
# ✅ Merge request summaries com AI
# ✅ Commit message geração automática
# ✅ Documentation generation
```

---

## 📊 Sua Setup Atual

```
┌─────────────────────────────────────┐
│  GitHub Copilot (Pago)              │
│  ✅ Chat, Sugestões, Explicações   │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  VS Code                             │
│  Funciona com qualquer repositório   │
│  - GitHub ✅                        │
│  - GitLab ✅                        │
│  - Local ✅                         │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Seus Repositórios                   │
│  - GitHub (usa Copilot oficial)      │
│  - GitLab (usa Copilot via VS Code) │
│  - Local (usa Copilot)               │
└─────────────────────────────────────┘
```

---

## ✅ Checklist - Você Já Tem

- ✅ GitHub Copilot instalado
- ✅ VS Code com Copilot ativo
- ✅ Extensão GitLab Workflow
- ✅ Acesso ao repositório GitLab
- ✅ Tudo funcionando!

---

## 🎯 Próximos Passos

### Agora:
1. Use `Ctrl+Shift+I` para abrir o chat do Copilot
2. Peça ao Copilot para melhorar um arquivo
3. Teste com seu `.gitlab-ci.yml` ou `k8s/` manifests

### Se Quiser Mais:
- Explore GitHub Copilot Labs (extensão adicional)
- Teste GitHub Copilot Chat deepdive
- Configure Continue.dev para Ollama local (gratuito)

### Se Quiser GitLab AI Oficial:
- Considere upgrade para Premium
- Acesso a Code Suggestions nativa
- Integração completa na web interface

---

## 📚 Referências

- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [GitHub Copilot VS Code](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- [GitLab Duo](https://about.gitlab.com/gitlab-duo/)
- [Continue.dev (Open Source)](https://continue.dev/)
- [Ollama](https://ollama.ai/)

---

## 💬 Resumo

**Pergunta:** "Tem como configurar agente de IA pra GitLab igual tem no GitHub?"

**Resposta:** 
- ✅ **GitHub Copilot já funciona!** (você tem)
- ❓ GitLab Duo requer Premium
- 🎁 Alternativa gratuita: Ollama + Continue.dev

**Recomendação:** Use o GitHub Copilot que você já tem! Funciona perfeitamente com GitLab. 🚀

---

**Quer experimentar agora?** Abra um chat com Copilot e peça: "Melhore meu .gitlab-ci.yml para incluir security scanning"

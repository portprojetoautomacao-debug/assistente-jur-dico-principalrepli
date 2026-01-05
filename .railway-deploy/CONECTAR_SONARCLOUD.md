# 🔌 Conectar SonarLint ao SonarCloud - Passo a Passo

## ✅ Pré-requisitos (Já Configurado)

- ✅ SonarLint instalado no VS Code
- ✅ `.sonarcloud.properties` criado
- ✅ Connected Mode habilitado em `.vscode/settings.json`
- ✅ Projeto existe no SonarCloud: `thiagobodevan-a11y_assistente-juridico-p`

---

## 🚀 Passo 1: Gerar Token no SonarCloud

### 1.1 Acessar SonarCloud

🌐 **Abra no navegador:** https://sonarcloud.io/account/security

### 1.2 Login

- Use sua conta GitHub
- Autorize o SonarCloud se solicitado

### 1.3 Gerar Token

1. Clique em **"Generate Token"**
2. Preencha:
   - **Name:** `VS Code - Copilot Dev Container`
   - **Type:** `User Token` (ou `Project Analysis Token`)
   - **Expires in:** `90 days` (recomendado)
3. Clique em **"Generate"**
4. **COPIE O TOKEN** - você não verá novamente!

Exemplo de token:
```
sqa_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r
```

---

## 🔗 Passo 2: Conectar SonarLint ao SonarCloud

### Opção A - Via Command Palette (RECOMENDADO)

1. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
2. Digite: `SonarLint: Connect to SonarCloud`
3. Pressione Enter
4. **Escolha método de autenticação:**
   - Opção 1: **Token** (cole o token que você gerou)
   - Opção 2: **Browser** (login via navegador)
5. **Selecione a organização:**
   - `thiagobodevan-a11y-assistente-juridico-p`
6. **Selecione o projeto:**
   - `thiagobodevan-a11y_assistente-juridico-p`
7. Aguarde sincronização (5-10 segundos)

### Opção B - Manualmente (Alternativa)

Se a Opção A não funcionar, edite `.vscode/settings.json`:

```json
{
  "sonarlint.connectedMode.connections.sonarcloud": [
    {
      "organizationKey": "thiagobodevan-a11y-assistente-juridico-p",
      "connectionId": "sonarcloud-assistente-juridico",
      "token": "SEU_TOKEN_AQUI"  // 👈 Cole o token
    }
  ],
  "sonarlint.connectedMode.project": {
    "connectionId": "sonarcloud-assistente-juridico",
    "projectKey": "thiagobodevan-a11y_assistente-juridico-p"
  }
}
```

---

## 🔍 Passo 3: Verificar Conexão

### 3.1 Abrir SonarLint

1. Clique no ícone **SonarLint** na barra lateral esquerda
2. Ou pressione `Ctrl+Shift+P` → `SonarLint: Show SonarLint Output`

### 3.2 Verificar Status

Você deve ver:
- ✅ **Connected Mode:** Ativo
- ✅ **Connection:** `sonarcloud-assistente-juridico`
- ✅ **Project:** `thiagobodevan-a11y_assistente-juridico-p`
- ✅ **Quality Profile:** Sincronizado

### 3.3 Testar Análise

1. Abra um arquivo TypeScript qualquer (ex: `src/App.tsx`)
2. Introduza um erro de propósito:
   ```typescript
   const x = 1;
   x = 2; // ❌ Cannot assign to 'x' because it is a constant
   ```
3. Verifique em **Problems** (`Ctrl+Shift+M`)
4. Deve aparecer issue do SonarLint

---

## 🎯 Passo 4: Adicionar Token ao GitHub (CI/CD)

Para análise automática em PRs e pushes:

### 4.1 Acessar GitHub Secrets

🌐 **Abra:** https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions

### 4.2 Criar Secret

1. Clique em **"New repository secret"**
2. Preencha:
   - **Name:** `SONAR_TOKEN`
   - **Secret:** (cole o mesmo token)
3. Clique em **"Add secret"**

### 4.3 Testar Workflow

```bash
# Fazer qualquer mudança e commitar
git add .
git commit -m "test: verificar integração SonarCloud"
git push

# Verificar workflow rodando
# https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions
```

---

## ✅ Checklist de Verificação

- [ ] Token gerado no SonarCloud
- [ ] SonarLint conectado via Command Palette
- [ ] Connected Mode mostra "Connected"
- [ ] Quality Profile sincronizado
- [ ] Teste de análise funcionou (erro detectado)
- [ ] Token adicionado ao GitHub Secrets
- [ ] Workflow SonarCloud rodou com sucesso

---

## 🐛 Troubleshooting

### Problema 1: "Failed to connect to SonarCloud"

**Soluções:**

A) **Verificar token:**
- Token expirou? Gere novo em: https://sonarcloud.io/account/security
- Token está correto (sem espaços extras)?

B) **Limpar cache SonarLint:**
```bash
# No terminal do dev container
rm -rf ~/.sonarlint/storage/*
rm -rf ~/.sonarlint/work/*

# Recarregar VS Code
# Ctrl+Shift+P → "Developer: Reload Window"
```

C) **Verificar organização e projeto:**
- Organization: `thiagobodevan-a11y-assistente-juridico-p`
- Project: `thiagobodevan-a11y_assistente-juridico-p`

### Problema 2: "Quality Profile not synchronized"

**Solução:**
```
Ctrl+Shift+P → "SonarLint: Update all project bindings to SonarCloud"
```

### Problema 3: Issues não aparecem

**Soluções:**

A) **Verificar arquivo está incluso:**
```bash
# Arquivo deve estar em src/ ou api/
# E NÃO estar em exclusões (.sonarcloud.properties)
```

B) **Forçar análise:**
```
Ctrl+Shift+P → "SonarLint: Analyze all files in workspace"
```

C) **Verificar logs:**
```
Ctrl+Shift+P → "SonarLint: Show SonarLint Output"
```

### Problema 4: Workflow GitHub Actions falha

**Verificar:**

1. **SONAR_TOKEN existe:**
   - https://github.com/thiagobodevan-a11y/assistente-juridico-p/settings/secrets/actions

2. **Token é válido:**
   - Gere novo se necessário

3. **Workflow existe:**
   - `.github/workflows/sonarcloud.yml` deve existir

4. **Ver logs do workflow:**
   - https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions

---

## 📊 Benefícios do Connected Mode

### ✅ O Que Você Ganha:

1. **Quality Profile Sincronizado**
   - Regras customizadas do SonarCloud
   - Mesmas regras em CI/CD e local

2. **Issues Sincronizados**
   - Ver issues detectados no servidor
   - Marcar como "won't fix" ou "false positive"

3. **New Code Definition**
   - Foco em código novo (não legado)
   - Evita ruído de código antigo

4. **Security Hotspots**
   - Ver hotspots de segurança
   - LGPD compliance

5. **Taint Vulnerabilities**
   - Rastreamento de dados sensíveis
   - XSS, SQL Injection, etc.

---

## 🔐 Segurança do Token

### ✅ BOM:
- Criar token específico por máquina/dev container
- Definir expiração (90 dias)
- Armazenar em `.env.local` (não commitar)
- Revogar tokens antigos

### ❌ RUIM:
- Commitar token no GitHub
- Compartilhar token entre desenvolvedores
- Token sem expiração
- Deixar token em arquivo público

---

## 🎓 Próximos Passos

Após conectar:

1. **Explorar SonarCloud Dashboard**
   - https://sonarcloud.io/project/overview?id=thiagobodevan-a11y_assistente-juridico-p

2. **Configurar Quality Gate**
   - Coverage > 80%
   - Duplications < 3%
   - Security Rating A

3. **Habilitar Pull Request Decoration**
   - Comentários automáticos em PRs
   - Bloquear merge com bugs

4. **Monitorar Métricas**
   - Code Smells
   - Bugs
   - Vulnerabilities
   - Security Hotspots

---

## 📞 Suporte

**Documentação:**
- SonarCloud: https://docs.sonarsource.com/sonarcloud/
- SonarLint: https://docs.sonarsource.com/sonarlint/vs-code/

**Comunidade:**
- Forum: https://community.sonarsource.com/
- GitHub: https://github.com/SonarSource/sonarlint-vscode

**Logs no VS Code:**
```
View → Output → Dropdown: "SonarLint"
```

---

**Criado em:** 5 de dezembro de 2025  
**Versão:** 1.0  
**Ambiente:** Dev Container (Linux)

**Boa análise de código!** 🚀

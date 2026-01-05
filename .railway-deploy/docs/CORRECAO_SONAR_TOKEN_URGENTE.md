# 🚨 CORREÇÃO URGENTE - Token SonarCloud Exposto

## ⚠️ PROBLEMA CRÍTICO DE SEGURANÇA

O token de autenticação do SonarCloud está **exposto publicamente** no arquivo `settings.json`.

### Token Exposto
```
83fa42a2bd87d9a864fa385b7e9b1f66438013db
```

## 📋 AÇÕES IMEDIATAS (EXECUTAR AGORA!)

### 1️⃣ Revogar Token Atual (5 min)

1. Acesse: https://sonarcloud.io/account/security
2. Encontre o token `83fa42a2bd87d9a864fa385b7e9b1f66438013db`
3. Clique em **"Revoke"**
4. Confirme a revogação

### 2️⃣ Remover Token do settings.json (2 min)

Edite `.vscode/settings.json` e remova a linha `"token"`:

```diff
  "sonarlint.connectedMode.connections.sonarcloud": [
    {
      "organizationKey": "thiagobodevan-a11y-assistente-juridico-p",
      "connectionId": "thiagobodevan-a11y-assistente-juridico-p",
-     "token": "83fa42a2bd87d9a864fa385b7e9b1f66438013db",
      "disableNotifications": false
    }
  ]
```

### 3️⃣ Criar Novo Token (3 min)

1. Acesse: https://sonarcloud.io/account/security
2. Clique em **"Generate Tokens"**
3. Nome: `VS Code - Assistente Jurídico`
4. Tipo: **User Token** (não Project Token!)
5. Expiration: 90 dias
6. Copie o novo token

### 4️⃣ Configurar Token no VS Code (2 min)

**NÃO adicione ao settings.json!** Use Secret Storage:

1. Abra Command Palette (`Ctrl+Shift+P`)
2. Execute: `SonarLint: Edit SonarCloud Connection`
3. Selecione a conexão `thiagobodevan-a11y-assistente-juridico-p`
4. Cole o **novo token**
5. Clique em **"Save"**

### 5️⃣ Verificar Conexão (1 min)

1. Command Palette → `SonarLint: Update all project bindings to SonarCloud/SonarQube`
2. Verificar que não há erros de autenticação
3. Abrir um arquivo `.ts` e confirmar que análise funciona

### 6️⃣ Commitar Correção (2 min)

```bash
cd /workspaces/assistente-juridico-p
git add .vscode/settings.json
git commit -m "security: remover token SonarCloud exposto do settings.json

- Token movido para VS Code Secret Storage (seguro)
- Adicionado .vscode/settings.json.example sem token
- Token anterior revogado no SonarCloud
"
git push
```

## ✅ VERIFICAÇÃO FINAL

Após completar todos os passos, confirme:

- [ ] Token antigo revogado no SonarCloud
- [ ] settings.json **sem campo "token"**
- [ ] Novo token armazenado no Secret Storage
- [ ] Análise SonarLint funcionando
- [ ] Commit com correção pushed

## 🔒 BOAS PRÁTICAS DE SEGURANÇA

### ❌ NUNCA faça:
- Adicionar tokens em `settings.json`
- Commitar tokens em `.env`
- Compartilhar tokens por email/chat
- Usar tokens de projeto (só User Token!)

### ✅ SEMPRE faça:
- Usar VS Code Secret Storage
- Revogar tokens antigos
- Tokens com expiração (90 dias)
- Tokens específicos por IDE/serviço

## 📚 Referências

- [SonarCloud Tokens](https://sonarcloud.io/account/security)
- [SonarLint Connected Mode](https://docs.sonarsource.com/sonarlint-vscode/using-sonarlint/connected-mode/)
- [VS Code Secret Storage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage)

---

**Data**: 6 de Dezembro de 2024
**Prioridade**: 🔴 CRÍTICA
**Tempo estimado**: 15 minutos
**Status**: ⏳ PENDENTE EXECUÇÃO

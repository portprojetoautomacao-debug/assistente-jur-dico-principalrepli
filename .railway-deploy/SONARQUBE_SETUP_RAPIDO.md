# 🚀 CONFIGURAÇÃO SONARQUBE - GUIA RÁPIDO

## ✅ Status da Configuração

A extensão SonarQube foi **configurada com sucesso**! Falta apenas 1 passo:

### 📝 O que foi configurado:

✅ **Servidor MCP SonarQube** adicionado em `.cursor/mcp.json`  
✅ **Configurações SonarLint** no VS Code (`.vscode/settings.json`)  
✅ **Análise automática** habilitada (on save, on commit)  
✅ **Connected Mode** com SonarCloud configurado  
✅ **Regras personalizadas** definidas  
✅ **Script de verificação** criado (`verificar-sonarqube.sh`)

### ⚠️ Falta apenas:

❌ **Token do SonarCloud** não configurado

---

## 🔑 PASSO FINAL: Configurar Token

### 1️⃣ Gerar Token no SonarCloud

1. Acesse: **https://sonarcloud.io/account/security**
2. Faça login (se necessário)
3. Clique em **"Generate Tokens"** ou **"Generate Token"**
4. Preencha:
   - **Name**: `vscode-assistente-juridico`
   - **Type**: **User Token** (obrigatório!)
   - **Expires in**: 90 days ou No expiration
5. Clique em **Generate**
6. **COPIE O TOKEN** (você não poderá vê-lo novamente!)

### 2️⃣ Configurar no Projeto

**Crie o arquivo `.env` na raiz do projeto:**

```bash
cp .env.example .env
```

**Adicione o token ao arquivo `.env`:**

```bash
# Abra o arquivo
code .env

# Adicione esta linha (substitua pelo token real):
SONARQUBE_TOKEN=squ_1234567890abcdef1234567890abcdef12345678
```

**OU use o comando:**

```bash
echo "SONARQUBE_TOKEN=seu_token_aqui" >> .env
```

### 3️⃣ Configurar via Interface Visual (Recomendado)

**IMPORTANTE**: Não use comandos! Use a interface visual do SonarLint:

1. **Abra a barra lateral** (Activity Bar) do VS Code
2. **Clique no ícone SonarQube** ou procure por "CONNECTED MODE"
3. **Clique em** "Add SonarQube Cloud Connection"
4. **Preencha**:
   - **Organization Key**: `thiagobodevan-a11y-assistente-juridico-p`
   - **User Token**: Cole o token gerado no passo 1
   - **Connection Name**: `SonarCloud Assistente Jurídico`
5. **Clique em** "Save Connection"
6. **Bind o projeto**:
   - Na mesma interface, clique em "Bind Project"
   - **Project Key**: `thiagobodevan-a11y_assistente-juridico-p`
   - Confirme

### 4️⃣ Verificar Conexão

Na barra inferior (status bar) do VS Code, você verá:
- ✅ Ícone do SonarLint (verde = conectado)
- ✅ Branch name sendo sincronizado

### 5️⃣ Testar Análise

1. **Abra** qualquer arquivo `.ts` ou `.tsx`
2. **Faça uma modificação**
3. **Salve** (`Ctrl+S`)
4. **Veja** os issues automaticamente no painel **Problems** (`Ctrl+Shift+M`)

**Pronto!** O SonarLint agora analisa automaticamente seu código! 🎉

---

### Análise Automática

1. **Abra qualquer arquivo `.ts` ou `.tsx`**
2. **Faça uma modificação**
3. **Salve o arquivo** (`Ctrl+S`)
4. **Veja os issues** no painel **"Problems"** (Ctrl+Shift+M)

### Comandos Disponíveis

| Atalho/Comando | Descrição |
|----------------|-----------|
| `Ctrl+Shift+P` → `SonarLint: Analyze Current File` | Analisa arquivo atual |
| `Ctrl+Shift+P` → `SonarLint: Show Rule Description` | Ver descrição da regra |
| `Ctrl+Shift+P` → `SonarLint: Update All Bindings` | Atualizar regras do SonarCloud |
| Painel **Problems** | Ver todos os issues detectados |

### Integração com Copilot

Você pode pedir ao Copilot para:

```
@workspace analise os issues do SonarQube
```

```
@workspace corrija os problemas de segurança detectados
```

---

## 🔍 Verificação Rápida

Execute este comando para verificar tudo:

```bash
./verificar-sonarqube.sh
```

**Resultado esperado:**

```
✅ node encontrado
✅ java encontrado
✅ Arquivo existe: .cursor/mcp.json
✅ Arquivo existe: .vscode/settings.json
✅ Variável SONARQUBE_TOKEN definida
✅ Servidor SonarQube MCP configurado
✅ Connected Mode configurado
✅ Token SonarCloud válido
```

---

## 📊 Dados do Projeto

| Item | Valor |
|------|-------|
| **URL SonarCloud** | https://sonarcloud.io |
| **Organização** | `thiagobodevan-a11y-assistente-juridico-p` |
| **Projeto** | `thiagobodevan-a11y_assistente-juridico-p` |
| **URL do Projeto** | https://sonarcloud.io/project/overview?id=thiagobodevan-a11y_assistente-juridico-p |

---

## 🐛 Problemas Comuns

### Token não funciona

```bash
# Verifique se o token está no .env
cat .env | grep SONARQUBE_TOKEN

# Teste a conexão manualmente
curl -u "seu_token:" https://sonarcloud.io/api/authentication/validate
```

**Resposta esperada**: `{"valid":true}`

### Java não encontrado

```bash
# Verificar Java (mínimo: Java 11)
java -version

# Java instalado via SDKMAN em:
# /usr/local/sdkman/candidates/java/current

# Ver versões disponíveis
sdk list java
```

### SonarLint não aparece no VS Code

**A extensão já está instalada!** (v4.35.1)

1. **Recarregue** o VS Code: `Ctrl+Shift+P` → `Developer: Reload Window`
2. **Aguarde** a inicialização do SonarLint (veja no status bar)
3. **Verifique** os comandos: `Ctrl+Shift+P` → digite `SonarLint`
4. **Se não funcionar**, veja: `cat SONARQUBE_TROUBLESHOOTING.md`

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

```bash
cat SONARQUBE_MCP_SETUP.md
```

---

## ✨ Pronto!

Após configurar o token e reiniciar o VS Code, a extensão SonarQube estará **100% funcional** e analisando seu código automaticamente! 🎉

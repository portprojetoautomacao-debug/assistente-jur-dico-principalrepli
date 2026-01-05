# 🔐 Guia de Conexão SSH - Replit → VS Code/Cursor

**Data:** 04 de Janeiro de 2026
**App:** Assistente Jurídico PJe (Replit)

---

## 🎯 Opções de Conexão

### 1️⃣ One-Click Setup (Recomendado)

#### VS Code
```
✅ Clique em "Connect to VS Code"
↓
Abrirá VS Code automaticamente
↓
Configurará SSH keys automaticamente
↓
Conectará ao workspace do Replit
```

#### Cursor
```
✅ Clique em "Connect to Cursor"
↓
Abrirá Cursor automaticamente
↓
Configurará SSH keys automaticamente
↓
Conectará ao workspace do Replit
```

---

### 2️⃣ Conexão Manual (CLI)

#### Windows (PowerShell/CMD)
```powershell
ssh -i %HOMEPATH%/.ssh/replit -p 22 3d18fe18-49cb-4d5c-b908-0599fc01a62c@3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev
```

#### Linux/MacOS (Bash)
```bash
ssh -i ~/.ssh/replit -p 22 3d18fe18-49cb-4d5c-b908-0599fc01a62c@3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev
```

---

## ⚙️ Configuração Manual do VS Code

### 1. Instalar Remote-SSH Extension
```
Extensão: ms-vscode-remote.remote-ssh
```

### 2. Adicionar Host ao SSH Config

**Windows:** `%HOMEPATH%\.ssh\config`
**Linux/Mac:** `~/.ssh/config`

```ssh-config
Host replit-assistente-juridico
    HostName 3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev
    User 3d18fe18-49cb-4d5c-b908-0599fc01a62c
    Port 22
    IdentityFile ~/.ssh/replit
    StrictHostKeyChecking no
    UserKnownHostsFile=/dev/null
    ServerAliveInterval 60
    ServerAliveCountMax 10
```

### 3. Conectar via Command Palette
```
Ctrl+Shift+P (ou Cmd+Shift+P no Mac)
→ Remote-SSH: Connect to Host
→ Selecionar "replit-assistente-juridico"
```

---

## 🔑 Gerar SSH Key (Se Necessário)

### Windows (PowerShell)
```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\replit -C "replit-assistente-juridico"
```

### Linux/MacOS
```bash
ssh-keygen -t ed25519 -f ~/.ssh/replit -C "replit-assistente-juridico"
```

### Adicionar ao Replit
```
1. Copie o conteúdo de ~/.ssh/replit.pub
2. No Replit: Settings → SSH Keys → Add Key
3. Cole a chave pública
```

---

## ✅ Vantagens da Conexão SSH

### 🚀 Performance
- **Edição Local:** VS Code roda na sua máquina
- **Execução Remota:** Código roda no container Replit
- **Sem Lag:** Interface responsiva mesmo com internet lenta

### 🛠️ Ferramentas
- **Extensions Completas:** Todas as extensões do VS Code funcionam
- **Terminal Integrado:** Acesso direto ao shell do Replit
- **Git Nativo:** Comandos git funcionam normalmente

### 🔒 Segurança
- **Chave SSH:** Autenticação criptografada
- **Sessão Persistente:** Reconexão automática
- **Sem Senha:** Login automático após configuração

---

## 🧪 Testar Conexão

### 1. Teste Básico
```bash
ssh -i ~/.ssh/replit -p 22 3d18fe18-49cb-4d5c-b908-0599fc01a62c@3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev "echo 'Conexão OK'"
```

Resposta esperada:
```
Conexão OK
```

### 2. Verificar Workspace
```bash
ssh -i ~/.ssh/replit -p 22 3d18fe18-49cb-4d5c-b908-0599fc01a62c@3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev "ls -la /home/runner/"
```

### 3. Testar Backend
```bash
ssh -i ~/.ssh/replit -p 22 3d18fe18-49cb-4d5c-b908-0599fc01a62c@3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev "curl -s http://localhost:3001/health"
```

---

## 🔧 Troubleshooting

### Erro: "Permission denied (publickey)"
```bash
# Verificar se a chave existe
ls -l ~/.ssh/replit

# Verificar permissões (deve ser 600)
chmod 600 ~/.ssh/replit

# Testar com verbose
ssh -v -i ~/.ssh/replit -p 22 [...]
```

### Erro: "Connection refused"
```
✅ Verifique se o Replit está rodando
✅ Confirme que SSH está habilitado no Replit
✅ Tente reconectar após 30 segundos
```

### Erro: "Host key verification failed"
```bash
# Limpar host key antigo
ssh-keygen -R 3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev

# Ou adicionar ao config:
# StrictHostKeyChecking no
```

---

## 📋 Workflow Recomendado

### Desenvolvimento Híbrido: Local + Remoto

```
┌─────────────────┐
│  VS Code Local  │  ← Você trabalha aqui
└────────┬────────┘
         │ SSH
         ▼
┌─────────────────┐
│ Replit Container│  ← Código executa aqui
│  - PostgreSQL   │
│  - Node.js      │
│  - Python       │
└─────────────────┘
```

### Comandos Úteis no Terminal SSH

```bash
# Ver processos rodando
ps aux | grep node

# Verificar portas
lsof -i :3001 -i :5000

# Logs do backend
tail -f backend/backend.log

# Reiniciar aplicação
npm run kill && npm run dev

# Build de produção
npm run build:deploy && npm run start:production
```

---

## 🎯 Comparação: Web IDE vs SSH

| Recurso | Replit Web IDE | VS Code via SSH |
|---------|----------------|----------------|
| **Velocidade** | 🐌 Depende da internet | ⚡ Interface local |
| **Extensions** | ⚠️ Limitadas | ✅ Todas disponíveis |
| **Copilot** | ✅ Funciona | ✅ Funciona melhor |
| **Terminal** | ✅ Integrado | ✅ Integrado |
| **Git** | ✅ Interface web | ✅ CLI completo |
| **Debugger** | ⚠️ Limitado | ✅ Completo |
| **Multi-cursor** | ❌ Não suporta | ✅ Suporta |
| **Offline** | ❌ Não funciona | ⚠️ Precisa conectar |

---

## 💡 Dicas Avançadas

### 1. Port Forwarding
Acesse serviços remotos localmente:
```bash
ssh -i ~/.ssh/replit -p 22 -L 3001:localhost:3001 [host] -N
```
Agora `http://localhost:3001` no seu navegador acessa o backend do Replit.

### 2. Manter Conexão Ativa
Adicione ao `~/.ssh/config`:
```
ServerAliveInterval 60
ServerAliveCountMax 10
TCPKeepAlive yes
```

### 3. Alias para Conexão Rápida
**Windows (PowerShell Profile):**
```powershell
function Connect-Replit {
    ssh -i $env:USERPROFILE\.ssh\replit -p 22 3d18fe18-49cb-4d5c-b908-0599fc01a62c@3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev
}
Set-Alias replit Connect-Replit
```

**Linux/Mac (~/.bashrc ou ~/.zshrc):**
```bash
alias replit='ssh -i ~/.ssh/replit -p 22 3d18fe18-49cb-4d5c-b908-0599fc01a62c@3d18fe18-49cb-4d5c-b908-0599fc01a62c-00-39tn00ki6b5vd.picard.replit.dev'
```

Agora basta digitar `replit` para conectar!

---

## ✅ Checklist de Configuração

- [ ] Extensão Remote-SSH instalada no VS Code
- [ ] Chave SSH gerada (`~/.ssh/replit`)
- [ ] Config SSH criado (`~/.ssh/config`)
- [ ] Teste de conexão bem-sucedido
- [ ] Workspace aberto no VS Code
- [ ] Terminal integrado funcionando
- [ ] Extensões sincronizadas

---

## 🚀 Próximos Passos

1. **Conecte via One-Click** (mais fácil) ou configure manualmente
2. **Abra o workspace** no VS Code remoto
3. **Execute os testes** dos notebooks via terminal SSH
4. **Deploy** usando `npm run build:deploy && npm run start:production`

**Resultado:** Você terá o melhor dos dois mundos - a potência do Replit com a interface do VS Code local!

---

**Importante:** O hostname do Replit pode mudar se você reiniciar o App. Verifique sempre a URL SSH mais recente no painel do Replit.

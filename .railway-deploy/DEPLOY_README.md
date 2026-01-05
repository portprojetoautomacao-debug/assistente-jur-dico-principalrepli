# ?? Deploy Local - Assistente Jurídico PJe

## Como Fazer Deploy Local

### Opção 1: Script Automático (Recomendado)

#### Windows PowerShell (Mais completo)
```powershell
# Execute no PowerShell (como Administrador se necessário)
.\deploy-local.ps1
```

#### Windows CMD (Mais simples)
```cmd
# Execute no Prompt de Comando
deploy-local.bat
```

### Opção 2: Passo a Passo Manual

Se preferir fazer manualmente:

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Edite o arquivo .env com suas chaves API

# 3. Testar build
npm run build

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

## ?? Pré-requisitos

- ? **Node.js 22.x** (obrigatório)
- ? **npm** (vem com Node.js)
- ? **Credenciais API** (Gemini + Upstash Redis)

## ?? Configuração Inicial

### 1. Obter Chaves API

#### Gemini AI (Obrigatório)
1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma nova chave API
3. Copie a chave

#### Upstash Redis (Obrigatório)
1. Acesse: https://upstash.com/
2. Crie conta gratuita
3. Crie um banco Redis
4. Copie URL e Token

#### Google OAuth (Opcional)
1. Acesse: https://console.cloud.google.com/
2. Crie projeto ou use existente
3. Configure OAuth 2.0
4. Configure credenciais

### 2. Configurar .env

Edite o arquivo `.env` na raiz do projeto:

```env
# === OBRIGATÓRIAS ===
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
UPSTASH_REDIS_REST_URL=https://sua-instancia.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_aqui

# === OPCIONAIS ===
VITE_GOOGLE_CLIENT_ID=seu_client_id_google
VITE_GOOGLE_API_KEY=sua_api_key_google
VITE_SENTRY_DSN=seu_dsn_sentry

# === AMBIENTE ===
VITE_APP_ENV=development
```

## ?? Acessar o Sistema

Após executar o deploy:

- **Aplicação**: http://localhost:5173
- **API Health**: http://localhost:5173/api/health
- **Preview Build**: http://localhost:4173 (use `npm run preview`)

## ??? Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build

# Qualidade
npm run lint         # Verificar código
npm run test         # Executar testes
npm run type-check   # Verificar tipos TypeScript

# Utilitários
npm run clean        # Limpar builds
npm run format       # Formatar código
```

## ?? Verificar se Está Funcionando

### 1. Página Inicial
- Acesse http://localhost:5173
- Deve carregar sem erros

### 2. API Health
```bash
curl http://localhost:5173/api/health
# Deve retornar: {"status":"ok"}
```

### 3. Testes
```bash
npm run test
# Deve passar todos os testes
```

## ?? Problemas Comuns

### "Node.js não encontrado"
- Instale Node.js 22.x de https://nodejs.org/
- Reinicie o terminal/PowerShell

### "Build falha"
- Verifique se todas as dependências foram instaladas
- Execute `npm install` novamente

### "API não responde"
- Verifique se o servidor está rodando
- Use `npm run dev` para iniciar

### "Credenciais inválidas"
- Verifique o arquivo `.env`
- Certifique-se que as chaves API estão corretas

## ?? Suporte

- **Documentação completa**: `README.md`
- **Guia de deploy**: `DEPLOY_LOCAL.md`
- **Troubleshooting**: `BUILD_GUIDE.md`

---

**?? Deploy concluído! O sistema está rodando localmente.**
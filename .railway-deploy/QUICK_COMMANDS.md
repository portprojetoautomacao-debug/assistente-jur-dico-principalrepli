# ? Comandos Rápidos - Build & Deploy

## ?? Executar Build Completo

```powershell
# PowerShell - Build completo com testes
.\build-and-preview.ps1

# Ou se preferir pular testes
.\build-and-preview.ps1 -SkipTests
```

```cmd
:: Batch/CMD - Build completo
build-and-preview.bat
```

---

## ?? Comandos Individuais (npm)

### Instalar Dependências
```bash
npm install
```

### Build de Produção
```bash
npm run build
```

### Executar Testes
```bash
# Todos os testes
npm run test:run

# Com cobertura
npm run test:coverage

# Apenas PII filtering
npm run test pii-filtering

# Modo watch (desenvolvimento)
npm run test
```

### Preview Local
```bash
npm run preview
# Acesse: http://localhost:4173
```

### Lint
```bash
# Verificar código
npm run lint

# Auto-fix
npm run lint -- --fix
```

### Desenvolvimento
```bash
# Servidor dev com hot reload
npm run dev
# Acesse: http://localhost:5173
```

---

## ?? Deploy para Vercel

### Deploy Automático (Git)
```bash
git add .
git commit -m "feat: v1.4.0 - LGPD Compliance"
git tag v1.4.0
git push origin v1.4.0
git push origin main
```

### Deploy Manual (Vercel CLI)
```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Preview
vercel

# Produção
vercel --prod
```

---

## ?? Verificações

### Verificar Versões
```bash
node --version    # Deve ser 22.x
npm --version     # Deve ser 10.x
```

### Verificar Bundle Size
```bash
# Após build
cd dist/assets
dir                        # Windows
ls -lh                     # Linux/Mac
```

### Verificar Erros TypeScript
```bash
# Type check sem build
npx tsc --noEmit
```

### Verificar Sentry
```bash
# Testar DSN
curl https://sentry.io/api/0/
```

---

## ?? Debug

### Limpar Cache
```bash
# Remover node_modules e dist
rm -rf node_modules dist

# Reinstalar
npm install
npm run build
```

### Verificar Dependências
```bash
# Listar dependências
npm list

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix
```

### Ver Logs Detalhados
```bash
# Build com verbose
npm run build -- --verbose

# Testes com verbose
npm run test:run -- --reporter=verbose
```

---

## ?? Variáveis de Ambiente

### Criar .env local (desenvolvimento)
```bash
# Copiar template
cp .env.example .env

# Editar
notepad .env
```

### Variáveis Obrigatórias
```env
VITE_GEMINI_API_KEY=your-key-here
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_APP_VERSION=1.4.0
VITE_ENABLE_PII_FILTERING=true
```

---

## ?? Testes Específicos

### Testar PII Filtering
```bash
npm run test pii-filtering
```

### Testar Schemas Zod
```bash
npm run test schema
```

### Testar Agentes IA
```bash
npm run test agents
```

### Testar Hooks
```bash
npm run test hooks
```

---

## ?? Análise de Código

### SonarCloud (se configurado)
```bash
# Análise local
npm run sonar
```

### Bundle Analyzer
```bash
# Gerar relatório
npm run build -- --report

# Abrir visualizador
npx vite-bundle-visualizer
```

---

## ?? Monitoramento

### Verificar Status da API
```bash
# Health check
curl https://seu-app.vercel.app/api/health

# Status do sistema
curl https://seu-app.vercel.app/api/status
```

### Verificar Sentry
```bash
# Enviar teste de erro
curl -X POST https://seu-app.vercel.app/api/test-sentry
```

---

## ?? Solução Rápida de Problemas

### Erro: "npm não encontrado"
```powershell
# Verificar se Node.js está instalado
node --version

# Se não estiver, baixe de: https://nodejs.org/
```

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Build failed"
```bash
# Limpar cache e rebuildar
npm run clean
npm run build
```

### Erro: "Tests failed"
```bash
# Ver detalhes dos testes
npm run test:run -- --reporter=verbose

# Executar teste específico
npm run test -- src/services/__tests__/pii-filtering.test.ts
```

---

**?? Documentação Completa:** `BUILD_GUIDE.md`

**? Versão:** 1.4.0 - LGPD Compliance  
**?? Data:** 08/12/2025

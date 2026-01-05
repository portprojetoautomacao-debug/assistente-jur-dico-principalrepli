# ?? Guia Rápido - Build e Deploy Local

## ? Execução Rápida

### PowerShell (Recomendado)

```powershell
# Executar build completo + testes + preview
.\build-and-preview.ps1

# Pular instalação de dependências (se já instalou)
.\build-and-preview.ps1 -SkipInstall

# Pular testes (build + preview apenas)
.\build-and-preview.ps1 -SkipTests

# Pular instalação E testes
.\build-and-preview.ps1 -SkipInstall -SkipTests
```

### Batch (Alternativa)

```cmd
build-and-preview.bat
```

---

## ?? O Que os Scripts Fazem

### Passo 1: Verificação de Ambiente
- ? Detecta Node.js e npm (local ou global)
- ? Exibe versões instaladas
- ? Valida se todas as ferramentas estão disponíveis

### Passo 2: Instalação de Dependências
- ? Executa `npm install`
- ? Instala todas as dependências do `package.json`
- ?? Pode ser pulado com `-SkipInstall`

### Passo 3: Build de Produção
- ? Executa `npm run build`
- ? Compila TypeScript para JavaScript
- ? Otimiza e minifica código
- ? Gera bundle final em `dist/`
- ? Verifica tamanho do bundle

### Passo 4: Testes Unitários
- ? Executa `npm run test:run`
- ? Roda todos os testes (incluindo PII filtering)
- ? Exibe relatório de aprovação/falha
- ?? Pode ser pulado com `-SkipTests`
- ?? Se falhar, pergunta se deseja continuar

### Passo 5: Preview Local
- ? Executa `npm run preview`
- ? Inicia servidor local em `http://localhost:4173`
- ? Abre navegador automaticamente (PowerShell)
- ? Permite testar build de produção localmente
- ?? Pressione `Ctrl+C` para parar

---

## ?? Troubleshooting

### Erro: "npm não encontrado"

**Solução 1 - Instalar Node.js:**
1. Baixe Node.js 22.x de: https://nodejs.org/
2. Instale com opções padrão
3. Reinicie o terminal
4. Execute o script novamente

**Solução 2 - Usar npm local do repositório:**
```powershell
# Se você já tem node_modules/
.\node_modules\.bin\npm.cmd install
.\build-and-preview.ps1
```

### Erro: "Falha ao executar script PowerShell"

**Causa:** Política de execução do Windows

**Solução:**
```powershell
# Permitir execução temporária (apenas para esta sessão)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Executar script
.\build-and-preview.ps1
```

### Erro: "Build falhou com erros TypeScript"

**Causa:** Erros de compilação no código

**Solução:**
1. Leia os erros exibidos no terminal
2. Corrija os arquivos indicados
3. Execute o build novamente

### Erro: "Alguns testes falharam"

**Opções:**

1. **Investigar falhas:**
   ```powershell
   npm run test:run
   ```
   Leia os erros e corrija os testes

2. **Continuar mesmo assim:**
   - O script perguntará se deseja continuar
   - Digite `S` e pressione Enter
   - **?? Não recomendado para produção**

3. **Pular testes:**
   ```powershell
   .\build-and-preview.ps1 -SkipTests
   ```

---

## ?? Verificações Pós-Build

Após build bem-sucedido, verifique:

### ? Arquivos Gerados

```
dist/
??? assets/
?   ??? index-[hash].js       # Bundle principal
?   ??? vendor-[hash].js      # Dependências
?   ??? *.css                 # Estilos
??? index.html                # HTML principal
??? ...
```

### ? Tamanho do Bundle

**Targets recomendados:**
- `index-[hash].js` < 500 KB
- `vendor-[hash].js` < 1 MB
- Total < 2 MB

**Se exceder:**
- Revisar code splitting
- Verificar dependências grandes
- Considerar lazy loading

### ? Testes

**Verificar:**
- ? Todos os 50+ testes de PII filtering passando
- ? Testes de schemas Zod passando
- ? Sem erros TypeScript

**Executar manualmente:**
```powershell
npm run test:run           # Todos os testes
npm run test:coverage      # Com cobertura
npm run test pii-filtering # Apenas PII
```

---

## ?? Testando o Preview Local

### 1. Acesse http://localhost:4173

### 2. Verifique Funcionalidades

- ? Login/Autenticação
- ? Dashboard carrega corretamente
- ? Harvey Specter chat funciona
- ? Processos são exibidos
- ? Minutas funcionam
- ? Sem erros no console (F12)

### 3. Teste PII Filtering (Opcional)

```javascript
// Abra console (F12) e execute:
import { sanitizePII } from './services/pii-filtering.js';

const texto = "Cliente João Silva, CPF 123.456.789-01";
console.log(sanitizePII(texto));
// Deve exibir: "Cliente João Silva, CPF [CPF_REDACTED]"
```

### 4. Lighthouse (Opcional)

1. Abra DevTools (F12)
2. Aba "Lighthouse"
3. Gere relatório
4. Verifique scores:
   - Performance > 90
   - Accessibility > 95
   - Best Practices > 90

---

## ?? Deploy para Vercel

Após validar o preview local com sucesso:

### Opção 1: Via Git (Automático)

```bash
git add .
git commit -m "feat: v1.4.0 - LGPD Compliance + PII Filtering"
git tag v1.4.0
git push origin v1.4.0
git push origin main
```

### Opção 2: Via Vercel CLI

```bash
# Instalar Vercel CLI (se necessário)
npm i -g vercel

# Login
vercel login

# Deploy em preview
vercel

# Deploy em produção
vercel --prod
```

### Configurar Variáveis de Ambiente

No Vercel Dashboard:

```env
VITE_GEMINI_API_KEY=your-key
VITE_SENTRY_DSN=your-dsn
VITE_APP_VERSION=1.4.0
VITE_ENABLE_PII_FILTERING=true  # ?? OBRIGATÓRIO
```

---

## ?? Logs e Debug

### Ver logs do build

```powershell
# Último build
npm run build > build.log 2>&1

# Ver log
cat build.log
```

### Ver logs dos testes

```powershell
# Executar com verbose
npm run test:run -- --reporter=verbose

# Salvar em arquivo
npm run test:run > tests.log 2>&1
```

### Debug de bundle size

```powershell
# Análise de bundle
npm run build -- --report

# Abre visualizador interativo
```

---

## ?? Checklist Final

Antes de fazer deploy para produção:

- [ ] Build local passou sem erros
- [ ] Todos os testes passaram
- [ ] Preview local funcionando corretamente
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] `VITE_ENABLE_PII_FILTERING=true` confirmado
- [ ] Lighthouse scores > 90
- [ ] Sem erros no console do navegador
- [ ] Documentação atualizada (README.md)

---

## ?? Suporte

Se encontrar problemas:

1. **Leia os erros** exibidos no terminal
2. **Consulte documentação**:
   - `docs/DEPLOY_CHECKLIST_v1.4.0.md`
   - `docs/LGPD_COMPLIANCE.md`
3. **Verifique logs**:
   - `build.log`
   - `tests.log`
4. **Issues conhecidos**:
   - Veja seção "Troubleshooting" deste guia

---

**? Boa sorte com o build e deploy!**

**Versão:** 1.4.0 - LGPD Compliance  
**Data:** 08/12/2025

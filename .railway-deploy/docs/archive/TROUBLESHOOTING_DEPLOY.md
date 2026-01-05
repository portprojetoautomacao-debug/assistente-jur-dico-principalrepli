# 🔧 Troubleshooting - Deploy no Vercel

## 🎯 Guia Rápido de Solução de Problemas

Este documento lista os problemas mais comuns durante deploy no Vercel e suas soluções.

---

## ❌ Erro: "Build Failed"

### Sintomas
```
Error: Build failed with exit code 1
```

### Possíveis Causas e Soluções

#### 1. Erro de TypeScript

**Verificar**:
```bash
npm run build
```

**Solução**: Corrija os erros de TypeScript mostrados no output.

#### 2. Dependências Faltando

**Verificar**:
```bash
npm install
npm run build
```

**Solução**: Se funcionar localmente, certifique-se de que `package-lock.json` está commitado:
```bash
git add package-lock.json
git commit -m "chore: add package-lock.json"
git push
```

#### 3. Variável de Ambiente Faltando no Build

**Solução**: Adicione a variável no Vercel:
1. Dashboard → Projeto → Settings → Environment Variables
2. Adicione a variável necessária
3. Marque "Production", "Preview" e "Development"
4. Redeploy

---

## ❌ Erro 403 Forbidden

### Sintomas
```
GET /_spark/kv/... 403 Forbidden
POST /_spark/... 403 Forbidden
```

### Causa
Variáveis de ambiente do GitHub Spark não configuradas.

### Solução

1. Obtenha o Runtime ID:
```bash
cat runtime.config.json
# Retorna: {"app": "97a1cb1e48835e0ecf1e"}
```

2. Crie um GitHub Token:
   - Acesse: https://github.com/settings/tokens
   - "Generate new token (classic)"
   - Scopes: `repo` + `workflow`
   - Copie o token (ghp_...)

3. Configure no Vercel:
   - Dashboard → Settings → Environment Variables
   - Adicione:
     ```
     GITHUB_RUNTIME_PERMANENT_NAME = 97a1cb1e48835e0ecf1e
     GITHUB_TOKEN = ghp_seu_token_aqui
     ```
   - Marque todos os ambientes

4. Redeploy:
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

## ❌ Erro 500 Internal Server Error

### Sintomas
```
500 Internal Server Error
```

### Causas Comuns

#### 1. Erro na API Serverless

**Verificar logs**:
1. Vercel Dashboard → Deployments → Seu deploy
2. Clique em "View Function Logs"
3. Procure por stack traces

**Solução**: Corrija o código da função com erro (geralmente em `/api/*`)

#### 2. Timeout da Função

**Solução**: Otimize a função ou aumente o timeout (planos pagos)

---

## ❌ Erro: "Module not found"

### Sintomas
```
Error: Cannot find module '...'
```

### Solução 1: Reinstalar Dependências

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
git add package-lock.json
git commit -m "fix: reinstall dependencies"
git push
```

### Solução 2: Verificar Import Paths

Certifique-se de usar caminhos corretos:
```typescript
// ✅ Correto
import { Button } from '@/components/ui/button'

// ❌ Errado (pode funcionar localmente mas não no Vercel)
import { Button } from '../../components/ui/button'
```

---

## ❌ Erro: "Node version not supported"

### Sintomas
```
Error: The engine "node" is incompatible with this module
```

### Solução

1. Verifique `package.json`:
```json
{
  "engines": {
    "node": "20.x",
    "npm": ">=10.0.0"
  }
}
```

2. Se necessário, atualize localmente:
```bash
nvm install 20
nvm use 20
```

---

## ❌ Erro: Página em branco em produção

### Sintomas
- Build completa com sucesso
- Mas a página carrega em branco
- Console mostra erros JavaScript

### Causas Comuns

#### 1. Caminho de Assets Incorreto

**Verificar**: Console do navegador mostra 404 para arquivos JS/CSS

**Solução**: Verifique `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/',  // Para Vercel, usar sempre '/'
})
```

#### 2. Variáveis de Ambiente Faltando

**Verificar**: Console mostra `undefined` para `import.meta.env.VITE_*`

**Solução**: Configure as variáveis `VITE_*` no Vercel

---

## ❌ Erro: CORS / Mixed Content

### Sintomas
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

### Solução

Adicione headers CORS no `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" }
      ]
    }
  ]
}
```

---

## ⚠️ Aviso: "X packages are looking for funding"

### É um Erro?
**Não!** É apenas informativo.

### O que fazer?
Nada - pode ignorar com segurança.

---

## ⚠️ Aviso: "Node.js Version Warning"

### Mensagem
```
Warning: Due to "engines": { "node": "20.x" } in your package.json file,
the Node.js Version defined in your Project Settings ("22.x") will not apply
```

### É um Erro?
**Não!** Comportamento esperado e correto.

### Explicação
O Vercel está respeitando a versão definida em `package.json`, que tem precedência sobre as configurações do projeto.

### O que fazer?
Nada - está funcionando corretamente.

---

## ⚠️ Aviso: "Vulnerabilities found"

### Sintomas
```
3 high severity vulnerabilities
To address all issues, run: npm audit fix
```

### Verificar se é Real

```bash
npm audit
```

Se mostrar 0 vulnerabilities, pode ignorar o aviso do deploy (as vulnerabilidades já foram corrigidas).

### Se Houver Vulnerabilidades Reais

```bash
# Tentar fix automático
npm audit fix

# Se não resolver, tentar com --force (cuidado!)
npm audit fix --force

# Commitar mudanças
git add package-lock.json
git commit -m "fix: resolve security vulnerabilities"
git push
```

---

## 🔍 Comandos de Diagnóstico

### Verificar Tudo de Uma Vez
```bash
./verificar-deploy.sh
```

### Build Local
```bash
npm run build
```

### Limpar e Rebuild
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Verificar Vulnerabilidades
```bash
npm audit
```

### Testar Localmente
```bash
npm run build
npm run preview
```

### Verificar Logs do Vercel
```bash
vercel logs <deployment-url>
```

---

## 📋 Checklist de Diagnóstico

Quando algo der errado, verifique em ordem:

- [ ] `npm run build` funciona localmente?
- [ ] `package-lock.json` está commitado?
- [ ] `.env` está no `.gitignore`?
- [ ] Variáveis de ambiente estão no Vercel?
- [ ] `vercel.json` está correto?
- [ ] Não há erros de TypeScript?
- [ ] Dependências estão atualizadas?
- [ ] Logs do Vercel mostram o erro exato?

---

## 🆘 Ainda com Problemas?

### 1. Verifique os Logs Detalhados

Vercel Dashboard → Deployments → Seu deploy → Function Logs

### 2. Compare com Deployments Anteriores

Se funcionava antes:
1. Veja o diff entre os commits
2. Identifique o que mudou
3. Reverta se necessário

### 3. Use o Script de Verificação

```bash
chmod +x verificar-deploy.sh
./verificar-deploy.sh
```

Ele vai identificar 90% dos problemas automaticamente.

### 4. Consulte a Documentação

- [GUIA_DEPLOY_VERCEL_COMPLETO.md](./GUIA_DEPLOY_VERCEL_COMPLETO.md)
- [DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md)
- [Vercel Docs](https://vercel.com/docs)

---

## 📞 Suporte

### Vercel Support
- https://vercel.com/support

### GitHub Issues
- https://github.com/seu-usuario/seu-repo/issues

---

**Última atualização**: 18 de Novembro de 2024  
**Versão**: 1.0

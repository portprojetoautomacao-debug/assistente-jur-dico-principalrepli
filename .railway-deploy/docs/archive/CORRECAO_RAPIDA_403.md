# ⚠️ LEIA ISTO PRIMEIRO - Solução para Erros 403

## 🎯 Problema

Você está vendo estes erros no console do navegador e nos logs do Vercel:

```
Uncaught (in promise) Error: Failed to set key
Uncaught (in promise) Error: Failed to fetch KV key
GET /_spark/kv/autonomous-agents 403 Forbidden
POST /_spark/kv/agent-task-queue 403 Forbidden
```

## ✅ Solução Simples (3 Passos)

### Passo 1: Configure as Variáveis de Ambiente no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione estas 2 variáveis obrigatórias:

#### Variável 1: GITHUB_RUNTIME_PERMANENT_NAME
```
Nome: GITHUB_RUNTIME_PERMANENT_NAME
Valor: 97a1cb1e48835e0ecf1e
Ambientes: ✅ Production ✅ Preview ✅ Development
```

#### Variável 2: GITHUB_TOKEN
```
Nome: GITHUB_TOKEN
Valor: SEU_TOKEN_DO_GITHUB (veja instruções abaixo)
Ambientes: ✅ Production ✅ Preview ✅ Development
```

**Como criar o GITHUB_TOKEN:**

1. Acesse: https://github.com/settings/tokens
2. Clique em **Generate new token** → **Generate new token (classic)**
3. Nome: "Vercel Assistente Jurídico"
4. Selecione os scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Clique em **Generate token**
6. **COPIE O TOKEN AGORA** (só aparece uma vez!)
7. Cole no Vercel como valor de `GITHUB_TOKEN`

### Passo 2: Fazer Redeploy

Depois de adicionar as variáveis:

**Opção A - Via Git (Recomendado):**
```bash
git commit --allow-empty -m "chore: redeploy com env vars"
git push
```

**Opção B - Via Vercel Dashboard:**
1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**

### Passo 3: Verificar

1. Aguarde 2-3 minutos do deploy completar
2. Acesse sua aplicação
3. Abra DevTools (F12) → Console
4. **Não deve haver mais erros 403!** ✅

## 📋 Checklist Rápido

- [ ] Token do GitHub criado com permissões `repo` e `workflow`
- [ ] Variável `GITHUB_TOKEN` adicionada no Vercel
- [ ] Variável `GITHUB_RUNTIME_PERMANENT_NAME` adicionada no Vercel
- [ ] Ambas marcadas para Production, Preview e Development
- [ ] Redeploy realizado
- [ ] Aplicação testada - sem erros 403 ✅

## 🔍 Por Que Isso Acontece?

- Os erros 403 significam que o Vercel não consegue autenticar com a API do GitHub
- Sem o `GITHUB_TOKEN`, as requisições para o Spark KV (armazenamento) falham
- O token é necessário para acessar o GitHub Runtime API

## 🆘 Ainda com Problemas?

Se mesmo após seguir esses passos você ainda vê erros 403:

1. **Verifique se o token tem as permissões corretas:**
   - Vá em https://github.com/settings/tokens
   - Clique no token criado
   - Confirme que `repo` e `workflow` estão marcados

2. **Verifique se as variáveis foram aplicadas:**
   ```bash
   # Via Vercel CLI (se tiver instalado)
   vercel env ls
   ```

3. **Force um novo deploy:**
   ```bash
   git commit --allow-empty -m "force redeploy"
   git push
   ```

## 📚 Documentação Detalhada

Para instruções mais detalhadas, consulte:
- [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) - Guia completo passo a passo
- [SPARK_FIX_GUIDE.md](./SPARK_FIX_GUIDE.md) - Informações técnicas sobre o Spark
- [.env.example](./.env.example) - Exemplo de todas as variáveis de ambiente

## ⏱️ Tempo Estimado

- Criar token do GitHub: **2 minutos**
- Configurar variáveis no Vercel: **3 minutos**
- Redeploy e teste: **5 minutos**
- **Total: ~10 minutos**

---

**🎉 Após seguir esses passos, sua aplicação estará 100% funcional sem erros 403!**

**Última atualização**: 18 de Novembro de 2024

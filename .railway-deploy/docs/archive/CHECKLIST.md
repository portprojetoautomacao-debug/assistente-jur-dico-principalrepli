# ✅ Checklist de Correção - 74 Conflitos

Use este checklist para garantir que todos os passos foram executados corretamente.

---

## 📋 Pré-Requisitos

- [ ] Você tem Node.js >= 18.0.0 instalado
  ```bash
  node --version
  ```

- [ ] Você tem npm >= 9.0.0 instalado
  ```bash
  npm --version
  ```

- [ ] Você está no diretório raiz do projeto
  ```bash
  pwd  # Deve mostrar .../assistente-juridico-p ou .../spark-template
  ```

---

## 🔧 Aplicar Correção

Escolha UMA das opções abaixo:

### Opção A: Comandos Manuais (Mais Rápido)

- [ ] Executar: `rm package-lock.json`
- [ ] Executar: `npm install`
- [ ] Executar: `npm run build`
- [ ] Build completou sem erros

### Opção B: Script Automatizado (Mais Seguro)

- [ ] Executar: `chmod +x fix-merge-conflicts.sh`
- [ ] Executar: `./fix-merge-conflicts.sh`
- [ ] Script completou com sucesso
- [ ] Backup criado: `package-lock.json.backup`

### Opção C: Via GitHub Web

- [ ] Acessar PR #21 no GitHub
- [ ] Clicar em "Resolve conflicts"
- [ ] Aceitar qualquer versão do package-lock.json
- [ ] Marcar como resolvido
- [ ] Executar localmente: `rm package-lock.json && npm install`

---

## ✅ Verificação

### Teste 1: Instalação OK

- [ ] Executar: `npm ls --depth=0`
- [ ] Nenhum erro crítico (avisos são OK)

### Teste 2: Build OK

- [ ] Executar: `npm run build`
- [ ] Build completa sem erros
- [ ] Pasta `dist/` foi criada

### Teste 3: Dev Server OK

- [ ] Executar: `npm run dev`
- [ ] Servidor inicia sem erros
- [ ] Mensagem mostra: `Local: http://localhost:5000/`

### Teste 4: Aplicação Funciona

- [ ] Abrir navegador em http://localhost:5000
- [ ] Página carrega sem erros
- [ ] Console do navegador não mostra erros

### Teste 5: Select Component OK

- [ ] Fazer login na aplicação
- [ ] Navegar para página "Minutas"
- [ ] Clicar em "Nova Minuta"
- [ ] Abrir campo "Processo (opcional)"
- [ ] Selecionar "Nenhum" - sem erros
- [ ] Console do navegador não mostra erro do Select

---

## 💾 Commit e Push

- [ ] Verificar mudanças: `git status`
- [ ] Ver diff: `git diff src/components/MinutasManager.tsx`
- [ ] Adicionar arquivos: `git add package-lock.json src/components/MinutasManager.tsx`
- [ ] Commit: `git commit -m "fix: resolve 74 package-lock.json conflicts and Select component bug"`
- [ ] Push: `git push`
- [ ] Verificar no GitHub que o commit foi enviado

---

## 🎯 Verificação Final

### No GitHub

- [ ] PR #21 não mostra mais conflitos
- [ ] Build do CI/CD está passando (se houver)
- [ ] Checks estão verdes

### Localmente

- [ ] Nenhum arquivo conflitado: `git status`
- [ ] Build funciona: `npm run build`
- [ ] Aplicação roda: `npm run dev`

---

## 📁 Arquivos para Commit

Certifique-se de que estes arquivos foram modificados/criados:

**Modificados:**
- [ ] `package-lock.json` (regenerado)
- [ ] `src/components/MinutasManager.tsx` (linha 318)
- [ ] `README.md` (nota adicionada)

**Criados (documentação):**
- [ ] `FIX_MERGE_CONFLICTS.md`
- [ ] `fix-merge-conflicts.sh`
- [ ] `CORRECOES_CONFLITOS_74.md`
- [ ] `LEIA-ME-PRIMEIRO.md`
- [ ] `SOLUCAO-RAPIDA.txt`
- [ ] `CHECKLIST.md` (este arquivo)

---

## 🐛 Se Algo Deu Errado

### Build falhou

- [ ] Limpar tudo: `rm -rf node_modules .vite dist package-lock.json`
- [ ] Reinstalar: `npm install`
- [ ] Tentar build: `npm run build`

### Ainda há conflitos Git

- [ ] Verificar status: `git status`
- [ ] Ver arquivos conflitados: `git diff --name-only --diff-filter=U`
- [ ] Aceitar versão: `git checkout --ours package-lock.json` ou `git checkout --theirs package-lock.json`
- [ ] Deletar e regenerar: `rm package-lock.json && npm install`

### Erro do Select ainda aparece

- [ ] Verificar arquivo: `cat src/components/MinutasManager.tsx | grep -A2 "onValueChange"`
- [ ] Linha 318 deve ser: `onValueChange={(value) => setFormData({ ...formData, processId: value })}`
- [ ] NÃO deve ter: `value === '_none' ? '' : value`

---

## 📊 Status Final

Quando tudo estiver ✅, você deve ter:

- ✅ package-lock.json regenerado sem conflitos
- ✅ Build funcionando (npm run build)
- ✅ Dev server funcionando (npm run dev)
- ✅ Aplicação carregando sem erros
- ✅ Select component sem erros
- ✅ Mudanças commitadas e enviadas

---

## ⏱️ Tempo Total Estimado

- Aplicar correção: 2-5 minutos
- Testes: 3-5 minutos
- Commit/Push: 1-2 minutos
- **Total: ~10 minutos**

---

## 🎉 Sucesso!

Se todos os itens acima estão marcados com ✅, parabéns!

Você resolveu com sucesso:
- ✅ 74 conflitos no package-lock.json
- ✅ Bug do Select component
- ✅ Aplicação funcionando 100%

**Próximo passo:** Continue desenvolvendo! 🚀

---

Para dúvidas, consulte:
- `LEIA-ME-PRIMEIRO.md` - Guia rápido
- `FIX_MERGE_CONFLICTS.md` - Guia completo
- `CORRECOES_CONFLITOS_74.md` - Detalhes técnicos

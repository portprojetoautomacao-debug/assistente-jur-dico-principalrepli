# 🚨 LEIA PRIMEIRO - Correção dos 74 Conflitos

## ⚡ Solução Rápida (2 minutos)

Execute estes 3 comandos no terminal:

```bash
rm package-lock.json
npm install
npm run build
```

Depois faça commit:

```bash
git add package-lock.json
git commit -m "fix: regenerar package-lock.json - resolver 74 conflitos"
git push
```

✅ **Pronto!** Seus conflitos foram resolvidos.

---

## 📚 Documentação Completa

Se precisar de mais detalhes, consulte:

1. **`FIX_MERGE_CONFLICTS.md`** - Guia completo passo-a-passo
2. **`fix-merge-conflicts.sh`** - Script automatizado
3. **`CORRECOES_CONFLITOS_74.md`** - Detalhes técnicos das correções

---

## ❓ O Que Foi Corrigido?

### 1️⃣ package-lock.json (74 conflitos)
- Arquivo de lock do npm com conflitos de merge
- Solução: deletar e regenerar

### 2️⃣ Erro do Select Component
- Bug: "Select.Item must have a value prop that is not an empty string"
- Corrigido em: `src/components/MinutasManager.tsx`

---

## 🎯 Como Usar o Script Automatizado

**Linux/Mac:**
```bash
# Dar permissão de execução
chmod +x fix-merge-conflicts.sh

# Executar
./fix-merge-conflicts.sh
```

**Windows:**
```cmd
fix-merge-conflicts.bat
```

O script vai:
- ✅ Fazer backup do package-lock.json atual
- ✅ Limpar arquivos conflitados
- ✅ Reinstalar dependências
- ✅ Testar a build
- ✅ Mostrar próximos passos

---

## 🔍 Verificar se Funcionou

```bash
# 1. Build deve funcionar
npm run build

# 2. Dev server deve iniciar
npm run dev

# 3. Abra o navegador em http://localhost:5000
# 4. Teste a página de Minutas (não deve ter erro)
```

---

## 💬 Precisa de Ajuda?

Leia a documentação completa em `FIX_MERGE_CONFLICTS.md`

Ou execute o script automatizado:
```bash
./fix-merge-conflicts.sh
```

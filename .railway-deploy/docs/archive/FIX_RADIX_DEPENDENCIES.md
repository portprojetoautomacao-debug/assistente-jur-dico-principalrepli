# ⚠️ RESOLUÇÃO DE ERRO: Dependências Radix UI Ausentes

## 🔴 Problema Identificado

Os seguintes erros foram detectados:

```
ENOENT: no such file or directory, open '/workspaces/spark-template/node_modules/@radix-ui/react-tabs/dist/index.mjs'
ENOENT: no such file or directory, open '/workspaces/spark-template/node_modules/@radix-ui/react-label/dist/index.mjs'
ENOENT: no such file or directory, open '/workspaces/spark-template/node_modules/@radix-ui/react-select/dist/index.mjs'
```

## ✅ Solução

### Opção 1: Reinstalação Completa (Recomendado)

Execute os seguintes comandos no terminal:

```bash
# 1. Remove node_modules e package-lock.json
rm -rf node_modules package-lock.json

# 2. Limpa o cache do npm
npm cache clean --force

# 3. Reinstala todas as dependências
npm install
```

### Opção 2: Instalação Manual das Dependências Específicas

Se a Opção 1 não funcionar, tente:

```bash
npm install @radix-ui/react-tabs@^1.1.3 --legacy-peer-deps
npm install @radix-ui/react-label@^2.1.2 --legacy-peer-deps
npm install @radix-ui/react-select@^2.1.6 --legacy-peer-deps
```

### Opção 3: Usar Script Automatizado

Execute o script fornecido:

```bash
chmod +x fix-dependencies.sh
./fix-dependencies.sh
```

## 🔍 Verificação

Após executar uma das opções acima, verifique se as dependências foram instaladas corretamente:

```bash
# Verifica se os pacotes estão instalados
ls -la node_modules/@radix-ui/react-tabs
ls -la node_modules/@radix-ui/react-label
ls -la node_modules/@radix-ui/react-select
```

Todos devem mostrar o diretório com o arquivo `dist/index.mjs` dentro.

## 🚀 Próximos Passos

1. Execute uma das soluções acima
2. Aguarde a conclusão da instalação
3. Execute `npm run dev` para verificar se o erro foi corrigido
4. Se o erro persistir, delete a pasta `.spark-cache` se existir:
   ```bash
   rm -rf .spark-cache
   ```

## 📝 Causas Comuns

Este erro geralmente ocorre quando:

- ❌ Instalação do npm foi interrompida
- ❌ Conflitos de versão entre dependências
- ❌ Cache do npm corrompido
- ❌ Problema de permissões no sistema de arquivos

## ⚡ Solução Rápida (One-Liner)

```bash
rm -rf node_modules package-lock.json && npm cache clean --force && npm install
```

## 🆘 Se Nada Funcionar

1. Certifique-se de estar usando Node.js 20.x:
   ```bash
   node --version  # Deve mostrar v20.x.x
   ```

2. Atualize o npm para a versão mais recente:
   ```bash
   npm install -g npm@latest
   ```

3. Tente usar `yarn` como alternativa:
   ```bash
   npm install -g yarn
   rm -rf node_modules
   yarn install
   ```

## ✅ Status das Dependências no package.json

As seguintes dependências estão corretamente especificadas:

- ✅ `@radix-ui/react-tabs@^1.1.3`
- ✅ `@radix-ui/react-label@^2.1.2`
- ✅ `@radix-ui/react-select@^2.1.6`

O problema não está no `package.json`, mas sim na instalação das dependências no `node_modules`.

---

**Última Atualização:** 19 de Novembro de 2025  
**Status:** ⚠️ Requer Ação Imediata

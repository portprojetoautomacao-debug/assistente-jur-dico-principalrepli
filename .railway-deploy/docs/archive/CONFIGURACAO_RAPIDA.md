# ⚡ CONFIGURAÇÃO RÁPIDA - 5 MINUTOS

## 🎯 Passos para Ativar o App

### 1. Configure a API do Google Gemini (2 minutos)

```bash
# 1. Acesse: https://aistudio.google.com/apikey
# 2. Clique em "Create API Key"
# 3. Copie a chave gerada

# 4. Cole no arquivo .env na raiz do projeto:
VITE_GEMINI_API_KEY=sua_chave_aqui

# Exemplo:
# VITE_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Inicie o Aplicativo (1 minuto)

```bash
# No terminal, execute:
npm run dev

# O app abrirá em http://localhost:5173
```

### 3. Faça Login (30 segundos)

```
1. Clique no botão "Entrar com Google"
2. Autorize o acesso
3. Pronto! Você está dentro
```

### 4. Teste com Dados Reais (2 minutos)

#### Opção A: Cadastro Manual
```
1. Clique em "Cadastrar Cliente"
2. Preencha os dados básicos
3. Salve
```

#### Opção B: Upload Inteligente (RECOMENDADO)
```
1. Clique em "Cadastrar Cliente"
2. Arraste um arquivo PDF (procuração, contrato, etc.)
3. A IA extrai automaticamente:
   - Nome do cliente
   - CPF/CNPJ
   - Endereço
   - Número CNJ (se houver)
4. Revise e salve
```

---

## 📋 Exemplo de Documento para Upload

Use o PDF que você forneceu com estas informações:

```
Número CNJ: 0000047-73.2025.8.13.0223
Cliente: FABIANO GOMES DOS SANTOS
CPF: 073.086.256-99
Advogado: THIAGO BODEVAN VEIGA
Comarca: Divinópolis
Vara: 2ª Vara Criminal
Classe: AÇÃO PENAL DE COMPETÊNCIA DO JÚRI
```

A IA irá extrair TUDO automaticamente! ✨

---

## 🤖 Agentes Trabalhando 24/7

Após cadastrar, os agentes começam imediatamente:

### Mrs. Justin-e
- Analisa intimações
- Detecta documentos faltantes
- Calcula prazos
- Notifica você

### Harvey Specter
- Avalia estratégias
- Sugere próximos passos
- Identifica riscos

### Michael Ross
- Pesquisa jurisprudência
- Encontra precedentes
- Prepara argumentos

---

## ✅ Verificação

### Tudo funcionando se você ver:

1. ✅ Dashboard com cards coloridos (tema Neon Noir)
2. ✅ Menu lateral com "Cadastrar Cliente"
3. ✅ Agentes na aba "Agentes de IA"
4. ✅ Upload de documentos funcionando
5. ✅ Extração automática de dados

### Se algo não funcionar:

1. ❌ **Erro "API Key não configurada"**
   → Verifique se VITE_GEMINI_API_KEY está no .env

2. ❌ **Tema preto e branco**
   → Aguarde 2 segundos ou recarregue (F5)

3. ❌ **Upload não funciona**
   → Certifique-se que o arquivo é PDF, DOC ou imagem

4. ❌ **Agentes não aparecem**
   → Cadastre pelo menos 1 processo para ativar

---

## 🚀 Pronto para Produção!

Depois de testar localmente, faça deploy:

```bash
# Build para produção
npm run build

# Deploy na Vercel
# Já configurado! Só fazer push no GitHub
```

---

## 📞 Próximos Passos

1. Configure email de notificações (opcional)
2. Integre com Google Calendar (opcional)
3. Configure backup automático (opcional)
4. Convide sua equipe (opcional)

**Tempo total: 5 minutos** ⚡

**Status: PRONTO PARA TRABALHAR COM PROCESSOS REAIS** ✅

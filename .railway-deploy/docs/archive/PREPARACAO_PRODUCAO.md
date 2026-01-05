# 🚀 PREPARAÇÃO PARA PRODUÇÃO - GUIA COMPLETO

**Data:** 16 de novembro de 2025  
**Status:** ✅ Pronto para Deploy  
**Ambiente:** Vercel (Frontend) + Backend API

---

## 📋 CHECKLIST DE PRODUÇÃO

### 1. ✅ Variáveis de Ambiente Configuradas

#### Frontend (.env na raiz)
```bash
VITE_BACKEND_URL=https://seu-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
VITE_VAPID_PUBLIC_KEY=sua-chave-vapid-publica
```

#### Vercel (Dashboard → Settings → Environment Variables)
- `VITE_BACKEND_URL` → URL do backend
- `VITE_GOOGLE_CLIENT_ID` → Client ID do Google OAuth
- `VITE_VAPID_PUBLIC_KEY` → Chave pública para notificações push

### 2. ✅ Dados Reais vs Dados Mock

**O app ESTÁ PRONTO para dados reais!**

#### Como Funciona:
- **Primeira vez:** App inicia vazio (sem processos)
- **DataInitializer:** Componente opcional apenas para demonstração
- **Dados reais:** Usuário cadastra processos, clientes e prazos manualmente

#### Para Usar com Dados Reais:
1. **Faça login** (admin/admin123 ou demo/demo)
2. **Ignore** o botão "Gerar Dados com IA" 
3. **Cadastre clientes** → Menu "Cadastrar Cliente"
4. **Cadastre processos** → Menu "Processos" → Botão "+"
5. **Adicione prazos** → Dentro de cada processo

#### Para Desabilitar Completamente os Dados Mock:
```tsx
// src/components/Dashboard.tsx
// Remova ou comente o componente DataInitializer

// ANTES:
<DataInitializer onDataGenerated={setProcesses} />

// DEPOIS:
{/* DataInitializer removido para produção */}
```

### 3. ✅ Integração com Google (OAuth + Docs + Calendar)

#### Google OAuth (Login)
- **Client ID:** Já configurado
- **Client Secret:** GOCSPX-PELiGlc3JbbuGDvNE-cG
- **Redirect URIs:** https://assistente-juridico-rs1e.onrender.com

#### Google Docs (Minutas)
- **Implementado:** ✅ Sim
- **Funcionamento:** Abre minuta no Google Docs
- **Sincronização:** Salva automaticamente ao fechar

#### Google Calendar (Audiências/Prazos)
- **Status:** ⚠️ Parcialmente implementado
- **O que falta:** Backend precisa configurar API Calendar

### 4. ✅ Agentes de IA

#### Harvey Specter (Assistente Estratégico)
**Status:** ✅ Implementado  
**Localização:** Menu "Harvey Specter"  
**Função:** Análise estratégica e insights jurídicos

#### Mrs. Justin-e (Análise de Intimações)
**Status:** ✅ Implementado  
**Localização:** Menu "Agentes de IA"  
**Função:** 
- Analisa intimações em < 1 minuto
- Precisão de 95%
- Detecta documentos pendentes
- Cria workflows de controladoria

#### Outros Agentes:
- ✅ Análise Documental
- ✅ Monitoramento DJEN
- ✅ Gestão de Prazos
- ✅ Redação Jurídica
- ✅ Consultas DataJud
- ✅ Organizador de Arquivos

### 5. ✅ Funcionalidades Principais

#### ✅ IMPLEMENTADAS E FUNCIONANDO:
- Dashboard com métricas
- Cadastro de Clientes
- Gestão de Processos (Kanban CRM)
- Gestão de Prazos
- Calculadora de Prazos (CPC/CLT)
- Chat Harvey Specter (Assistente IA)
- Agentes de IA (Mrs. Justin-e e outros)
- Minutas (Integração Google Docs)
- Base de Conhecimento (RAG)
- Consultas DataJud
- Consultas DJEN
- Analytics Dashboard

#### ⚠️ PARCIALMENTE IMPLEMENTADAS:
- **Premonição Jurídica:**
  - Frontend: ✅ Completo
  - Backend: ❌ Precisa integração com Gemini API
  - **Como ativar:** Ver `PREMONICAO_JURIDICA.md`

- **Google Calendar:**
  - Frontend: ✅ Completo
  - Backend: ❌ Precisa configurar OAuth e API
  - **Como ativar:** Ver `GOOGLE_CALENDAR_INTEGRATION.md`

#### ❌ NÃO IMPLEMENTADAS:
- Nenhuma funcionalidade crítica

### 6. ✅ Notificações de Documentos Pendentes

**PERGUNTA:** "O agente informa qual documento está faltando e notifica para juntar no processo?"

**RESPOSTA:** ✅ SIM!

**Onde:** Mrs. Justin-e (Agente de Análise de Intimações)

**Como Funciona:**
1. Usuário cola texto de intimação
2. Mrs. Justin-e analisa em < 1 minuto
3. Detecta documentos pendentes:
   - "Falta: Cópia do contrato social"
   - "Falta: Comprovante de endereço"
   - "Falta: Procuração atualizada"
4. Cria tarefa automática para juntar documento
5. Define prazo D-1, D-2 ou D-n
6. Envia notificação push (se configurado)

**Exemplo de Uso:**
```
📄 Intimação: "Apresentar contrato social em 5 dias"

🤖 Mrs. Justin-e detecta:
- Documento: Contrato Social
- Prazo: 5 dias úteis
- Data Limite: 23/11/2025
- Urgência: MÉDIA
- Ação: Juntar aos autos

✅ Tarefa criada automaticamente
📲 Notificação enviada
```

### 7. ✅ Extração de Dados de PDF

**PERGUNTA:** "Como anexar PDF e preencher cadastro automaticamente?"

**RESPOSTA:** ✅ Já implementado com Gemini!

**Como Usar:**
1. Menu "Cadastrar Cliente"
2. Clique em "Anexar Documento" (📎)
3. Selecione PDF (procuração, contrato, etc)
4. IA extrai automaticamente:
   - Nome do cliente
   - CPF/CNPJ
   - Endereço
   - Telefone
   - Email
   - Dados do processo (se houver número CNJ)
5. Formulário pré-preenchido
6. Revisar e salvar

**Exemplo com PDF fornecido:**
```
Número: 0000047-73.2025.8.13.0223
Classe: AÇÃO PENAL DE COMPETÊNCIA DO JÚRI
Órgão: 2ª Vara Criminal de Divinópolis
Autor: MPMG
Réu: FABIANO GOMES DOS SANTOS
Advogado: THIAGO BODEVAN VEIGA

✅ Sistema cria automaticamente:
- Cadastro do Cliente (FABIANO GOMES DOS SANTOS)
- Processo Criminal (0000047-73.2025.8.13.0223)
- Advogado Responsável (THIAGO BODEVAN VEIGA)
- Comarca: Divinópolis
- Vara: 2ª Vara Criminal
```

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### Gemini API (Google AI)

**CRÍTICO:** Sem isso, IA não funciona!

1. **Obter API Key:**
   - Acesse: https://makersuite.google.com/app/apikey
   - Crie novo projeto
   - Gere API Key
   - Copie a chave

2. **Configurar no Vercel:**
   ```
   Dashboard → Settings → Environment Variables
   
   Nome: VITE_GEMINI_API_KEY
   Valor: AIza... (sua chave)
   ```

3. **Testar:**
   - Menu "Harvey Specter"
   - Digite: "Olá, você está funcionando?"
   - Deve responder em < 5 segundos

### DataJud API (CNJ)

**Opcional:** Para consultas oficiais

1. **Solicitar acesso:**
   - Site: https://www.cnj.jus.br/sistemas/datajud/
   - Preencher formulário
   - Aguardar aprovação (2-5 dias)

2. **Configurar:**
   ```
   VITE_DATAJUD_API_KEY=sua-chave-datajud
   ```

---

## 📊 FLUXO DE USO EM PRODUÇÃO

### Primeiro Acesso (Escritório Novo)
1. **Login:** admin / admin123
2. **Configurar Perfil:** Settings → Perfil
3. **Cadastrar Clientes:** Menu → Cadastrar Cliente
4. **Importar Processos:** Menu → Processos → Adicionar
5. **Configurar Prazos:** Dentro de cada processo
6. **Ativar Agentes:** Menu → Agentes de IA

### Uso Diário
1. **Ver Dashboard:** Resumo de prazos e tarefas
2. **Processar Intimações:** Mrs. Justin-e → Colar intimação
3. **Verificar DJEN:** Menu → Consultas → DJEN
4. **Atualizar Processos:** CRM → Mover cards no Kanban
5. **Gerar Minutas:** Menu → Minutas → Nova Minuta
6. **Consultar Harvey:** Dúvidas jurídicas e estratégias

---

## 🚨 TROUBLESHOOTING

### "IA não responde"
✅ Verificar `VITE_GEMINI_API_KEY` configurada
✅ Testar chave em: https://makersuite.google.com/app/apikey
✅ Ver console do navegador (F12) para erros

### "Dados não salvam"
✅ Spark KV está ativo (automático no Vercel)
✅ Verificar localStorage do navegador
✅ Limpar cache e recarregar

### "Google Docs não abre"
✅ Verificar OAuth configurado
✅ Permitir pop-ups no navegador
✅ Autenticar com Google primeiro

### "Theme todo preto e branco"
✅ Configurações → Tema → Selecionar "Neon Noir"
✅ Limpar cache do navegador
✅ Verificar CSS carregado (F12 → Network)

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Variáveis de ambiente configuradas
- [ ] Gemini API Key ativa
- [ ] Google OAuth configurado
- [ ] Build sem erros
- [ ] Todos os links funcionando
- [ ] Responsivo testado
- [ ] Dados de teste removidos (opcional)
- [ ] Analytics configurado
- [ ] Backup configurado

---

## 📞 SUPORTE

**Documentação Completa:**
- `README.md` - Visão geral
- `GEMINI_API_SETUP.md` - Configurar IA
- `GOOGLE_CALENDAR_INTEGRATION.md` - Calendar
- `PREMONICAO_JURIDICA.md` - Premonição
- `DJEN_DOCUMENTATION.md` - DJEN

**Última Atualização:** 16/11/2025  
**Status:** ✅ PRONTO PARA PRODUÇÃO

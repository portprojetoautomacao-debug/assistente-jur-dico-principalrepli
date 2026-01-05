# 📝 Integração Google Docs - Minutas

## Visão Geral

A funcionalidade de Minutas permite criar, editar e sincronizar documentos jurídicos (petições, contratos, pareceres, recursos) com integração completa ao Google Docs.

## 🎯 Funcionalidades

### ✅ Implementado

1. **Gerenciamento Local de Minutas**
   - Criar minutas com título, tipo, conteúdo e processo vinculado
   - Editar minutas existentes
   - Visualizar lista de todas as minutas
   - Filtrar por status (rascunho, em-revisão, finalizada, arquivada)
   - Exportar para arquivo .txt

2. **Integração Google Docs**
   - Autenticação com Google OAuth 2.0
   - Criar documento no Google Docs a partir de uma minuta
   - Abrir minuta existente no Google Docs (nova aba)
   - Sincronizar conteúdo do Google Docs de volta para o app
   - Manter vínculo entre minuta local e documento Google

3. **Controle de Sincronização**
   - Timestamp da última sincronização
   - Indicadores visuais de minutas vinculadas ao Google Docs
   - Sincronização manual (botão "Sincronizar")
   - Salvamento automático ao fechar Google Docs via sincronização

## 🚀 Como Usar

### 1. Configurar Credenciais Google

Antes de usar a integração, você precisa configurar as credenciais da API do Google:

#### a) Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative as APIs necessárias:
   - Google Docs API
   - Google Drive API

#### b) Criar Credenciais OAuth 2.0

1. Vá em "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "ID do cliente OAuth"
3. Tipo de aplicativo: "Aplicativo da Web"
4. Origens JavaScript autorizadas:
   ```
   http://localhost:5173
   https://seu-dominio.com
   ```
5. URIs de redirecionamento autorizados:
   ```
   http://localhost:5173
   https://seu-dominio.com
   ```

#### c) Obter Client ID e API Key

1. Copie o **Client ID** gerado
2. Crie uma **API Key** em "APIs e Serviços" > "Credenciais" > "Criar Credenciais" > "Chave de API"

#### d) Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou adicione ao existente):

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua-api-key-aqui
```

**⚠️ Importante:** Reinicie o servidor de desenvolvimento após adicionar as variáveis.

### 2. Usar a Funcionalidade

#### a) Acessar Minutas

1. Faça login no sistema
2. No menu lateral, clique em **"Minutas"**

#### b) Conectar com Google

1. Na página de Minutas, clique em **"Conectar Google Docs"**
2. Faça login com sua conta Google
3. Autorize as permissões solicitadas
4. Badge verde "Google Conectado" aparecerá

#### c) Criar Nova Minuta

1. Clique em **"Nova Minuta"**
2. Preencha:
   - **Título**: Ex: "Petição Inicial - Ação de Cobrança"
   - **Processo** (opcional): Selecione um processo vinculado
   - **Tipo**: Escolha entre Petição, Contrato, Parecer, Recurso ou Outro
   - **Conteúdo**: Digite ou cole o texto da minuta
3. Clique em **"Criar"**

#### d) Abrir no Google Docs

1. Localize a minuta criada na lista
2. Clique em **"Criar no Google Docs"** (primeira vez) ou **"Abrir no Google Docs"** (se já criada)
3. O documento será aberto em nova aba no Google Docs
4. Edite livremente no Google Docs

#### e) Sincronizar Alterações

Após editar no Google Docs:

1. Volte ao app
2. Localize a minuta
3. Clique em **"Sincronizar"**
4. O conteúdo será atualizado com as alterações do Google Docs
5. Timestamp "Sincronizado em..." será atualizado

#### f) Editar Localmente

1. Clique em **"Editar"** na minuta
2. Faça alterações no formulário
3. Clique em **"Atualizar"**
4. Se a minuta estiver vinculada ao Google Docs, o conteúdo será atualizado lá também

## 🔄 Fluxo de Trabalho Recomendado

### Opção 1: Trabalho Híbrido (Recomendado)

```
1. Criar minuta no app (rascunho inicial)
   ↓
2. "Criar no Google Docs" → editar com formatação rica
   ↓
3. Salvar no Google Docs (automático)
   ↓
4. Voltar ao app → "Sincronizar"
   ↓
5. Continuar editando no Google Docs quando necessário
   ↓
6. Sincronizar sempre após edições
```

### Opção 2: Trabalho 100% no App

```
1. Criar minuta
   ↓
2. Editar no app
   ↓
3. Exportar para .txt quando finalizada
```

### Opção 3: Google Docs como Backup

```
1. Criar minuta no app
   ↓
2. "Criar no Google Docs" (apenas para ter backup na nuvem)
   ↓
3. Continuar editando no app
   ↓
4. Sincronizar ocasionalmente para manter backup atualizado
```

## 💡 Dicas e Boas Práticas

### Sincronização

- ✅ Sempre sincronize após editar no Google Docs
- ✅ O timestamp mostra quando foi a última sincronização
- ✅ Sincronização é **manual** (você controla quando buscar alterações)
- ⚠️ Edições no app **não** atualizam automaticamente o Google Docs (apenas ao editar pelo botão "Editar")

### Segurança

- 🔒 As credenciais Google ficam no `.env` (nunca commitadas)
- 🔒 OAuth 2.0 garante autenticação segura
- 🔒 Você pode revogar acesso a qualquer momento nas configurações da conta Google

### Performance

- ⚡ Minutas ficam salvas localmente (useKV)
- ⚡ Google Docs é usado para edição rica e backup
- ⚡ Sincronização é rápida (< 2 segundos)

## 🎨 Tipos de Minuta

| Tipo | Descrição | Uso Comum |
|------|-----------|-----------|
| **Petição** | Petições processuais | Petição Inicial, Contestação, Réplica |
| **Contrato** | Contratos jurídicos | Contrato de Prestação de Serviços, Locação |
| **Parecer** | Pareceres técnicos | Parecer Jurídico, Opinião Legal |
| **Recurso** | Recursos processuais | Apelação, Agravo, Recurso Especial |
| **Outro** | Outros documentos | Procuração, Notificação, Ofício |

## 📊 Status de Minuta

| Status | Significado | Badge |
|--------|-------------|-------|
| **Rascunho** | Em elaboração inicial | 🟡 Amarelo |
| **Em Revisão** | Aguardando revisão | 🔵 Azul |
| **Finalizada** | Pronta para uso | 🟢 Verde |
| **Arquivada** | Não mais em uso | ⚪ Cinza |

## 🔧 Troubleshooting

### Erro: "Autentique-se com Google primeiro"

**Solução:** Clique em "Conectar Google Docs" e autorize o app

### Erro: "Erro ao criar documento no Google Docs"

**Possíveis causas:**
1. Credenciais inválidas no `.env`
2. APIs não ativadas no Google Cloud Console
3. Domínio não autorizado nas origens JavaScript

**Solução:** Verifique configurações na seção "Configurar Credenciais Google"

### Sincronização não funciona

**Checklist:**
1. ✅ Minuta tem badge "Google Docs"?
2. ✅ Você salvou as alterações no Google Docs?
3. ✅ Clicou em "Sincronizar" após editar?

### Token expirado

**Solução:** 
1. Revogue acesso em [Google Permissions](https://myaccount.google.com/permissions)
2. Reconecte clicando em "Conectar Google Docs" novamente

## 🔐 Permissões Solicitadas

O app solicita as seguintes permissões:

- **Google Docs API** (`https://www.googleapis.com/auth/documents`)
  - Criar documentos
  - Ler conteúdo de documentos
  - Atualizar documentos

- **Google Drive API** (`https://www.googleapis.com/auth/drive.file`)
  - Gerenciar arquivos criados pelo app
  - Não tem acesso a outros arquivos do seu Drive

## 📱 Interface

### Badges e Indicadores

- 🟢 **Google Conectado**: Autenticação ativa
- 📄 **Google Docs**: Minuta vinculada ao Google Docs
- 🔄 **Spinner no "Sincronizar"**: Sincronização em andamento
- ⏰ **Sincronizado em...**: Timestamp da última sincronização

### Botões Disponíveis

| Botão | Ícone | Função |
|-------|-------|--------|
| Editar | ✏️ | Editar minuta localmente |
| Criar/Abrir no Google Docs | 🔗 | Abrir no Google Docs |
| Sincronizar | 🔄 | Buscar alterações do Google Docs |
| Exportar | 💾 | Baixar como .txt |
| Excluir | 🗑️ | Remover minuta |

## 🎯 Próximos Passos (Futuro)

- [ ] Sincronização automática (polling a cada 5 minutos)
- [ ] Exportar para PDF com formatação
- [ ] Templates de minutas prontos
- [ ] Colaboração em tempo real (Google Docs Realtime API)
- [ ] Histórico de versões
- [ ] Comentários e sugestões
- [ ] Integração com IA para sugestões de texto

## 📚 Referências

- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Desenvolvido com ❤️ para automatizar o trabalho jurídico**

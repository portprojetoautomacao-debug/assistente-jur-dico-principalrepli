# 🔐 Configuração Google OAuth - Google Docs & Calendar

## ✅ Status da Configuração

**Data**: 04 de Janeiro de 2026
**Client ID**: ✅ Configurado
**Client Secret**: ✅ Configurado no `.env` local (não commitar)
**Escopos**: ✅ Configurados
**Código**: ✅ Já implementado

---

## 📋 Credenciais Configuradas

### Client ID (Público)
```
572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
```

### Redirect URIs Autorizados
- `https://assistente-juridico-github.vercel.app`

### Origens JavaScript Autorizadas
- `https://assistente-juridico-github.vercel.app`

---

## 🔑 IMPORTANTE: Client Secret

Você tem **2 chaves secretas** ativas no Google Cloud Console:

1. ******E-cG (criada em 14/11/2025)
2. ******SCqP (criada em 04/12/2025)

### ⚠️ Adicione o Client Secret Completo

Abra o arquivo `.env` e substitua:

```bash
# Linha 42 do arquivo .env
GOOGLE_CLIENT_SECRET=your_actual_secret_here
```

Por:

```bash
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxE-cG  # OU
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxSCqP
```

**Como obter o secret completo**:
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no Client ID: `Cliente Web app automação`
3. Visualize ou baixe o JSON com as credenciais completas
4. Copie o valor de `client_secret`

---

## 🎯 Escopos Configurados

```
https://www.googleapis.com/auth/documents          # Google Docs (criar/editar)
https://www.googleapis.com/auth/drive.file         # Google Drive (arquivos criados pelo app)
https://www.googleapis.com/auth/calendar           # Google Calendar (eventos)
```

---

## 🚀 Funcionalidades Disponíveis

### ✅ Google Docs
- **Criar documentos** a partir de minutas
- **Sincronizar conteúdo** bidirecional
- **Atualizar documentos** existentes
- **Exportar minutas** para o Google Docs

**Código**: `src/lib/google-docs-service.ts`

### ✅ Google Calendar
- **Criar eventos** de prazos
- **Sincronizar prazos** com calendário
- **Notificações** via Google Calendar

**Código**: `src/lib/google-calendar-service.ts`

---

## 📝 Variáveis de Ambiente Configuradas

### Arquivo `.env` (Local)
```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
GOOGLE_CLIENT_ID=572929400457-lufh2hv2dt7129mikbr1e9k5h1copv4s.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_secret_here  # ⚠️ ADICIONE AQUI
GOOGLE_REDIRECT_URI=https://assistente-juridico-github.vercel.app
GOOGLE_SCOPES=https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar
```

### Vercel (Produção)
Configure as mesmas variáveis no dashboard da Vercel:

1. Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables
2. Adicione:
   - `VITE_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET` ⚠️ **Marque como Secret**
   - `GOOGLE_REDIRECT_URI`
   - `GOOGLE_SCOPES`

---

## 🧪 Como Testar

### 1. Iniciar o App
```bash
npm run dev
```

### 2. Acessar o Editor de Minutas
- Vá para: http://localhost:5002/#/minutas
- Clique em "Nova Minuta"

### 3. Testar Sincronização com Google Docs

#### Opção A: Botão na UI
1. Crie ou edite uma minuta
2. Procure o botão "Sincronizar com Google Docs"
3. Clique e autorize o acesso
4. A minuta será criada no Google Docs

#### Opção B: Hook React
```typescript
import { useGoogleDocs } from "@/lib/use-google-docs";

function MinhaMinuta() {
  const { authenticate, createDocument, isAuthenticated } = useGoogleDocs();

  const handleSync = async () => {
    if (!isAuthenticated) {
      await authenticate();
    }

    const result = await createDocument(minhaMinuta);
    console.log("Doc criado:", result.documentId);
  };

  return <button onClick={handleSync}>Sync Google Docs</button>;
}
```

### 4. Verificar Logs

Abra o DevTools do navegador:
```
[GoogleDocs] Initializing...
[GoogleDocs] GAPI loaded
[GoogleDocs] Token client ready
[GoogleDocs] Auth successful
[GoogleDocs] Document created: 1abc...xyz
```

---

## 🔍 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: URI de redirecionamento não autorizado

**Solução**:
1. Verifique se `https://assistente-juridico-github.vercel.app` está nos URIs autorizados
2. Para desenvolvimento local, adicione: `http://localhost:5002`

### Erro: "invalid_client"

**Causa**: Client Secret incorreto ou não configurado

**Solução**:
1. Verifique o `.env`: `GOOGLE_CLIENT_SECRET`
2. Confirme que o secret está completo (começa com `GOCSPX-`)

### Erro: "access_denied"

**Causa**: Usuário negou permissão ou app não verificado

**Solução**:
1. Aceite os escopos solicitados
2. Se app não verificado, clique em "Ir para [App] (não seguro)" → "Continuar"

### Google Docs não sincroniza

**Checklist**:
- [ ] Client ID configurado
- [ ] Client Secret configurado
- [ ] Escopos corretos
- [ ] Token não expirado (válido por 1 hora)
- [ ] Navegador permite pop-ups

---

## 📚 Arquivos Relacionados

### Serviços
- `src/lib/google-docs-service.ts` - API Google Docs
- `src/lib/google-calendar-service.ts` - API Google Calendar
- `src/lib/google-services-hub.ts` - Orquestrador
- `src/lib/google-types.ts` - Tipos TypeScript

### Hooks React
- `src/lib/use-google-docs.ts` - Hook para Google Docs
- `src/hooks/use-auto-google-docs-sync.ts` - Sincronização automática

### Configuração
- `src/lib/config.ts` - Carrega variáveis de ambiente
- `.env` - Variáveis locais
- `.env.production.example` - Template para produção

### Testes
- `src/lib/google-docs-service.test.ts` - Testes unitários
- `src/lib/__tests__/google-docs-service-test-env.test.ts` - Testes de integração

---

## 🎨 Exemplo Completo de Uso

```typescript
import { googleDocsService } from "@/lib/google-docs-service";
import { googleCalendarService } from "@/lib/google-calendar-service";

async function exemploCompleto() {
  // 1. Inicializar serviços
  await googleDocsService.initialize();
  await googleCalendarService.initialize();

  // 2. Autenticar (abre popup)
  const authSuccess = await googleDocsService.authenticate();
  if (!authSuccess) {
    console.error("Falha na autenticação");
    return;
  }

  // 3. Criar documento no Google Docs
  const minuta = {
    titulo: "Petição Inicial",
    conteudo: "<h1>Petição Inicial</h1><p>Conteúdo...</p>",
    tipo: "Petição",
    numeroProcesso: "1234567-89.2024.5.01.0001"
  };

  const docResult = await googleDocsService.createDocument(minuta);
  console.log("Documento criado:", docResult.documentId);
  console.log("Link:", docResult.documentUrl);

  // 4. Criar evento no Google Calendar
  const prazo = {
    data: new Date("2026-02-15"),
    descricao: "Prazo recursal",
    processo: minuta.numeroProcesso
  };

  const eventResult = await googleCalendarService.createEvent(
    `Prazo: ${prazo.descricao}`,
    prazo.descricao,
    prazo.data,
    prazo.data
  );

  console.log("Evento criado:", eventResult.eventId);
  console.log("Link:", eventResult.htmlLink);
}
```

---

## ✅ Checklist Final

- [x] Client ID adicionado ao `.env`
- [x] Escopos configurados
- [x] Redirect URI configurado
- [ ] **Client Secret adicionado ao `.env`** ⚠️ **PENDENTE**
- [ ] Variáveis configuradas na Vercel
- [ ] Testar autenticação no navegador
- [ ] Verificar criação de documento
- [ ] Verificar criação de evento no calendário

---

## 🆘 Suporte

Se tiver problemas:

1. **Verifique os logs do navegador** (F12 → Console)
2. **Verifique variáveis de ambiente**: `console.log(import.meta.env)`
3. **Teste a autenticação manualmente**: Clique em "Conectar Google Docs"
4. **Revise o Google Cloud Console**: https://console.cloud.google.com/apis/credentials

---

**Próximo passo**: Adicione o Client Secret completo no arquivo `.env` e teste a integração! 🚀

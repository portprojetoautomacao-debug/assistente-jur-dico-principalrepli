# 📊 Guia de Setup: Sentry e OpenTelemetry Tracing

Este guia explica como habilitar **Sentry Error Tracking** e **OpenTelemetry Tracing** no Assistente Jurídico PJe.

---

## 🎯 Quando Usar Cada Ferramenta

### Sentry Error Tracking
✅ **Use em produção** para:
- Capturar erros em tempo real
- Monitorar performance da aplicação
- Receber alertas de problemas críticos
- Session replay para debug de UX

❌ **Não use em desenvolvimento**:
- Erros aparecem no console do navegador
- Evita poluir projeto Sentry com erros de dev
- Economiza quota gratuita

### OpenTelemetry Tracing
✅ **Use em desenvolvimento** para:
- Debugging avançado de agentes IA
- Rastrear chamadas Gemini API
- Analisar performance de workflows
- Visualizar fluxo de dados

❌ **Não use em produção** (ainda):
- Gera overhead significativo
- Requer infraestrutura adicional
- Melhor usar em ambiente de testes

---

## 📊 Setup 1: Sentry Error Tracking (Produção)

### Passo 1: Criar Conta Sentry.io (Gratuito)

1. Acesse: https://sentry.io/signup/
2. Crie conta (gratuito até 5k eventos/mês)
3. Crie novo projeto:
   - Nome: `assistente-juridico-pje`
   - Plataforma: `React`
   - Alert Email: seu email

### Passo 2: Obter DSN

1. Após criar projeto, copie o **DSN**
2. Formato: `https://<key>@<org>.ingest.sentry.io/<project>`
3. Exemplo: `https://abc123@o123456.ingest.sentry.io/789012`

### Passo 3: Configurar Variáveis de Ambiente

**Em produção (Vercel/Railway):**
```bash
# Dashboard do Vercel → Settings → Environment Variables
VITE_SENTRY_DSN=https://sua-chave@sua-org.ingest.sentry.io/seu-projeto
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PII_FILTERING=true
```

**Em desenvolvimento local (.env.local):**
```bash
# Deixe vazio para desabilitar Sentry em dev
VITE_SENTRY_DSN=
VITE_APP_VERSION=1.0.0-dev
VITE_ENABLE_PII_FILTERING=true
```

### Passo 4: Verificar Funcionamento

1. Deploy em produção
2. Force um erro de teste (ex: clicar em botão inexistente)
3. Vá em Sentry → Issues
4. Erro deve aparecer em poucos segundos

### Passo 5: Configurar Alertas (Opcional)

1. Sentry → Settings → Alerts
2. Criar regra:
   - **Trigger**: Primeiro erro de um tipo novo
   - **Action**: Enviar email para você
   - **Frequência**: Imediato

---

## 🔍 Setup 2: OpenTelemetry Tracing (Desenvolvimento)

### Opção A: Console Simples (Padrão)

**Já habilitado por padrão!** Traces aparecem no console:

```bash
# .env.local (configuração padrão)
VITE_ENABLE_TRACING=false
VITE_OTLP_ENDPOINT=

# Traces aparecem no console do navegador automaticamente
```

### Opção B: AI Toolkit (Debugging Avançado)

Para visualização gráfica de traces:

#### Passo 1: Instalar AI Toolkit

```bash
# Instalar globalmente
npm install -g @vscode/ai-toolkit

# Verificar instalação
ai-toolkit --version
```

#### Passo 2: Iniciar Servidor OTLP

```bash
# Terminal 1: Iniciar AI Toolkit
ai-toolkit start

# Deve exibir:
# ✅ AI Toolkit listening on http://localhost:4318
# 📊 Traces UI: http://localhost:4318/ui
```

#### Passo 3: Configurar Variáveis

```bash
# .env.local - Habilitar tracing
VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTLP_ENDPOINT=http://localhost:4318/v1/traces
VITE_ENABLE_TRACING=true
```

#### Passo 4: Reiniciar Dev Server

```bash
# Terminal 2: Reiniciar Vite
npm run dev
```

#### Passo 5: Visualizar Traces

1. Acesse: http://localhost:4318/ui
2. Use a aplicação normalmente
3. Veja traces em tempo real
4. Analise:
   - Tempo de resposta de cada agente
   - Chamadas à Gemini API
   - Latência de workflows

---

## 🛡️ Configurações de Segurança (LGPD)

### PII Filtering Automático

O sistema já filtra automaticamente dados sensíveis:

```typescript
// ✅ Filtrados automaticamente
- CPF (formato 123.456.789-01)
- Email (exemplo@dominio.com)
- Telefone ((11) 98765-4321)
- Números de processo (0000000-00.0000.0.00.0000)
- Nomes de pessoas (João da Silva)
- Endereços completos
```

**Configuração:**
```bash
# Sempre habilitado em produção
VITE_ENABLE_PII_FILTERING=true
```

### Dados NÃO Enviados ao Sentry

```typescript
// ❌ Nunca enviado
- Senhas
- Tokens de autenticação
- Cookies de sessão
- Headers Authorization
- Conteúdo de petições completas
- PDFs e documentos
```

---

## 📈 Monitoramento de Custos

### Sentry (Plano Gratuito)

| Item | Limite Gratuito | Uso Estimado |
|------|----------------|--------------|
| Erros capturados | 5.000/mês | ~500/mês (baixo tráfego) |
| Performance traces | 10.000/mês | ~2.000/mês |
| Session replays | 1 hora/mês | Desabilitar em prod |
| Retenção | 30 dias | OK |

**Dica**: Configure **Issue Grouping** para evitar duplicatas.

### AI Toolkit (Local)

| Item | Custo |
|------|-------|
| Software | **Gratuito** (open source) |
| Armazenamento | ~100MB por sessão |
| CPU/RAM | ~200MB RAM, negligível CPU |

---

## 🔧 Troubleshooting

### Sentry não captura erros

**Verificar:**
```typescript
// 1. DSN configurado?
console.log(import.meta.env.VITE_SENTRY_DSN);

// 2. Ambiente correto?
console.log(import.meta.env.PROD); // deve ser true

// 3. Erro forçado para teste
throw new Error("Teste Sentry");
```

**Solução:**
- Verificar que `VITE_SENTRY_DSN` está em **variáveis de produção**
- Deploy novamente após alterar variáveis
- Aguardar 2-3 minutos para propagação

### OpenTelemetry 404 (v1/traces)

**Causa:** AI Toolkit não está rodando ou endpoint incorreto

**Solução:**
```bash
# 1. Verificar se AI Toolkit está ativo
curl http://localhost:4318/v1/traces
# Deve retornar 200 ou 405 (não 404)

# 2. Se não estiver, reinicie
pkill -f ai-toolkit
ai-toolkit start

# 3. Ou desabilite tracing
VITE_ENABLE_TRACING=false
```

### Traces não aparecem no AI Toolkit

**Verificar:**
```typescript
// Console do navegador deve mostrar:
// [Tracing] ✅ OTLP Endpoint ativo: http://localhost:4318/v1/traces
```

**Solução:**
- Reiniciar dev server após alterar `.env.local`
- Limpar cache do navegador (Ctrl+Shift+R)
- Verificar CORS no AI Toolkit

---

## 📚 Referências

### Documentação Oficial

- **Sentry React**: https://docs.sentry.io/platforms/javascript/guides/react/
- **OpenTelemetry**: https://opentelemetry.io/docs/instrumentation/js/
- **AI Toolkit**: https://github.com/microsoft/vscode-ai-toolkit

### Dashboards Úteis

- **Sentry Issues**: https://sentry.io/organizations/[org]/issues/
- **Sentry Performance**: https://sentry.io/organizations/[org]/performance/
- **AI Toolkit UI**: http://localhost:4318/ui (apenas local)

### Artigos Relacionados

- [LGPD e Monitoramento de Aplicações](https://docs.sentry.io/product/data-management-settings/scrubbing/)
- [Best Practices for Error Tracking](https://blog.sentry.io/error-monitoring-best-practices/)
- [OpenTelemetry for Frontend](https://opentelemetry.io/docs/demo/services/frontend/)

---

## ✅ Checklist de Configuração

### Produção (Vercel/Railway)

- [ ] Conta Sentry.io criada
- [ ] Projeto Sentry criado (React)
- [ ] DSN copiado
- [ ] `VITE_SENTRY_DSN` configurado em variáveis de ambiente
- [ ] `VITE_ENABLE_PII_FILTERING=true` configurado
- [ ] Deploy realizado
- [ ] Erro de teste capturado no Sentry
- [ ] Alertas configurados (opcional)

### Desenvolvimento Local

- [ ] `.env.local` criado (ou atualizado)
- [ ] `VITE_SENTRY_DSN=` (vazio para desabilitar)
- [ ] `VITE_ENABLE_TRACING=false` (ou true se usar AI Toolkit)
- [ ] Dev server reiniciado após mudanças
- [ ] Console não mostra erros de tracing 404

---

## 🚀 Próximos Passos

Após configurar Sentry e Tracing:

1. **Monitorar erros** nos primeiros 7 dias
2. **Criar alertas** para erros críticos
3. **Configurar releases** no Sentry para rastrear versões
4. **Habilitar Session Replay** (cuidado com quota gratuita)
5. **Configurar source maps** para melhor debugging

---

**Última atualização**: 15/12/2024
**Versão do documento**: 1.0.0
**Autor**: Assistente Jurídico PJe Team

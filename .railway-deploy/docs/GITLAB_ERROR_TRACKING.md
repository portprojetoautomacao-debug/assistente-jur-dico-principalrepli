# 🚨 GitLab Error Tracking - Setup Completo

## 📊 Informações de Configuração

### Project ID
```
76299042
```

### Error Tracking DSN
```
https://glet_11997d8fcca1f917be020f0d22aa5175@observe.gitlab.com:443/errortracking/api/v1/projects/76299042
```

### Client Key
```
glet_11997d8fcca1f917be020f0d22aa5175
```

### Status
✅ **Ativo e pronto para usar**

---

## 🔧 Instalação

### 1. Instalar Sentry SDK

```bash
cd /workspaces/assistente-juridico-p

# Para Node.js backend
npm install @sentry/node @sentry/profiling-node

# Para React frontend
npm install @sentry/react @sentry/tracing
```

### 2. Importar Error Tracking

No seu arquivo principal (`src/main.ts` ou `src/main.tsx`):

```typescript
import { initErrorTracking, setUserContext, clearUserContext } from './services/error-tracking';

// Inicializar ao startup
initErrorTracking();

// Quando usuário fazer login
setUserContext(
  user.id,
  user.email,
  user.username
);

// Quando usuário fazer logout
clearUserContext();
```

---

## 📝 Como Usar

### Capturar Erros Automaticamente

```typescript
import { captureError, captureApiError } from './services/error-tracking';

try {
  // Seu código
  await fetchData();
} catch (error) {
  // Capturar erro automaticamente
  captureError(error as Error, {
    context: "data_fetch",
    user_id: user.id,
  });
}
```

### Capturar Erros de API

```typescript
async function fetchUser(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    captureApiError(
      error as Error,
      "GET",
      `/api/users/${userId}`,
      response?.status,
      await response?.json()
    );
    throw error;
  }
}
```

### Capturar Mensagens Customizadas

```typescript
import { captureMessage } from './services/error-tracking';

// Log informativo
captureMessage("User login successful", "info");

// Warning
captureMessage("API response time > 5s", "warning");

// Error
captureMessage("Database connection failed", "error");

// Critical
captureMessage("Payment processing failed", "fatal");
```

### Monitorar Performance

```typescript
import { startTransaction } from './services/error-tracking';

async function processPayment(orderId: string) {
  const transaction = startTransaction(`process_payment_${orderId}`, "payment");
  
  try {
    // Seu código
    await submitPayment(orderId);
    
    transaction?.finish();
  } catch (error) {
    transaction?.setStatus("error");
    transaction?.finish();
    throw error;
  }
}
```

---

## 🎯 Caso de Uso: API Wrapper com Error Tracking

```typescript
// src/services/api-wrapper.ts
import { captureApiError, startTransaction } from './error-tracking';

export async function apiCall(
  method: string,
  endpoint: string,
  body?: any,
  options?: any
) {
  const transaction = startTransaction(`api_${method}_${endpoint}`, "http.request");
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      captureApiError(
        new Error(`HTTP ${response.status}: ${errorData.message}`),
        method,
        endpoint,
        response.status,
        errorData
      );
      
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    transaction?.finish();
    return data;
  } catch (error) {
    transaction?.setStatus("error");
    transaction?.finish();
    
    if (!(error instanceof Error) || !error.message.startsWith("API Error")) {
      captureApiError(
        error instanceof Error ? error : new Error(String(error)),
        method,
        endpoint
      );
    }
    
    throw error;
  }
}
```

---

## 📊 Ver Erros Capturados

### No GitLab

1. Acesse seu repositório:
   https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p

2. Vá para: **Monitor → Error Tracking**

3. Você verá todos os erros capturados com:
   - Total de ocorrências
   - Usuários afetados
   - Stack trace completo
   - Timestamps
   - Gráfico de frequência

### Criar Issue a partir do Erro

1. Clique no erro em "Error Tracking"
2. Clique em "Create issue"
3. Issue é criada automaticamente com stack trace

---

## 🔐 Segurança

### ✅ DSN Público vs Privado

A DSN pode ser pública (para frontend) ou privada (para backend).

**Configuração Recomendada:**
- Backend: Privada (não exponha em ambiente público)
- Frontend: Pública (será exposta no navegador anyway)

### Variáveis de Ambiente

```bash
# .env
SENTRY_DSN=https://glet_11997d8fcca1f917be020f0d22aa5175@observe.gitlab.com:443/errortracking/api/v1/projects/76299042
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

### Rotação de DSN

Se precisar regenerar:

```bash
# Criar nova chave
curl -X POST \
  -H "PRIVATE-TOKEN: <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "https://gitlab.com/api/v4/projects/76299042/error_tracking/client_keys"

# Listar chaves
curl -H "PRIVATE-TOKEN: <seu_token>" \
  "https://gitlab.com/api/v4/projects/76299042/error_tracking/client_keys"

# Deletar chave antiga
curl -X DELETE \
  -H "PRIVATE-TOKEN: <seu_token>" \
  "https://gitlab.com/api/v4/projects/76299042/error_tracking/client_keys/<key_id>"
```

---

## 📈 Linguagens Suportadas

| Linguagem | SDK Testado | Status |
|-----------|------------|--------|
| JavaScript/TypeScript | sentry.javascript.node:7.38.0 | ✅ |
| React | @sentry/react | ✅ |
| Python | sentry.python/1.21.0 | ✅ |
| Java | sentry.java:6.18.1 | ✅ |
| Go | sentry-go/0.20.0 | ✅ |
| Ruby | sentry.ruby:5.9.0 | ✅ |
| PHP | sentry.php/3.18.0 | ✅ |
| Rust | sentry.rust/0.31.0 | ✅ |

---

## 🎯 Exemplo Completo

### Inicializar na Aplicação

```typescript
// src/main.ts
import { initErrorTracking } from './services/error-tracking';

// Inicializar Sentry
initErrorTracking();

// Seu código da aplicação
const app = createApp(App);
app.mount('#app');
```

### API Handler com Error Tracking

```typescript
// src/api/handlers.ts
import { 
  captureApiError, 
  captureMessage, 
  setErrorTag 
} from '../services/error-tracking';

export async function handleUserLogin(email: string, password: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      captureApiError(
        new Error(error.message),
        'POST',
        '/api/auth/login',
        response.status
      );
      throw new Error('Login failed');
    }

    const { token, user } = await response.json();
    
    // Registrar login bem-sucedido
    captureMessage(`User login: ${user.email}`, 'info');
    setErrorTag('user_id', user.id);
    
    return { token, user };
  } catch (error) {
    captureMessage(`Login error: ${(error as Error).message}`, 'error');
    throw error;
  }
}
```

### React Component com Error Tracking

```typescript
// src/components/PaymentForm.tsx
import React, { useState } from 'react';
import { captureError, startTransaction } from '../services/error-tracking';

export function PaymentForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const transaction = startTransaction('payment_submission', 'payment');

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 99.99 }),
      });

      if (!response.ok) throw new Error(`Payment failed: ${response.status}`);

      const result = await response.json();
      transaction?.finish();
      
      return result;
    } catch (error) {
      transaction?.setStatus('error');
      transaction?.finish();
      
      captureError(error as Error, {
        component: 'PaymentForm',
        action: 'submit',
      });

      throw error;
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Card number" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}
```

---

## 📊 Retenção de Dados

- ⏱️ **Retenção**: 90 dias
- 📦 **Limite**: Ilimitado de eventos
- 🗑️ **Automático**: Eventos com 90+ dias são deletados

---

## 🎉 Próximos Passos

- [x] Error Tracking DSN criado
- [x] Sentry SDK integrado
- [x] Documentação completa
- [ ] Instalar `@sentry/node` e `@sentry/react`
- [ ] Importar `initErrorTracking()` no `main.ts`
- [ ] Adicionar `setUserContext()` ao login
- [ ] Testar capturando um erro
- [ ] Ver no GitLab Monitor → Error Tracking

---

## 📚 Recursos

- [GitLab Error Tracking Docs](https://docs.gitlab.com/ee/user/project/error_tracking.html)
- [Sentry SDK Documentation](https://docs.sentry.io/)
- [Sentry Node.js Integration](https://docs.sentry.io/platforms/node/)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)

---

## ✅ Checklist

- [x] Error Tracking habilitado no GitLab
- [x] DSN criado (Project ID 76299042)
- [x] Sentry SDK integrado (`src/services/error-tracking.ts`)
- [x] Documentação completa
- [ ] Instalar dependências npm
- [ ] Inicializar no app startup
- [ ] Testar com erro de teste
- [ ] Configurar alertas (opcional)
- [ ] Revisar erros capturados no Dashboard

**Tudo pronto! 🚀**

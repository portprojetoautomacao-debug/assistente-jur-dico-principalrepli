# Guia de Deploy: Arquitetura Separada (Frontend Vercel + Backend Render)

## 🎯 Objetivo

Separar a aplicação em duas partes:
- **Frontend (Vercel):** Interface React + Vite
- **Backend (Render):** API Node.js + Express para proteger chaves Spark

## 🏗️ Arquitetura

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │  HTTPS  │    Backend      │  HTTPS  │   GitHub Spark  │
│   (Vercel)      │────────▶│    (Render)     │────────▶│      API        │
│   React + Vite  │         │  Node + Express │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │                           ├─ Spark LLM
        │                           ├─ Spark KV
        │                           └─ Spark Runtime
        │
        └─ UI/UX
        └─ Autenticação Google
```

## 📁 Estrutura do Projeto

```
assistente-juridico-pje/
├── frontend/                  # Frontend (React + Vite) → Deploy na Vercel
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json           # Config Vercel (frontend apenas)
│
├── backend/                   # Backend (Node + Express) → Deploy no Render
│   ├── src/
│   │   ├── routes/
│   │   │   ├── spark.ts      # Proxy Spark API
│   │   │   ├── kv.ts         # KV operations
│   │   │   └── llm.ts        # LLM operations
│   │   ├── middleware/
│   │   │   ├── cors.ts
│   │   │   └── auth.ts
│   │   └── server.ts         # Express server
│   ├── package.json
│   ├── Dockerfile            # Para deploy no Render
│   └── render.yaml           # Config Render
│
└── docs/                      # Documentação compartilhada
```

## 🔧 Passo 1: Criar Backend Express

Crie a estrutura do backend:

```bash
# Na raiz do projeto
mkdir -p backend/src/{routes,middleware}
cd backend
npm init -y
```

### Instalar Dependências

```bash
npm install express cors dotenv @vercel/kv
npm install -D @types/express @types/cors @types/node typescript tsx nodemon
```

### package.json do Backend

```json
{
  "name": "assistente-juridico-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@vercel/kv": "^3.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/cors": "^2.8.15",
    "@types/node": "^20.8.0",
    "typescript": "^5.5.0",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.1"
  }
}
```

### backend/src/server.ts

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sparkRouter from './routes/spark.js';
import kvRouter from './routes/kv.js';
import llmRouter from './routes/llm.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/spark', sparkRouter);
app.use('/api/kv', kvRouter);
app.use('/api/llm', llmRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

### backend/src/routes/spark.ts

```typescript
import { Router } from 'express';

const router = Router();

// Proxy for Spark API
router.all('/*', async (req, res) => {
  const path = req.params[0];
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRuntimeName = process.env.GITHUB_RUNTIME_PERMANENT_NAME;
  const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';

  if (!githubToken || !githubRuntimeName) {
    return res.status(500).json({
      error: 'GitHub credentials not configured',
      message: 'GITHUB_TOKEN and GITHUB_RUNTIME_PERMANENT_NAME must be set'
    });
  }

  const targetUrl = `${githubApiUrl}/runtime/${githubRuntimeName}/${path}`;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `bearer ${githubToken}`,
    };

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Spark proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy request',
      message: error.message
    });
  }
});

export default router;
```

### backend/src/routes/kv.ts

```typescript
import { Router } from 'express';
import { kv } from '@vercel/kv';

const router = Router();

// GET key
router.get('/:key', async (req, res) => {
  try {
    const value = await kv.get(req.params.key);
    res.json({ value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SET key
router.post('/:key', async (req, res) => {
  try {
    await kv.set(req.params.key, req.body.value);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE key
router.delete('/:key', async (req, res) => {
  try {
    await kv.del(req.params.key);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### backend/src/routes/llm.ts

```typescript
import { Router } from 'express';

const router = Router();

// LLM proxy
router.post('/', async (req, res) => {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRuntimeName = process.env.GITHUB_RUNTIME_PERMANENT_NAME;
  const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';

  if (!githubToken || !githubRuntimeName) {
    return res.status(500).json({
      error: 'GitHub credentials not configured'
    });
  }

  const targetUrl = `${githubApiUrl}/runtime/${githubRuntimeName}/llm`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${githubToken}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### backend/.env.example

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# GitHub Spark
GITHUB_TOKEN=your_github_token
GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e
GITHUB_API_URL=https://api.github.com

# Vercel KV (se usar)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## 🚀 Passo 2: Deploy Backend no Render

### render.yaml

Crie `backend/render.yaml`:

```yaml
services:
  - type: web
    name: assistente-juridico-backend
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        sync: false
      - key: GITHUB_TOKEN
        sync: false
      - key: GITHUB_RUNTIME_PERMANENT_NAME
        sync: false
      - key: GITHUB_API_URL
        value: https://api.github.com
      - key: PORT
        value: 10000
```

### Passos no Render:

1. **Criar conta no Render:** https://render.com
2. **New → Web Service**
3. **Conectar repositório GitHub**
4. **Configurar:**
   - Name: `assistente-juridico-backend`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Environment Variables:**
   - `GITHUB_TOKEN` = seu token
   - `GITHUB_RUNTIME_PERMANENT_NAME` = `97a1cb1e48835e0ecf1e`
   - `FRONTEND_URL` = URL do Vercel (ex: `https://seu-app.vercel.app`)
6. **Create Web Service**

## 🎨 Passo 3: Configurar Frontend para usar Backend

### frontend/.env.example

```env
# Backend API
VITE_BACKEND_URL=http://localhost:3001

# Google OAuth
VITE_GOOGLE_CLIENT_ID=
VITE_REDIRECT_URI=http://localhost:5173

# App Config
VITE_APP_ENV=development
```

### Atualizar src/lib/config.ts

```typescript
export const config = {
  backend: {
    url: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
  },
  app: {
    environment: import.meta.env.VITE_APP_ENV || 'development',
    isDevelopment: import.meta.env.VITE_APP_ENV !== 'production',
    isProduction: import.meta.env.VITE_APP_ENV === 'production',
  },
} as const;
```

### Criar cliente API (frontend/src/lib/api-client.ts)

```typescript
import { config } from './config';

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = config.backend.url;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Spark methods
  async sparkRequest(path: string, options: RequestInit = {}) {
    return this.request(`/api/spark/${path}`, options);
  }

  // KV methods
  async kvGet(key: string) {
    return this.request(`/api/kv/${key}`);
  }

  async kvSet(key: string, value: any) {
    return this.request(`/api/kv/${key}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  // LLM methods
  async llm(messages: any[]) {
    return this.request('/api/llm', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }
}

export const apiClient = new APIClient();
```

## 🚀 Passo 4: Deploy Frontend na Vercel

### vercel.json (simplificado)

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Variáveis de Ambiente na Vercel:

1. `VITE_BACKEND_URL` = URL do Render (ex: `https://assistente-juridico-backend.onrender.com`)
2. `VITE_GOOGLE_CLIENT_ID` = Client ID do Google
3. `VITE_REDIRECT_URI` = URL do Vercel
4. `VITE_APP_ENV` = `production`

## ✅ Checklist Completo

### Backend (Render):
- [ ] Criar pasta `backend/` com estrutura
- [ ] Configurar `package.json`
- [ ] Criar `server.ts` e rotas
- [ ] Criar `render.yaml`
- [ ] Fazer commit e push
- [ ] Criar Web Service no Render
- [ ] Configurar variáveis de ambiente
- [ ] Deploy e testar endpoint `/health`

### Frontend (Vercel):
- [ ] Atualizar `config.ts` com `VITE_BACKEND_URL`
- [ ] Criar `api-client.ts`
- [ ] Atualizar componentes para usar `apiClient`
- [ ] Configurar variáveis de ambiente na Vercel
- [ ] Deploy e testar

### Testes:
- [ ] Backend responde em `/health`
- [ ] Frontend conecta ao backend
- [ ] Spark API funciona via proxy
- [ ] KV operations funcionam
- [ ] LLM funciona

## 🔒 Segurança

### No Backend (Render):
- ✅ Chaves de API ficam no servidor
- ✅ CORS configurado para aceitar apenas frontend
- ✅ Variáveis de ambiente protegidas

### No Frontend (Vercel):
- ✅ Apenas credenciais públicas (Google Client ID)
- ✅ Chama backend via HTTPS
- ✅ Sem acesso direto às chaves Spark

## 📊 Vantagens desta Arquitetura

1. **Segurança:** Chaves de API nunca expostas no frontend
2. **Escalabilidade:** Backend e frontend escalam independentemente
3. **Manutenção:** Atualizações isoladas
4. **Performance:** CDN do Vercel para frontend estático
5. **Custo:** Ambos têm planos gratuitos generosos

## 🆘 Troubleshooting

### CORS Error
- Verifique `FRONTEND_URL` no backend
- Adicione domínio do Vercel no CORS

### Backend não conecta
- Verifique logs no Render Dashboard
- Teste `/health` endpoint
- Verifique variáveis de ambiente

### Frontend não conecta ao backend
- Verifique `VITE_BACKEND_URL` na Vercel
- Use HTTPS (não HTTP) para backend

---

**Autor:** GitHub Copilot  
**Data:** 2025-11-19  
**Versão:** 1.0

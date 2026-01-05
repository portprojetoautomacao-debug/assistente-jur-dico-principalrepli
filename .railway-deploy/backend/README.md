# Backend API - Assistente Jurídico PJe

Backend API em Node.js/TypeScript para o sistema Assistente Jurídico PJe, com foco em IA jurídica e gerenciamento seguro de recursos.

> **⚠️ Nota de Migração**: O sistema foi migrado do Spark para o **Gemini 2.5 Pro**. Os endpoints e módulos legados do Spark foram mantidos para compatibilidade, mas o motor principal de IA agora é o Gemini.

## 🚀 Funcionalidades

- **Motor de IA Gemini 2.5 Pro**: Processamento de linguagem natural para análise jurídica
- **API KV Store**: Armazenamento persistente via Upstash Redis
- **Interface LLM**: Comunicação com modelos de linguagem (Gemini)
- **CORS Configurado**: Suporte para frontend
- **TypeScript**: Tipagem forte e segura
- **Health Checks**: Monitoramento de saúde da API
- **Legado Spark**: Endpoints mantidos para compatibilidade (deprecated)

## 📦 Instalação

```bash
cd backend
npm install
```

## 🏃‍♂️ Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento com hot reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Executa versão compilada
- `npm run test` - Executa testes (placeholder)

## 🌐 Endpoints da API

### Health Check
```
GET /health
```
Retorna status do servidor e ambiente.

### Spark API (⚠️ Deprecated - Mantido para Compatibilidade)
```
GET  /api/spark/status     - Status do serviço (deprecated)
POST /api/spark/auth       - Autenticação (deprecated)
GET  /api/spark/config     - Configuração (deprecated)
```

> **Nota**: Use os endpoints LLM com Gemini 2.5 Pro para novas implementações.

### KV Store API
```
GET    /api/kv             - Lista chaves
GET    /api/kv/:key        - Busca valor por chave
POST   /api/kv/:key        - Armazena valor
DELETE /api/kv/:key        - Remove chave
```

### LLM API (Gemini 2.5 Pro)
```
POST /api/llm/chat         - Chat com Gemini 2.5 Pro
POST /api/llm/embeddings   - Gera embeddings
GET  /api/llm/models       - Lista modelos disponíveis
```

## 🔒 Segurança

- **CORS**: Configurado para aceitar apenas origens autorizadas
- **Proteção de Chaves**: Chaves de API nunca expostas em logs
- **Validação**: Todos os inputs são validados
- **Rate Limiting**: Implementado para prevenir abuso

## 🛠️ Tecnologias

- **Node.js** 22+
- **Express.js** - Framework web
- **TypeScript** - Tipagem forte
- **Gemini 2.5 Pro** - Motor de IA principal
- **Upstash Redis** - KV Storage
- **CORS** - Controle de origem cruzada
- **Dotenv** - Variáveis de ambiente

## 📝 Variáveis de Ambiente

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
VITE_GEMINI_API_KEY=sua_chave_gemini
UPSTASH_REDIS_REST_URL=sua_url_upstash
UPSTASH_REDIS_REST_TOKEN=seu_token_upstash
```

## 🧪 Testes

```bash
# Health check
curl http://localhost:3001/health

# Spark status
curl http://localhost:3001/api/spark/status

# KV operations
curl http://localhost:3001/api/kv/test_key
```

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── server.ts          # Servidor principal
│   └── routes/
│       ├── spark.ts       # Rotas Spark
│       ├── kv.ts          # Rotas KV Store
│       └── llm.ts         # Rotas LLM
├── dist/                  # Código compilado
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contribuição

1. Faça fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT - veja o arquivo LICENSE para detalhes.
# Hybrid Architecture Stubs

This directory contains **safe, minimal stub files** for the hybrid AI agent architecture combining:

- **AutoGen** - Multi-agent orchestration
- **LangGraph** - Graph-based agent workflows
- **DSPy** - Prompt optimization
- **Qdrant** - Vector search and RAG (Haystack integration planned)

## 🔒 Security Features

All stubs implement critical security measures:

1. **No `eval()` or dynamic code execution** - All code is static and type-safe
2. **Token-based authentication** - API keys required for all services
3. **Input validation** - All external data is validated before processing
4. **Timeout protection** - Operations have maximum execution time limits
5. **Retry logic** - Automatic retry with exponential backoff
6. **Rate limiting** - Prevents abuse of API endpoints

## 📁 Files Added

### TypeScript/JavaScript

#### `src/agents/base/agent_state.ts`
- Base state management for LangGraph agents
- Immutable state updates
- Type-safe message handling

#### `src/agents/base/langgraph_agent.ts`
- Abstract base class for LangGraph agents
- Built-in timeout and retry logic
- AbortController support for cancellation

#### `src/agents/monitor-djen/monitor_graph.ts`
- Example LangGraph agent for DJEN monitoring
- Demonstrates workflow steps and state transitions
- Safe HTTP requests with timeout protection

#### `src/lib/qdrant-service.ts`
- Qdrant vector database client wrapper
- Secure API key authentication
- Input validation on all operations
- Vector and payload sanitization

#### `api/agents/autogen_orchestrator.ts`
- Vercel serverless function for AutoGen orchestration
- API key authentication
- Request validation
- Configurable timeout (max 45s for Vercel)

### Python

#### `scripts/dspy_bridge.py`
- HTTP bridge service for DSPy integration
- Token authentication required (`DSPY_API_TOKEN`)
- Rate limiting (100 req/min)
- CORS support with allowed origins
- No `eval()` or `exec()` - completely safe

## 🚀 Local Testing

### Prerequisites

```bash
# Node.js 22+ (required by Vercel)
node --version

# Python 3.8+ (for DSPy bridge)
python3 --version

# Docker (for Qdrant)
docker --version
```

### 1. Start Qdrant Vector Database

```bash
# Pull and run Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Qdrant UI will be available at http://localhost:6333/dashboard
```

### 2. Start DSPy Bridge

```bash
# Set API token (REQUIRED for security)
export DSPY_API_TOKEN="your-secure-random-token-here"

# Optional: Configure port and allowed origins
export DSPY_PORT=8765
export ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

# Make script executable
chmod +x scripts/dspy_bridge.py

# Start the bridge
python3 scripts/dspy_bridge.py
```

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# AutoGen Orchestrator
AUTOGEN_API_KEY=your-autogen-api-key

# Qdrant Vector DB
VITE_QDRANT_URL=http://localhost:6333
VITE_QDRANT_API_KEY=your-qdrant-api-key
VITE_QDRANT_COLLECTION=legal_docs

# DSPy Bridge
VITE_DSPY_URL=http://localhost:8765
VITE_DSPY_API_TOKEN=your-secure-random-token-here
```

### 4. Run Tests

```bash
# Install dependencies
npm install

# Run TypeScript type checking
npm run type-check

# Run unit tests
npm run test:run

# Run API tests
npm run test:api
```

### 5. Test Individual Components

#### Test LangGraph Agent

```typescript
import { monitorDJEN } from '@/agents/monitor-djen/monitor_graph';

const result = await monitorDJEN({ courtId: 'TRT02' });
console.log(result);
```

#### Test Qdrant Service

```typescript
import { createQdrantService } from '@/lib/qdrant-service';

const qdrant = createQdrantService({
  url: 'http://localhost:6333',
  apiKey: 'your-api-key',
  collectionName: 'test_collection',
});

// Create collection
await qdrant?.createCollection(384, 'Cosine');

// Upsert test data
await qdrant?.upsert([
  {
    id: '1',
    vector: new Array(384).fill(0).map(() => Math.random()),
    payload: { text: 'Test document' },
  },
]);

// Search
const results = await qdrant?.search(
  new Array(384).fill(0).map(() => Math.random()),
  5
);
console.log(results);
```

#### Test DSPy Bridge

```bash
# Test health endpoint
curl http://localhost:8765/health

# Test optimization endpoint
curl -X POST http://localhost:8765/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-random-token-here" \
  -d '{"prompt": "Optimize this legal prompt"}'
```

#### Test AutoGen Orchestrator (Locally with Vercel CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev

# Test orchestrator
curl -X POST http://localhost:3000/api/agents/autogen_orchestrator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-autogen-api-key" \
  -d '{
    "task": "Analyze legal document",
    "agents": ["harvey", "analise-documental"],
    "maxRounds": 3
  }'
```

## 🔄 Integration with Existing System

These stubs integrate with the existing 15-agent system:

| Existing Agent | Hybrid Integration |
|----------------|-------------------|
| Harvey Specter | Can use AutoGen for multi-agent coordination |
| Mrs. Justin-e | Can use LangGraph for workflow automation |
| Análise Documental | Can use Qdrant for vector similarity search |
| Monitor DJEN | Already has LangGraph stub (monitor_graph.ts) |
| Redação de Petições | Can use DSPy for prompt optimization |

## 📝 Next Steps

1. **Implement Real AutoGen Integration**
   - Install `@microsoft/autogen` (when available)
   - Replace stub orchestration with real agent coordination

2. **Implement Real LangGraph Integration**
   - Install `langchain` and `@langchain/langgraph`
   - Replace base classes with actual LangGraph constructs

3. **Implement Real DSPy Integration**
   - Install `dspy-ai` Python package
   - Replace stub optimization with real DSPy programs

4. **Implement Haystack Integration**
   - Install `haystack-ai` Python package
   - Create document indexing pipeline
   - Integrate with Qdrant for vector storage

5. **Add Comprehensive Tests**
   - Unit tests for each component
   - Integration tests for agent workflows
   - E2E tests for complete scenarios

## ⚠️ Important Notes

- **These are STUBS** - They provide the interface and security foundation but do not contain full implementations
- **Production use requires** actual library installations and complete implementations
- **Security is built-in** - All authentication, validation, and timeout mechanisms are already in place
- **Type-safe** - All TypeScript code uses strict typing
- **Documented** - Each file includes security notes and usage examples

## 📚 References

- [AutoGen Documentation](https://microsoft.github.io/autogen/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [DSPy Documentation](https://dspy-docs.vercel.app/)
- [Haystack Documentation](https://haystack.deepset.ai/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)

## 🤝 Contributing

When implementing the full versions:

1. Maintain all security features (auth, validation, timeouts)
2. Keep the same interface signatures for compatibility
3. Add comprehensive error handling
4. Update tests to cover new functionality
5. Document any breaking changes

---

**Status**: 🟡 Safe stubs ready for testing
**Next Action**: Test locally with Qdrant + DSPy bridge, then implement real integrations

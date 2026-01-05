# Sincronização de Tipos - Checklist Completo

## 📋 Tipos Centrais do Sistema

O sistema possui 3 tipos principais em [`src/types.ts`](../src/types.ts) que precisam sincronização quando alterados:

### 1. `Process` (Processos Jurídicos)

```typescript
export interface Process {
  id: string;
  numeroCNJ: string;
  titulo: string;
  autor: string;
  reu: string;
  comarca: string;
  vara: string;
  status: "ativo" | "suspenso" | "arquivado" | "concluido";
  fase?: string;
  valor?: number;
  dataDistribuicao: string;
  dataUltimaMovimentacao: string;
  notas?: string;
  prazos: Prazo[];
  createdAt: string;
  updatedAt: string;
  // Contadores automáticos
  expedientesCount?: number;
  intimacoesCount?: number;
  minutasCount?: number;
  documentosCount?: number;
  lastExpedienteAt?: string;
  lastMinutaAt?: string;
}
```

### 2. `Expediente` (Intimações/Publicações)

```typescript
export interface Expediente {
  id: string;
  processId: string;
  processoCNJ: string;
  tipo: TipoExpediente; // "intimacao" | "citacao" | "documento" | "outro"
  numero: string;
  dataPublicacao: string;
  conteudo: string;
  origem: "DJEN" | "DataJud" | "PJe" | "Manual";
  prazo?: string;
  dataLimite?: string;
  urgente?: boolean;
  lido: boolean;
  analisado: boolean;
  tags?: string[];
  createdAt: string;
  // Campos opcionais para classificação IA
  temaJuridico?: string;
  subtemas?: string[];
  confidence?: number;
}
```

### 3. `Minuta` (Documentos Gerados)

```typescript
export interface Minuta {
  id: string;
  titulo: string;
  processId?: string;
  tipo: "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";
  conteudo: string;
  status: "rascunho" | "em-revisao" | "pendente-revisao" | "finalizada" | "arquivada";
  criadoEm: string;
  atualizadoEm: string;
  autor: string;
  googleDocsId?: string;
  googleDocsUrl?: string;
  ultimaSincronizacao?: string;
  // Integração com agentes IA
  criadoPorAgente?: boolean;
  agenteId?: string;
  templateId?: string;
  expedienteId?: string;
  variaveis?: Record<string, string>;
  confidence?: number;
}
```

## 🔄 Checklist de Sincronização

### ✅ Ao Adicionar Campo em `Process`

1. **Frontend State** (`src/hooks/use-processes.ts`):
   ```typescript
   export function useProcesses() {
     const [processes, setProcesses] = useKV<Process[]>("processes", []);
     // ✅ Tipo já sincronizado via useKV<Process[]>
   }
   ```

2. **API Endpoint** (`api/pje-sync.ts`):
   ```typescript
   // ✅ Validar novo campo no payload
   const processo: Process = {
     ...camposExistentes,
     novoCard: req.body.novoCampo // <-- ADICIONAR AQUI
   };
   ```

3. **Chrome Extension** (`chrome-extension-pje/src/shared/types.ts`):
   ```typescript
   export interface ProcessoPJe {
     // Copiar definição do Process
     novoCampo?: string; // <-- ADICIONAR AQUI
   }
   ```

4. **Dashboard Contadores** (`src/components/Dashboard.tsx`):
   ```typescript
   // Se campo afeta métricas
   const totalNovoCampo = processes.filter(p => p.novoCampo).length;
   ```

5. **Testes**:
   ```bash
   # Atualizar mocks
   src/__tests__/mocks/process.mock.ts
   
   # Rodar testes
   npm run test:run -- src/hooks/use-processes.test.ts
   ```

### ✅ Ao Adicionar Campo em `Expediente`

1. **Frontend State** (`src/hooks/use-expedientes.ts`):
   ```typescript
   const [expedientes, setExpedientes] = useKV<Expediente[]>("expedientes", []);
   ```

2. **API Endpoint** (`api/expedientes.ts`):
   ```typescript
   // POST /api/expedientes
   const expediente: Expediente = {
     ...payload,
     novoCampo: req.body.novoCampo // <-- ADICIONAR
   };
   ```

3. **Agente Mrs. Justin-e** (`src/lib/agents.ts`):
   ```typescript
   // Se agente usa o campo
   async function processIntimation(expediente: Expediente) {
     const { novoCampo } = expediente; // <-- USAR AQUI
   }
   ```

4. **Dashboard** (`src/components/Dashboard.tsx`):
   ```typescript
   // Atualizar métricas
   const expedientesNovoCampo = expedientes.filter(e => e.novoCampo);
   ```

5. **Testes**:
   ```bash
   npm run test:run -- src/hooks/use-expedientes.test.ts
   npm run test:api -- api/expedientes.test.ts
   ```

### ✅ Ao Adicionar Campo em `Minuta`

1. **Frontend State** (`src/hooks/use-auto-minuta.ts`):
   ```typescript
   const [minutas, setMinutas] = useKV<Minuta[]>("minutas", []);
   ```

2. **MinutasManager** (`src/components/MinutasManager.tsx`):
   ```tsx
   <MinutaCard
     {...minuta}
     novoCampo={minuta.novoCampo} // <-- ADICIONAR PROP
   />
   ```

3. **Document Templates** (`src/lib/document-templates.ts`):
   ```typescript
   // Se campo afeta template
   export const templates = {
     peticao: {
       placeholders: {
         novoCampo: "{{novoCampo}}" // <-- ADICIONAR
       }
     }
   };
   ```

4. **Agente Redação** (`src/lib/agents.ts`):
   ```typescript
   async function createMinuta(data: MinutaData) {
     const minuta: Minuta = {
       ...data,
       novoCampo: calculaNovoCampo(data) // <-- ADICIONAR
     };
   }
   ```

5. **Dashboard** (`src/components/Dashboard.tsx`):
   ```typescript
   const minutasNovoCampo = minutas.filter(m => m.novoCampo);
   ```

6. **Testes**:
   ```bash
   npm run test:run -- src/hooks/use-auto-minuta.test.ts
   npm run test:run -- src/components/MinutasManager.test.ts
   ```

## 🎯 Hook Dependencies (Grafo de Dependências)

### `useKV()` - Base de Tudo

```
useKV<T>(key, initialValue)
  ├── Frontend cache (localStorage)
  ├── API sync (/api/kv)
  └── Upstash KV (Redis)
```

**Dependentes**:
- `useProcesses()` → `useKV<Process[]>("processes")`
- `useExpedientes()` → `useKV<Expediente[]>("expedientes")`
- `useMinutas()` → `useKV<Minuta[]>("minutas")`

### `useAutonomousAgents()` - Orquestrador

```
useAutonomousAgents()
  ├── useKV<Agent[]>("agents")
  ├── useKV<AgentTask[]>("agent_queue")
  ├── POST /api/agents
  └── Streaming updates
```

**Dependentes**:
- `AIAgents.tsx` → Exibe status de agentes
- `Dashboard.tsx` → Métricas de automação

### `useAutoMinuta()` - Criação Automática

```
useAutoMinuta()
  ├── useKV<Minuta[]>("minutas")
  ├── useAutonomousAgents() → Detecta tarefas CRIAR_MINUTA
  ├── useExpedientes() → Mapeia expediente → minuta
  └── Cria minuta automaticamente
```

**Dependentes**:
- `MinutasManager.tsx` → Exibe minutas criadas
- `App.tsx` → Usa hook global

### `useProcessSync()` - Chrome Extension Bridge

```
useProcessSync()
  ├── useKV<Process[]>("processes")
  ├── WebSocket/Polling (opcional)
  └── Incrementa contadores automaticamente
```

**Dependentes**:
- `AcervoPJe.tsx` → Lista processos sincronizados
- `Dashboard.tsx` → Métricas de processos

## 📊 Dashboard Counter Sync

### Contadores Automáticos

Ao alterar `Process`, `Expediente` ou `Minuta`, atualizar:

```typescript
// src/components/Dashboard.tsx
const metrics = {
  processes: processes.length,
  expedientes: expedientes.length,
  minutas: minutas.length,
  
  // Contadores derivados
  expedientesPendentes: expedientes.filter(e => !e.lido).length,
  minutasPendentes: minutas.filter(m => m.status === 'pendente-revisao').length,
  prazosVencendo: processes.flatMap(p => p.prazos).filter(isVencendoEm48h).length,
  
  // Se adicionar novoCampo
  novoCampoTotal: processes.filter(p => p.novoCampo).length
};
```

## 🧪 Testes de Sincronização

### Script de Validação

```bash
# Rodar todos os testes relacionados
npm run test:run -- --grep "Process|Expediente|Minuta"

# Validar tipos TypeScript
npm run type-check

# Verificar contadores do dashboard
npm run test:run -- src/components/Dashboard.test.ts
```

### Exemplo de Teste

```typescript
// src/__tests__/type-sync.test.ts
describe('Type Synchronization', () => {
  it('Process type matches API response', async () => {
    const apiResponse = await fetch('/api/pje-sync');
    const data = await apiResponse.json();
    
    // Validar todos os campos
    expect(data.processes[0]).toMatchObject<Process>({
      id: expect.any(String),
      numeroCNJ: expect.any(String),
      // ... todos os campos
    });
  });
});
```

## 📚 Documentação de Tipos

### Adicionar JSDoc

```typescript
export interface Process {
  /**
   * Identificador único do processo
   * @example "proc_abc123"
   */
  id: string;
  
  /**
   * Número CNJ completo do processo
   * @example "0001234-56.2024.8.01.0001"
   * @pattern \d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}
   */
  numeroCNJ: string;
  
  // ... documentar todos os campos
}
```

## ✅ Checklist Rápido

Ao adicionar campo em tipo:

- [ ] Atualizar `src/types.ts`
- [ ] Atualizar hook correspondente (`use-processes`, `use-expedientes`, `use-auto-minuta`)
- [ ] Atualizar API endpoint (`api/pje-sync.ts`, `api/expedientes.ts`, `api/agents.ts`)
- [ ] Atualizar contadores em `Dashboard.tsx`
- [ ] Atualizar Chrome Extension types (se `Process`)
- [ ] Adicionar testes para novo campo
- [ ] Rodar `npm run type-check`
- [ ] Rodar `npm run test:run`
- [ ] Atualizar documentação (este arquivo)

---

**Última atualização**: 13/12/2024  
**Responsável**: Sistema de manutenção automática

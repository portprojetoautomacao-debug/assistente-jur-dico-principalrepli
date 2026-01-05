# 🧪 Cenários de Teste Específicos
## Assistente Jurídico PJe - Testes Detalhados por Funcionalidade

---

## 📋 Índice
1. [Autenticação](#1-autenticação)
2. [Gestão de Processos](#2-gestão-de-processos)
3. [Sistema de Minutas](#3-sistema-de-minutas)
4. [Cálculo de Prazos](#4-cálculo-de-prazos)
5. [Agentes de IA](#5-agentes-de-ia)
6. [Busca Global](#6-busca-global)
7. [Notificações](#7-notificações)
8. [Upload de Documentos](#8-upload-de-documentos)
9. [Calendário](#9-calendário)
10. [Gestão Financeira](#10-gestão-financeira)

---

## 1. Autenticação

### Cenário 1.1: Login com Sucesso
**Pré-condições:**
- Aplicação carregada
- Usuário não autenticado

**Passos:**
1. Acessar página inicial
2. Inserir usuário: `adm`
3. Inserir senha: `adm123`
4. Clicar em "Entrar"

**Resultado esperado:**
- ✅ Redirecionamento para dashboard
- ✅ Nome do usuário visível no header
- ✅ Token salvo em localStorage
- ✅ Tempo de resposta < 2s

**Código de teste:**
```typescript
test('should login successfully with valid credentials', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="username"]', 'adm');
  await page.fill('input[name="password"]', 'adm123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=adm')).toBeVisible();
});
```

---

### Cenário 1.2: Login com Credenciais Inválidas
**Pré-condições:**
- Aplicação carregada
- Usuário não autenticado

**Passos:**
1. Acessar página inicial
2. Inserir usuário: `invalid`
3. Inserir senha: `wrong`
4. Clicar em "Entrar"

**Resultado esperado:**
- ❌ Mensagem de erro exibida
- ❌ Permanece na tela de login
- ❌ Sem token em localStorage
- ✅ Campos de input limpos

---

### Cenário 1.3: Persistência de Sessão
**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Fazer login
2. Recarregar página (F5)

**Resultado esperado:**
- ✅ Usuário permanece autenticado
- ✅ Dashboard carregado
- ✅ Sem redirecionamento para login

---

### Cenário 1.4: Logout
**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Clicar no menu do usuário
2. Clicar em "Sair"

**Resultado esperado:**
- ✅ Redirecionamento para login
- ✅ Token removido de localStorage
- ✅ Dados do usuário limpos

---

## 2. Gestão de Processos

### Cenário 2.1: Criar Processo Válido
**Pré-condições:**
- Usuário autenticado
- Na tela de processos

**Passos:**
1. Clicar em "Novo Processo"
2. Preencher campos obrigatórios:
   - Número CNJ: `1234567-89.2024.8.26.0100`
   - Título: `Ação Trabalhista - Rescisão Indireta`
   - Autor: `João da Silva`
   - Réu: `Empresa XYZ Ltda`
   - Tipo: `Trabalhista`
   - Status: `Ativo`
3. Clicar em "Salvar"

**Resultado esperado:**
- ✅ Processo criado com sucesso
- ✅ Toast de confirmação exibido
- ✅ Processo aparece na lista
- ✅ Dados salvos corretamente

**Código de teste:**
```typescript
test('should create new process', async () => {
  const process = {
    numeroCNJ: '1234567-89.2024.8.26.0100',
    titulo: 'Ação Trabalhista - Rescisão Indireta',
    autor: 'João da Silva',
    reu: 'Empresa XYZ Ltda',
    tipo: 'trabalhista',
    status: 'ativo'
  };
  
  const result = await createProcess(process);
  
  expect(result.success).toBe(true);
  expect(result.data.id).toBeDefined();
  expect(result.data.numeroCNJ).toBe(process.numeroCNJ);
});
```

---

### Cenário 2.2: Validação de Número CNJ
**Pré-condições:**
- Usuário autenticado
- Na tela de criação de processo

**Passos:**
1. Inserir número CNJ inválido: `123456`
2. Tentar salvar

**Resultado esperado:**
- ❌ Erro de validação exibido
- ❌ Processo não criado
- ✅ Mensagem clara sobre formato correto

**Formatos válidos:**
- `NNNNNNN-DD.AAAA.J.TR.OOOO`
- Exemplo: `1234567-89.2024.8.26.0100`

---

### Cenário 2.3: Editar Processo
**Pré-condições:**
- Processo existente
- Usuário autenticado

**Passos:**
1. Abrir processo
2. Clicar em "Editar"
3. Modificar campo "Status" para "Arquivado"
4. Salvar

**Resultado esperado:**
- ✅ Processo atualizado
- ✅ Histórico de alterações registrado
- ✅ Toast de confirmação

---

### Cenário 2.4: Excluir Processo
**Pré-condições:**
- Processo existente
- Usuário autenticado

**Passos:**
1. Selecionar processo
2. Clicar em "Excluir"
3. Confirmar exclusão

**Resultado esperado:**
- ✅ Diálogo de confirmação exibido
- ✅ Processo removido da lista
- ✅ Dados relacionados tratados (minutas, prazos)

---

### Cenário 2.5: Buscar Processos
**Pré-condições:**
- Múltiplos processos cadastrados

**Passos:**
1. Inserir termo de busca: "trabalhista"
2. Aplicar filtro

**Resultado esperado:**
- ✅ Apenas processos trabalhistas exibidos
- ✅ Busca em múltiplos campos (título, número, partes)
- ✅ Resultado em < 1s

---

### Cenário 2.6: Paginação
**Pré-condições:**
- Mais de 20 processos cadastrados

**Passos:**
1. Acessar lista de processos
2. Verificar paginação
3. Navegar para página 2

**Resultado esperado:**
- ✅ 20 processos por página
- ✅ Navegação funcional
- ✅ Indicador de página atual
- ✅ Total de páginas exibido

---

## 3. Sistema de Minutas

### Cenário 3.1: Criar Minuta Manual
**Pré-condições:**
- Usuário autenticado
- Na tela de minutas

**Passos:**
1. Clicar em "Nova Minuta"
2. Preencher:
   - Título: `Petição Inicial - Ação Trabalhista`
   - Tipo: `Petição`
   - Processo: Selecionar processo existente
3. Escrever conteúdo no editor
4. Salvar

**Resultado esperado:**
- ✅ Minuta criada
- ✅ Conteúdo salvo
- ✅ Vinculada ao processo

---

### Cenário 3.2: Auto-Save
**Pré-condições:**
- Minuta aberta no editor

**Passos:**
1. Escrever texto
2. Aguardar 30 segundos
3. Verificar indicador de salvamento

**Resultado esperado:**
- ✅ "Salvo automaticamente" exibido
- ✅ Sem perda de dados ao recarregar
- ✅ Timestamp de última modificação atualizado

---

### Cenário 3.3: Formatação de Texto
**Pré-condições:**
- Minuta aberta no editor TipTap

**Passos:**
1. Selecionar texto
2. Aplicar formatações:
   - Negrito (Ctrl+B)
   - Itálico (Ctrl+I)
   - Sublinhado (Ctrl+U)
   - Lista numerada
   - Lista com marcadores

**Resultado esperado:**
- ✅ Formatações aplicadas corretamente
- ✅ Atalhos de teclado funcionam
- ✅ Formatação mantida ao salvar

---

### Cenário 3.4: Inserir Tabela
**Pré-condições:**
- Minuta aberta no editor

**Passos:**
1. Clicar em "Inserir Tabela"
2. Selecionar 3x3
3. Preencher células
4. Salvar

**Resultado esperado:**
- ✅ Tabela inserida
- ✅ Células editáveis
- ✅ Formatação mantida

---

### Cenário 3.5: Exportar para PDF
**Pré-condições:**
- Minuta com conteúdo

**Passos:**
1. Abrir minuta
2. Clicar em "Exportar PDF"
3. Aguardar download

**Resultado esperado:**
- ✅ PDF gerado
- ✅ Formatação preservada
- ✅ Metadados incluídos (título, data, autor)

---

### Cenário 3.6: Minuta Criada por Agente
**Pré-condições:**
- Agente de Redação ativo
- Tarefa de redação completada

**Passos:**
1. Agente completa tarefa `DRAFT_PETITION`
2. Sistema detecta conclusão
3. Minuta criada automaticamente

**Resultado esperado:**
- ✅ Minuta criada com status "Pendente Revisão"
- ✅ Notificação exibida ao usuário
- ✅ Conteúdo do agente incluído
- ✅ Metadados do agente salvos

**Código de teste:**
```typescript
test('should auto-create minuta from agent task', async () => {
  const task: AgentTask = {
    id: 'task-1',
    agentId: 'redacao-peticoes',
    type: 'DRAFT_PETITION',
    status: 'completed',
    result: {
      success: true,
      data: {
        draft: 'Conteúdo da petição...',
        confidence: 0.85
      }
    }
  };
  
  // Simular conclusão de tarefa
  await completeAgentTask(task);
  
  // Verificar criação de minuta
  const minutas = await getMinutas();
  const newMinuta = minutas.find(m => m.criadoPorAgente);
  
  expect(newMinuta).toBeDefined();
  expect(newMinuta.status).toBe('pendente-revisao');
  expect(newMinuta.conteudo).toContain('Conteúdo da petição');
});
```

---

## 4. Cálculo de Prazos

### Cenário 4.1: Prazo Simples (Dias Úteis)
**Entrada:**
- Data inicial: `15/01/2024` (segunda-feira)
- Prazo: 15 dias úteis
- Tipo: Cível

**Resultado esperado:**
- Data final: `05/02/2024`
- Considerando apenas dias úteis
- Excluindo sábados e domingos

**Código de teste:**
```typescript
test('should calculate 15 business days correctly', () => {
  const startDate = '15/01/2024';
  const deadline = calculateDeadline(startDate, 15, 'civel');
  
  expect(deadline).toBe('05/02/2024');
});
```

---

### Cenário 4.2: Prazo com Feriado Nacional
**Entrada:**
- Data inicial: `01/11/2024` (sexta-feira)
- Prazo: 5 dias úteis
- Feriado: 15/11 (Proclamação da República)

**Resultado esperado:**
- Data final: `08/11/2024`
- Feriado não contado

---

### Cenário 4.3: Prazo com Recesso Forense
**Entrada:**
- Data inicial: `15/12/2024`
- Prazo: 10 dias úteis
- Recesso: 20/12/2024 a 06/01/2025

**Resultado esperado:**
- Data final: `17/01/2025`
- Dias de recesso não contados

---

### Cenário 4.4: Validação de Data Inválida
**Entrada:**
- Data: `31/02/2024` (fevereiro não tem 31 dias)

**Resultado esperado:**
- ❌ Erro de validação
- ✅ Mensagem clara sobre data inválida

**Código de teste:**
```typescript
test('should reject invalid date like Feb 31', () => {
  const result = parseBrazilianDate('31/02/2024');
  
  expect(result).toBeNull();
});
```

---

### Cenário 4.5: Ano Bissexto
**Entrada:**
- Data: `29/02/2024` (2024 é bissexto)

**Resultado esperado:**
- ✅ Data aceita
- ✅ Cálculo correto

**Código de teste:**
```typescript
test('should accept Feb 29 in leap year', () => {
  const result = parseBrazilianDate('29/02/2024');
  
  expect(result).not.toBeNull();
  expect(result?.getUTCDate()).toBe(29);
});
```

---

## 5. Agentes de IA

### Cenário 5.1: Harvey - Análise Estratégica
**Entrada:**
```json
{
  "task": "Analisar estratégia para ação trabalhista de rescisão indireta",
  "urgency": "high",
  "context": "Cliente trabalhou 5 anos sem registro CLT"
}
```

**Resultado esperado:**
- ✅ Análise estratégica gerada
- ✅ Recomendações específicas
- ✅ Confidence score > 0.7
- ✅ Tempo de resposta < 30s

---

### Cenário 5.2: Justine - Análise de Intimações
**Entrada:**
```json
{
  "task": "Analisar intimação do processo 1234567-89.2024.8.26.0100",
  "priority": "high",
  "publications": [
    {
      "id": "pub-1",
      "court": "TJSP",
      "date": "2024-01-15",
      "content": "Intima-se o advogado para apresentar contestação..."
    }
  ]
}
```

**Resultado esperado:**
- ✅ Intimação identificada
- ✅ Prazo calculado
- ✅ Ação recomendada
- ✅ Urgência classificada

---

### Cenário 5.3: Análise Documental
**Entrada:**
```json
{
  "documentoTexto": "Contrato de prestação de serviços entre...",
  "tipoDocumento": "contrato"
}
```

**Resultado esperado:**
- ✅ Partes identificadas
- ✅ Cláusulas importantes destacadas
- ✅ Riscos identificados
- ✅ Sugestões de melhoria

---

### Cenário 5.4: Gestão de Prazos (Agente)
**Entrada:**
```json
{
  "tipoProcesso": "trabalhista",
  "dataPublicacao": "2024-01-15",
  "prazoEmDias": 15
}
```

**Resultado esperado:**
- ✅ Prazo calculado corretamente
- ✅ Feriados considerados
- ✅ Alerta criado no calendário

---

### Cenário 5.5: Redação de Petições
**Entrada:**
```json
{
  "detalhes": "Petição inicial de ação trabalhista por rescisão indireta",
  "tipoDocumento": "peticao_inicial",
  "contexto": "Cliente trabalhou 5 anos sem registro"
}
```

**Resultado esperado:**
- ✅ Petição redigida
- ✅ Estrutura jurídica correta
- ✅ Fundamentação legal incluída
- ✅ Minuta criada automaticamente

---

### Cenário 5.6: Retry de Agente com Falha
**Pré-condições:**
- Agente falhou na primeira tentativa

**Passos:**
1. Agente executa tarefa
2. Falha (timeout, erro de API)
3. Sistema agenda retry

**Resultado esperado:**
- ✅ Status muda para `pending_retry`
- ✅ `retryCount` incrementado
- ✅ `nextRunAt` definido com backoff exponencial
- ✅ Retry executado automaticamente

**Código de teste:**
```typescript
test('should retry failed agent task with backoff', () => {
  const task: AgentTask = {
    id: 'task-1',
    agentId: 'harvey',
    type: 'CASE_STRATEGY',
    status: 'failed',
    retryCount: 0,
    maxRetries: 3
  };
  
  const retriedTask = agendarRetryTarefa(task);
  
  expect(retriedTask.status).toBe('pending_retry');
  expect(retriedTask.retryCount).toBe(1);
  expect(retriedTask.nextRunAt).toBeDefined();
  
  const nextRun = new Date(retriedTask.nextRunAt!);
  const now = new Date();
  const delayMs = nextRun.getTime() - now.getTime();
  
  // Primeiro retry: ~10s (com jitter 8.5-11.5s)
  expect(delayMs).toBeGreaterThan(8000);
  expect(delayMs).toBeLessThan(12000);
});
```

---

## 6. Busca Global

### Cenário 6.1: Busca por Processo
**Pré-condições:**
- Processos cadastrados

**Passos:**
1. Pressionar `/` (atalho)
2. Digitar: `trabalhista`
3. Verificar resultados

**Resultado esperado:**
- ✅ Modal de busca abre
- ✅ Processos trabalhistas listados
- ✅ Debounce de 150ms aplicado
- ✅ Máximo 5 resultados por categoria

---

### Cenário 6.2: Navegação por Teclado
**Pré-condições:**
- Busca aberta com resultados

**Passos:**
1. Pressionar `↓` (seta para baixo)
2. Pressionar `↑` (seta para cima)
3. Pressionar `Enter`

**Resultado esperado:**
- ✅ Seleção move entre resultados
- ✅ Resultado selecionado destacado
- ✅ Enter navega para item selecionado

---

### Cenário 6.3: Filtro por Categoria
**Pré-condições:**
- Busca com múltiplos resultados

**Passos:**
1. Buscar: `silva`
2. Clicar em categoria "Pessoas"

**Resultado esperado:**
- ✅ Apenas clientes exibidos
- ✅ Processos e minutas ocultos
- ✅ Contador atualizado

---

## 7. Notificações

### Cenário 7.1: Nova Notificação
**Pré-condições:**
- Usuário autenticado

**Passos:**
1. Agente completa tarefa
2. Sistema gera notificação

**Resultado esperado:**
- ✅ Badge de contador atualizado
- ✅ Toast exibido (opcional)
- ✅ Som reproduzido (se habilitado)

---

### Cenário 7.2: Marcar como Lida
**Pré-condições:**
- Notificações não lidas

**Passos:**
1. Abrir centro de notificações
2. Clicar em notificação

**Resultado esperado:**
- ✅ Notificação marcada como lida
- ✅ Badge decrementado
- ✅ Estilo visual atualizado

---

### Cenário 7.3: Marcar Todas como Lidas
**Pré-condições:**
- Múltiplas notificações não lidas

**Passos:**
1. Abrir centro de notificações
2. Clicar em "Marcar todas como lidas"

**Resultado esperado:**
- ✅ Todas marcadas como lidas
- ✅ Badge zerado
- ✅ Confirmação visual

---

## 8. Upload de Documentos

### Cenário 8.1: Upload de PDF Válido
**Pré-condições:**
- Na tela de upload

**Passos:**
1. Selecionar arquivo PDF (< 10MB)
2. Clicar em "Upload"

**Resultado esperado:**
- ✅ Arquivo enviado
- ✅ Barra de progresso exibida
- ✅ Preview gerado
- ✅ OCR executado (Tesseract.js)

---

### Cenário 8.2: Validação de Tipo de Arquivo
**Pré-condições:**
- Na tela de upload

**Passos:**
1. Tentar enviar arquivo .docx

**Resultado esperado:**
- ❌ Erro de validação
- ✅ Mensagem: "Apenas arquivos PDF são aceitos"

---

### Cenário 8.3: Validação de Tamanho
**Pré-condições:**
- Na tela de upload

**Passos:**
1. Tentar enviar PDF > 10MB

**Resultado esperado:**
- ❌ Erro de validação
- ✅ Mensagem: "Arquivo muito grande (máx: 10MB)"

---

### Cenário 8.4: OCR de Texto
**Pré-condições:**
- PDF com texto escaneado

**Passos:**
1. Upload de PDF
2. Aguardar OCR

**Resultado esperado:**
- ✅ Texto extraído
- ✅ Confiança > 70%
- ✅ Texto editável gerado

---

## 9. Calendário

### Cenário 9.1: Adicionar Evento
**Pré-condições:**
- Na visualização de calendário

**Passos:**
1. Clicar em data
2. Preencher:
   - Título: `Audiência Preliminar`
   - Data: `15/02/2024`
   - Hora: `14:00`
   - Processo: Selecionar
3. Salvar

**Resultado esperado:**
- ✅ Evento criado
- ✅ Aparece no calendário
- ✅ Notificação agendada

---

### Cenário 9.2: Arrastar e Soltar
**Pré-condições:**
- Evento existente

**Passos:**
1. Arrastar evento para nova data
2. Soltar

**Resultado esperado:**
- ✅ Evento movido
- ✅ Data atualizada
- ✅ Confirmação visual

---

### Cenário 9.3: Sincronização com Google Calendar
**Pré-condições:**
- Google Calendar configurado

**Passos:**
1. Criar evento
2. Verificar Google Calendar

**Resultado esperado:**
- ✅ Evento sincronizado
- ✅ Bidirecional (ambos os lados)

---

## 10. Gestão Financeira

### Cenário 10.1: Adicionar Receita
**Pré-condições:**
- Na tela financeira

**Passos:**
1. Clicar em "Nova Receita"
2. Preencher:
   - Descrição: `Honorários - Processo 123`
   - Valor: `R$ 5.000,00`
   - Data: `15/01/2024`
   - Categoria: `Honorários`
3. Salvar

**Resultado esperado:**
- ✅ Receita registrada
- ✅ Saldo atualizado
- ✅ Gráfico atualizado

---

### Cenário 10.2: Adicionar Despesa
**Pré-condições:**
- Na tela financeira

**Passos:**
1. Clicar em "Nova Despesa"
2. Preencher:
   - Descrição: `Custas Processuais`
   - Valor: `R$ 500,00`
   - Data: `15/01/2024`
   - Categoria: `Custas`
3. Salvar

**Resultado esperado:**
- ✅ Despesa registrada
- ✅ Saldo atualizado
- ✅ Gráfico atualizado

---

### Cenário 10.3: Filtro por Período
**Pré-condições:**
- Múltiplas transações

**Passos:**
1. Selecionar período: `01/01/2024 a 31/01/2024`
2. Aplicar filtro

**Resultado esperado:**
- ✅ Apenas transações do período exibidas
- ✅ Totais recalculados
- ✅ Gráficos atualizados

---

### Cenário 10.4: Exportar Relatório
**Pré-condições:**
- Transações cadastradas

**Passos:**
1. Selecionar período
2. Clicar em "Exportar"
3. Escolher formato: PDF

**Resultado esperado:**
- ✅ PDF gerado
- ✅ Contém todas as transações
- ✅ Totais calculados
- ✅ Gráficos incluídos

---

## 📝 Notas de Implementação

### Priorização de Testes
1. **🔴 Críticos** - Devem passar 100%
2. **🟡 Altos** - Devem passar > 95%
3. **🟢 Médios** - Devem passar > 80%

### Automação
- Testes unitários: 100% automatizados
- Testes de integração: 90% automatizados
- Testes E2E: 70% automatizados
- Testes manuais: 30% (exploratórios)

### Frequência de Execução
- **CI/CD:** Todos os testes unitários
- **Nightly:** Testes de integração + E2E
- **Pré-deploy:** Suite completa
- **Pós-deploy:** Smoke tests

---

**Última atualização:** Janeiro 2026  
**Próxima revisão:** Antes do deploy em produção

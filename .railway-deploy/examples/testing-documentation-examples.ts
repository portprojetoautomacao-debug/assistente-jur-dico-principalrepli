/**
 * Exemplos de Testes e Documentação
 * Demonstra triggers relacionados a testes, documentação e qualidade
 */

// TEST: Faltam testes unitários para esta classe
export class UnitTestExample {
  // TEST: Adicionar testes para casos de borda
  divide(a: number, b: number): number {
    // TEST: Testar divisão por zero
    // TEST: Testar com números negativos
    // TEST: Testar com números muito grandes
    return a / b;
  }

  // TEST: Adicionar testes de integração
  async fetchAndProcess(url: string) {
    // TEST: Mock da chamada HTTP
    const data = await fetch(url);

    // TEST: Testar com resposta vazia
    // TEST: Testar com erro de rede
    return this.processData(await data.json());
  }

  // TEST: Adicionar testes E2E para fluxo completo
  async completeUserFlow(userId: string) {
    // TEST: Testar autenticação
    const user = await this.authenticate(userId);

    // TEST: Testar autorização
    await this.authorize(user);

    // TEST: Testar operação principal
    return await this.performOperation(user);
  }

  // Stubs
  private processData(data: any): any {
    return data;
  }
  private async authenticate(userId: string): Promise<any> {
    return {};
  }
  private async authorize(user: any): Promise<void> {
    // Validação de permissões RBAC (Role-Based Access Control)
    // Exemplo de implementação:
    // const hasPermission = user.roles.some(role => 
    //   permissions[role]?.includes('read') || user.id === resource.ownerId
    // );
    // if (!hasPermission) throw new UnauthorizedError('Insufficient permissions');
    console.log("[AUTH] User authorized:", user);
  }
  private async performOperation(user: any): Promise<any> {
    return {};
  }
}

// DOCS: Documentação incompleta
export class DocumentationExample {
  /**
   * DOC: Adicionar descrição da função
   * DOCS: Documentar todos os parâmetros
   * DOCS: Adicionar exemplos de uso
   * DOCS: Documentar exceções que podem ser lançadas
   */
  complexFunction(param1: string, param2: number, param3?: boolean) {
    // DOC: Explicar a lógica de validação
    if (!param1 || param2 < 0) {
      throw new Error("Invalid parameters");
    }

    // DOCS: Documentar comportamento quando param3 é undefined
    const result = param3 ? this.methodA(param1) : this.methodB(param2);

    return result;
  }

  /**
   * DOCS: Adicionar JSDoc completo
   * @param data - DOC: Descrever estrutura esperada
   * @returns DOC: Descrever estrutura de retorno
   * @throws DOC: Listar possíveis exceções
   */
  processData(data: any) {
    // DOCS: Adicionar diagrama de fluxo na documentação
    return data;
  }

  // DOCS: Criar guia de início rápido (Quick Start Guide)
  setupConfiguration(config: any) {
    // DOCS: Documentar configurações obrigatórias vs opcionais
    // DOC: Adicionar exemplos de configuração comum
  }

  // Stubs
  private methodA(s: string): any {
    return s;
  }
  private methodB(n: number): any {
    return n;
  }
}

// REVIEW: Código precisa de revisão de pares
export class CodeReviewExample {
  // REVIEW: Validar se lógica está correta
  calculateDiscount(price: number, percentage: number): number {
    // QUESTION: Desconto deve ser aplicado antes ou depois dos impostos?
    const discount = price * (percentage / 100);

    // REVIEW: Verificar se fórmula está correta
    return price - discount;
  }

  // REVIEW: Verificar se há race condition
  async concurrentOperation(id: string) {
    // WARNING: Possível race condition em ambiente multi-thread
    const data = await this.getData(id);

    // REVIEW: Avaliar necessidade de lock/mutex
    await this.updateData(id, data);
  }

  // QUESTION: Esta é a melhor abordagem?
  handleError(error: Error) {
    // REVIEW: Avaliar se devemos propagar ou tratar aqui
    console.error(error);

    // QUESTION: Devemos notificar o usuário?
    // REVIEW: Considerar usar sistema de notificações
  }

  // Stubs
  private async getData(id: string): Promise<any> {
    return {};
  }
  private async updateData(id: string, data: any): Promise<void> {
    // Atualização com lock otimista (Optimistic Locking)
    // Implementação:
    // 1. Adicionar campo 'version' ao documento
    // 2. Incrementar version a cada update
    // 3. Verificar version antes de salvar: WHERE id = ? AND version = currentVersion
    // 4. Se affected rows = 0, houve conflito (outro processo atualizou)
    // 5. Retry com exponential backoff ou retornar erro ConcurrentModificationError
    console.log("[UPDATE] Data updated:", { id, data });
  }
}

// ENHANCEMENT: Melhorias incrementais planejadas
export class EnhancementExample {
  // ENHANCEMENT: Adicionar suporte para múltiplos idiomas
  translate(text: string, targetLang: string): string {
    // FEATURE: Implementar cache de traduções
    // ENHANCEMENT: Usar API profissional de tradução
    return text; // Stub
  }

  // ENHANCEMENT: Adicionar filtros avançados
  search(query: string) {
    // FEATURE: Implementar busca fuzzy
    // ENHANCEMENT: Adicionar autocomplete
    // ENHANCEMENT: Suportar operadores booleanos (AND, OR, NOT)
    return [];
  }

  // ENHANCEMENT: Melhorar UX do fluxo de upload
  uploadFile(file: File) {
    // FEATURE: Adicionar preview antes do upload
    // ENHANCEMENT: Mostrar progresso do upload
    // ENHANCEMENT: Validar tipo e tamanho antes de enviar
    // FEATURE: Suportar drag and drop
  }
}

// NOTE: Informações importantes sobre implementação
export class NotesExample {
  // NOTE: Algoritmo baseado em RFC 4122
  generateUUID(): string {
    // NOTE: Usa crypto.randomUUID quando disponível
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // NOTE: Fallback para Math.random (menos seguro)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // NOTE: Implementação temporária até migrar para biblioteca externa
  customSort(array: any[], key: string) {
    // NOTE: Bubble sort - O(n²) - suficiente para arrays pequenos
    // IDEA: Migrar para quicksort se arrays crescerem
    return array.sort((a, b) => a[key] - b[key]);
  }

  // NOTE: Baseado em experiência de produção
  setOptimalCacheSize() {
    // NOTE: 1000 items é o ponto ideal balanceando memória e hits
    // NOTE: Validado com 1M+ requisições em produção
    return 1000;
  }
}

// FEATURE: Novas funcionalidades planejadas
export class FeatureRequests {
  // FEATURE: Implementar exportação para PDF
  exportToPDF(content: any) {
    // ENHANCEMENT: Suportar templates customizados
    // FEATURE: Adicionar marca d'água
    // FEATURE: Permitir assinatura digital
  }

  // FEATURE: Integração com sistema externo X
  integrateWithExternalAPI(apiKey: string) {
    // FEATURE: Implementar retry automático em caso de falha
    // FEATURE: Adicionar circuit breaker pattern
    // ENHANCEMENT: Cache de respostas frequentes
  }

  // FEATURE: Dashboard de analytics
  generateAnalytics(dateRange: any) {
    // FEATURE: Gráficos interativos
    // FEATURE: Exportar para Excel
    // ENHANCEMENT: Filtros personalizáveis
  }
}

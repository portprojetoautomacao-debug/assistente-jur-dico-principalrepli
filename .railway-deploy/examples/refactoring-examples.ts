/**
 * Exemplos de Refatoração e Débito Técnico
 * Demonstra triggers relacionados a melhoria de código e manutenção
 */

// REFACTOR: Classe muito grande - quebrar em módulos menores
export class MonolithicService {
  // DEBT: Código duplicado em 5 lugares diferentes
  validateInput(data: any): boolean {
    if (!data) return false;
    if (typeof data !== "object") return false;
    if (Object.keys(data).length === 0) return false;
    return true;
  }

  // REFACTOR: Extrair para serviço separado de validação
  validateEmail(email: string): boolean {
    // CLEANUP: Usar biblioteca de validação ao invés de regex manual
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // DEPRECATED: Usar biblioteca date-fns ao invés de lógica customizada
  formatDate(date: Date): string {
    // DEBT: Lógica de formatação duplicada em 3 componentes
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // BREAKING: Método será removido na v2.0
  legacyMethod(param: string) {
    // WARNING: Usar newMethod() ao invés deste
    console.warn("This method is deprecated");
    return this.newMethod(param);
  }

  private newMethod(param: string) {
    return param.toUpperCase();
  }
}

// CLEANUP: Arquivo com código morto e imports não utilizados
export class UnusedCodeExample {
  // CLEANUP: Variável nunca utilizada - remover
  private unusedVariable = "never used";

  // CLEANUP: Método nunca chamado - pode ser removido
  private orphanedMethod() {
    // DEBT: Lógica complexa que ninguém mais usa
    return "orphaned";
  }

  // CLEANUP: Console.logs de debug esquecidos
  debugMethod() {
    console.log("Debug 1"); // CLEANUP: Remover antes de produção
    console.log("Debug 2"); // CLEANUP: Remover antes de produção
    console.log("Debug 3"); // CLEANUP: Remover antes de produção
  }

  // CLEANUP: Comentários obsoletos
  processData(data: any) {
    // Validação implementada em 2023 - mantida para compatibilidade
    // Versão atual usa Zod schemas em src/lib/validation.ts
    // NOTE: Código antigo comentado abaixo (pré-2020, IE6 descontinuado)
    // const oldWay = doSomethingOld();
    // const anotherOldWay = doSomethingElse();

    return data;
  }
}

// REFACTOR: Separar responsabilidades (SRP violation)
export class GodObject {
  // REFACTOR: Extrair para DatabaseService
  async saveToDatabase(data: any) {
    // DEBT: Lógica de persistência misturada com lógica de negócio
  }

  // REFACTOR: Extrair para ValidationService
  validateBusinessRules(data: any) {
    // DEBT: 500 linhas de validação - quebrar em funções menores
  }

  // REFACTOR: Extrair para NotificationService
  sendNotifications(users: any[]) {
    // DEBT: Código de email/SMS misturado com lógica de usuário
  }

  // REFACTOR: Extrair para ReportService
  generateReport(type: string) {
    // WARNING: Função com 50+ parâmetros - usar objeto config
  }
}

// OPTIMIZE: Algoritmo ineficiente O(n²)
export class PerformanceIssues {
  // OPTIMIZE: Usar Map ao invés de Array.find em loop
  findDuplicates(items: any[]) {
    const duplicates = [];

    // PERFORMANCE: Complexidade O(n²) - refatorar para O(n)
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].id === items[j].id) {
          duplicates.push(items[i]);
        }
      }
    }

    return duplicates;
  }

  // OPTIMIZE: Implementar cache para evitar recalcular
  expensiveCalculation(input: number) {
    // PERFORMANCE: Cálculo pesado executado repetidamente
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(input * i);
    }
    return result;
  }

  // OPTIMIZE: Lazy loading para arrays grandes
  loadAllData() {
    // PERFORMANCE: Carregando 1M+ registros na memória de uma vez
    // IDEA: Implementar paginação ou streaming
    return this.fetchMillionRecords();
  }

  // Stub
  private fetchMillionRecords(): any[] {
    return [];
  }
}

// IDEA: Considerar usar padrão Observer para notificações
export class NotificationSystem {
  // IDEA: Implementar queue para processar notificações em lote
  async sendBulkNotifications(users: any[]) {
    // PERFORMANCE: Enviando uma por uma - usar batch processing
    for (const user of users) {
      await this.sendEmail(user);
    }
  }

  // ENHANCEMENT: Adicionar suporte para templates personalizados
  sendEmail(user: any) {
    // FEATURE: Implementar sistema de templates
    // IDEA: Usar handlebars ou mustache para templates
    return `Email para ${user.email}`;
  }

  // QUESTION: Devemos permitir cancelar notificações agendadas?
  scheduleNotification(delay: number, message: string) {
    // REVIEW: Avaliar uso de job queue (Bull, Bee-Queue)
    setTimeout(() => {
      console.log(message);
    }, delay);
  }
}

// NOTE: Código baseado no algoritmo de Dijkstra
export class GraphAlgorithm {
  // NOTE: Implementação otimizada para grafos esparsos
  findShortestPath(graph: any, start: string, end: string) {
    // REVIEW: Considerar algoritmo A* para melhor performance
    // NOTE: Complexidade O(V² + E) onde V=vértices, E=arestas
    return [];
  }

  // DOCS: Adicionar exemplo de uso na documentação
  traverseGraph(graph: any) {
    // DOC: Explicar diferença entre DFS e BFS
    // DOCS: Documentar casos de uso de cada abordagem
  }
}

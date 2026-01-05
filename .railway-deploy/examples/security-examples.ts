/**
 * Exemplos de Segurança e Performance
 * Demonstra triggers relacionados a segurança, performance e otimização
 */

// CRITICAL: Sistema de autenticação vulnerável
export class AuthService {
  // SECURITY: Hash de senha usando bcrypt sem salt
  hashPassword(password: string): string {
    // URGENTE: Implementar salt adequado
    return btoa(password); // INSEGURO!
  }

  // SECURITY: Implementar rate limiting para prevenir brute force
  async login(email: string, password: string) {
    // CRITICAL: Falta validação de entrada
    const user = await this.findUser(email);

    // WARNING: Comparação de senha em texto plano
    if (user.password === password) {
      // SECURITY: Token JWT sem expiração
      return this.generateToken(user);
    }

    return null;
  }

  // DEPRECATED: Usar OAuth 2.0 ao invés de sessões customizadas
  createSession(userId: string) {
    // BREAKING: Sessions serão removidas na v3.0
    return { userId, sessionId: Math.random().toString() };
  }

  // Stubs
  private async findUser(email: string): Promise<any> {
    return {};
  }
  private generateToken(user: any): string {
    return "";
  }
}

// PERFORMANCE: Query extremamente lenta (5-10 segundos)
export class DatabaseService {
  // OPTIMIZE: Adicionar índices nas colunas de busca frequente
  async searchProcesses(filters: any) {
    // PERFORMANCE: Query N+1 - buscar processos e expedientes separadamente
    const processes = await this.getAllProcesses();

    for (const process of processes) {
      // OPTIMIZE: Usar JOIN ao invés de queries separadas
      process.expedientes = await this.getExpedientes(process.id);

      // PERFORMANCE: Loop desnecessário - usar bulk operations
      for (const exp of process.expedientes) {
        exp.metadata = await this.getMetadata(exp.id);
      }
    }

    return processes;
  }

  // REFACTOR: Migrar para query builder para melhor manutenibilidade
  async complexQuery(params: any) {
    // DEBT: SQL raw string - difícil de manter
    const sql = `SELECT * FROM processes WHERE status = '${params.status}'`;

    // CRITICAL: SQL Injection vulnerability
    return this.execute(sql);
  }

  // Stubs
  private async getAllProcesses(): Promise<any[]> {
    return [];
  }
  private async getExpedientes(id: string): Promise<any[]> {
    return [];
  }
  private async getMetadata(id: string): Promise<any> {
    return {};
  }
  private async execute(sql: string): Promise<any> {
    return {};
  }
}

// A11Y: Componente não acessível
export class UIComponent {
  // ACCESSIBILITY: Adicionar suporte para leitores de tela
  renderDialog() {
    // A11Y: Falta aria-label, role e aria-modal
    return `
      <div class="dialog">
        <!-- ACCESSIBILITY: Botão sem label descritivo -->
        <button onclick="close()">×</button>
        
        <!-- A11Y: Contraste de cores insuficiente (WCAG AA) -->
        <p style="color: #ccc;">Conteúdo do diálogo</p>
      </div>
    `;
  }

  // ACCESSIBILITY: Implementar navegação por teclado (Tab, Esc, Enter)
  handleKeyboard(event: KeyboardEvent) {
    // A11Y: Falta tratamento de Escape para fechar
    // A11Y: Falta trap de foco dentro do modal
  }
}

// TEST: Faltam testes de segurança
export class PaymentService {
  // CRITICAL: Processamento de pagamento sem validação adequada
  async processPayment(amount: number, cardNumber: string) {
    // SECURITY: Número de cartão sendo logado - PCI DSS violation
    console.log("Processing payment:", cardNumber);

    // CRITICAL: Falta validação de valor mínimo/máximo
    // SECURITY: Implementar 3D Secure para transações

    // WARNING: Dados sensíveis em memória por muito tempo
    const transaction = {
      amount,
      card: cardNumber, // SECURITY: Armazenar apenas últimos 4 dígitos
      timestamp: Date.now(),
    };

    return transaction;
  }

  // COMPLIANCE: Implementar logs de auditoria para transações
  async refundPayment(transactionId: string) {
    // JURIDICO: Verificar regras de estorno conforme CDC
    // PRAZO: Processar estorno em até 7 dias úteis
  }
}

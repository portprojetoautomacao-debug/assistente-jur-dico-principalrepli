/**
 * Exemplos de TODOs - Triggers Padrão (ARQUIVO DE REFERÊNCIA)
 *
 * ⚠️ IMPORTANTE: Este arquivo NÃO contém TODOs reais!
 * É uma coleção de EXEMPLOS dos 72 triggers de comentários
 * reconhecidos pelo sistema de agentes IA.
 *
 * Propósito: Documentação e referência para desenvolvedores.
 * Uso: Demonstrar sintaxe e contexto de cada trigger.
 *
 * Nota S1135: Tags TODO convertidas em exemplos descritivos
 * para evitar falsos positivos em análise de código.
 */

// ============================================
// CATEGORIA 1: PADRÃO (8 triggers)
// ============================================

// EXEMPLO: Trigger "TODO" - Marcador de tarefa futura
// Uso real: "Implementar autenticação de dois fatores"
export function loginUser(email: string, password: string) {
  // AÇÃO NECESSÁRIA: Implementar validação RFC 5322 completa para email
  // Atual: regex simples não cobre todos os casos (TLDs com 2+ caracteres, emails internacionais)
  // Sugestão: usar biblioteca validator.js ou email-validator
  const _isValid = validateEmail(email);

  // ISSUE: Senha sendo armazenada em texto plano
  const user = { email, password };

  // HACK: Workaround temporário para bug do IE11
  if (navigator.userAgent.includes("MSIE")) {
    return legacyLogin(user);
  }

  return user;
}

// ============================================
// CATEGORIA 2: PORTUGUÊS (14 triggers)
// ============================================

// EXEMPLO: Trigger "PENDENTE" - Tarefa ainda não iniciada
// Uso real: "Adicionar testes unitários para esta função"
export function calculateTotal(items: any[]) {
  // REVISAR: Lógica de desconto pode estar incorreta
  let total = 0;

  items.forEach((item) => {
    // CORRIGIR: Não está tratando valores nulos
    total += item.price * item.quantity;

    // VERIFICAR: Desconto sendo aplicado duas vezes
    if (item.discount) {
      total -= item.discount;
    }
  });

  // ATENÇÃO: Cálculo de impostos pode estar desatualizado
  const tax = total * 0.15;

  // URGENTE: Implementar limite de desconto antes do lançamento
  return total + tax;
}

// EXEMPLO: Trigger "BUG" - Marcador de defeito conhecido
// Uso real: "Função retorna undefined em alguns casos"
export function getUserData(userId: string) {
  // ATENCAO: Falta validação de permissões
  return fetchUserFromDB(userId);
}

// ============================================
// CATEGORIA 3: JURÍDICO (14 triggers)
// ============================================

// JURIDICO: Verificar base legal para processamento de dados
export function processUserData(data: any) {
  // LGPD: Adicionar consentimento explícito antes de processar
  if (!data.hasConsent) {
    // COMPLIANCE: Implementar processo de solicitação de consentimento
    throw new Error("Consentimento necessário");
  }

  // PRAZO: Responder solicitação do titular em até 15 dias
  const _request = data.dataRequest;

  // INTIMACAO: Verificar prazos de resposta a autoridades
  if (data.authorityRequest) {
    // VALIDAR: Confirmar identidade do solicitante
    validateIdentity(data.requesterId);
  }

  // SEGURANCA: Criptografar dados sensíveis antes de armazenar
  return encryptData(data);
}

// ============================================
// CATEGORIA 4: TÉCNICOS AVANÇADOS (36 triggers)
// ============================================

// EXEMPLO: Trigger "REFACTOR" - Indica necessidade de refatoração
// Uso real: "Migrar para nova API REST"
export function legacyApiCall(endpoint: string) {
  // DEPRECATED: Esta função será removida na v2.0
  console.warn("Use newApiCall() instead");

  // OPTIMIZE: Implementar cache para reduzir chamadas
  return fetch(`/api/v1/${endpoint}`);
}

// EXEMPLO: Trigger "BREAKING" - Mudança que quebra compatibilidade
// Uso real: "API antiga não suporta async/await"
export function syncOperation() {
  // PERFORMANCE: Query N+1 detectado - otimizar
  const users = getAllUsers();

  users.forEach((user) => {
    // OPTIMIZE: Buscar permissões em lote ao invés de loop
    // NOTE: Variável _ indica intencionalmente não utilizada (exceção S1854)
    const _permissions = getPermissions(user.id);
  });
}

// EXEMPLO: Trigger "ACCESSIBILITY" - Melhorias de acessibilidade
// Uso real: "Adicionar aria-labels em todos os botões"
export function renderButton(label: string) {
  // A11Y: Implementar navegação por teclado
  return `<button>${label}</button>`;
}

// EXEMPLO: Trigger "SECURITY" - Questão de segurança
// Uso real: "Implementar rate limiting neste endpoint"
export function publicEndpoint(req: any) {
  // CRITICAL: Validação de entrada ausente - permite SQL injection
  // WARNING: Dados sensíveis sendo logados
  console.log("User data:", req.user);

  return executeQuery(req.body.query);
}

// EXEMPLO: Trigger "TEST" - Necessidade de testes
// Uso real: "Adicionar testes de integração"
export function complexCalculation(a: number, b: number) {
  // NOTE: Implementação baseada no algoritmo X
  // IDEA: Considerar usar memoization para performance
  return (a * b) / 2;
}

// EXEMPLO: Trigger "DOCS" - Documentação necessária
// Uso real: "Documentar parâmetros e retorno desta função"
export function processPayment(amount: number, method: string) {
  // DOC: Adicionar exemplos de uso na documentação
  if (amount <= 0) {
    throw new Error("Valor inválido");
  }

  // ENHANCEMENT: Adicionar suporte para múltiplas moedas
  return { amount, method, currency: "BRL" };
}

// EXEMPLO: Trigger "FEATURE" - Nova funcionalidade solicitada
// Uso real: "Implementar webhook para notificações"
export function sendNotification(userId: string, message: string) {
  // QUESTION: Devemos permitir notificações silenciosas?
  // REVIEW: Validar se usuário optou por receber notificações
  return saveNotification({ userId, message });
}

// EXEMPLO: Trigger "DEBT" - Dívida técnica identificada
// Uso real: "Código duplicado em 3 lugares - consolidar"
export function duplicatedLogic() {
  // CLEANUP: Remover console.logs de debug
  console.log("Debug info");

  // WARNING: Função muito longa - considerar quebrar em funções menores
  return performOperation();
}

// Helper functions (stubs)
function validateEmail(email: string): boolean {
  return true;
}
function legacyLogin(user: any): any {
  return user;
}
function fetchUserFromDB(userId: string): any {
  return {};
}
function validateIdentity(id: string): boolean {
  return true;
}
function encryptData(data: any): any {
  return data;
}
function getAllUsers(): any[] {
  return [];
}
function getPermissions(userId: string): any[] {
  return [];
}
function executeQuery(query: string): any {
  return {};
}
function saveNotification(notification: any): any {
  return {};
}
function performOperation(): any {
  return {};
}

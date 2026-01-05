/**
 * Sistema centralizado de tratamento de erros para a extensão
 */
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Captura e trata erros de forma padronizada
   */
  handle(error, context = '', severity = 'error') {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message || error,
      stack: error.stack,
      context,
      severity,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Log no console de forma estruturada
    console. group(`🚨 ${severity.toUpperCase()}: ${context}`);
    console.error('Mensagem:', errorInfo.message);
    console. error('Stack:', errorInfo.stack);
    console.error('Contexto:', context);
    console.groupEnd();

    // Armazena no log local
    this.errorLog.push(errorInfo);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Salva no storage local para análise posterior
    this.saveToStorage(errorInfo);

    // Notifica o usuário de forma amigável
    this.notifyUser(errorInfo);

    // Envia para o servidor (se crítico)
    if (severity === 'critical') {
      this.sendToServer(errorInfo);
    }

    return errorInfo;
  }

  /**
   * Salva erros no storage local
   */
  async saveToStorage(errorInfo) {
    try {
      const errors = await chrome.storage.local. get('errors') || { errors: [] };
      errors. errors = errors.errors || [];
      errors.errors.push(errorInfo);
      
      // Mantém apenas os últimos 50 erros
      if (errors.errors.length > 50) {
        errors.errors = errors.errors.slice(-50);
      }
      
      await chrome.storage.local.set({ errors: errors. errors });
    } catch (e) {
      console.error('Erro ao salvar log:', e);
    }
  }

  /**
   * Notifica o usuário de forma não intrusiva
   */
  notifyUser(errorInfo) {
    const messages = {
      network: 'Erro de conexão. Verifique sua internet.',
      auth: 'Erro de autenticação. Faça login novamente.',
      parse: 'Erro ao processar dados do PJe.',
      ai: 'Erro ao processar com IA. Tente novamente.',
      default: 'Ocorreu um erro.  Tente novamente.'
    };

    const errorType = this.identifyErrorType(errorInfo. message);
    const userMessage = messages[errorType] || messages.default;

    // Cria notificação amigável
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Assistente Jurídico PJe',
        message: userMessage,
        priority: errorInfo.severity === 'critical' ?  2 : 1
      });
    }
  }

  /**
   * Identifica o tipo de erro
   */
  identifyErrorType(message) {
    if (/network|fetch|connection/i.test(message)) return 'network';
    if (/auth|token|unauthorized/i.test(message)) return 'auth';
    if (/parse|syntax|json/i.test(message)) return 'parse';
    if (/ai|gpt|openai/i.test(message)) return 'ai';
    return 'default';
  }

  /**
   * Envia erros críticos para o servidor
   */
  async sendToServer(errorInfo) {
    try {
      await fetch('https://seu-servidor.com/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo)
      });
    } catch (e) {
      console.error('Erro ao enviar log para servidor:', e);
    }
  }

  /**
   * Wrapper para promises com retry automático
   */
  async withRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = 2,
      onRetry = () => {}
    } = options;

    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          const waitTime = delay * Math.pow(backoff, i);
          console.log(`Tentativa ${i + 1} falhou.  Tentando novamente em ${waitTime}ms... `);
          onRetry(i + 1, error);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }
}

// Exporta instância única (Singleton)
const errorHandler = new ErrorHandler();
export default errorHandler;
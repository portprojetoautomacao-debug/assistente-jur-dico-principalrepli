import { consultarDJEN, type DJENConfig, type DJENFilteredResult } from "@/lib/djen-api";

export interface DJENMonitorConfig {
  tribunais: string[];
  advogados: Array<{
    nome?: string;
    oab?: string;
  }>;
  /**
   * Intervalo em horas entre execuções automáticas.
   * Default: 24h → modo diário.
   */
  intervaloHoras?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  /**
   * Callback para integração com o agente de IA / notificações.
   * Ex.: enfileirar tarefas para o AgentTaskQueue.
   */
  notificarCallback?: (publicacoes: DJENFilteredResult[]) => void;
  logCallback?: (message: string, level: "info" | "warn" | "error") => void;
}

export interface DJENMonitorTask {
  id: string;
  status: "idle" | "running" | "paused" | "error";
  lastRun?: string;
  nextRun?: string;
  totalPublicacoesEncontradas: number;
  ultimasPublicacoes: DJENFilteredResult[];
  erros: Array<{ timestamp: string; message: string }>;
}

export class DJENMonitorAgent {
  private config: DJENMonitorConfig;
  private readonly task: DJENMonitorTask;
  private intervalId?: ReturnType<typeof setInterval>;
  private isRunning: boolean = false;

  constructor(config: DJENMonitorConfig) {
    this.config = {
      intervaloHoras: 24, // diário por padrão
      maxRetries: 3,
      retryDelayMs: 5000,
      ...config,
    };

    this.task = {
      id: `djen-monitor-${Date.now()}`,
      status: "idle",
      totalPublicacoesEncontradas: 0,
      ultimasPublicacoes: [],
      erros: [],
    };
  }

  private log(message: string, level: "info" | "warn" | "error" = "info") {
    if (this.config.logCallback) {
      this.config.logCallback(`[DJEN Monitor] ${message}`, level);
    } else {
      console[level](`[DJEN Monitor] ${message}`);
    }
  }

  private calcularProximaExecucao(): Date {
    const agora = new Date();
    const intervaloMs = (this.config.intervaloHoras || 24) * 60 * 60 * 1000;
    return new Date(agora.getTime() + intervaloMs);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async consultarComRetry(
    configConsulta: DJENConfig,
    advogado: { nome?: string; oab?: string }
  ): Promise<{
    resultados: DJENFilteredResult[];
    erros: Array<{ tribunal: string }>;
  }> {
    const maxRetries = this.config.maxRetries || 3;
    const retryDelay = this.config.retryDelayMs || 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resultado = await consultarDJEN(configConsulta);
        return resultado;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

        if (attempt === maxRetries) {
          this.log(
            `Falha após ${maxRetries} tentativas para ${
              advogado.nome || advogado.oab
            }: ${errorMessage}`,
            "error"
          );
          throw error;
        }

        this.log(
          `Tentativa ${attempt}/${maxRetries} falhou para ${
            advogado.nome || advogado.oab
          }. Tentando novamente em ${retryDelay * attempt}ms...`,
          "warn"
        );

        await this.sleep(retryDelay * attempt); // backoff incremental
      }
    }

    throw new Error("Max retries exceeded");
  }

  // ===== Helper methods for executarConsulta (reduced CC) =====

  private isAdvogadoValido(advogado: { nome?: string; oab?: string }): boolean {
    return !!(advogado.nome || advogado.oab);
  }

  private buildConsultaConfig(advogado: { nome?: string; oab?: string }): DJENConfig {
    return {
      tribunais: this.config.tribunais,
      searchTerms: {
        nomeAdvogado: advogado.nome,
        numeroOAB: advogado.oab,
      },
      timeout: 60000,
      delayBetweenRequests: 1500,
    };
  }

  private getAdvogadoIdentifier(advogado: { nome?: string; oab?: string }): string {
    return advogado.nome || advogado.oab || "desconhecido";
  }

  private handleAdvogadoError(advogado: { nome?: string; oab?: string }, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    this.log(
      `Erro ao consultar advogado ${this.getAdvogadoIdentifier(advogado)}: ${errorMessage}`,
      "error"
    );

    this.task.erros.push({
      timestamp: new Date().toISOString(),
      message: errorMessage,
    });

    // Limita histórico de erros
    if (this.task.erros.length > 100) {
      this.task.erros = this.task.erros.slice(-50);
    }
  }

  private processResultado(
    resultado: {
      resultados: DJENFilteredResult[];
      erros: Array<{ tribunal: string }>;
    },
    advogado: { nome?: string; oab?: string },
    todasPublicacoes: DJENFilteredResult[]
  ): void {
    const identifier = this.getAdvogadoIdentifier(advogado);

    if (resultado.resultados.length > 0) {
      this.log(
        `Encontradas ${resultado.resultados.length} publicação(ões) para ${identifier}`,
        "info"
      );
      todasPublicacoes.push(...resultado.resultados);
    }

    if (resultado.erros.length > 0) {
      const tribunais = resultado.erros.map((e) => e.tribunal).join(", ");
      this.log(`Erros ao consultar tribunais para ${identifier}: ${tribunais}`, "warn");
    }
  }

  private handlePublicacoesEncontradas(todasPublicacoes: DJENFilteredResult[]): void {
    this.task.totalPublicacoesEncontradas += todasPublicacoes.length;
    this.task.ultimasPublicacoes = todasPublicacoes;

    if (this.config.notificarCallback) {
      try {
        this.config.notificarCallback(todasPublicacoes);
      } catch {
        this.log("Erro ao executar callback de notificação", "error");
      }
    }

    this.log(
      `Total de ${todasPublicacoes.length} publicação(ões) relevante(s) encontrada(s) nesta execução`,
      "info"
    );
  }

  private finalizarConsulta(): void {
    this.task.lastRun = new Date().toISOString();
    this.task.nextRun = this.calcularProximaExecucao().toISOString();
    this.task.status = "idle";
    this.log(
      `Próxima execução agendada para ${new Date(this.task.nextRun).toLocaleString("pt-BR")}`
    );
  }

  // ===== Main refactored method =====

  private async executarConsulta(): Promise<void> {
    if (!this.isRunning) return;

    this.task.status = "running";
    this.log("Iniciando consulta ao DJEN (modo diário automático, janela = hoje)...");

    const todasPublicacoes: DJENFilteredResult[] = [];

    for (const advogado of this.config.advogados) {
      if (!this.isAdvogadoValido(advogado)) {
        this.log("Advogado sem nome e sem OAB ignorado na consulta", "warn");
        continue;
      }

      try {
        const configConsulta = this.buildConsultaConfig(advogado);
        const resultado = await this.consultarComRetry(configConsulta, advogado);
        this.processResultado(resultado, advogado, todasPublicacoes);
      } catch (error) {
        this.handleAdvogadoError(advogado, error);
      }
    }

    if (todasPublicacoes.length > 0) {
      this.handlePublicacoesEncontradas(todasPublicacoes);
    } else {
      this.log("Nenhuma publicação relevante encontrada nesta execução", "info");
    }

    this.finalizarConsulta();
  }

  public iniciar(): void {
    if (this.isRunning) {
      this.log("Monitor já está em execução", "warn");
      return;
    }

    this.isRunning = true;
    this.task.status = "running";
    this.log("Monitor DJEN iniciado (modo automático)");

    // Primeira rodada imediata
    void this.executarConsulta();

    const intervaloMs = (this.config.intervaloHoras || 24) * 60 * 60 * 1000;
    this.intervalId = setInterval(() => {
      void this.executarConsulta();
    }, intervaloMs);

    this.task.nextRun = this.calcularProximaExecucao().toISOString();
  }

  public pausar(): void {
    if (!this.isRunning) {
      this.log("Monitor já está pausado", "warn");
      return;
    }

    this.isRunning = false;
    this.task.status = "paused";

    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.log("Monitor DJEN pausado");
  }

  public retomar(): void {
    if (this.isRunning) {
      this.log("Monitor já está em execução", "warn");
      return;
    }

    this.log("Retomando monitor DJEN...");
    this.iniciar();
  }

  public parar(): void {
    this.pausar();
    this.task.status = "idle";
    this.task.nextRun = undefined;
    this.log("Monitor DJEN parado");
  }

  public getStatus(): DJENMonitorTask {
    return { ...this.task };
  }

  public executarAgora(): void {
    if (this.task.status === "running") {
      this.log("Já há uma consulta em execução", "warn");
      return;
    }

    this.log("Executando consulta manual agora...");
    void this.executarConsulta();
  }

  public limparHistorico(): void {
    this.task.ultimasPublicacoes = [];
    this.task.erros = [];
    this.log("Histórico limpo");
  }

  public atualizarConfig(novaConfig: Partial<DJENMonitorConfig>): void {
    const estaRodando = this.isRunning;

    if (estaRodando) {
      this.pausar();
    }

    this.config = {
      ...this.config,
      ...novaConfig,
    };

    this.log("Configuração do Monitor DJEN atualizada");

    if (estaRodando) {
      this.retomar();
    }
  }
}

export function criarMonitorDJEN(config: DJENMonitorConfig): DJENMonitorAgent {
  return new DJENMonitorAgent(config);
}

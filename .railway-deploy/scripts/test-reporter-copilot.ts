
/**
 * Custom Vitest Reporter para Copilot
 * Envia resultados de testes automaticamente para análise do Copilot
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { File, Reporter, Task, Vitest } from "vitest";

interface TestResult {
  timestamp: string;
  duration: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  suites: SuiteResult[];
  summary: string;
  errors: ErrorDetail[];
  coverage?: CoverageData;
}

interface SuiteResult {
  name: string;
  file: string;
  tests: TestDetail[];
  duration: number;
  status: "passed" | "failed" | "skipped";
}

interface TestDetail {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

interface ErrorDetail {
  test: string;
  file: string;
  message: string;
  stack?: string;
}

interface CoverageData {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

export default class CopilotReporter implements Reporter {
  private ctx!: Vitest;
  private results: TestResult;
  private startTime: number = 0;

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      duration: 0,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: [],
      summary: "",
      errors: [],
    };
  }

  onInit(ctx: Vitest) {
    this.ctx = ctx;
    this.startTime = Date.now();
    console.log("🤖 Copilot Reporter iniciado - testes serão enviados automaticamente");
  }

  onFinished(files?: File[]) {
    if (!files) return;

    this.results.duration = Date.now() - this.startTime;
    this.processFiles(files);
    this.generateSummary();
    this.saveResults();
    this.notifyCopilot();
  }

  private processFiles(files: File[]) {
    for (const file of files) {
      const suite = this.processSuite(file);
      this.results.suites.push(suite);
    }
  }

  private processSuite(file: File): SuiteResult {
    const tests: TestDetail[] = [];
    let suiteDuration = 0;
    let suiteStatus: "passed" | "failed" | "skipped" = "passed";

    const processTasks = (tasks: Task[]) => {
      for (const task of tasks) {
        if (task.type === "test") {
          const duration = task.result?.duration || 0;
          suiteDuration += duration;

          const status =
            task.result?.state === "pass"
              ? "passed"
              : task.result?.state === "skip"
                ? "skipped"
                : "failed";

          if (status === "failed") {
            suiteStatus = "failed";
            this.results.failed++;

            // Adicionar erro detalhado
            this.results.errors.push({
              test: task.name,
              file: file.filepath,
              message: task.result?.errors?.[0]?.message || "Unknown error",
              stack: task.result?.errors?.[0]?.stack,
            });
          } else if (status === "passed") {
            this.results.passed++;
          } else {
            this.results.skipped++;
          }

          this.results.total++;

          tests.push({
            name: task.name,
            status,
            duration,
            error: status === "failed" ? task.result?.errors?.[0]?.message : undefined,
          });
        }

        if (task.tasks) {
          processTasks(task.tasks);
        }
      }
    };

    processTasks(file.tasks);

    return {
      name: file.name,
      file: file.filepath,
      tests,
      duration: suiteDuration,
      status: suiteStatus,
    };
  }

  private generateSummary() {
    const { total, passed, failed, skipped, duration } = this.results;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : "0";
    const durationSec = (duration / 1000).toFixed(2);

    this.results.summary = `
╔════════════════════════════════════════════════════════════════╗
║             🧪 RELATÓRIO AUTOMÁTICO DE TESTES                  ║
╚════════════════════════════════════════════════════════════════╝

⏱️  Tempo total: ${durationSec}s
📊 Total de testes: ${total}

${passed > 0 ? `✅ Passaram: ${passed}` : ""}
${failed > 0 ? `❌ Falharam: ${failed}` : ""}
${skipped > 0 ? `⏭️  Ignorados: ${skipped}` : ""}

📈 Taxa de sucesso: ${passRate}%
📅 Executado em: ${new Date(this.results.timestamp).toLocaleString("pt-BR")}

${failed > 0 ? this.formatErrors() : ""}

${this.generateRecommendations()}
`;
  }

  private formatErrors(): string {
    let output = "\n🔍 ERROS DETECTADOS:\n\n";

    this.results.errors.slice(0, 5).forEach((error, index) => {
      output += `${index + 1}. ${error.test}\n`;
      output += `   📁 ${error.file}\n`;
      output += `   💬 ${error.message}\n\n`;
    });

    if (this.results.errors.length > 5) {
      output += `   ... e mais ${this.results.errors.length - 5} erros\n`;
    }

    return output;
  }

  private generateRecommendations(): string {
    const { passed, failed, total } = this.results;
    const recommendations: string[] = [];

    if (failed > 0) {
      recommendations.push("🔧 Corrija os testes falhando antes de fazer commit");
      recommendations.push("🤖 Use '@workspace corrigir testes falhando' para ajuda do Copilot");
    }

    if (total === 0) {
      recommendations.push("⚠️  Nenhum teste foi executado - verifique a configuração");
    }

    if (passed === total && total > 0) {
      recommendations.push("🎉 Todos os testes passaram! Pronto para commit");
    }

    if (this.results.duration > 60000) {
      recommendations.push("⚡ Testes demorando muito - considere paralelização");
    }

    return recommendations.length > 0
      ? `\n💡 RECOMENDAÇÕES:\n${recommendations.map((r) => `   ${r}`).join("\n")}\n`
      : "";
  }

  private saveResults() {
    const resultsDir = join(process.cwd(), ".test-results");

    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir, { recursive: true });
    }

    try {
      // Salvar JSON completo
      const jsonPath = join(resultsDir, "latest-test-results.json");
      writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

      // Salvar resumo em texto
      const txtPath = join(resultsDir, "latest-test-summary.txt");
      writeFileSync(txtPath, this.results.summary);

      // Salvar histórico
      const historyPath = join(resultsDir, `test-${Date.now()}.json`);
      writeFileSync(historyPath, JSON.stringify(this.results, null, 2));

      console.log(`\n📝 Resultados salvos em: ${resultsDir}`);
    } catch (err: unknown) {
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = String(err);
      }
      console.error(
        `\n❌ Erro ao salvar resultados dos testes em '${resultsDir}':\n` +
        `   ${errorMessage}\n` +
        "   Verifique permissões de escrita e se o caminho existe.\n"
      );
    }
  }

  private notifyCopilot() {
    // Criar arquivo de notificação para Copilot
    const copilotDir = join(process.cwd(), ".copilot-notifications");

    if (!existsSync(copilotDir)) {
      mkdirSync(copilotDir, { recursive: true });
    }

    const notification = {
      type: "test-results",
      timestamp: this.results.timestamp,
      priority: this.results.failed > 0 ? "high" : "normal",
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        duration: this.results.duration,
      },
      action_required: this.results.failed > 0,
      message:
        this.results.failed > 0
          ? `❌ ${this.results.failed} teste(s) falhando - atenção necessária`
          : `✅ Todos os ${this.results.passed} testes passaram`,
      details_path: ".test-results/latest-test-results.json",
    };

    const notificationPath = join(copilotDir, "test-notification.json");
    writeFileSync(notificationPath, JSON.stringify(notification, null, 2));

    // Imprimir resumo no console
    console.log(this.results.summary);

    console.log("\n🤖 Resultados enviados para Copilot:");
    console.log(`   📂 ${notificationPath}`);
    console.log(`   📊 Status: ${notification.message}`);

    if (this.results.failed > 0) {
      console.log("\n💬 Peça ajuda ao Copilot com:");
      console.log("   @workspace analisar resultados dos testes");
      console.log("   @workspace corrigir testes falhando");
    }
  }
}

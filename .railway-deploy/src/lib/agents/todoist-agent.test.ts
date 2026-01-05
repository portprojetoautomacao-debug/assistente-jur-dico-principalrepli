import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoist mocks to ensure they are applied before imports
const mocks = vi.hoisted(() => {
  return {
    getTodoistClient: vi.fn(),
    updateLegalTask: vi.fn(),
    addLegalTasks: vi.fn(),
    callGemini: vi.fn(),
    llmService: {
      execute: vi.fn(),
    },
    googleCalendarService: {
      createEvent: vi.fn(),
    },
    todoistApi: {
      addComment: vi.fn(),
    },
  };
});

// Mock dependencies
vi.mock("../todoist-integration", () => ({
  getTodoistClient: mocks.getTodoistClient,
  updateLegalTask: mocks.updateLegalTask,
  addLegalTasks: mocks.addLegalTasks,
}));

vi.mock("../llm-service", () => ({
  llmService: mocks.llmService,
}));

vi.mock("../google-calendar-service", () => ({
  googleCalendarService: mocks.googleCalendarService,
}));

vi.mock("../gemini-service", () => ({
  callGemini: mocks.callGemini,
}));

// Import the agent AFTER mocking
import { todoistAgent } from "./todoist-agent";

describe("TodoistAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock return values
    mocks.getTodoistClient.mockReturnValue(mocks.todoistApi);
  });

  describe("processWebhookEvent", () => {
    it("should handle item:updated event", async () => {
      const event = {
        event_name: "item:updated",
        event_data: {
          id: "123",
          content: "Test Task",
          due: { date: "2023-10-27" },
        },
      };

      // Spy on console.log to verify execution flow (since handleItemUpdated logs)
      const consoleSpy = vi.spyOn(console, "log");

      await todoistAgent.processWebhookEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agente Todoist processando evento"),
        "item:updated"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Data da tarefa 123 atualizada")
      );
    });

    it("should handle item:completed event", async () => {
      const event = {
        event_name: "item:completed",
        event_data: {
          id: "123",
          content: "Processo 1234567-89.2023.8.26.0100",
        },
      };

      const consoleSpy = vi.spyOn(console, "log");

      await todoistAgent.processWebhookEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Tarefa Processo 1234567-89.2023.8.26.0100 concluída!")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Atualizando progresso do processo")
      );
    });

    it("should handle note:added event (comments)", async () => {
      const event = {
        event_name: "note:added",
        event_data: {
          id: "note_123",
          item_id: "task_123",
          content: "@Harvey reagendar para amanhã",
        },
      };

      // Mock LLM response
      mocks.llmService.execute.mockResolvedValue(
        JSON.stringify({
          action: "reschedule",
          parameters: {
            taskId: "task_123",
            date: "2023-10-28",
          },
          confidence: 0.9,
        })
      );

      await todoistAgent.processWebhookEvent(event);

      expect(mocks.llmService.execute).toHaveBeenCalled();
      expect(mocks.updateLegalTask).toHaveBeenCalledWith("task_123", {
        dueDate: "2023-10-28",
      });
    });

    it("should ignore unknown events", async () => {
      const event = {
        event_name: "unknown:event",
        event_data: { id: "1", content: "Unknown task" },
      };

      const consoleSpy = vi.spyOn(console, "log");

      await todoistAgent.processWebhookEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith("Evento ignorado pelo agente:", "unknown:event");
    });
  });

  describe("Command Interpretation & Execution", () => {
    it('should interpret and execute "reschedule" command', async () => {
      // We can access private methods by casting to any if needed,
      // but better to test via public interface (processWebhookEvent with note:added)

      const event = {
        event_name: "note:added",
        event_data: {
          id: "note_1",
          item_id: "task_1",
          content: "@Harvey remarcar para 2023-12-25",
        },
      };

      mocks.llmService.execute.mockResolvedValue(
        JSON.stringify({
          action: "reschedule",
          parameters: {
            taskId: "task_1",
            date: "2023-12-25",
          },
          confidence: 0.95,
        })
      );

      await todoistAgent.processWebhookEvent(event);

      expect(mocks.updateLegalTask).toHaveBeenCalledWith("task_1", {
        dueDate: "2023-12-25",
      });
    });

    it('should interpret and execute "update_status" (urgency) command', async () => {
      const event = {
        event_name: "note:added",
        event_data: {
          id: "note_2",
          item_id: "task_2",
          content: "URGENTE: verificar isso agora",
        },
      };

      // Simulate LLM failure or fallback logic
      mocks.llmService.execute.mockRejectedValue(new Error("LLM Error"));

      await todoistAgent.processWebhookEvent(event);

      // Should fall back to simple keyword matching for "urgente"
      expect(mocks.updateLegalTask).toHaveBeenCalledWith("task_2", {
        priority: 4,
      });
    });

    it('should interpret and execute "create_event" command', async () => {
      const event = {
        event_name: "note:added",
        event_data: {
          id: "note_3",
          item_id: "task_3",
          content: "@Harvey criar reunião dia 2023-11-01 às 14:00",
        },
      };

      mocks.llmService.execute.mockResolvedValue(
        JSON.stringify({
          action: "create_event",
          parameters: {
            date: "2023-11-01",
            startTime: "14:00",
            description: "Reunião",
          },
          confidence: 0.9,
        })
      );

      await todoistAgent.processWebhookEvent(event);

      expect(mocks.googleCalendarService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          date: "2023-11-01",
          time: "14:00",
          title: "Reunião",
        })
      );
    });
  });

  describe("Issue #146 - Sugestões Inteligentes com Gemini", () => {
    it("should generate intelligent suggestions when process task is completed", async () => {
      const event = {
        event_name: "item:completed",
        event_data: {
          id: "task_456",
          content: "Protocolar contestação - Processo 1234567-89.2024.8.09.0000",
        },
      };

      // Mock resposta do Gemini com sugestões estruturadas
      mocks.callGemini.mockResolvedValue({
        text: JSON.stringify({
          tasks: [
            {
              content: "Preparar documentos para audiência - Processo 1234567-89.2024.8.09.0000",
              description: "Separar provas documentais e preparar rol de testemunhas",
              dueDate: "7 days",
              priority: 4,
            },
            {
              content: "Verificar publicação DJEN - Processo 1234567-89.2024.8.09.0000",
              description: "Conferir diário oficial para novas intimações",
              dueDate: "tomorrow",
              priority: 3,
            },
            {
              content: "Atualizar cliente - Processo 1234567-89.2024.8.09.0000",
              description: "Enviar relatório de andamento processual",
              dueDate: "3 days",
              priority: 2,
            },
          ],
          reasoning:
            "Após protocolar contestação, próxima fase é audiência preliminar. É importante preparar documentação, monitorar publicações e manter cliente informado.",
        }),
        metadata: {
          model: "gemini-2.5-pro",
          totalTokens: 512,
        },
      });

      // Mock criação de tarefas no Todoist
      mocks.addLegalTasks.mockResolvedValue([
        { id: "new_task_1", content: "Preparar documentos para audiência..." },
        { id: "new_task_2", content: "Verificar publicação DJEN..." },
        { id: "new_task_3", content: "Atualizar cliente..." },
      ]);

      const consoleSpy = vi.spyOn(console, "log");

      await todoistAgent.processWebhookEvent(event);

      // Verificar que Gemini foi chamado
      expect(mocks.callGemini).toHaveBeenCalledWith(
        expect.stringContaining("Processo: 1234567-89.2024.8.09.0000"),
        expect.objectContaining({
          temperature: 0.7,
          maxOutputTokens: 2048,
        })
      );

      // Verificar que tarefas foram criadas
      expect(mocks.addLegalTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("Preparar documentos para audiência"),
            priority: 4,
            labels: expect.arrayContaining(["auto-generated", "ai-suggestion", "processo"]),
          }),
          expect.objectContaining({
            content: expect.stringContaining("Verificar publicação DJEN"),
            priority: 3,
            labels: expect.arrayContaining(["auto-generated", "ai-suggestion", "processo"]),
          }),
          expect.objectContaining({
            content: expect.stringContaining("Atualizar cliente"),
            priority: 2,
            labels: expect.arrayContaining(["auto-generated", "ai-suggestion", "processo"]),
          }),
        ])
      );

      // Verificar logs de sucesso
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gerando sugestões inteligentes para processo")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/✨ Estratégia sugerida:.*audiência preliminar/i)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("3 tarefas criadas automaticamente pelo Gemini")
      );
    });

    it("should handle Gemini API error with fallback to default suggestion", async () => {
      const event = {
        event_name: "item:completed",
        event_data: {
          id: "task_789",
          content: "Análise de documentos - Processo 9876543-21.2024.5.02.0001",
        },
      };

      // Mock erro do Gemini
      mocks.callGemini.mockResolvedValue({
        text: "",
        error: "API quota exceeded",
      });

      // Mock criação de tarefa padrão (fallback)
      mocks.addLegalTasks.mockResolvedValue([
        {
          id: "default_task",
          content: "Verificar publicação - Processo 9876543-21.2024.5.02.0001",
        },
      ]);

      const consoleSpy = vi.spyOn(console, "log");
      const consoleErrorSpy = vi.spyOn(console, "error");

      await todoistAgent.processWebhookEvent(event);

      // Verificar que erro foi registrado
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erro ao chamar Gemini:"),
        "API quota exceeded"
      );

      // Verificar que fallback foi usado
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Usando sugestão padrão (fallback)")
      );

      // Verificar que tarefa padrão foi criada
      expect(mocks.addLegalTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("Verificar publicação"),
            priority: 3,
            labels: expect.arrayContaining(["auto-generated", "default-suggestion", "processo"]),
          }),
        ])
      );
    });

    it("should handle invalid JSON response from Gemini with fallback", async () => {
      const event = {
        event_name: "item:completed",
        event_data: {
          id: "task_999",
          content: "Juntar documentos - Processo 5555555-55.2024.4.03.0000",
        },
      };

      // Mock resposta inválida do Gemini (JSON malformado)
      mocks.callGemini.mockResolvedValue({
        text: "Aqui estão as sugestões: { tasks: [ invalid json",
        metadata: {
          model: "gemini-2.5-pro",
        },
      });

      // Mock criação de tarefa padrão
      mocks.addLegalTasks.mockResolvedValue([
        {
          id: "fallback_task",
          content: "Verificar publicação - Processo 5555555-55.2024.4.03.0000",
        },
      ]);

      const consoleErrorSpy = vi.spyOn(console, "error");
      const consoleSpy = vi.spyOn(console, "log");

      await todoistAgent.processWebhookEvent(event);

      // Verificar que erro de parse foi registrado
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Erro ao fazer parse da resposta Gemini:"),
        expect.any(Error)
      );

      // Verificar que fallback foi usado
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Usando sugestão padrão (fallback)")
      );

      // Verificar que tarefa padrão foi criada
      expect(mocks.addLegalTasks).toHaveBeenCalled();
    });

    it("should handle Gemini response with markdown code blocks", async () => {
      const event = {
        event_name: "item:completed",
        event_data: {
          id: "task_111",
          content: "Elaborar parecer - Processo 1111111-11.2024.1.01.0001",
        },
      };

      // Mock resposta do Gemini com markdown code blocks (comum quando LLM formata resposta)
      mocks.callGemini.mockResolvedValue({
        text: `\`\`\`json
{
  "tasks": [
    {
      "content": "Revisar jurisprudência - Processo 1111111-11.2024.1.01.0001",
      "description": "Buscar precedentes STJ e STF",
      "dueDate": "2 days",
      "priority": 3
    }
  ],
  "reasoning": "Parecer requer fundamentação jurisprudencial sólida"
}
\`\`\``,
        metadata: {
          model: "gemini-2.5-pro",
        },
      });

      // Mock criação de tarefa
      mocks.addLegalTasks.mockResolvedValue([
        { id: "task_jurisprudencia", content: "Revisar jurisprudência..." },
      ]);

      await todoistAgent.processWebhookEvent(event);

      // Verificar que markdown foi limpo e JSON foi parseado corretamente
      expect(mocks.addLegalTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("Revisar jurisprudência"),
            description: expect.stringContaining("Buscar precedentes STJ e STF"),
            priority: 3,
          }),
        ])
      );
    });

    it("should not call Gemini for non-process tasks", async () => {
      const event = {
        event_name: "item:completed",
        event_data: {
          id: "task_non_process",
          content: "Comprar material de escritório",
        },
      };

      await todoistAgent.processWebhookEvent(event);

      // Verificar que Gemini NÃO foi chamado (tarefa não é de processo)
      expect(mocks.callGemini).not.toHaveBeenCalled();
      expect(mocks.addLegalTasks).not.toHaveBeenCalled();
    });

    it("should validate suggestion structure before creating tasks", async () => {
      const event = {
        event_name: "item:completed",
        event_data: {
          id: "task_222",
          content: "Atualizar petição - Processo 2222222-22.2024.2.02.0002",
        },
      };

      // Mock resposta sem campo "tasks" (estrutura inválida)
      mocks.callGemini.mockResolvedValue({
        text: JSON.stringify({
          suggestions: ["Fazer isso", "Fazer aquilo"],
          reasoning: "Sugestões genéricas",
        }),
      });

      // Mock criação de tarefa padrão (fallback devido a estrutura inválida)
      mocks.addLegalTasks.mockResolvedValue([
        {
          id: "fallback_task_2",
          content: "Verificar publicação - Processo 2222222-22.2024.2.02.0002",
        },
      ]);

      const consoleErrorSpy = vi.spyOn(console, "error");

      await todoistAgent.processWebhookEvent(event);

      // Verificar que erro de estrutura foi registrado
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Resposta do Gemini em formato inválido")
      );

      // Verificar que fallback foi usado
      expect(mocks.addLegalTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            labels: expect.arrayContaining(["default-suggestion"]),
          }),
        ])
      );
    });
  });
});

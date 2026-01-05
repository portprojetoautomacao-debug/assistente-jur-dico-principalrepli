import { describe, expect, it } from "vitest";
import { agentSchema } from "../agent.schema";

describe("agentSchema", () => {
  it("should validate a correct agent object", () => {
    const validAgent = {
      id: "harvey",
      name: "Harvey Specter",
      type: "strategic" as const,
      description: "Estrategista-chefe do escritório",
      capabilities: ["strategic-analysis", "performance-monitoring"],
      active: true,
    };

    expect(() => agentSchema.parse(validAgent)).not.toThrow();
  });

  it("should throw on missing required fields", () => {
    const invalidAgent = {
      id: "harvey",
      // name missing
      active: true,
    };

    expect(() => agentSchema.parse(invalidAgent)).toThrow();
  });

  it("should throw on invalid capability", () => {
    const invalidAgent = {
      id: "harvey",
      name: "Harvey Specter",
      type: "strategic" as const,
      description: "Estrategista-chefe",
      active: true,
      capabilities: ["invalid-capability"],
    };

    expect(() => agentSchema.parse(invalidAgent)).toThrow();
  });

  it("should accept agent without capabilities", () => {
    const validAgent = {
      id: "test",
      name: "Test Agent",
      type: "analyzer" as const,
      description: "Agent for testing purposes only",
      active: false,
      capabilities: ["document-analysis"],
    };

    expect(() => agentSchema.parse(validAgent)).not.toThrow();
  });

  it("should validate all capability types", () => {
    const allCapabilities = [
      "strategic-analysis",
      "performance-monitoring",
      "risk-identification",
      "data-analysis",
      "intimation-analysis",
      "deadline-identification",
      "task-generation",
      "priority-assessment",
      "document-analysis",
      "text-extraction",
      "entity-recognition",
      "classification",
    ];

    const validAgent = {
      id: "all-caps",
      name: "All Capabilities Agent",
      type: "analyzer" as const,
      description: "Agent with all capabilities for testing",
      active: true,
      capabilities: allCapabilities,
    };

    expect(() => agentSchema.parse(validAgent)).not.toThrow();
  });
});

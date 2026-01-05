import { describe, it, expect } from "vitest";
import { config, validateConfig } from "./config";

describe("config.ts", () => {
  it("deve exportar objeto config", () => {
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });

  it("deve ter seção google com clientId, apiKey e redirectUri", () => {
    expect(config.google).toBeDefined();
    expect(config.google).toHaveProperty("clientId");
    expect(config.google).toHaveProperty("apiKey");
    expect(config.google).toHaveProperty("redirectUri");
  });

  it("deve ter seção github", () => {
    expect(config.github).toBeDefined();
    expect(config.github).toHaveProperty("oauthClientId");
    expect(config.github).toHaveProperty("oauthClientSecret");
  });

  it("deve ter seção gitlab", () => {
    expect(config.gitlab).toBeDefined();
    expect(config.gitlab).toHaveProperty("oauthClientId");
    expect(config.gitlab).toHaveProperty("oauthClientSecret");
    expect(config.gitlab).toHaveProperty("redirectUri");
  });

  it("deve ter seção datajud", () => {
    expect(config.datajud).toBeDefined();
    expect(config.datajud).toHaveProperty("apiKey");
  });

  it("deve ter seção todoist", () => {
    expect(config.todoist).toBeDefined();
    expect(config.todoist).toHaveProperty("apiKey");
    expect(config.todoist).toHaveProperty("webhookSecret");
    expect(config.todoist).toHaveProperty("icalUrl");
  });

  it("deve ter seção tavily", () => {
    expect(config.tavily).toBeDefined();
    expect(config.tavily).toHaveProperty("apiKey");
  });

  it("deve ter seção app", () => {
    expect(config.app).toBeDefined();
    expect(config.app).toHaveProperty("environment");
    expect(config.app).toHaveProperty("isDevelopment");
    expect(config.app).toHaveProperty("isProduction");
  });

  it("validateConfig deve ser uma função", () => {
    expect(validateConfig).toBeTypeOf("function");
  });

  it("validateConfig deve retornar boolean", () => {
    const result = validateConfig();
    expect(typeof result).toBe("boolean");
  });
});

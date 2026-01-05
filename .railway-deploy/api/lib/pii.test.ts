import { describe, expect, it } from "vitest";

import { redactPii } from "./pii.js";

describe("api/lib/pii - redactPii", () => {
  it("redacts full emails (including + tags) without partial matches", () => {
    const input = "Contato: foo+bar@example.com.";
    const output = redactPii(input);

    expect(output).toContain("[REDACTED_EMAIL].");
    expect(output).not.toContain("foo+bar@example.com");
    expect(output).not.toContain("bar@example.com");
  });

  it("does not redact when the email is embedded in an alphanumeric token", () => {
    const input = "texto123abc@example.com.br456";
    const output = redactPii(input);

    // Requisito: evitar correspondências parciais/embutidas em tokens
    // (ex: sufixos numéricos logo após o e-mail).
    expect(output).toBe(input);
  });

  it("redacts when the email is properly delimited", () => {
    const input = "Emails: abc@example.com.br 456";
    const output = redactPii(input);

    expect(output).toContain("[REDACTED_EMAIL]");
    expect(output).not.toContain("abc@example.com.br");
  });
});

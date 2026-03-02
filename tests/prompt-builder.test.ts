import { describe, expect, it } from "vitest";
import {
  buildOrderedPromptMessages,
  renderOrderedPromptDebug,
  type PromptStaticBundle,
} from "../src/agent/promptBuilder.js";

const baseBundle: PromptStaticBundle = {
  systemInstructions: "  system block\r\n",
  referenceDocuments: "\nreference block\n",
  fewShotExamples: "few-shot block",
  toolDefinitions: "tools block",
};

describe("buildOrderedPromptMessages", () => {
  it("returns sections in exact required order and user is always last", () => {
    const messages = buildOrderedPromptMessages(baseBundle, {
      userInput: "dynamic input",
    });

    expect(messages.map((message) => message.section)).toEqual([
      "system",
      "reference",
      "fewshot",
      "tools",
      "user",
    ]);
    expect(messages[messages.length - 1].role).toBe("user");
    expect(messages[messages.length - 1].content).toBe("dynamic input");
    expect(messages).toHaveLength(5);
  });

  it("normalizes whitespace without changing section order", () => {
    const messages = buildOrderedPromptMessages(baseBundle, {
      userInput: "\n\n  dynamic input   \r\n",
    });

    expect(messages[0].content).toBe("system block");
    expect(messages[1].content).toBe("reference block");
    expect(messages[4].content).toBe("dynamic input");
    expect(messages.map((message) => message.section)).toEqual([
      "system",
      "reference",
      "fewshot",
      "tools",
      "user",
    ]);
  });

  it("is deterministic for same static and dynamic input", () => {
    const a = buildOrderedPromptMessages(baseBundle, { userInput: "x" });
    const b = buildOrderedPromptMessages(baseBundle, { userInput: "x" });
    expect(a).toEqual(b);
  });
});

describe("renderOrderedPromptDebug", () => {
  it("renders compact section trace", () => {
    const trace = renderOrderedPromptDebug(
      buildOrderedPromptMessages(baseBundle, { userInput: "x" }),
    );
    expect(trace).toContain("1. system (system)");
    expect(trace).toContain("5. user (user)");
  });
});

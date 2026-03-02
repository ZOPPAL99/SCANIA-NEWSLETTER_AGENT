import { afterEach, describe, expect, it, vi } from "vitest";

const loadPromptStaticBundleMock = vi.hoisted(() =>
  vi.fn(async () => ({
    systemInstructions: "system",
    referenceDocuments: "reference",
    fewShotExamples: "fewshot",
    toolDefinitions: "tools",
  })),
);
const buildOrderedPromptMessagesMock = vi.hoisted(() =>
  vi.fn(() => [
    { role: "system", content: "system", section: "system" },
    { role: "system", content: "reference", section: "reference" },
    { role: "system", content: "fewshot", section: "fewshot" },
    { role: "system", content: "tools", section: "tools" },
    { role: "user", content: "dynamic", section: "user" },
  ]),
);
const renderOrderedPromptDebugMock = vi.hoisted(() => vi.fn(() => "trace"));
const generateMockNewsletterMock = vi.hoisted(() =>
  vi.fn(() => ({ subject: "mock" })),
);

vi.mock("../src/agent/promptAssets.js", () => ({
  loadPromptStaticBundle: loadPromptStaticBundleMock,
}));

vi.mock("../src/agent/promptBuilder.js", () => ({
  buildOrderedPromptMessages: buildOrderedPromptMessagesMock,
  renderOrderedPromptDebug: renderOrderedPromptDebugMock,
}));

vi.mock("../src/agent/mockGenerator.js", () => ({
  generateMockNewsletter: generateMockNewsletterMock,
}));

import { generateNewsletterWithOpenAIStub } from "../src/agent/openaiStub.js";

describe("generateNewsletterWithOpenAIStub", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_STUB_JSON;
    delete process.env.PROMPT_DEBUG;
  });

  it("invokes ordered prompt assembly", async () => {
    await generateNewsletterWithOpenAIStub({ prompt: "hello world" });
    expect(loadPromptStaticBundleMock).toHaveBeenCalledTimes(1);
    expect(buildOrderedPromptMessagesMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ userInput: "hello world" }),
    );
  });

  it("respects OPENAI_STUB_JSON override", async () => {
    process.env.OPENAI_STUB_JSON = JSON.stringify({ subject: "from-env" });
    const output = await generateNewsletterWithOpenAIStub({ prompt: "ignored" });
    expect(output).toEqual({ subject: "from-env" });
    expect(generateMockNewsletterMock).not.toHaveBeenCalled();
  });

  it("prints debug trace when PROMPT_DEBUG=1", async () => {
    process.env.PROMPT_DEBUG = "1";
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    await generateNewsletterWithOpenAIStub({ prompt: "debug-input" });
    expect(renderOrderedPromptDebugMock).toHaveBeenCalled();
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Prompt order:"));
    stdoutSpy.mockRestore();
  });
});

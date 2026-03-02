export interface OpenAIStubInput {
  prompt: string;
}

import { generateMockNewsletter } from "./mockGenerator.js";
import { loadPromptStaticBundle } from "./promptAssets.js";
import {
  buildOrderedPromptMessages,
  renderOrderedPromptDebug,
} from "./promptBuilder.js";

export async function generateNewsletterWithOpenAIStub(
  input: OpenAIStubInput,
): Promise<unknown> {
  const staticBundle = await loadPromptStaticBundle();
  const orderedMessages = buildOrderedPromptMessages(staticBundle, {
    userInput: input.prompt,
  });

  if (process.env.PROMPT_DEBUG === "1") {
    process.stdout.write(
      `Prompt order:\n${renderOrderedPromptDebug(orderedMessages)}\n`,
    );
  }

  const raw = process.env.OPENAI_STUB_JSON;
  if (raw?.trim()) {
    return JSON.parse(raw);
  }
  return generateMockNewsletter(input.prompt);
}

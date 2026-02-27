export interface OpenAIStubInput {
  prompt: string;
}

import { generateMockNewsletter } from "./mockGenerator.js";

export async function generateNewsletterWithOpenAIStub(
  input: OpenAIStubInput,
): Promise<unknown> {
  const raw = process.env.OPENAI_STUB_JSON;
  if (raw?.trim()) {
    return JSON.parse(raw);
  }
  return generateMockNewsletter(input.prompt);
}

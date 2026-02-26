export interface OpenAIStubInput {
  prompt: string;
}

export async function generateNewsletterWithOpenAIStub(
  _input: OpenAIStubInput
): Promise<never> {
  throw new Error(
    "OpenAI generation is not implemented in this MVP. Use mock mode (default)."
  );
}

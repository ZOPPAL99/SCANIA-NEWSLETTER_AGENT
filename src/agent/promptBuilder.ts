export interface PromptStaticBundle {
  systemInstructions: string;
  referenceDocuments: string;
  fewShotExamples: string;
  toolDefinitions: string;
}

export interface PromptBuildInput {
  userInput: string;
  locale?: string;
  audience?: string;
  edition?: string;
}

export type PromptSection = "system" | "reference" | "fewshot" | "tools" | "user";

export interface PromptMessage {
  role: "system" | "user";
  content: string;
  section: PromptSection;
}

function normalizeContent(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

export function buildOrderedPromptMessages(
  staticBundle: PromptStaticBundle,
  input: PromptBuildInput,
): PromptMessage[] {
  return [
    {
      role: "system",
      content: normalizeContent(staticBundle.systemInstructions),
      section: "system",
    },
    {
      role: "system",
      content: normalizeContent(staticBundle.referenceDocuments),
      section: "reference",
    },
    {
      role: "system",
      content: normalizeContent(staticBundle.fewShotExamples),
      section: "fewshot",
    },
    {
      role: "system",
      content: normalizeContent(staticBundle.toolDefinitions),
      section: "tools",
    },
    {
      role: "user",
      content: normalizeContent(input.userInput),
      section: "user",
    },
  ];
}

export function renderOrderedPromptDebug(messages: PromptMessage[]): string {
  return messages
    .map((message, index) => `${index + 1}. ${message.section} (${message.role})`)
    .join("\n");
}

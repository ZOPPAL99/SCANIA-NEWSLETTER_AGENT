import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PromptStaticBundle } from "./promptBuilder.js";

async function readPromptFile(fileName: string): Promise<string> {
  const fullPath = path.resolve("prompts", fileName);
  let text: string;
  try {
    text = await readFile(fullPath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load prompt asset: ${fullPath}. ${message}`);
  }

  if (!text.trim()) {
    throw new Error(`Prompt asset is empty: ${fullPath}`);
  }
  return text;
}

export async function loadPromptStaticBundle(): Promise<PromptStaticBundle> {
  const [systemInstructions, referenceDocuments, fewShotExamples, toolDefinitions] =
    await Promise.all([
      readPromptFile("system-instructions.md"),
      readPromptFile("reference-documents.md"),
      readPromptFile("few-shot-examples.md"),
      readPromptFile("tool-definitions.md"),
    ]);

  return {
    systemInstructions,
    referenceDocuments,
    fewShotExamples,
    toolDefinitions,
  };
}

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { loadPromptStaticBundle } from "../src/agent/promptAssets.js";

const previousCwd = process.cwd();
let tempDir = "";

async function setupPromptDir(withToolDefinitions = true): Promise<void> {
  const promptsDir = path.join(tempDir, "prompts");
  await mkdir(promptsDir, { recursive: true });
  await writeFile(
    path.join(promptsDir, "system-instructions.md"),
    "system",
    "utf8",
  );
  await writeFile(
    path.join(promptsDir, "reference-documents.md"),
    "reference",
    "utf8",
  );
  await writeFile(
    path.join(promptsDir, "few-shot-examples.md"),
    "fewshot",
    "utf8",
  );
  if (withToolDefinitions) {
    await writeFile(
      path.join(promptsDir, "tool-definitions.md"),
      "tools",
      "utf8",
    );
  }
}

describe("loadPromptStaticBundle", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "prompt-assets-"));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("loads all four files successfully", async () => {
    await setupPromptDir();
    const bundle = await loadPromptStaticBundle();
    expect(bundle.systemInstructions).toBe("system");
    expect(bundle.referenceDocuments).toBe("reference");
    expect(bundle.fewShotExamples).toBe("fewshot");
    expect(bundle.toolDefinitions).toBe("tools");
  });

  it("fails with clear error if a required file is missing", async () => {
    await setupPromptDir(false);
    await expect(loadPromptStaticBundle()).rejects.toThrow(/tool-definitions\.md/i);
  });
});

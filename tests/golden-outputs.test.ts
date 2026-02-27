import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { generateMockNewsletter } from "../src/agent/mockGenerator.js";
import { renderEmailHtml } from "../src/render/email/renderer.js";
import { renderPreviewHtml } from "../src/render/web/renderer.js";
import { validateNewsletter } from "../src/schemas/newsletter.schema.js";

const FIXED_NOW = new Date("2026-02-01T00:00:00.000Z");
const expectedDir = path.resolve("examples/expected");
const createdDirs: string[] = [];

function normalizeEol(input: string): string {
  return input.replace(/\r\n/g, "\n");
}

afterAll(async () => {
  await Promise.all(
    createdDirs.map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("golden artifacts", () => {
  it("matches expected newsletter.json, email.html, and preview.html", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "newsletter-golden-"));
    createdDirs.push(tmpDir);

    const markdown = await readFile(path.resolve("examples/input.md"), "utf8");
    const draft = generateMockNewsletter(markdown, FIXED_NOW);
    const validation = validateNewsletter(draft);
    expect(validation.issues).toHaveLength(0);
    expect(validation.newsletter).not.toBeNull();

    const newsletter = validation.newsletter!;
    const email = renderEmailHtml(newsletter);
    const preview = renderPreviewHtml(newsletter);

    const generatedJsonPath = path.join(tmpDir, "newsletter.json");
    const generatedEmailPath = path.join(tmpDir, "email.html");
    const generatedPreviewPath = path.join(tmpDir, "preview.html");

    await writeFile(
      generatedJsonPath,
      `${JSON.stringify(newsletter, null, 2)}\n`,
      "utf8",
    );
    await writeFile(generatedEmailPath, email, "utf8");
    await writeFile(generatedPreviewPath, preview, "utf8");

    const expectedJson = JSON.parse(
      await readFile(path.join(expectedDir, "newsletter.json"), "utf8"),
    );
    const actualJson = JSON.parse(await readFile(generatedJsonPath, "utf8"));
    expect(actualJson).toEqual(expectedJson);

    const expectedEmail = normalizeEol(
      await readFile(path.join(expectedDir, "email.html"), "utf8"),
    );
    const expectedPreview = normalizeEol(
      await readFile(path.join(expectedDir, "preview.html"), "utf8"),
    );
    const actualEmail = normalizeEol(await readFile(generatedEmailPath, "utf8"));
    const actualPreview = normalizeEol(
      await readFile(generatedPreviewPath, "utf8"),
    );

    expect(actualEmail).toBe(expectedEmail);
    expect(actualPreview).toBe(expectedPreview);
  });
});

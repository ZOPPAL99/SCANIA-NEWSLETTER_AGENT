import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateMockNewsletter } from "../agent/mockGenerator.js";
import { generateNewsletterWithOpenAIStub } from "../agent/openaiStub.js";
import { checkNewsletter } from "../qa/checkNewsletter.js";
import { renderEmailHtml } from "../render/email/renderer.js";
import { renderPreviewHtml } from "../render/web/renderer.js";
import {
  validateNewsletter,
  type ValidationIssue,
} from "../schemas/newsletter.schema.js";
import { renderQaReport } from "../qa/report.js";

interface CliArgs {
  input: string;
  out: string;
  useApi: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const value = argv[i + 1];
    if (value && !value.startsWith("--")) {
      args.set(key, value);
      i += 1;
    } else {
      args.set(key, "true");
    }
  }

  return {
    input: args.get("input") ?? "examples/input.md",
    out: args.get("out") ?? "dist",
    useApi: args.has("use-api") || args.get("mode") === "openai",
  };
}

async function generateDraft(markdown: string, useApi: boolean): Promise<unknown> {
  if (!useApi) {
    return generateMockNewsletter(markdown);
  }
  return generateNewsletterWithOpenAIStub({ prompt: markdown });
}

function renderSchemaFailureReport(issues: ValidationIssue[]): string {
  const lines: string[] = [];
  lines.push("# QA Report");
  lines.push("");
  lines.push("- Status: FAIL");
  lines.push("- Total Issues: " + issues.length);
  lines.push("");
  lines.push("## Issues");
  lines.push("");
  for (const issue of issues) {
    lines.push(
      `- [ERROR] SCHEMA_INVALID: ${issue.path}: ${issue.message} | Pointer: src/schemas/newsletter.schema.ts`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(cli.out);
  const markdown = await readFile(path.resolve(cli.input), "utf8");

  await mkdir(outDir, { recursive: true });

  const firstDraft = await generateDraft(markdown, cli.useApi);
  let validation = validateNewsletter(firstDraft);
  if (!validation.newsletter && cli.useApi) {
    const retryDraft = await generateDraft(markdown, cli.useApi);
    validation = validateNewsletter(retryDraft);
  }

  if (!validation.newsletter) {
    const qaReport = renderSchemaFailureReport(validation.issues);
    await writeFile(path.resolve(outDir, "qa-report.md"), qaReport, "utf8");
    process.stderr.write(
      `Schema validation failed with ${validation.issues.length} issue(s).\n`,
    );
    process.exitCode = 1;
    return;
  }

  const newsletter = validation.newsletter;
  const preRenderQa = checkNewsletter(newsletter);
  const email = renderEmailHtml(newsletter);
  const preview = renderPreviewHtml(newsletter);
  const qa = checkNewsletter(newsletter, {
    emailHtml: email,
    previewHtml: preview,
  });
  const qaReport = renderQaReport(newsletter, qa);

  await writeFile(
    path.resolve(outDir, "newsletter.json"),
    `${JSON.stringify(newsletter, null, 2)}\n`,
    "utf8",
  );
  await writeFile(path.resolve(outDir, "email.html"), email, "utf8");
  await writeFile(path.resolve(outDir, "preview.html"), preview, "utf8");
  await writeFile(path.resolve(outDir, "qa-report.md"), qaReport, "utf8");

  const fontOutDir = path.resolve(outDir, "assets/fonts/latin");
  await mkdir(fontOutDir, { recursive: true });
  await copyFile(
    path.resolve("src/render/brand/assets/fonts/latin/ScaniaSans-Regular.woff"),
    path.resolve(fontOutDir, "ScaniaSans-Regular.woff"),
  );
  await copyFile(
    path.resolve("src/render/brand/assets/fonts/latin/ScaniaSans-Bold.woff"),
    path.resolve(fontOutDir, "ScaniaSans-Bold.woff"),
  );
  await copyFile(
    path.resolve("src/render/brand/assets/scania-logotype.svg"),
    path.resolve(outDir, "assets/scania-logotype.svg"),
  );

  process.stdout.write(
    `Generated newsletter artifacts in ${outDir}\n` +
      "- newsletter.json\n" +
      "- email.html\n" +
      "- preview.html\n" +
      "- qa-report.md\n" +
      "- assets/fonts/latin/ScaniaSans-Regular.woff\n" +
      "- assets/fonts/latin/ScaniaSans-Bold.woff\n" +
      "- assets/scania-logotype.svg\n" +
      `- QA status: ${qa.ok ? "PASS" : "FAIL"}\n`,
  );

  if (!preRenderQa.ok || !qa.ok) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

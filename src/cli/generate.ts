import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateMockNewsletter } from "../agent/mockGenerator.js";
import { generateNewsletterWithOpenAIStub } from "../agent/openaiStub.js";
import { renderEmailHtml } from "../render/email/renderer.js";
import { renderPreviewHtml } from "../render/web/renderer.js";
import { validateNewsletter } from "../schemas/newsletter.js";
import { renderQaReport } from "../qa/report.js";
import { runQaChecks } from "../qa/validators.js";

interface CliArgs {
  input: string;
  out: string;
  mode: "mock" | "openai";
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
    mode: args.get("mode") === "openai" ? "openai" : "mock",
  };
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const markdown = await readFile(path.resolve(cli.input), "utf8");

  const draft =
    cli.mode === "openai"
      ? await generateNewsletterWithOpenAIStub({ prompt: markdown })
      : generateMockNewsletter(markdown);

  const newsletter = validateNewsletter(draft);
  const email = renderEmailHtml(newsletter);
  const preview = renderPreviewHtml(newsletter);
  const qa = runQaChecks(newsletter, {
    emailHtml: email,
    previewHtml: preview,
  });
  const qaReport = renderQaReport(newsletter, qa);

  await mkdir(path.resolve(cli.out), { recursive: true });
  await writeFile(
    path.resolve(cli.out, "newsletter.json"),
    `${JSON.stringify(newsletter, null, 2)}\n`,
    "utf8",
  );
  await writeFile(path.resolve(cli.out, "email.html"), email, "utf8");
  await writeFile(path.resolve(cli.out, "preview.html"), preview, "utf8");
  await writeFile(path.resolve(cli.out, "qa-report.md"), qaReport, "utf8");

  process.stdout.write(
    `Generated newsletter artifacts in ${path.resolve(cli.out)}\n` +
      "- newsletter.json\n" +
      "- email.html\n" +
      "- preview.html\n" +
      "- qa-report.md\n",
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

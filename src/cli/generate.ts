import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateMockNewsletter } from "../agent/mockGenerator.js";
import { generateNewsletterWithOpenAIStub } from "../agent/openaiStub.js";
import {
  runNewsletterPipeline,
  writeNewsletterArtifacts,
  renderSchemaFailureReport,
} from "../core/pipeline.js";

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

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(cli.out);
  const markdown = await readFile(path.resolve(cli.input), "utf8");

  const firstDraft = await generateDraft(markdown, cli.useApi);
  let result = runNewsletterPipeline(firstDraft);
  if (!result.ok && cli.useApi) {
    const retryDraft = await generateDraft(markdown, cli.useApi);
    result = runNewsletterPipeline(retryDraft);
  }

  if (!result.ok) {
    await mkdir(outDir, { recursive: true });
    const qaReport = renderSchemaFailureReport(result.validationIssues);
    await writeFile(path.resolve(outDir, "qa-report.md"), qaReport, "utf8");
    process.stderr.write(
      `Schema validation failed with ${result.validationIssues.length} issue(s).\n`,
    );
    process.exitCode = 1;
    return;
  }

  const artifacts = await writeNewsletterArtifacts(result, outDir);

  process.stdout.write(
    `Generated newsletter artifacts in ${outDir}\n` +
      `- ${path.relative(outDir, artifacts.newsletterJsonPath)}\n` +
      `- ${path.relative(outDir, artifacts.emailHtmlPath)}\n` +
      `- ${path.relative(outDir, artifacts.previewHtmlPath)}\n` +
      `- ${path.relative(outDir, artifacts.qaReportPath)}\n` +
      `- ${path.relative(outDir, artifacts.regularFontPath)}\n` +
      `- ${path.relative(outDir, artifacts.boldFontPath)}\n` +
      `- ${path.relative(outDir, artifacts.logoPath)}\n` +
      `- QA status: ${result.qa.ok ? "PASS" : "FAIL"}\n`,
  );

  if (!result.qa.ok) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

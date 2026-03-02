import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Newsletter } from "../schemas/newsletter.js";
import {
  validateNewsletter,
  type ValidationIssue,
} from "../schemas/newsletter.schema.js";
import { checkNewsletter } from "../qa/checkNewsletter.js";
import { renderEmailHtml } from "../render/email/renderer.js";
import { renderPreviewHtml } from "../render/web/renderer.js";
import { renderQaReport } from "../qa/report.js";
import type { QAIssue, QAResult } from "../qa/types.js";

export interface SchemaFailure {
  ok: false;
  validationIssues: ValidationIssue[];
  qa: QAResult;
  qaReport: string;
}

export interface PipelineSuccess {
  ok: true;
  newsletter: Newsletter;
  qa: QAResult;
  qaReport: string;
  emailHtml: string;
  previewHtml: string;
}

export type PipelineResult = SchemaFailure | PipelineSuccess;

export interface WrittenArtifacts {
  newsletterJsonPath: string;
  emailHtmlPath: string;
  previewHtmlPath: string;
  qaReportPath: string;
  regularFontPath: string;
  boldFontPath: string;
  logoPath: string;
}

function schemaIssuesToQaIssues(issues: ValidationIssue[]): QAIssue[] {
  return issues.map((issue) => ({
    severity: "error",
    code: "SCHEMA_INVALID",
    message: `${issue.path}: ${issue.message}`,
    location: "src/schemas/newsletter.schema.ts",
  }));
}

export function renderSchemaFailureReport(issues: ValidationIssue[]): string {
  const lines: string[] = [];
  lines.push("# QA Report");
  lines.push("");
  lines.push("- Status: FAIL");
  lines.push(`- Total Issues: ${issues.length}`);
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

export function runNewsletterPipeline(input: unknown): PipelineResult {
  const validation = validateNewsletter(input);
  if (!validation.newsletter) {
    return {
      ok: false,
      validationIssues: validation.issues,
      qa: {
        ok: false,
        issues: schemaIssuesToQaIssues(validation.issues),
      },
      qaReport: renderSchemaFailureReport(validation.issues),
    };
  }

  const newsletter = validation.newsletter;
  const emailHtml = renderEmailHtml(newsletter);
  const previewHtml = renderPreviewHtml(newsletter);
  const qa = checkNewsletter(newsletter, { emailHtml, previewHtml });
  const qaReport = renderQaReport(newsletter, qa);

  return {
    ok: true,
    newsletter,
    qa,
    qaReport,
    emailHtml,
    previewHtml,
  };
}

export async function writeNewsletterArtifacts(
  result: PipelineSuccess,
  outDir: string,
): Promise<WrittenArtifacts> {
  const outputDir = path.resolve(outDir);
  await mkdir(outputDir, { recursive: true });

  const newsletterJsonPath = path.resolve(outputDir, "newsletter.json");
  const emailHtmlPath = path.resolve(outputDir, "email.html");
  const previewHtmlPath = path.resolve(outputDir, "preview.html");
  const qaReportPath = path.resolve(outputDir, "qa-report.md");

  await writeFile(
    newsletterJsonPath,
    `${JSON.stringify(result.newsletter, null, 2)}\n`,
    "utf8",
  );
  await writeFile(emailHtmlPath, result.emailHtml, "utf8");
  await writeFile(previewHtmlPath, result.previewHtml, "utf8");
  await writeFile(qaReportPath, result.qaReport, "utf8");

  const fontOutDir = path.resolve(outputDir, "assets/fonts/latin");
  await mkdir(fontOutDir, { recursive: true });

  const regularFontPath = path.resolve(fontOutDir, "ScaniaSans-Regular.woff");
  const boldFontPath = path.resolve(fontOutDir, "ScaniaSans-Bold.woff");
  const logoPath = path.resolve(outputDir, "assets/scania-logotype.svg");

  await copyFile(
    path.resolve("src/render/brand/assets/fonts/latin/ScaniaSans-Regular.woff"),
    regularFontPath,
  );
  await copyFile(
    path.resolve("src/render/brand/assets/fonts/latin/ScaniaSans-Bold.woff"),
    boldFontPath,
  );
  await copyFile(
    path.resolve("src/render/brand/assets/scania-logotype.svg"),
    logoPath,
  );

  return {
    newsletterJsonPath,
    emailHtmlPath,
    previewHtmlPath,
    qaReportPath,
    regularFontPath,
    boldFontPath,
    logoPath,
  };
}

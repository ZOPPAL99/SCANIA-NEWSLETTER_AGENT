import type { Newsletter } from "../schemas/newsletter.js";
import type { QAResult } from "./types.js";

export function renderQaReport(newsletter: Newsletter, qa: QAResult): string {
  const lines: string[] = [];
  lines.push("# QA Report");
  lines.push("");
  lines.push(`- Subject: ${newsletter.subject}`);
  lines.push(`- Language: ${newsletter.meta?.language ?? "en"}`);
  lines.push(`- Audience: ${newsletter.meta?.audience ?? "general"}`);
  lines.push(`- Status: ${qa.ok ? "PASS" : "FAIL"}`);
  lines.push(`- Total Issues: ${qa.issues.length}`);
  lines.push("");

  if (qa.issues.length === 0) {
    lines.push("No issues found.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Issues");
  lines.push("");
  for (const issue of qa.issues) {
    const pointer = issue.location ? ` | Pointer: ${issue.location}` : "";
    lines.push(
      `- [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.message}${pointer}`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

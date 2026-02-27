import type { Newsletter } from "../schemas/newsletter.schema.js";
import type { QAResult } from "./types.js";
import { runQaChecks } from "./validators.js";

export function checkNewsletter(
  newsletter: Newsletter,
  artifacts?: { emailHtml?: string; previewHtml?: string },
): QAResult {
  return runQaChecks(newsletter, artifacts);
}

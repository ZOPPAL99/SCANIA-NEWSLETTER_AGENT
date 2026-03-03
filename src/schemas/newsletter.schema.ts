import type { ZodIssue } from "zod";
import {
  newsletterSchema,
  type Newsletter,
  type Block,
  type Cta,
  type Image,
  type FeatureItem,
} from "./newsletter.js";

export interface ValidationIssue {
  code: string;
  message: string;
  path: string;
}

export interface ValidationResult {
  newsletter: Newsletter | null;
  issues: ValidationIssue[];
}

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "(root)";
  }
  return path
    .map((segment) =>
      typeof segment === "symbol" ? segment.toString() : String(segment),
    )
    .join(".");
}

function toIssue(issue: ZodIssue): ValidationIssue {
  return {
    code: issue.code,
    message: issue.message,
    path: formatPath(issue.path),
  };
}

export function validateNewsletter(input: unknown): ValidationResult {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      newsletter: null,
      issues: parsed.error.issues.map(toIssue),
    };
  }
  return {
    newsletter: parsed.data,
    issues: [],
  };
}

export { newsletterSchema };
export type { Newsletter, Block, Cta, Image, FeatureItem };

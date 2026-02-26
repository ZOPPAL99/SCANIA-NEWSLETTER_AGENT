import type { Newsletter } from "../schemas/newsletter.js";
import {
  allowedBodyTextSizesPx,
  allowedHeadingTextSizesPx,
  allowedSpacingValuesPx,
  isVerbFirstCta,
  tegelRules,
} from "../tegel/rules.js";
import type { QAIssue, QAResult } from "./types.js";

const MAX_BODY_LINE_LENGTH = 120;

function headingOrderIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  let previousLevel: number | null = null;
  let h1Count = 0;

  for (const section of newsletter.sections) {
    for (let index = 0; index < section.blocks.length; index++) {
      const block = section.blocks[index];
      if (block.type !== "heading") {
        continue;
      }

      if (block.level === 1) {
        h1Count += 1;
      } else if (h1Count === 0) {
        issues.push({
          severity: "error",
          code: "HEADING_ORDER",
          message: "H1 must appear before any H2/H3 headings.",
          location: `${section.id}.blocks[${index}]`,
        });
      }

      if (previousLevel !== null && block.level > previousLevel + 1) {
        issues.push({
          severity: "error",
          code: "HEADING_ORDER",
          message: `Heading level jumps from H${previousLevel} to H${block.level}.`,
          location: `${section.id}.blocks[${index}]`,
        });
      }
      previousLevel = block.level;
    }
  }

  if (h1Count !== 1) {
    issues.push({
      severity: "error",
      code: "HEADING_ORDER",
      message: `Exactly one H1 is required, found ${h1Count}.`,
      location: "newsletter.sections[*].blocks[*]",
    });
  }

  return issues;
}

function imageAltIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  for (const section of newsletter.sections) {
    for (let index = 0; index < section.blocks.length; index++) {
      const block = section.blocks[index];
      if (block.type === "image" && block.alt.trim().length === 0) {
        issues.push({
          severity: "error",
          code: "IMAGE_ALT_MISSING",
          message: "Image block requires non-empty alt text.",
          location: `${section.id}.blocks[${index}]`,
        });
      }
    }
  }
  return issues;
}

function linkTextIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  for (const section of newsletter.sections) {
    for (let index = 0; index < section.blocks.length; index++) {
      const block = section.blocks[index];
      if (block.type !== "links") {
        continue;
      }

      for (let itemIndex = 0; itemIndex < block.items.length; itemIndex++) {
        const item = block.items[itemIndex];
        if (!item.text.trim()) {
          issues.push({
            severity: "error",
            code: "LINK_TEXT_MISSING",
            message: "Every link needs visible text.",
            location: `${section.id}.blocks[${index}].items[${itemIndex}]`,
          });
        }
      }
    }
  }
  return issues;
}

function ctaIssue(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  let ctaCount = 0;

  for (const section of newsletter.sections) {
    for (let index = 0; index < section.blocks.length; index++) {
      const block = section.blocks[index];
      if (block.type !== "cta") {
        continue;
      }

      ctaCount += 1;
      const words = block.text.trim().split(/\s+/).filter(Boolean);
      if (words.length > tegelRules.content.maxCtaWords) {
        issues.push({
          severity: "error",
          code: "CTA_TEXT_LENGTH",
          message: `CTA text must be <= ${tegelRules.content.maxCtaWords} words.`,
          location: `${section.id}.blocks[${index}]`,
        });
      }
      if (!isVerbFirstCta(block.text)) {
        issues.push({
          severity: "error",
          code: "CTA_VERB_FIRST",
          message: "CTA text must start with a verb.",
          location: `${section.id}.blocks[${index}]`,
        });
      }
    }
  }

  if (ctaCount === 0) {
    issues.push({
      severity: "error",
      code: "CTA_MISSING",
      message: "Newsletter must include at least one CTA block.",
    });
  }

  return issues;
}

function bodyLineLengthIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  for (const section of newsletter.sections) {
    for (let index = 0; index < section.blocks.length; index++) {
      const block = section.blocks[index];
      if (block.type !== "paragraph") {
        continue;
      }

      const lines = block.text.split(/\r?\n/);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        if (line.length > MAX_BODY_LINE_LENGTH) {
          issues.push({
            severity: "warning",
            code: "BODY_LINE_LENGTH",
            message: `Paragraph line exceeds ${MAX_BODY_LINE_LENGTH} chars.`,
            location: `${section.id}.blocks[${index}].line[${lineIndex}]`,
          });
        }
      }
    }
  }
  return issues;
}

function heroAndFeatureCardIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  let heroCount = 0;
  let featureCardCount = 0;

  for (const section of newsletter.sections) {
    for (let index = 0; index < section.blocks.length; index++) {
      const block = section.blocks[index];
      if (block.type === "image") {
        heroCount += 1;
      }
      if (block.type === "links") {
        featureCardCount += block.items.length;
      }
    }
  }

  if (heroCount > tegelRules.content.maxHeroes) {
    issues.push({
      severity: "error",
      code: "HERO_LIMIT",
      message: `Max ${tegelRules.content.maxHeroes} hero block allowed, found ${heroCount}.`,
      location: "newsletter.sections[*].blocks[type=image]",
    });
  }
  if (featureCardCount > tegelRules.content.maxFeatureCards) {
    issues.push({
      severity: "error",
      code: "FEATURE_CARD_LIMIT",
      message: `Max ${tegelRules.content.maxFeatureCards} feature cards allowed, found ${featureCardCount}.`,
      location: "newsletter.sections[*].blocks[type=links].items[*]",
    });
  }

  return issues;
}

function uniqueSorted(values: Iterable<number>): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function parsePxValues(input: string): number[] {
  const matches = input.match(/\b(\d+)px\b/g) ?? [];
  return matches.map((part) => Number.parseInt(part.replace("px", ""), 10));
}

function extractPxValuesForProperties(
  input: string,
  properties: string[],
): number[] {
  const propertyPattern = properties.join("|");
  const regex = new RegExp(`(?:${propertyPattern})\\s*:\\s*([^;"']+)`, "gi");
  const values: number[] = [];
  let match: RegExpExecArray | null = regex.exec(input);
  while (match) {
    values.push(...parsePxValues(match[1]));
    match = regex.exec(input);
  }
  return values;
}

function extractFontSizes(input: string): number[] {
  const regex = /font-size\s*:\s*(\d+)px/gi;
  const values: number[] = [];
  let match: RegExpExecArray | null = regex.exec(input);
  while (match) {
    values.push(Number.parseInt(match[1], 10));
    match = regex.exec(input);
  }
  return values;
}

function extractCssVariableMap(input: string): Map<string, number> {
  const values = new Map<string, number>();
  const regex = /(--[a-z0-9-]+)\s*:\s*(\d+)px/gi;
  let match: RegExpExecArray | null = regex.exec(input);
  while (match) {
    values.set(match[1], Number.parseInt(match[2], 10));
    match = regex.exec(input);
  }
  return values;
}

function extractRuleFontSizes(
  input: string,
  selectorRegex: RegExp,
  cssVars: Map<string, number>,
): number[] {
  const values: number[] = [];
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match: RegExpExecArray | null = ruleRegex.exec(input);
  while (match) {
    const selector = match[1].trim();
    const declarations = match[2];
    if (!selectorRegex.test(selector)) {
      match = ruleRegex.exec(input);
      continue;
    }

    const pxValues = parsePxValues(
      declarations
        .split(";")
        .filter((entry) => /font-size/i.test(entry))
        .join(";"),
    );
    values.push(...pxValues);

    const varMatch = declarations.match(
      /font-size\s*:\s*var\((--[a-z0-9-]+)\)/i,
    );
    if (varMatch) {
      const resolved = cssVars.get(varMatch[1]);
      if (resolved !== undefined) {
        values.push(resolved);
      }
    }

    match = ruleRegex.exec(input);
  }
  return values;
}

function rendererStyleIssues(
  emailHtml?: string,
  previewHtml?: string,
): QAIssue[] {
  const issues: QAIssue[] = [];
  const artifacts = [
    { input: emailHtml, pointer: "src/render/email/renderer.ts" },
    { input: previewHtml, pointer: "src/render/web/Preview.tsx" },
  ];

  for (const artifact of artifacts) {
    if (!artifact.input) {
      continue;
    }

    const pxValues = extractPxValuesForProperties(artifact.input, [
      "padding",
      "margin",
      "gap",
      "row-gap",
      "column-gap",
    ]);
    const disallowedSpacing = uniqueSorted(
      pxValues.filter((value) => !allowedSpacingValuesPx.has(value)),
    );
    if (disallowedSpacing.length > 0) {
      issues.push({
        severity: "error",
        code: "TEGEL_SPACING_TOKENS",
        message: `Spacing must use Tegel tokens only. Found non-token px values: ${disallowedSpacing.join(", ")}.`,
        location: artifact.pointer,
      });
    }

    const cssVars = extractCssVariableMap(artifact.input);
    const fontSizes = extractFontSizes(artifact.input);
    const maxBodySize = tegelRules.typography.body.basePx;
    const bodyFontValues = [
      ...fontSizes.filter((value) => value <= maxBodySize),
      ...extractRuleFontSizes(
        artifact.input,
        /^p$|\.meta|\.preheader/i,
        cssVars,
      ),
    ];
    const disallowedBody = uniqueSorted(
      bodyFontValues.filter((value) => !allowedBodyTextSizesPx.has(value)),
    );
    if (disallowedBody.length > 0) {
      issues.push({
        severity: "error",
        code: "TEGEL_BODY_TEXT_SIZE",
        message: `Body text must use only base/small sizes. Found: ${disallowedBody.join(", ")}.`,
        location: artifact.pointer,
      });
    }

    const headingFontValues = uniqueSorted([
      ...fontSizes.filter((value) => value > maxBodySize),
      ...extractRuleFontSizes(artifact.input, /^h1$|^h2$|^h3$/i, cssVars),
    ]);
    const disallowedHeading = headingFontValues.filter(
      (value) => !allowedHeadingTextSizesPx.has(value),
    );
    if (
      disallowedHeading.length > 0 ||
      headingFontValues.length < 1 ||
      headingFontValues.length > 2
    ) {
      issues.push({
        severity: "error",
        code: "TEGEL_HEADING_TEXT_SIZE",
        message: `Heading sizes must be 1-2 tokens. Found: ${headingFontValues.join(", ") || "none"}.`,
        location: artifact.pointer,
      });
    }
  }

  return issues;
}

export function runQaChecks(
  newsletter: Newsletter,
  artifacts?: { emailHtml?: string; previewHtml?: string },
): QAResult {
  const issues: QAIssue[] = [
    ...headingOrderIssues(newsletter),
    ...imageAltIssues(newsletter),
    ...linkTextIssues(newsletter),
    ...ctaIssue(newsletter),
    ...bodyLineLengthIssues(newsletter),
    ...heroAndFeatureCardIssues(newsletter),
    ...rendererStyleIssues(artifacts?.emailHtml, artifacts?.previewHtml),
  ];

  const ok = issues.every((issue) => issue.severity !== "error");
  return { ok, issues };
}

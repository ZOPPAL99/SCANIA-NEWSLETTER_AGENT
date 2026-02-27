import type { Block, Newsletter } from "../schemas/newsletter.js";
import { MAX_RELEASE_ITEMS } from "../schemas/newsletter.js";
import {
  allowedBodyTextSizesPx,
  allowedHeadingTextSizesPx,
  allowedSpacingValuesPx,
  isVerbFirstCta,
  tegelRules
} from "../tegel/rules.js";
import type { QAIssue, QAResult } from "./types.js";

const MAX_BODY_LINE_LENGTH = 120;

function headingOrderIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  const headingMarkers: Array<{ level: 1 | 2; location: string }> = [];

  for (let index = 0; index < newsletter.blocks.length; index++) {
    const block = newsletter.blocks[index];
    if (!("title" in block) || !block.title?.trim()) {
      continue;
    }
    headingMarkers.push({
      level: block.type === "hero" ? 1 : 2,
      location: `blocks[${index}].title`
    });
  }

  const h1Count = headingMarkers.filter((entry) => entry.level === 1).length;
  if (h1Count !== 1) {
    issues.push({
      severity: "error",
      code: "HEADING_ORDER",
      message: `Exactly one H1 is required, found ${h1Count}.`,
      location: "blocks[*].title"
    });
  }

  if (headingMarkers[0] && headingMarkers[0].level !== 1) {
    issues.push({
      severity: "error",
      code: "HEADING_ORDER",
      message: "H1 must appear before any H2/H3 headings.",
      location: headingMarkers[0].location
    });
  }

  for (let index = 1; index < headingMarkers.length; index++) {
    const previous = headingMarkers[index - 1];
    const current = headingMarkers[index];
    if (current.level === 1) {
      issues.push({
        severity: "error",
        code: "HEADING_ORDER",
        message: "H1 can only appear once at the start of heading flow.",
        location: current.location
      });
    }
    if (current.level > previous.level + 1) {
      issues.push({
        severity: "error",
        code: "HEADING_ORDER",
        message: `Heading level jumps from H${previous.level} to H${current.level}.`,
        location: current.location
      });
    }
  }

  return issues;
}

function imageAltIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  for (let blockIndex = 0; blockIndex < newsletter.blocks.length; blockIndex++) {
    const block = newsletter.blocks[blockIndex];
    const images = "images" in block ? (block.images ?? []) : [];
    for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
      const image = images[imageIndex];
      if (!image.alt.trim()) {
        issues.push({
          severity: "error",
          code: "IMAGE_ALT_MISSING",
          message: "Image block requires non-empty alt text.",
          location: `blocks[${blockIndex}].images[${imageIndex}]`
        });
      }
    }
  }
  return issues;
}

function cardItemText(item: unknown): string {
  if (typeof item === "string") {
    return item;
  }
  if (typeof item === "object" && item !== null) {
    const record = item as Record<string, unknown>;
    const value = record.text ?? record.title ?? record.label;
    return typeof value === "string" ? value : "";
  }
  return "";
}

function linkTextIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  for (let blockIndex = 0; blockIndex < newsletter.blocks.length; blockIndex++) {
    const block = newsletter.blocks[blockIndex];
    if (block.type !== "cards") {
      continue;
    }

    const items = block.items ?? [];
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      if (!cardItemText(items[itemIndex]).trim()) {
        issues.push({
          severity: "error",
          code: "LINK_TEXT_MISSING",
          message: "Every feature card item needs visible text.",
          location: `blocks[${blockIndex}].items[${itemIndex}]`
        });
      }
    }
  }
  return issues;
}

function collectCtas(block: Block): Array<{ label: string; location: string }> {
  if (!("ctas" in block) || !block.ctas) {
    return [];
  }
  return block.ctas.map((cta, index) => ({
    label: cta.label,
    location: `.ctas[${index}]`
  }));
}

function ctaIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  const ctas: Array<{ label: string; location: string }> = [];

  for (let blockIndex = 0; blockIndex < newsletter.blocks.length; blockIndex++) {
    for (const cta of collectCtas(newsletter.blocks[blockIndex])) {
      ctas.push({
        label: cta.label,
        location: `blocks[${blockIndex}]${cta.location}`
      });
    }
  }

  if (ctas.length === 0) {
    issues.push({
      severity: "error",
      code: "CTA_MISSING",
      message: "Newsletter must include at least one CTA block.",
      location: "blocks[*].ctas"
    });
    return issues;
  }

  for (const cta of ctas) {
    const words = cta.label.trim().split(/\s+/).filter(Boolean);
    if (words.length > tegelRules.content.maxCtaWords) {
      issues.push({
        severity: "error",
        code: "CTA_TEXT_LENGTH",
        message: `CTA text must be <= ${tegelRules.content.maxCtaWords} words.`,
        location: cta.location
      });
    }
    if (!isVerbFirstCta(cta.label)) {
      issues.push({
        severity: "error",
        code: "CTA_VERB_FIRST",
        message: "CTA text must start with a verb.",
        location: cta.location
      });
    }
  }

  return issues;
}

function bodyLineLengthIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  for (let blockIndex = 0; blockIndex < newsletter.blocks.length; blockIndex++) {
    const block = newsletter.blocks[blockIndex];
    const text = "body" in block ? block.body : undefined;
    if (!text) {
      continue;
    }
    const lines = text.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      if (lines[lineIndex].length > MAX_BODY_LINE_LENGTH) {
        issues.push({
          severity: "warning",
          code: "BODY_LINE_LENGTH",
          message: `Paragraph line exceeds ${MAX_BODY_LINE_LENGTH} chars.`,
          location: `blocks[${blockIndex}].body.line[${lineIndex}]`
        });
      }
    }
  }
  return issues;
}

function heroAndFeatureCardIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];
  const heroCount = newsletter.blocks.filter((block) => block.type === "hero").length;
  const featureCardCount = newsletter.blocks
    .filter((block) => block.type === "cards")
    .reduce((sum, block) => sum + (block.items?.length ?? 0), 0);

  if (heroCount > tegelRules.content.maxHeroes) {
    issues.push({
      severity: "error",
      code: "HERO_LIMIT",
      message: `Max ${tegelRules.content.maxHeroes} hero block allowed, found ${heroCount}.`,
      location: "blocks[type=hero]"
    });
  }
  if (featureCardCount > tegelRules.content.maxFeatureCards) {
    issues.push({
      severity: "error",
      code: "FEATURE_CARD_LIMIT",
      message: `Max ${tegelRules.content.maxFeatureCards} feature cards allowed, found ${featureCardCount}.`,
      location: "blocks[type=cards].items[*]"
    });
  }

  return issues;
}

function releaseSectionIssues(newsletter: Newsletter): QAIssue[] {
  const issues: QAIssue[] = [];

  for (let blockIndex = 0; blockIndex < newsletter.blocks.length; blockIndex++) {
    const block = newsletter.blocks[blockIndex];
    if (block.type !== "releaseSection") {
      continue;
    }

    if (!block.title.trim()) {
      issues.push({
        severity: "error",
        code: "RELEASE_SECTION_TITLE_MISSING",
        message: "releaseSection.title is required.",
        location: `blocks[${blockIndex}].title`
      });
    }

    if (!block.disclaimer.trim()) {
      issues.push({
        severity: "error",
        code: "RELEASE_SECTION_DISCLAIMER_MISSING",
        message: "releaseSection.disclaimer is required.",
        location: `blocks[${blockIndex}].disclaimer`
      });
    }

    if (block.items.length > MAX_RELEASE_ITEMS) {
      issues.push({
        severity: "error",
        code: "RELEASE_ITEM_LIMIT",
        message: `releaseSection supports at most ${MAX_RELEASE_ITEMS} items.`,
        location: `blocks[${blockIndex}].items`,
      });
    }

    for (let itemIndex = 0; itemIndex < block.items.length; itemIndex++) {
      const item = block.items[itemIndex];
      if (!Number.isInteger(item.number) || item.number < 1) {
        issues.push({
          severity: "error",
          code: "RELEASE_ITEM_NUMBER_INVALID",
          message: "releaseSection.items[*].number must be a positive integer.",
          location: `blocks[${blockIndex}].items[${itemIndex}].number`
        });
      }
      if (!item.title.trim()) {
        issues.push({
          severity: "error",
          code: "RELEASE_ITEM_TITLE_MISSING",
          message: "releaseSection.items[*].title is required.",
          location: `blocks[${blockIndex}].items[${itemIndex}].title`
        });
      }
      if (!item.kicker.trim()) {
        issues.push({
          severity: "error",
          code: "RELEASE_ITEM_KICKER_MISSING",
          message: "releaseSection.items[*].kicker is required.",
          location: `blocks[${blockIndex}].items[${itemIndex}].kicker`
        });
      }
      if (!item.body.trim()) {
        issues.push({
          severity: "error",
          code: "RELEASE_ITEM_BODY_MISSING",
          message: "releaseSection.items[*].body is required.",
          location: `blocks[${blockIndex}].items[${itemIndex}].body`
        });
      }

      const media = item.media ?? [];
      for (let mediaIndex = 0; mediaIndex < media.length; mediaIndex++) {
        if (!media[mediaIndex].alt.trim()) {
          issues.push({
            severity: "error",
            code: "RELEASE_MEDIA_ALT_MISSING",
            message: "releaseSection media requires non-empty alt text.",
            location: `blocks[${blockIndex}].items[${itemIndex}].media[${mediaIndex}]`
          });
        }
      }
    }
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

function extractPxValuesForProperties(input: string, properties: string[]): number[] {
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

function extractRuleFontSizes(input: string, selectorRegex: RegExp, cssVars: Map<string, number>): number[] {
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
        .join(";")
    );
    values.push(...pxValues);

    const varMatch = declarations.match(/font-size\s*:\s*var\((--[a-z0-9-]+)\)/i);
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

function rendererStyleIssues(emailHtml?: string, previewHtml?: string): QAIssue[] {
  const issues: QAIssue[] = [];
  const artifacts = [
    { input: emailHtml, pointer: "src/render/email/renderer.ts" },
    { input: previewHtml, pointer: "src/render/web/Preview.tsx" }
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
      "column-gap"
    ]);
    const disallowedSpacing = uniqueSorted(
      pxValues.filter((value) => !allowedSpacingValuesPx.has(value))
    );
    if (disallowedSpacing.length > 0) {
      issues.push({
        severity: "error",
        code: "TEGEL_SPACING_TOKENS",
        message: `Spacing must use Tegel tokens only. Found non-token px values: ${disallowedSpacing.join(", ")}.`,
        location: artifact.pointer
      });
    }

    const cssVars = extractCssVariableMap(artifact.input);
    const fontSizes = extractFontSizes(artifact.input);
    const maxBodySize = tegelRules.typography.body.basePx;
    const bodyFontValues = [
      ...fontSizes.filter((value) => value <= maxBodySize),
      ...extractRuleFontSizes(artifact.input, /^p$|\.meta|\.preheader/i, cssVars)
    ];
    const disallowedBody = uniqueSorted(
      bodyFontValues.filter((value) => !allowedBodyTextSizesPx.has(value))
    );
    if (disallowedBody.length > 0) {
      issues.push({
        severity: "error",
        code: "TEGEL_BODY_TEXT_SIZE",
        message: `Body text must use only base/small sizes. Found: ${disallowedBody.join(", ")}.`,
        location: artifact.pointer
      });
    }

    const headingFontValues = uniqueSorted([
      ...fontSizes.filter((value) => value > maxBodySize),
      ...extractRuleFontSizes(artifact.input, /^h1$|^h2$|^h3$/i, cssVars)
    ]);
    const disallowedHeading = headingFontValues.filter(
      (value) => !allowedHeadingTextSizesPx.has(value)
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
        location: artifact.pointer
      });
    }
  }

  return issues;
}

function rendererBrandingIssues(emailHtml?: string, previewHtml?: string): QAIssue[] {
  const issues: QAIssue[] = [];

  if (emailHtml && !/alt=["']Scania logo["']/i.test(emailHtml)) {
    issues.push({
      severity: "error",
      code: "BRANDING_LOGO_MISSING",
      message: "Email renderer output must include the Scania logo marker.",
      location: "src/render/email/renderer.ts",
    });
  }

  if (previewHtml && !/alt=["']Scania logo["']/i.test(previewHtml)) {
    issues.push({
      severity: "error",
      code: "BRANDING_LOGO_MISSING",
      message: "Web preview renderer output must include the Scania logo marker.",
      location: "src/render/web/Preview.tsx",
    });
  }

  return issues;
}

export function runQaChecks(
  newsletter: Newsletter,
  artifacts?: { emailHtml?: string; previewHtml?: string }
): QAResult {
  const issues: QAIssue[] = [
    ...headingOrderIssues(newsletter),
    ...imageAltIssues(newsletter),
    ...linkTextIssues(newsletter),
    ...ctaIssues(newsletter),
    ...bodyLineLengthIssues(newsletter),
    ...heroAndFeatureCardIssues(newsletter),
    ...releaseSectionIssues(newsletter),
    ...rendererStyleIssues(artifacts?.emailHtml, artifacts?.previewHtml),
    ...rendererBrandingIssues(artifacts?.emailHtml, artifacts?.previewHtml),
  ];

  const ok = issues.every((issue) => issue.severity !== "error");
  return { ok, issues };
}

export const tegelRules = {
  spacing: {
    "space.1": 4,
    "space.2": 8,
    "space.3": 12,
    "space.4": 16,
    "space.5": 24,
    "space.6": 32,
  },
  typography: {
    body: {
      basePx: 16,
      smallPx: 14,
    },
    heading: {
      h1Px: 32,
      h2Px: 24,
    },
  },
  content: {
    maxHeroes: 1,
    maxFeatureCards: 3,
    maxCtaWords: 5,
  },
} as const;

export const allowedSpacingValuesPx = new Set<number>(
  Object.values(tegelRules.spacing),
);
export const allowedBodyTextSizesPx = new Set<number>([
  tegelRules.typography.body.basePx,
  tegelRules.typography.body.smallPx,
]);
export const allowedHeadingTextSizesPx = new Set<number>([
  tegelRules.typography.heading.h1Px,
  tegelRules.typography.heading.h2Px,
]);

const VERB_FIRST_ALLOWLIST = new Set<string>([
  "apply",
  "book",
  "browse",
  "build",
  "call",
  "check",
  "compare",
  "contact",
  "download",
  "explore",
  "find",
  "get",
  "go",
  "join",
  "learn",
  "open",
  "order",
  "read",
  "register",
  "request",
  "review",
  "see",
  "shop",
  "start",
  "subscribe",
  "try",
  "update",
  "view",
  "watch",
]);

export function isVerbFirstCta(text: string): boolean {
  const first = text.trim().split(/\s+/)[0]?.toLowerCase();
  if (!first) {
    return false;
  }
  return VERB_FIRST_ALLOWLIST.has(first);
}

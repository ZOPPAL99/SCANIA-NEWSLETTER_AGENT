import { tegelRules } from "../../tegel/rules.js";
import { tokens as tegelTokens } from "../../tegel/tokens.js";

export const tokens = {
  spacing: {
    xs: tegelRules.spacing["space.1"],
    sm: tegelRules.spacing["space.2"],
    md: tegelRules.spacing["space.4"],
    lg: tegelRules.spacing["space.5"],
  },
  font: {
    family: tegelTokens.font.family,
    base: `${tegelRules.typography.body.basePx}px`,
    small: `${tegelRules.typography.body.smallPx}px`,
    h1: `${tegelRules.typography.heading.h1Px}px`,
    h2: `${tegelRules.typography.heading.h2Px}px`,
    bodyWeight: 400,
    headingWeight: 700,
  },
  colors: {
    primary: tegelTokens.accent.primary,
    secondary: tegelTokens.divider,
    accent: tegelTokens.accent.primary,
    text: tegelTokens.text.primary,
    muted: tegelTokens.text.muted,
    border: tegelTokens.divider,
    surface: tegelTokens.surface.section,
    surfaceMuted: tegelTokens.surface.card,
    pageBackground: tegelTokens.surface.page,
  },
  borderRadius: tegelTokens.radius.card,
} as const;

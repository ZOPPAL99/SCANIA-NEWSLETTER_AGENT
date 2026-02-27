import { tokens as tegelTokens } from "../../tegel/tokens.js";

export interface EmailTheme {
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  surfaceColor: string;
  surfaceMutedColor: string;
  borderColor: string;
  mutedTextColor: string;
  accentColor: string;
  headerGradientStart: string;
  headerGradientEnd: string;
}

export const defaultEmailTheme: EmailTheme = {
  fontFamily: tegelTokens.font.family.replaceAll('"', "'"),
  textColor: tegelTokens.text.primary,
  backgroundColor: tegelTokens.surface.page,
  surfaceColor: tegelTokens.surface.section,
  surfaceMutedColor: tegelTokens.surface.card,
  borderColor: tegelTokens.divider,
  mutedTextColor: tegelTokens.text.secondary,
  accentColor: tegelTokens.accent.primary,
  headerGradientStart: tegelTokens.accent.primary,
  headerGradientEnd: tegelTokens.divider,
};

export const baseContainerStyle =
  `margin:0;padding:0;background-color:${defaultEmailTheme.backgroundColor};width:100%;`;

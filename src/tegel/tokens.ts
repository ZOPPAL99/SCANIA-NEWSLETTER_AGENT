// Placeholder "Tegel-like" tokens (replace later with real Tegel tokens/mapping)

export const tokens = {
  surface: {
    page: "#0B0F14", // deep dark
    section: "#0F1720",
    card: "#111B26", // slightly lighter than page
  },
  text: {
    primary: "#F5F7FA",
    secondary: "#B6C2D1",
    muted: "#8FA1B5",
    inverse: "#0B0F14",
  },
  divider: "#223041",
  accent: {
    primary: "#2D6CDF",
  },
  radius: {
    card: 14,
    button: 10,
  },
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  font: {
    family: '"Scania Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    h1: 30,
    h2: 20,
    title: 18,
    kicker: 14,
    body: 15,
    small: 13,
    number: 34,
    lineHeight: 1.45,
  },
  layout: {
    maxWidth: 640, // web preview container; email typically 600
  },
} as const;

export type Tokens = typeof tokens;

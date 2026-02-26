import { tegelRules } from "../../tegel/rules.js";

export const tokens = {
  spacing: {
    "space.1": `${tegelRules.spacing["space.1"]}px`,
    "space.2": `${tegelRules.spacing["space.2"]}px`,
    "space.3": `${tegelRules.spacing["space.3"]}px`,
    "space.4": `${tegelRules.spacing["space.4"]}px`,
    "space.5": `${tegelRules.spacing["space.5"]}px`,
    "space.6": `${tegelRules.spacing["space.6"]}px`,
  },
  typography: {
    family: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    bodyBase: `${tegelRules.typography.body.basePx}px`,
    bodySmall: `${tegelRules.typography.body.smallPx}px`,
    h1: `${tegelRules.typography.heading.h1Px}px`,
    h2: `${tegelRules.typography.heading.h2Px}px`,
    h3: `${tegelRules.typography.heading.h2Px}px`,
  },
  colors: {
    pageBg: "#EEF2F5",
    surface: "#FFFFFF",
    text: "#12202B",
    muted: "#5D6E7E",
    accent: "#0B7A75",
    border: "#D8DEE5",
  },
} as const;

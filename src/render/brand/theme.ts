import { readFileSync } from "node:fs";
import path from "node:path";

export const brandColors = {
  primary: "#003A70",
  secondary: "#00579F",
  accent: "#F15A22",
  text: "#1F2937",
  muted: "#4B5563",
  border: "#D1D5DB",
  surface: "#FFFFFF",
  surfaceMuted: "#F3F6FA",
  pageBackground: "#E9EFF6",
} as const;

export const brandTypography = {
  webFontFaces: [
    {
      family: "Scania Sans",
      style: "normal",
      weight: 400,
      src: "local('Scania Sans Regular'), local('Scania Sans'), url('./assets/fonts/latin/ScaniaSans-Regular.woff') format('woff')",
    },
    {
      family: "Scania Sans",
      style: "normal",
      weight: 700,
      src: "local('Scania Sans Bold'), local('Scania Sans'), url('./assets/fonts/latin/ScaniaSans-Bold.woff') format('woff')",
    },
  ],
  webFamily: "'Scania Sans', 'Segoe UI', Arial, sans-serif",
  emailFamily: "'Scania Sans', Arial, Helvetica, sans-serif",
  bodyWeight: 400,
  headingWeight: 700,
} as const;

const logoPath = path.resolve(
  process.cwd(),
  "src/render/brand/assets/scania-logotype.svg",
);
const scaniaLogoSvg = readFileSync(logoPath, "utf8");

export const brandLogo = {
  alt: "Scania logo",
  sourcePath: "src/render/brand/assets/scania-logotype.svg",
  webPath: "./assets/scania-logotype.svg",
  dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(scaniaLogoSvg)}`,
} as const;

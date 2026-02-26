export interface PlanResult {
  title: string;
  sectionTitles: string[];
}

export function planFromMarkdown(markdown: string): PlanResult {
  const headingLines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("#"));

  const title = headingLines[0]?.replace(/^#+\s*/, "").trim() || "Newsletter Draft";
  const sectionTitles = headingLines
    .slice(1)
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .filter(Boolean);

  return {
    title,
    sectionTitles: sectionTitles.length > 0 ? sectionTitles : ["Top Stories", "What to Watch"]
  };
}

export interface PlannedFeatureLink {
  label: string;
  href: string;
}

export interface PlannedFeatureItem {
  number: number;
  title: string;
  kicker: string;
  body: string;
  image?: string;
  alt?: string;
  links: PlannedFeatureLink[];
}

export interface PlanResult {
  title: string;
  sectionTitles: string[];
  header: {
    subject: string;
    intro: string;
    edition: string;
  };
  featureSection: {
    title: string;
    disclaimer: string;
    items: PlannedFeatureItem[];
  };
  footer: {
    body: string;
  };
}

interface ParsedHeading {
  level: number;
  text: string;
}

function parseHeadings(markdown: string): ParsedHeading[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (!match) {
        return null;
      }
      return {
        level: match[1].length,
        text: match[2].trim(),
      };
    })
    .filter((entry): entry is ParsedHeading => entry !== null);
}

function topLevelSections(markdown: string): Map<string, string> {
  const lines = markdown.split(/\r?\n/);
  const sections = new Map<string, string>();
  let currentHeading = "";
  let currentLines: string[] = [];

  const commitCurrent = (): void => {
    if (!currentHeading) {
      return;
    }
    sections.set(currentHeading.toLowerCase(), currentLines.join("\n").trim());
  };

  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/);
    if (match) {
      commitCurrent();
      currentHeading = match[1].trim();
      currentLines = [];
      continue;
    }
    currentLines.push(line);
  }

  commitCurrent();
  return sections;
}

function parseLinks(value: string): PlannedFeatureLink[] {
  const links: PlannedFeatureLink[] = [];
  const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let markdownMatch: RegExpExecArray | null = markdownLinkPattern.exec(value);
  while (markdownMatch) {
    links.push({
      label: markdownMatch[1].trim(),
      href: markdownMatch[2].trim(),
    });
    markdownMatch = markdownLinkPattern.exec(value);
  }
  if (links.length > 0) {
    return links;
  }

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const labelUrl = part.match(/^(.+?)\s*[:\-]\s*(https?:\/\/\S+)$/i);
    if (labelUrl) {
      links.push({
        label: labelUrl[1].trim(),
        href: labelUrl[2].trim(),
      });
      continue;
    }

    const bareUrl = part.match(/^(https?:\/\/\S+)$/i);
    if (bareUrl) {
      links.push({
        label: "",
        href: bareUrl[1].trim(),
      });
    }
  }

  return links;
}

function parseFeatureItems(markdown: string): PlannedFeatureItem[] {
  const lines = markdown.split(/\r?\n/);
  const items: PlannedFeatureItem[] = [];
  let inReleaseSection = false;
  let active: PlannedFeatureItem | null = null;

  const commit = (): void => {
    if (!active) {
      return;
    }
    items.push(active);
    active = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const topHeading = line.match(/^#\s+(.+)$/);
    if (topHeading) {
      if (inReleaseSection) {
        commit();
      }
      inReleaseSection = /upcoming releases/i.test(topHeading[1]);
      continue;
    }

    if (!inReleaseSection) {
      continue;
    }

    const numberedSection = line.match(/^##\s*(\d+)[.)-]?\s*(.+)$/);
    if (numberedSection) {
      commit();
      active = {
        number: Number.parseInt(numberedSection[1], 10),
        title: numberedSection[2].trim(),
        kicker: "",
        body: "",
        links: [],
      };
      continue;
    }

    if (!active) {
      continue;
    }

    const field = line.match(/^-\s*([A-Za-z ]+)\s*:\s*(.*)$/);
    if (!field) {
      continue;
    }

    const key = field[1].trim().toLowerCase();
    const value = field[2].trim();
    if (key === "title" && value) {
      active.title = value;
    } else if (key === "kicker") {
      active.kicker = value;
    } else if (key === "body") {
      active.body = value;
    } else if (key === "image") {
      active.image = value;
    } else if (key === "alt") {
      active.alt = value;
    } else if (key === "links") {
      active.links = parseLinks(value);
    }
  }

  commit();
  return items.map((item, index) => ({
    ...item,
    number: index + 1,
  }));
}

function readSection(sections: Map<string, string>, key: string): string {
  return sections.get(key.toLowerCase())?.trim() ?? "";
}

export function planFromMarkdown(markdown: string): PlanResult {
  const headings = parseHeadings(markdown);
  const title = headings[0]?.text || "Newsletter Draft";
  const sectionTitles = headings
    .filter((entry) => entry.level >= 2)
    .map((entry) => entry.text)
    .filter(Boolean);

  const sections = topLevelSections(markdown);
  const subject = readSection(sections, "subject") || title;
  const intro = readSection(sections, "intro");
  const edition = readSection(sections, "edition");
  const disclaimer = readSection(sections, "disclaimer");
  const featureItems = parseFeatureItems(markdown);

  return {
    title,
    sectionTitles: sectionTitles.length > 0 ? sectionTitles : ["Top Stories", "What to Watch"],
    header: {
      subject,
      intro,
      edition,
    },
    featureSection: {
      title: "Upcoming releases",
      disclaimer,
      items: featureItems,
    },
    footer: {
      body: "Add or remove blocks without changing renderer code paths; QA checks run before delivery artifacts are produced.",
    },
  };
}

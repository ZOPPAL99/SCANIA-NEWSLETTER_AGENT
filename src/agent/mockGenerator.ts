import type { Newsletter } from "../schemas/newsletter.js";
import { planFromMarkdown } from "./planner.js";

function firstNonEmptyLine(markdown: string): string | undefined {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
}

function toEditionLabel(date: Date): string {
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

export function generateMockNewsletter(markdown: string, now = new Date()): Newsletter {
  const plan = planFromMarkdown(markdown);
  const lead = firstNonEmptyLine(markdown) ?? "Weekly update";

  const primary = plan.sectionTitles[0] ?? "Top Stories";
  const secondary = plan.sectionTitles[1] ?? "What to Watch";

  return {
    meta: {
      title: plan.title,
      preheader: "A concise briefing with highlights and links.",
      edition: `Edition ${toEditionLabel(now)}`,
      dateISO: now.toISOString().slice(0, 10)
    },
    sections: [
      {
        id: "top-stories",
        title: primary,
        blocks: [
          { type: "heading", level: 1, text: plan.title },
          {
            type: "paragraph",
            text: `${lead}. This mock newsletter keeps structure deterministic and renderer-safe for email and web preview output.`
          },
          {
            type: "image",
            src: "https://picsum.photos/seed/newsletter/1200/640",
            alt: "Abstract editorial illustration",
            caption: "Lead visual used for layout verification."
          },
          {
            type: "links",
            items: [
              { text: "Read the full analysis", url: "https://example.com/analysis" },
              { text: "See the data notes", url: "https://example.com/data-notes" }
            ]
          },
          {
            type: "cta",
            text: "Open full briefing",
            url: "https://example.com/briefing"
          }
        ]
      },
      {
        id: "watch-list",
        title: secondary,
        blocks: [
          { type: "heading", level: 2, text: secondary },
          {
            type: "paragraph",
            text: "Watch-list items can be authored safely in JSON and rendered consistently across channels."
          },
          { type: "divider" },
          {
            type: "paragraph",
            text: "Add or remove blocks without changing renderer code paths; QA checks run before delivery artifacts are produced."
          }
        ]
      }
    ]
  };
}

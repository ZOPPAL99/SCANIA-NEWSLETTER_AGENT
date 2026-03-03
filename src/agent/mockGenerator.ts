import type { Newsletter } from "../schemas/newsletter.js";
import { planFromMarkdown } from "./planner.js";
import { MAX_FEATURE_ITEMS } from "../schemas/newsletter.js";

function firstNonEmptyLine(markdown: string): string | undefined {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
}

export function generateMockNewsletter(
  markdown: string,
  now = new Date(),
): Newsletter {
  const plan = planFromMarkdown(markdown);
  const lead = firstNonEmptyLine(markdown) ?? "Weekly update";
  const primary = plan.sectionTitles[0] ?? "Top Stories";
  const dateId = now.toISOString().slice(0, 10);
  const legacyFeatureItems = [
    {
      number: 1,
      title: "Jobs for PDI activities",
      kicker: "Automate preparation flow for faster handover.",
      body: `${primary} initiatives now include clearer job lifecycle signals for planning and follow-up.`,
      media: [
        {
          src: "https://picsum.photos/seed/release-one/1200/640",
          alt: "Release preview for Jobs for PDI activities",
        },
      ],
    },
    {
      number: 2,
      title: "Release timeline visibility",
      kicker: "Give teams faster status awareness at a glance.",
      body: "A compact timeline summary highlights what is planned, in validation, and ready for rollout.",
      media: [
        {
          src: "https://picsum.photos/seed/release-two/1200/640",
          alt: "Release preview for timeline visibility",
        },
      ],
    },
    {
      number: 3,
      title: "Workshop slot coordination",
      kicker: "Reduce booking friction during peak demand periods.",
      body: "Slot coordination adds quicker conflict detection and clearer prioritization when demand changes.",
      media: [
        {
          src: "https://picsum.photos/seed/release-three/1200/640",
          alt: "Release preview for workshop slot coordination",
        },
      ],
    },
    {
      number: 4,
      title: "Parts request tracking",
      kicker: "Improve confidence with clearer delivery checkpoints.",
      body: "Parts request tracking now surfaces progress states and delays earlier so teams can react faster.",
      media: [
        {
          src: "https://picsum.photos/seed/release-four/1200/640",
          alt: "Release preview for parts request tracking",
        },
      ],
    },
    {
      number: 5,
      title: "Retail handover checklist",
      kicker: "Standardize delivery quality across locations.",
      body: "The handover checklist supports consistent customer-ready delivery with clearer completion indicators.",
      media: [
        {
          src: "https://picsum.photos/seed/release-five/1200/640",
          alt: "Release preview for retail handover checklist",
        },
      ],
    },
    {
      number: 6,
      title: "Service notification center",
      kicker: "Centralize critical updates for daily execution.",
      body: "A unified notification center helps teams act on high-priority service events without missing context.",
      media: [
        {
          src: "https://picsum.photos/seed/release-six/1200/640",
          alt: "Release preview for service notification center",
        },
      ],
    },
  ].slice(0, MAX_FEATURE_ITEMS);

  const structuredMode = /(^|\r?\n)#\s*Subject\b/i.test(markdown);
  if (!structuredMode) {
    return {
      id: `newsletter-${dateId}`,
      subject: "Welcome to your Digital Dealer update!",
      preheader: "February edition: Upcoming releases and progress highlights.",
      meta: {
        audience: "general",
        language: "en",
      },
      blocks: [
        {
          type: "hero",
          title: "Welcome to your Digital Dealer update!",
          body: `${lead}. This edition summarizes upcoming product improvements and near-term release plans.`,
          ctas: [
            {
              label: "Open briefing",
              href: "https://example.com/briefing",
            },
          ],
        },
        {
          type: "text",
          body: "Below you can review upcoming releases that focus on operational flow, transparency, and faster daily actions for dealer teams.",
        },
        {
          type: "featureSection",
          title: "Upcoming releases",
          disclaimer:
            "The images presented in this newsletter are from preliminary designs.\nMinor design and other changes can be expected...",
          items: legacyFeatureItems,
        },
        {
          type: "cta",
          ctas: [
            {
              label: "Read updates",
              href: "https://example.com/updates",
            },
          ],
        },
        {
          type: "footer",
          body: "Add or remove blocks without changing renderer code paths; QA checks run before delivery artifacts are produced.",
        },
      ],
    };
  }

  const parsedFeatureItems = plan.featureSection.items
    .slice(0, MAX_FEATURE_ITEMS)
    .map((item) => ({
      number: item.number,
      title: item.title,
      kicker: item.kicker,
      body: item.body,
      media: item.image ? [{ src: item.image, alt: item.alt ?? "" }] : undefined,
      links: item.links,
    }));
  const featureItems =
    parsedFeatureItems.length > 0 ? parsedFeatureItems : legacyFeatureItems;
  const subject = plan.header.subject || "Welcome to your Digital Dealer update!";
  const edition = plan.header.edition || "February";
  const intro =
    plan.header.intro ||
    `${lead}. This edition summarizes upcoming product improvements and near-term release plans.`;
  const disclaimer =
    plan.featureSection.disclaimer ||
    "The images presented in this newsletter are from preliminary designs.\nMinor design and other changes can be expected...";

  return {
    id: `newsletter-${dateId}`,
    subject,
    preheader: `${edition} edition: Upcoming releases and progress highlights.`,
    meta: {
      audience: "general",
      language: "en",
    },
    blocks: [
      {
        type: "hero",
        title: subject,
        body: `${intro}${plan.header.edition ? `\nEdition: ${plan.header.edition}` : ""}`,
        ctas: [
          {
            label: "Open briefing",
            href: "https://example.com/briefing",
          },
        ],
      },
      {
        type: "featureSection",
        title: plan.featureSection.title,
        disclaimer,
        items: featureItems,
      },
      {
        type: "footer",
        body: plan.footer.body,
      },
    ],
  };
}

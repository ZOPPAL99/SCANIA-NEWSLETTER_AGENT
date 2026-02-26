import { describe, expect, it } from "vitest";
import { runQaChecks } from "../src/qa/validators.js";
import type { Newsletter } from "../src/schemas/newsletter.js";

function baseNewsletter(): Newsletter {
  return {
    meta: {
      title: "QA",
      preheader: "Checks",
      edition: "Edition 2026-02-25",
      dateISO: "2026-02-25",
    },
    sections: [
      {
        id: "s1",
        title: "Section",
        blocks: [
          { type: "heading", level: 1, text: "Top" },
          { type: "paragraph", text: "Short paragraph." },
          {
            type: "links",
            items: [{ text: "Valid link", url: "https://example.com" }],
          },
          { type: "cta", text: "Go", url: "https://example.com/go" },
        ],
      },
    ],
  };
}

describe("runQaChecks", () => {
  it("passes for a baseline valid payload", () => {
    const qa = runQaChecks(baseNewsletter());
    expect(qa.ok).toBe(true);
    expect(qa.issues.length).toBe(0);
  });

  it("fails when CTA is missing", () => {
    const data = baseNewsletter();
    data.sections[0].blocks = data.sections[0].blocks.filter(
      (b) => b.type !== "cta",
    );
    const qa = runQaChecks(data);
    expect(qa.ok).toBe(false);
    expect(qa.issues.some((i) => i.code === "CTA_MISSING")).toBe(true);
  });

  it("warns when paragraph line exceeds max length", () => {
    const data = baseNewsletter();
    data.sections[0].blocks[1] = {
      type: "paragraph",
      text: "x".repeat(121),
    };
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "BODY_LINE_LENGTH")).toBe(true);
  });

  it("fails when CTA is not verb-first or too long", () => {
    const data = baseNewsletter();
    data.sections[0].blocks[3] = {
      type: "cta",
      text: "The best newsletter offer right now",
      url: "https://example.com/go",
    };
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "CTA_VERB_FIRST")).toBe(true);
    expect(qa.issues.some((i) => i.code === "CTA_TEXT_LENGTH")).toBe(true);
  });

  it("fails when hero and feature-card counts exceed limits", () => {
    const data = baseNewsletter();
    data.sections[0].blocks.splice(2, 0, {
      type: "image",
      src: "https://example.com/hero-1.png",
      alt: "hero 1",
    });
    data.sections[0].blocks.splice(3, 0, {
      type: "image",
      src: "https://example.com/hero-2.png",
      alt: "hero 2",
    });
    data.sections[0].blocks[4] = {
      type: "links",
      items: [
        { text: "Card 1", url: "https://example.com/1" },
        { text: "Card 2", url: "https://example.com/2" },
        { text: "Card 3", url: "https://example.com/3" },
        { text: "Card 4", url: "https://example.com/4" },
      ],
    };
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "HERO_LIMIT")).toBe(true);
    expect(qa.issues.some((i) => i.code === "FEATURE_CARD_LIMIT")).toBe(true);
  });

  it("fails when heading structure has no H1 or skips levels", () => {
    const data = baseNewsletter();
    data.sections[0].blocks[0] = { type: "heading", level: 2, text: "Subhead" };
    data.sections[0].blocks.splice(1, 0, {
      type: "heading",
      level: 3,
      text: "Detail",
    });
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "HEADING_ORDER")).toBe(true);
  });

  it("fails when renderer artifacts contain disallowed Tegel spacing and text sizes", () => {
    const data = baseNewsletter();
    const qa = runQaChecks(data, {
      emailHtml:
        '<td style="padding:10px 24px;font-size:15px;">x</td><h1 style="font-size:22px;">h</h1>',
      previewHtml: "h2 { font-size:20px; } p { font-size:13px; margin:10px; }",
    });
    expect(qa.issues.some((i) => i.code === "TEGEL_SPACING_TOKENS")).toBe(true);
    expect(qa.issues.some((i) => i.code === "TEGEL_BODY_TEXT_SIZE")).toBe(true);
    expect(qa.issues.some((i) => i.code === "TEGEL_HEADING_TEXT_SIZE")).toBe(
      true,
    );
  });
});

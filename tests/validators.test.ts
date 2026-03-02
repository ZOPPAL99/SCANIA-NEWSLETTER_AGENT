import { describe, expect, it } from "vitest";
import { runQaChecks } from "../src/qa/validators.js";
import { renderEmailHtml } from "../src/render/email/renderer.js";
import { renderPreviewHtml } from "../src/render/web/renderer.js";
import type { Newsletter } from "../src/schemas/newsletter.js";

function baseNewsletter(): Newsletter {
  return {
    subject: "QA",
    preheader: "Checks",
    meta: { language: "en", audience: "general" },
    blocks: [
      {
        type: "hero",
        title: "Top",
        body: "Short paragraph.",
        images: [{ src: "https://example.com/hero.jpg", alt: "Hero image" }],
        ctas: [{ label: "Go", href: "https://example.com/go" }]
      },
      {
        type: "cards",
        title: "Highlights",
        items: [{ title: "Valid link", href: "https://example.com" }]
      }
    ]
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
    data.blocks[0].ctas = [];
    const qa = runQaChecks(data);
    expect(qa.ok).toBe(false);
    expect(qa.issues.some((i) => i.code === "CTA_MISSING")).toBe(true);
  });

  it("warns when body line exceeds max length", () => {
    const data = baseNewsletter();
    data.blocks[0].body = "x".repeat(121);
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "BODY_LINE_LENGTH")).toBe(true);
  });

  it("fails when CTA is not verb-first or too long", () => {
    const data = baseNewsletter();
    data.blocks[0].ctas = [
      {
        label: "The best newsletter offer right now",
        href: "https://example.com/go"
      }
    ];
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "CTA_VERB_FIRST")).toBe(true);
    expect(qa.issues.some((i) => i.code === "CTA_TEXT_LENGTH")).toBe(true);
  });

  it("fails when hero and feature-card counts exceed limits", () => {
    const data = baseNewsletter();
    data.blocks.push({
      type: "hero",
      title: "Another hero"
    });
    data.blocks[1] = {
      type: "cards",
      title: "Too many cards",
      items: [
        { title: "Card 1", href: "https://example.com/1" },
        { title: "Card 2", href: "https://example.com/2" },
        { title: "Card 3", href: "https://example.com/3" },
        { title: "Card 4", href: "https://example.com/4" }
      ]
    };
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "HERO_LIMIT")).toBe(true);
    expect(qa.issues.some((i) => i.code === "FEATURE_CARD_LIMIT")).toBe(true);
  });

  it("fails when heading structure has no H1", () => {
    const data = baseNewsletter();
    data.blocks[0] = { type: "text", title: "Subhead", body: "Body" };
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "HEADING_ORDER")).toBe(true);
  });

  it("fails when renderer artifacts contain disallowed Tegel spacing and text sizes", () => {
    const data = baseNewsletter();
    const qa = runQaChecks(data, {
      emailHtml:
        '<td style="padding:10px 24px;font-size:15px;">x</td><h1 style="font-size:22px;">h</h1>',
      previewHtml: "h2 { font-size:20px; } p { font-size:13px; margin:10px; }"
    });
    expect(qa.issues.some((i) => i.code === "TEGEL_SPACING_TOKENS")).toBe(true);
    expect(qa.issues.some((i) => i.code === "TEGEL_BODY_TEXT_SIZE")).toBe(true);
    expect(qa.issues.some((i) => i.code === "TEGEL_HEADING_TEXT_SIZE")).toBe(true);
  });

  it("passes style and branding checks for generated renderer artifacts", () => {
    const data = baseNewsletter();
    const qa = runQaChecks(data, {
      emailHtml: renderEmailHtml(data),
      previewHtml: renderPreviewHtml(data)
    });
    expect(qa.issues.some((i) => i.code === "TEGEL_SPACING_TOKENS")).toBe(false);
    expect(qa.issues.some((i) => i.code === "TEGEL_BODY_TEXT_SIZE")).toBe(false);
    expect(qa.issues.some((i) => i.code === "TEGEL_HEADING_TEXT_SIZE")).toBe(false);
    expect(qa.issues.some((i) => i.code === "BRANDING_LOGO_MISSING")).toBe(false);
  });

  it("fails branding checks when renderer artifacts do not contain logo markers", () => {
    const data = baseNewsletter();
    const qa = runQaChecks(data, {
      emailHtml: "<html><body>No logo</body></html>",
      previewHtml: "<html><body>No logo</body></html>"
    });
    expect(
      qa.issues.filter((i) => i.code === "BRANDING_LOGO_MISSING").length
    ).toBe(2);
  });

  it("fails when releaseSection is missing required fields", () => {
    const data = baseNewsletter();
    data.blocks.push({
      type: "releaseSection",
      title: "",
      disclaimer: "",
      items: [
        {
          number: 0,
          title: "",
          kicker: "",
          body: "",
          media: [{ src: "https://example.com/a.jpg", alt: "" }]
        }
      ]
    });
    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "RELEASE_SECTION_TITLE_MISSING")).toBe(true);
    expect(
      qa.issues.some((i) => i.code === "RELEASE_SECTION_DISCLAIMER_MISSING")
    ).toBe(true);
    expect(qa.issues.some((i) => i.code === "RELEASE_ITEM_NUMBER_INVALID")).toBe(true);
    expect(qa.issues.some((i) => i.code === "RELEASE_ITEM_TITLE_MISSING")).toBe(true);
    expect(qa.issues.some((i) => i.code === "RELEASE_ITEM_KICKER_MISSING")).toBe(true);
    expect(qa.issues.some((i) => i.code === "RELEASE_ITEM_BODY_MISSING")).toBe(true);
    expect(qa.issues.some((i) => i.code === "RELEASE_MEDIA_ALT_MISSING")).toBe(true);
  });

  it("fails when releaseSection contains more than 6 items", () => {
    const data = baseNewsletter();
    data.blocks.push({
      type: "releaseSection",
      title: "Upcoming releases",
      disclaimer: "The images presented are from preliminary designs.",
      items: Array.from({ length: 7 }, (_, index) => ({
        number: index + 1,
        title: `Release ${index + 1}`,
        kicker: "Kicker",
        body: "Body",
      })),
    });

    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "RELEASE_ITEM_LIMIT")).toBe(true);
  });

  it("fails when releaseSection numbering is not sequential", () => {
    const data = baseNewsletter();
    data.blocks.push({
      type: "releaseSection",
      title: "Upcoming releases",
      disclaimer: "Preview visuals only.",
      items: [
        {
          number: 1,
          title: "Release 1",
          kicker: "Kicker",
          body: "Short and scannable body.",
        },
        {
          number: 3,
          title: "Release 3",
          kicker: "Kicker",
          body: "Short and scannable body.",
        },
      ],
    });

    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "RELEASE_ITEM_NUMBER_SEQUENCE")).toBe(true);
  });

  it("fails when releaseSection body is not short and scannable", () => {
    const data = baseNewsletter();
    data.blocks.push({
      type: "releaseSection",
      title: "Upcoming releases",
      disclaimer: "Preview visuals only.",
      items: [
        {
          number: 1,
          title: "Release 1",
          kicker: "Kicker",
          body: "This release body is intentionally long so it exceeds the scannable threshold and keeps adding detail for context, caveats, rollout notes, operational considerations, migration steps, compatibility remarks, team ownership notes, and change-management guidance. It also includes another sentence to ensure sentence count validation triggers.",
        },
      ],
    });

    const qa = runQaChecks(data);
    expect(
      qa.issues.some((i) => i.code === "RELEASE_ITEM_BODY_NOT_SCANNABLE")
    ).toBe(true);
  });

  it("fails when releaseSection links are not labeled", () => {
    const data = baseNewsletter();
    data.blocks.push({
      type: "releaseSection",
      title: "Upcoming releases",
      disclaimer: "Preview visuals only.",
      items: [
        {
          number: 1,
          title: "Release 1",
          kicker: "Kicker",
          body: "Short body.",
          links: [
            {
              label: "   ",
              href: "https://example.com/release-1",
            },
          ],
        },
      ],
    });

    const qa = runQaChecks(data);
    expect(qa.issues.some((i) => i.code === "RELEASE_LINK_LABEL_MISSING")).toBe(true);
  });
});

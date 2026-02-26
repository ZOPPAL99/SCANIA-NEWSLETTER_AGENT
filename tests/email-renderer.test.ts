import { describe, expect, it } from "vitest";
import { renderEmailHtml } from "../src/render/email/renderer.js";
import type { Newsletter } from "../src/schemas/newsletter.js";

const newsletter: Newsletter = {
  meta: {
    title: "Renderer Test",
    preheader: "Preheader text",
    edition: "Edition 2026-02-25",
    dateISO: "2026-02-25"
  },
  sections: [
    {
      id: "s1",
      title: "Primary",
      blocks: [
        { type: "heading", level: 1, text: "Renderer Test" },
        { type: "paragraph", text: "Body content" },
        { type: "cta", text: "Click me", url: "https://example.com/cta" }
      ]
    }
  ]
};

describe("renderEmailHtml", () => {
  it("renders table-based HTML with CTA link", () => {
    const html = renderEmailHtml(newsletter);
    expect(html).toContain("<table role=\"presentation\"");
    expect(html).toContain("Click me");
    expect(html).toContain("https://example.com/cta");
  });
});

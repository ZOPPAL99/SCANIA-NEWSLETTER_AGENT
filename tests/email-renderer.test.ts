import { describe, expect, it } from "vitest";
import { renderEmailHtml } from "../src/render/email/renderer.js";
import type { Newsletter } from "../src/schemas/newsletter.js";

const newsletter: Newsletter = {
  subject: "Renderer Test",
  preheader: "Preheader text",
  meta: { language: "en", audience: "general" },
  blocks: [
    {
      type: "hero",
      title: "Primary",
      body: "Body content",
      ctas: [{ label: "Click me", href: "https://example.com/cta" }],
    },
  ],
};

describe("renderEmailHtml", () => {
  it("renders branded table-based HTML with CTA link", () => {
    const html = renderEmailHtml(newsletter);
    expect(html).toContain('<table role="presentation"');
    expect(html).toContain("Click me");
    expect(html).toContain("https://example.com/cta");
    expect(html).toContain('alt="Scania logo"');
    expect(html).toContain("linear-gradient(90deg,#2D6CDF,#223041)");
    expect(html).toContain(
      "font-family:'Scania Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    );
    expect(html).toContain("background-color:#2D6CDF");
  });
});


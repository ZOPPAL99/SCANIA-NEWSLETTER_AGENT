import { describe, expect, it } from "vitest";
import { NewsletterSchema } from "../src/schemas/newsletter.js";

describe("NewsletterSchema", () => {
  it("accepts a valid newsletter", () => {
    const result = NewsletterSchema.parse({
      meta: {
        title: "Test",
        preheader: "Preheader",
        edition: "Edition 2026-02-25",
        dateISO: "2026-02-25",
      },
      sections: [
        {
          id: "s1",
          title: "Section",
          blocks: [
            { type: "heading", level: 1, text: "Heading" },
            { type: "paragraph", text: "Body copy" },
            { type: "cta", text: "Read more", url: "https://example.com" },
          ],
        },
      ],
    });
    expect(result.meta.title).toBe("Test");
  });

  it("rejects unknown top-level keys due to strict schema", () => {
    expect(() =>
      NewsletterSchema.parse({
        meta: {
          title: "Test",
          preheader: "Preheader",
          edition: "Edition 2026-02-25",
          dateISO: "2026-02-25",
        },
        sections: [
          {
            id: "s1",
            title: "Section",
            blocks: [
              { type: "cta", text: "Read more", url: "https://example.com" },
            ],
          },
        ],
        html: "<h1>nope</h1>",
      }),
    ).toThrow();
  });
});

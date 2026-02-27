import { describe, expect, it } from "vitest";
import { NewsletterSchema } from "../src/schemas/newsletter.js";

describe("NewsletterSchema", () => {
  it("accepts a valid newsletter", () => {
    const result = NewsletterSchema.parse({
      id: "n1",
      subject: "Test",
      preheader: "Preheader",
      blocks: [
        {
          type: "hero",
          title: "Heading",
          body: "Body copy",
          images: [{ src: "https://example.com/a.jpg", alt: "Alt text" }],
          ctas: [{ label: "Read more", href: "https://example.com" }],
        },
      ],
      meta: {
        audience: "ops",
        language: "en",
      },
    });
    expect(result.subject).toBe("Test");
  });

  it("rejects unknown top-level keys with strict schema", () => {
    expect(() =>
      NewsletterSchema.parse({
        subject: "Test",
        blocks: [{ type: "text", body: "Body" }],
        html: "<h1>not allowed</h1>",
      }),
    ).toThrow();
  });

  it("defaults meta.language to en when meta exists", () => {
    const result = NewsletterSchema.parse({
      subject: "Test",
      blocks: [{ type: "text", body: "Body" }],
      meta: {},
    });
    expect(result.meta?.language).toBe("en");
  });

  it("rejects invalid block type", () => {
    expect(() =>
      NewsletterSchema.parse({
        subject: "Test",
        blocks: [{ type: "heading", body: "invalid" }],
      }),
    ).toThrow();
  });

  it("accepts releaseSection with required disclaimer and items", () => {
    const result = NewsletterSchema.parse({
      subject: "Test",
      blocks: [
        {
          type: "releaseSection",
          title: "Upcoming releases",
          disclaimer: "Preliminary designs may change before release.",
          items: [
            {
              number: 1,
              title: "Jobs for PDI activities",
              kicker: "Speed up preparation workflows.",
              body: "Supports structured job handling and visibility.",
              media: [
                {
                  src: "https://example.com/release.jpg",
                  alt: "Release screenshot",
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.blocks[0].type).toBe("releaseSection");
  });

  it("rejects releaseSection media entries with unsupported keys", () => {
    expect(() =>
      NewsletterSchema.parse({
        subject: "Test",
        blocks: [
          {
            type: "releaseSection",
            title: "Upcoming releases",
            disclaimer: "Preliminary designs may change before release.",
            items: [
              {
                number: 1,
                title: "Jobs for PDI activities",
                kicker: "Speed up preparation workflows.",
                body: "Supports structured job handling and visibility.",
                media: [
                  {
                    src: "https://example.com/release.jpg",
                    alt: "Release screenshot",
                    caption: "Not allowed for release media",
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toThrow();
  });
});

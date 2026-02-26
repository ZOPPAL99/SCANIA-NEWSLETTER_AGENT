import { z } from "zod";

export const LinkItemSchema = z
  .object({
    text: z.string().min(1),
    url: z.string().url()
  })
  .strict();

export const HeadingBlockSchema = z
  .object({
    type: z.literal("heading"),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    text: z.string().min(1)
  })
  .strict();

export const ParagraphBlockSchema = z
  .object({
    type: z.literal("paragraph"),
    text: z.string().min(1)
  })
  .strict();

export const ImageBlockSchema = z
  .object({
    type: z.literal("image"),
    src: z.string().url(),
    alt: z.string().min(1),
    caption: z.string().optional(),
    link: z.string().url().optional()
  })
  .strict();

export const LinksBlockSchema = z
  .object({
    type: z.literal("links"),
    items: z.array(LinkItemSchema).min(1)
  })
  .strict();

export const CtaBlockSchema = z
  .object({
    type: z.literal("cta"),
    text: z.string().min(1),
    url: z.string().url()
  })
  .strict();

export const DividerBlockSchema = z
  .object({
    type: z.literal("divider")
  })
  .strict();

export const NewsletterBlockSchema = z.discriminatedUnion("type", [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ImageBlockSchema,
  LinksBlockSchema,
  CtaBlockSchema,
  DividerBlockSchema
]);

export const NewsletterSectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    blocks: z.array(NewsletterBlockSchema).min(1)
  })
  .strict();

export const NewsletterSchema = z
  .object({
    meta: z
      .object({
        title: z.string().min(1),
        preheader: z.string().min(1),
        edition: z.string().min(1),
        dateISO: z.string().date()
      })
      .strict(),
    sections: z.array(NewsletterSectionSchema).min(1)
  })
  .strict();

export type LinkItem = z.infer<typeof LinkItemSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type LinksBlock = z.infer<typeof LinksBlockSchema>;
export type CtaBlock = z.infer<typeof CtaBlockSchema>;
export type DividerBlock = z.infer<typeof DividerBlockSchema>;
export type NewsletterBlock = z.infer<typeof NewsletterBlockSchema>;
export type NewsletterSection = z.infer<typeof NewsletterSectionSchema>;
export type Newsletter = z.infer<typeof NewsletterSchema>;

export function validateNewsletter(input: unknown): Newsletter {
  return NewsletterSchema.parse(input);
}

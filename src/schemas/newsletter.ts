import { z } from "zod";
export const MAX_FEATURE_ITEMS = 6;

function isUrlOrLocalAssetPath(value: string): boolean {
  if (/^https?:\/\//i.test(value)) {
    return true;
  }
  return /^assets\/[A-Za-z0-9._/-]+$/.test(value);
}

export const imageSchema = z
  .object({
    src: z.string().url(),
    alt: z.string().min(1),
    caption: z.string().optional(),
  })
  .strict();

export const ctaSchema = z
  .object({
    label: z.string().min(1),
    href: z.string().url(),
  })
  .strict();

export const featureMediaSchema = z
  .object({
    src: z.string().refine(isUrlOrLocalAssetPath, {
      message: "Expected an http(s) URL or local assets/<filename> path.",
    }),
    alt: z.string(),
    assetId: z.string().min(1).optional(),
  })
  .strict();

export const featureLinkSchema = z
  .object({
    label: z.string().min(1),
    href: z.string().url(),
  })
  .strict();

export const featureItemSchema = z
  .object({
    number: z.number().int().positive(),
    title: z.string().min(1),
    kicker: z.string().min(1),
    body: z.string().min(1),
    media: z.array(featureMediaSchema).optional(),
    links: z.array(featureLinkSchema).optional(),
  })
  .strict();

const heroBlockSchema = z
  .object({
    type: z.literal("hero"),
    title: z.string().min(1),
    body: z.string().optional(),
    images: z.array(imageSchema).optional(),
    ctas: z.array(ctaSchema).optional(),
  })
  .strict();

const textBlockSchema = z
  .object({
    type: z.literal("text"),
    title: z.string().optional(),
    body: z.string().optional(),
    images: z.array(imageSchema).optional(),
    ctas: z.array(ctaSchema).optional(),
  })
  .strict();

const cardsBlockSchema = z
  .object({
    type: z.literal("cards"),
    title: z.string().optional(),
    body: z.string().optional(),
    images: z.array(imageSchema).optional(),
    ctas: z.array(ctaSchema).optional(),
    items: z.array(z.unknown()).optional(),
  })
  .strict();

const ctaBlockSchema = z
  .object({
    type: z.literal("cta"),
    title: z.string().optional(),
    body: z.string().optional(),
    ctas: z.array(ctaSchema).optional(),
  })
  .strict();

const footerBlockSchema = z
  .object({
    type: z.literal("footer"),
    body: z.string().optional(),
  })
  .strict();

const featureSectionBlockSchema = z
  .object({
    type: z.literal("featureSection"),
    title: z.string().min(1),
    disclaimer: z.string().min(1),
    items: z.array(featureItemSchema).min(1).max(MAX_FEATURE_ITEMS),
  })
  .strict();

export const blockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  textBlockSchema,
  cardsBlockSchema,
  ctaBlockSchema,
  footerBlockSchema,
  featureSectionBlockSchema,
]);

export const newsletterSchema = z
  .object({
    id: z.string().optional(),
    subject: z.string().min(1),
    preheader: z.string().optional(),
    blocks: z.array(blockSchema),
    meta: z
      .object({
        audience: z.string().optional(),
        language: z.string().default("en"),
      })
      .strict()
      .optional(),
  })
  .strict();

export type Image = z.infer<typeof imageSchema>;
export type Cta = z.infer<typeof ctaSchema>;
export type FeatureItem = z.infer<typeof featureItemSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Newsletter = z.infer<typeof newsletterSchema>;

export const NewsletterSchema = newsletterSchema;

export function validateNewsletter(input: unknown): Newsletter {
  return newsletterSchema.parse(input);
}

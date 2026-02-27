import React from "react";
import type { Block, Newsletter, ReleaseItem } from "../../schemas/newsletter.js";
import { brandLogo, brandTypography } from "../brand/theme.js";
import { tokens } from "./tokens.js";

interface CardItemData {
  title: string;
  subtitle?: string;
  body?: string;
  href?: string;
}

function normalizeCardItem(item: unknown): CardItemData {
  if (typeof item === "string") {
    return { title: item };
  }

  if (typeof item === "object" && item !== null) {
    const asRecord = item as Record<string, unknown>;
    const title =
      typeof asRecord.title === "string"
        ? asRecord.title
        : typeof asRecord.text === "string"
          ? asRecord.text
          : "Item";

    const subtitle =
      typeof asRecord.subtitle === "string" ? asRecord.subtitle : undefined;
    const body = typeof asRecord.body === "string" ? asRecord.body : undefined;
    const href =
      typeof asRecord.href === "string"
        ? asRecord.href
        : typeof asRecord.url === "string"
          ? asRecord.url
          : undefined;

    return { title, subtitle, body, href };
  }

  return { title: String(item) };
}

function renderCards(items: unknown[]): React.ReactNode {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="article-list">
      {items.map((item, index) => {
        const article = normalizeCardItem(item);
        return (
          <article className="article-card" key={index}>
            <div className="article-index">{index + 1}</div>
            <div className="article-content">
              <h3>
                {article.href ? (
                  <a href={article.href}>{article.title}</a>
                ) : (
                  article.title
                )}
              </h3>
              {article.subtitle ? (
                <p className="article-subtitle">{article.subtitle}</p>
              ) : null}
              {article.body ? (
                <p className="article-body">{article.body}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function renderReleaseItems(items: ReleaseItem[]): React.ReactNode {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="release-list">
      {items.map((item) => (
        <article className="release-item" key={item.number}>
          <div className="release-number">{item.number}</div>
          <div className="release-content">
            <h3>{item.title}</h3>
            <p className="release-kicker">{item.kicker}</p>
            <p className="release-body">{item.body}</p>
            {(item.media ?? []).map((image, index) => (
              <figure key={`${item.number}-media-${index}`}>
                <img src={image.src} alt={image.alt} />
              </figure>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function renderBlock(block: Block, key: string): React.ReactNode {
  const title =
    block.type === "hero" && block.title ? (
      <h1 key={`${key}-title`}>{block.title}</h1>
    ) : "title" in block && block.type !== "releaseSection" && block.title ? (
      <h2 key={`${key}-title`}>{block.title}</h2>
    ) : null;

  const body =
    "body" in block && block.body ? <p key={`${key}-body`}>{block.body}</p> : null;

  const images =
    "images" in block
      ? block.images?.map((image, index) => (
          <figure key={`${key}-image-${index}`}>
            <img src={image.src} alt={image.alt} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))
      : null;

  const cards = block.type === "cards" ? renderCards(block.items ?? []) : null;
  const releaseSection =
    block.type === "releaseSection" ? (
      <>
        <h2>{block.title}</h2>
        <p className="release-disclaimer">{block.disclaimer}</p>
        {renderReleaseItems(block.items)}
      </>
    ) : null;

  const ctas = "ctas" in block && block.ctas?.length ? (
    <p key={`${key}-ctas`}>
      {block.ctas.map((cta, index) => (
        <a className="cta" href={cta.href} key={`${key}-cta-${index}`}>
          {cta.label}
        </a>
      ))}
    </p>
  ) : null;

  return (
    <section key={key}>
      {title}
      {body}
      {images}
      {cards}
      {releaseSection}
      {ctas}
    </section>
  );
}

export function NewsletterPreview({
  newsletter,
}: {
  newsletter: Newsletter;
}): React.ReactElement {
  return (
    <article className="newsletter-preview">
      <header className="topbar">
        <p className="meta">{newsletter.subject.toUpperCase()}</p>
        <div className="brand-wrap">
          <img className="brand-mark" src={brandLogo.webPath} alt={brandLogo.alt} />
        </div>
      </header>
      <header className="masthead">
        <h1>{newsletter.subject}</h1>
        <p className="preheader">{newsletter.preheader ?? ""}</p>
      </header>
      {newsletter.blocks.map((block, index) =>
        renderBlock(block, `block-${index}`),
      )}
    </article>
  );
}

export function previewStyles(): string {
  const fontFaces = brandTypography.webFontFaces
    .map(
      (face) =>
        `@font-face { font-family: '${face.family}'; font-style: ${face.style}; font-weight: ${face.weight}; src: ${face.src}; font-display: swap; }`,
    )
    .join("\n  ");

  return `
  ${fontFaces}
  :root {
    --space-xs: ${tokens.spacing.xs}px;
    --space-sm: ${tokens.spacing.sm}px;
    --space-md: ${tokens.spacing.md}px;
    --space-lg: ${tokens.spacing.lg}px;
    --font-family: ${tokens.font.family};
    --font-body-base: ${tokens.font.base};
    --font-body-small: ${tokens.font.small};
    --font-h1: ${tokens.font.h1};
    --font-h2: ${tokens.font.h2};
    --color-text: ${tokens.colors.text};
    --color-muted: ${tokens.colors.muted};
    --color-accent: ${tokens.colors.primary};
    --color-accent-secondary: ${tokens.colors.secondary};
    --color-cta: ${tokens.colors.accent};
    --color-border: ${tokens.colors.border};
    --color-surface: ${tokens.colors.surface};
    --color-surface-muted: ${tokens.colors.surfaceMuted};
    --color-page-bg: ${tokens.colors.pageBackground};
    --radius-base: ${tokens.borderRadius}px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: var(--space-lg);
    background:
      radial-gradient(circle at 12% 8%, rgba(45, 108, 223, 0.28) 0%, rgba(11, 15, 20, 0) 38%),
      radial-gradient(circle at 88% 0%, rgba(45, 108, 223, 0.16) 0%, rgba(11, 15, 20, 0) 32%),
      linear-gradient(170deg, #0b0f14 0%, #0a1118 100%);
    color: #f3f4f6;
    font-family: var(--font-family);
    font-size: var(--font-body-base);
    font-weight: ${tokens.font.bodyWeight};
    line-height: 1.6;
  }
  .newsletter-preview {
    max-width: 860px;
    margin: 0 auto;
    padding: var(--space-lg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: linear-gradient(180deg, rgba(15, 23, 32, 0.97) 0%, rgba(17, 27, 38, 0.97) 100%);
    box-shadow: 0 28px 52px rgba(0, 0, 0, 0.38);
    position: relative;
    overflow: hidden;
  }
  .newsletter-preview::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(130deg, rgba(45, 108, 223, 0.06) 0%, rgba(45, 108, 223, 0) 40%);
  }
  .topbar {
    margin: calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) var(--space-md);
    padding: var(--space-sm) var(--space-lg);
    border-bottom: 1px solid var(--color-border);
    background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 2;
  }
  .masthead {
    background: linear-gradient(145deg, rgba(17, 27, 38, 1) 0%, rgba(24, 36, 51, 1) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--space-lg);
    margin-bottom: var(--space-md);
    position: relative;
    overflow: hidden;
  }
  .masthead::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -10%;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(45, 108, 223, 0.18) 0%, rgba(45, 108, 223, 0) 70%);
    pointer-events: none;
  }
  section {
    background: linear-gradient(180deg, rgba(17, 27, 38, 0.98) 0%, rgba(15, 23, 32, 0.98) 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--space-lg);
    margin-bottom: var(--space-md);
    position: relative;
    z-index: 1;
    animation: section-enter 320ms ease-out both;
  }
  .meta {
    color: #eff6ff;
    margin: 0;
    font-size: var(--font-body-small);
    letter-spacing: 0.06em;
    font-weight: ${tokens.font.headingWeight};
  }
  .brand-mark {
    width: 124px;
    height: 24px;
    display: block;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
  .brand-wrap {
    display: inline-flex;
    align-items: center;
    gap: 0;
  }
  .preheader { color: #d1d5db; margin-top: 0; margin-bottom: 0; max-width: 88%; font-size: var(--font-body-base); line-height: 1.5; }
  h1 { margin: 0 0 var(--space-sm); font-size: var(--font-h1); line-height: 1.2; letter-spacing: -0.02em; font-weight: ${tokens.font.headingWeight}; }
  h2 { margin: 0 0 var(--space-md); font-size: var(--font-h2); line-height: 1.2; letter-spacing: -0.02em; font-weight: ${tokens.font.headingWeight}; }
  h3 { margin: 0 0 var(--space-xs); font-size: var(--font-h2); line-height: 1.2; letter-spacing: -0.01em; font-weight: ${tokens.font.headingWeight}; }
  p { margin: 0 0 var(--space-md); font-size: var(--font-body-base); }
  img {
    width: 100%;
    height: auto;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.28);
  }
  figure { margin: var(--space-sm) 0 0; }
  figcaption { color: var(--color-muted); font-size: var(--font-body-small); margin-top: var(--space-xs); }
  a { color: var(--color-accent-secondary); }
  .article-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .article-card {
    display: grid;
    grid-template-columns: 32px 1fr;
    gap: var(--space-sm);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-md);
  }
  .article-card:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .article-index {
    font-size: var(--font-h1);
    font-weight: 700;
    color: var(--color-accent);
    line-height: 1;
  }
  .article-subtitle {
    color: var(--color-text);
    font-weight: ${tokens.font.headingWeight};
    margin-bottom: var(--space-xs);
  }
  .article-body {
    color: var(--color-muted);
    font-size: var(--font-body-small);
    line-height: 1.5;
  }
  .release-disclaimer {
    color: var(--color-muted);
    white-space: pre-line;
    font-size: var(--font-body-small);
    margin-bottom: var(--space-md);
  }
  .release-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .release-item {
    display: grid;
    grid-template-columns: 32px 1fr;
    gap: var(--space-sm);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-md);
    background: linear-gradient(180deg, rgba(34, 48, 65, 0.12) 0%, rgba(17, 27, 38, 0) 100%);
    border-radius: var(--radius-base);
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .release-item:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .release-item:hover {
    transform: translateY(-2px);
    border-color: rgba(45, 108, 223, 0.42);
    box-shadow: 0 18px 30px rgba(0, 0, 0, 0.24);
  }
  .release-number {
    font-size: var(--font-h1);
    font-weight: ${tokens.font.headingWeight};
    color: rgba(45, 108, 223, 0.86);
    line-height: 1;
  }
  .release-kicker {
    color: var(--color-text);
    font-size: var(--font-body-small);
    font-weight: ${tokens.font.headingWeight};
    margin-bottom: var(--space-xs);
  }
  .release-body {
    color: var(--color-text);
    font-size: var(--font-body-base);
    margin-bottom: var(--space-sm);
  }
  .cta {
    display: inline-block;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-base);
    background: var(--color-cta);
    color: #fff;
    text-decoration: none;
    font-weight: ${tokens.font.headingWeight};
    margin-right: var(--space-sm);
    margin-bottom: var(--space-sm);
    box-shadow: 0 10px 24px rgba(45, 108, 223, 0.36);
    transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
  }
  .cta:hover {
    transform: translateY(-1px);
    background: #3f7bed;
    box-shadow: 0 14px 28px rgba(45, 108, 223, 0.42);
  }
  @keyframes section-enter {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 768px) {
    body { padding: var(--space-md); }
    .newsletter-preview { padding: var(--space-md); }
    .topbar {
      margin: calc(-1 * var(--space-md)) calc(-1 * var(--space-md)) var(--space-md);
      padding: var(--space-sm) var(--space-md);
    }
    .masthead, section { padding: var(--space-md); }
    h1 { font-size: 24px; }
    h2 { font-size: 24px; }
    h3 { font-size: 24px; }
    .article-card { grid-template-columns: 32px 1fr; }
    .article-index { font-size: 32px; }
  }
  `;
}




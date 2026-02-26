import React from "react";
import type { Newsletter, NewsletterBlock } from "../../schemas/newsletter.js";
import { tokens } from "./tokens.js";

function blockKey(sectionId: string, index: number): string {
  return `${sectionId}-${index}`;
}

function renderBlock(block: NewsletterBlock, key: string): React.ReactNode {
  switch (block.type) {
    case "heading": {
      if (block.level === 1) {
        return <h1 key={key}>{block.text}</h1>;
      }
      if (block.level === 2) {
        return <h2 key={key}>{block.text}</h2>;
      }
      return <h3 key={key}>{block.text}</h3>;
    }
    case "paragraph":
      return <p key={key}>{block.text}</p>;
    case "image":
      return (
        <figure key={key}>
          <img src={block.src} alt={block.alt} />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    case "links":
      return (
        <ul key={key}>
          {block.items.map((item, index) => (
            <li key={`${key}-${index}`}>
              <a href={item.url}>{item.text}</a>
            </li>
          ))}
        </ul>
      );
    case "cta":
      return (
        <p key={key}>
          <a className="cta" href={block.url}>
            {block.text}
          </a>
        </p>
      );
    case "divider":
      return <hr key={key} />;
  }
}

export function NewsletterPreview({
  newsletter,
}: {
  newsletter: Newsletter;
}): React.ReactElement {
  return (
    <article className="newsletter-preview">
      <header>
        <p className="meta">
          {newsletter.meta.edition} - {newsletter.meta.dateISO}
        </p>
        <h1>{newsletter.meta.title}</h1>
        <p className="preheader">{newsletter.meta.preheader}</p>
      </header>
      {newsletter.sections.map((section) => (
        <section key={section.id}>
          {section.blocks.map((block, index) =>
            renderBlock(block, blockKey(section.id, index)),
          )}
        </section>
      ))}
    </article>
  );
}

export function previewStyles(): string {
  return `
  :root {
    --space-1: ${tokens.spacing["space.1"]};
    --space-2: ${tokens.spacing["space.2"]};
    --space-3: ${tokens.spacing["space.3"]};
    --space-4: ${tokens.spacing["space.4"]};
    --space-5: ${tokens.spacing["space.5"]};
    --space-6: ${tokens.spacing["space.6"]};
    --font-family: ${tokens.typography.family};
    --font-body-base: ${tokens.typography.bodyBase};
    --font-body-small: ${tokens.typography.bodySmall};
    --font-h1: ${tokens.typography.h1};
    --font-h2: ${tokens.typography.h2};
    --font-h3: ${tokens.typography.h3};
    --color-page-bg: ${tokens.colors.pageBg};
    --color-surface: ${tokens.colors.surface};
    --color-text: ${tokens.colors.text};
    --color-muted: ${tokens.colors.muted};
    --color-accent: ${tokens.colors.accent};
    --color-border: ${tokens.colors.border};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: var(--space-6);
    background: linear-gradient(135deg, #f6fafc 0%, var(--color-page-bg) 100%);
    color: var(--color-text);
    font-family: var(--font-family);
    font-size: var(--font-body-base);
    line-height: 1.6;
  }
  .newsletter-preview {
    max-width: 860px;
    margin: 0 auto;
    padding: var(--space-6);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow: 0 16px 32px rgba(15, 28, 45, 0.08);
  }
  .meta { color: var(--color-muted); margin: 0 0 var(--space-2); font-size: var(--font-body-small); }
  .preheader { color: var(--color-muted); margin-top: 0; margin-bottom: var(--space-5); font-size: var(--font-body-small); }
  h1 { margin: var(--space-4) 0; font-size: var(--font-h1); line-height: 1.2; }
  h2 { margin: var(--space-5) 0 var(--space-2); font-size: var(--font-h2); line-height: 1.3; }
  h3 { margin: var(--space-4) 0 var(--space-2); font-size: var(--font-h3); line-height: 1.4; }
  p { margin: 0 0 var(--space-4); font-size: var(--font-body-base); }
  img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }
  figure { margin: 0 0 var(--space-4); }
  figcaption { color: var(--color-muted); font-size: var(--font-body-small); margin-top: var(--space-1); }
  ul { margin: 0 0 var(--space-4); }
  a { color: var(--color-accent); }
  .cta {
    display: inline-block;
    padding: var(--space-2) var(--space-4);
    border-radius: 6px;
    background: var(--color-accent);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
  }
  hr {
    border: 0;
    border-top: 1px solid var(--color-border);
    margin: var(--space-5) 0;
  }
  @media (max-width: 768px) {
    body { padding: var(--space-4); }
    .newsletter-preview { padding: var(--space-5); }
  }
  `;
}

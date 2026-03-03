import type { Block, Newsletter } from "../../schemas/newsletter.js";
import { tegelRules } from "../../tegel/rules.js";
import { brandLogo } from "../brand/theme.js";
import { baseContainerStyle, defaultEmailTheme } from "./template.js";

const space = tegelRules.spacing;
const typeScale = tegelRules.typography;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlWithLineBreaks(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, "<br />");
}

function renderBody(text?: string): string {
  if (!text?.trim()) {
    return "";
  }
  return `<tr><td style="padding:${space["space.2"]}px ${space["space.5"]}px;font-size:${typeScale.body.basePx}px;line-height:1.6;color:${defaultEmailTheme.textColor};">${escapeHtml(text)}</td></tr>`;
}

function renderBrandHeader(subject: string): string {
  return `<tr><td style="padding:${space["space.2"]}px ${space["space.5"]}px;background:linear-gradient(90deg,${defaultEmailTheme.headerGradientStart},${defaultEmailTheme.headerGradientEnd});"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="font-size:${typeScale.body.smallPx}px;line-height:1.5;color:#EFF6FF;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(subject)}</td><td align="right"><img src="${brandLogo.webPath}" alt="${escapeHtml(brandLogo.alt)}" width="124" height="24" style="display:block;border:0;outline:none;text-decoration:none;" /></td></tr></table></td></tr>`;
}

function renderTitle(text: string, level: 1 | 2): string {
  const size = level === 1 ? typeScale.heading.h1Px : typeScale.heading.h2Px;
  return `<tr><td style="padding:${space["space.2"]}px ${space["space.5"]}px;font-size:${size}px;line-height:1.3;font-weight:700;color:${defaultEmailTheme.textColor};">${escapeHtml(text)}</td></tr>`;
}

function renderImages(block: Block): string {
  if (!("images" in block) || !block.images || block.images.length === 0) {
    return "";
  }
  return block.images
    .map((image) => {
      const caption = image.caption
        ? `<div style="font-size:${typeScale.body.smallPx}px;line-height:1.5;color:${defaultEmailTheme.mutedTextColor};padding-top:${space["space.1"]}px;">${escapeHtml(image.caption)}</div>`
        : "";
      return `<tr><td style="padding:${space["space.3"]}px ${space["space.5"]}px;"><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" width="100%" style="display:block;border:0;outline:none;text-decoration:none;width:100%;height:auto;" />${caption}</td></tr>`;
    })
    .join("");
}

function renderCtas(block: Block): string {
  if (!("ctas" in block) || !block.ctas || block.ctas.length === 0) {
    return "";
  }
  const ctas = block.ctas
    .map(
      (cta) =>
        `<a href="${escapeHtml(cta.href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:${defaultEmailTheme.accentColor};color:#FFFFFF;font-size:${typeScale.body.smallPx}px;font-weight:700;line-height:1;text-decoration:none;padding:${space["space.3"]}px ${space["space.4"]}px;border-radius:${space["space.1"]}px;margin-right:${space["space.2"]}px;margin-bottom:${space["space.2"]}px;">${escapeHtml(cta.label)}</a>`,
    )
    .join("");
  return `<tr><td style="padding:${space["space.4"]}px ${space["space.5"]}px;">${ctas}</td></tr>`;
}

function renderCards(block: Block): string {
  if (block.type !== "cards") {
    return "";
  }
  const items = block.items ?? [];
  if (items.length === 0) {
    return "";
  }

  const content = items
    .map((item) => {
      if (typeof item === "string") {
        return `<li style="margin-bottom:${space["space.2"]}px;">${escapeHtml(item)}</li>`;
      }
      if (typeof item === "object" && item !== null) {
        const title =
          "title" in item && typeof item.title === "string" ? item.title : "";
        const text =
          "text" in item && typeof item.text === "string" ? item.text : "";
        const label = title || text || "Item";
        const href =
          "href" in item && typeof item.href === "string"
            ? item.href
            : "url" in item && typeof item.url === "string"
              ? item.url
              : "";
        if (href) {
          return `<li style="margin-bottom:${space["space.2"]}px;"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:${defaultEmailTheme.accentColor};text-decoration:underline;">${escapeHtml(label)}</a></li>`;
        }
        return `<li style="margin-bottom:${space["space.2"]}px;">${escapeHtml(label)}</li>`;
      }
      return `<li style="margin-bottom:${space["space.2"]}px;">${escapeHtml(String(item))}</li>`;
    })
    .join("");

  return `<tr><td style="padding:${space["space.2"]}px ${space["space.5"]}px;"><ul style="margin:0;padding-left:${space["space.4"]}px;color:${defaultEmailTheme.textColor};">${content}</ul></td></tr>`;
}

function renderFeatureSection(block: Block): string {
  if (block.type !== "featureSection") {
    return "";
  }

  const items = block.items
    .map((item) => {
      const links = (item.links ?? [])
        .map(
          (link) =>
            `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:${defaultEmailTheme.accentColor};font-size:${typeScale.body.smallPx}px;line-height:1.4;text-decoration:underline;margin-right:${space["space.2"]}px;margin-top:${space["space.1"]}px;">${escapeHtml(link.label)}</a>`,
        )
        .join("");
      const media = (item.media ?? [])
        .map(
          (image) =>
            `<div style="padding-top:${space["space.2"]}px;"><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" width="100%" style="display:block;border:1px solid ${defaultEmailTheme.borderColor};outline:none;text-decoration:none;width:100%;height:auto;box-shadow:0 10px 20px rgba(0,0,0,0.25);" /></div>`,
        )
        .join("");

      return `<tr><td style="padding:${space["space.4"]}px ${space["space.5"]}px;border-top:1px solid ${defaultEmailTheme.borderColor};"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(180deg,rgba(34,48,65,0.12) 0%, rgba(17,27,38,0) 100%);border-radius:${space["space.2"]}px;"><tr><td valign="top" style="width:${typeScale.heading.h1Px}px;font-size:${typeScale.heading.h1Px}px;line-height:1;color:${defaultEmailTheme.headerGradientStart};font-weight:700;padding-right:${space["space.2"]}px;">${item.number}</td><td valign="top"><div style="font-size:${typeScale.body.basePx}px;line-height:1.4;color:${defaultEmailTheme.textColor};font-weight:700;">${escapeHtml(item.title)}</div><div style="font-size:${typeScale.body.smallPx}px;line-height:1.5;color:${defaultEmailTheme.mutedTextColor};font-weight:700;padding-top:${space["space.1"]}px;">${escapeHtml(item.kicker)}</div><div style="font-size:${typeScale.body.basePx}px;line-height:1.6;color:${defaultEmailTheme.textColor};padding-top:${space["space.1"]}px;">${escapeHtml(item.body)}</div>${links ? `<div style="padding-top:${space["space.1"]}px;">${links}</div>` : ""}${media}</td></tr></table></td></tr>`;
    })
    .join("");

  return `<tr><td style="padding:${space["space.4"]}px ${space["space.5"]}px;background:linear-gradient(140deg,rgba(45,108,223,0.12) 0%, rgba(45,108,223,0) 45%);"><div style="font-size:${typeScale.heading.h2Px}px;line-height:1.3;font-weight:700;color:${defaultEmailTheme.textColor};">${escapeHtml(block.title)}</div><div style="font-size:${typeScale.body.smallPx}px;line-height:1.5;color:${defaultEmailTheme.mutedTextColor};padding-top:${space["space.1"]}px;">${escapeHtmlWithLineBreaks(block.disclaimer)}</div></td></tr>${items}`;
}

function renderBlock(block: Block): string {
  const chunks: string[] = [];

  if (block.type === "hero" && block.title?.trim()) {
    chunks.push(renderTitle(block.title, 1));
  } else if (
    block.type !== "featureSection" &&
    "title" in block &&
    block.title?.trim()
  ) {
    chunks.push(renderTitle(block.title, 2));
  }

  if (block.type !== "footer" && "body" in block) {
    chunks.push(renderBody(block.body));
  }
  chunks.push(renderImages(block));

  if (block.type === "cards") {
    chunks.push(renderCards(block));
  }
  if (block.type === "featureSection") {
    chunks.push(renderFeatureSection(block));
  }

  if (block.type === "footer" && block.body?.trim()) {
    chunks.push(
      `<tr><td style="padding:${space["space.2"]}px ${space["space.5"]}px;font-size:${typeScale.body.smallPx}px;line-height:1.5;color:${defaultEmailTheme.mutedTextColor};">${escapeHtml(block.body)}</td></tr>`,
    );
  }

  chunks.push(renderCtas(block));
  return chunks.join("");
}

export function renderEmailHtml(newsletter: Newsletter): string {
  const renderedBlocks = newsletter.blocks
    .map((block) => renderBlock(block))
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(newsletter.subject)}</title>
  </head>
  <body style="${baseContainerStyle}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${defaultEmailTheme.backgroundColor};padding:${space["space.5"]}px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;width:100%;background-color:${defaultEmailTheme.surfaceColor};font-family:${defaultEmailTheme.fontFamily};border:1px solid ${defaultEmailTheme.borderColor};">
            ${renderBrandHeader(newsletter.subject)}
            <tr>
              <td style="padding:${space["space.5"]}px ${space["space.5"]}px ${space["space.1"]}px ${space["space.5"]}px;font-size:${typeScale.body.smallPx}px;line-height:1.5;color:${defaultEmailTheme.mutedTextColor};background-color:${defaultEmailTheme.surfaceMutedColor};border-bottom:1px solid ${defaultEmailTheme.borderColor};">${escapeHtml(newsletter.preheader ?? "")}</td>
            </tr>
            ${renderedBlocks}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}



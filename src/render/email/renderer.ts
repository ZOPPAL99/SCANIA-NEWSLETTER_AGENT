import type { Newsletter, NewsletterBlock } from "../../schemas/newsletter.js";
import { tegelRules } from "../../tegel/rules.js";
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

function renderBlock(block: NewsletterBlock): string {
  switch (block.type) {
    case "heading": {
      const size =
        block.level === 1 ? typeScale.heading.h1Px : typeScale.heading.h2Px;
      return `<tr><td style="padding:${space["space.2"]}px ${space["space.5"]}px;font-size:${size}px;line-height:1.3;font-weight:700;color:${defaultEmailTheme.textColor};">${escapeHtml(block.text)}</td></tr>`;
    }
    case "paragraph":
      return `<tr><td style="padding:${space["space.2"]}px ${space["space.5"]}px;font-size:${typeScale.body.basePx}px;line-height:1.6;color:${defaultEmailTheme.textColor};">${escapeHtml(block.text)}</td></tr>`;
    case "image": {
      const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(
        block.alt,
      )}" width="100%" style="display:block;border:0;outline:none;text-decoration:none;width:100%;height:auto;" />`;
      const wrapped = block.link
        ? `<a href="${escapeHtml(block.link)}" target="_blank" rel="noopener noreferrer">${img}</a>`
        : img;
      const caption = block.caption
        ? `<div style="font-size:${typeScale.body.smallPx}px;line-height:1.5;color:${defaultEmailTheme.mutedTextColor};padding-top:${space["space.1"]}px;">${escapeHtml(
            block.caption,
          )}</div>`
        : "";
      return `<tr><td style="padding:${space["space.3"]}px ${space["space.5"]}px;">${wrapped}${caption}</td></tr>`;
    }
    case "links": {
      const items = block.items
        .map(
          (item) =>
            `<li style="margin-bottom:${space["space.2"]}px;"><a href="${escapeHtml(
              item.url,
            )}" target="_blank" rel="noopener noreferrer" style="color:${defaultEmailTheme.accentColor};text-decoration:underline;">${escapeHtml(
              item.text,
            )}</a></li>`,
        )
        .join("");
      return `<tr><td style="padding:${space["space.2"]}px ${space["space.5"]}px;"><ul style="margin:0;padding-left:${space["space.4"]}px;color:${defaultEmailTheme.textColor};">${items}</ul></td></tr>`;
    }
    case "cta":
      return `<tr><td style="padding:${space["space.4"]}px ${space["space.5"]}px;"><a href="${escapeHtml(
        block.url,
      )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:${defaultEmailTheme.accentColor};color:#FFFFFF;font-size:${typeScale.body.smallPx}px;font-weight:700;line-height:1;text-decoration:none;padding:${space["space.3"]}px ${space["space.4"]}px;border-radius:${space["space.1"]}px;">${escapeHtml(
        block.text,
      )}</a></td></tr>`;
    case "divider":
      return `<tr><td style="padding:${space["space.4"]}px ${space["space.5"]}px;"><hr style="border:0;border-top:1px solid #E5E7EB;margin:0;" /></td></tr>`;
  }
}

export function renderEmailHtml(newsletter: Newsletter): string {
  const renderedSections = newsletter.sections
    .map((section) => {
      const blocks = section.blocks.map((block) => renderBlock(block)).join("");
      return `<tr><td style="padding:${space["space.1"]}px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${blocks}</table></td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(newsletter.meta.title)}</title>
  </head>
  <body style="${baseContainerStyle}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${defaultEmailTheme.backgroundColor};padding:${space["space.5"]}px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;width:100%;background-color:${defaultEmailTheme.surfaceColor};font-family:${defaultEmailTheme.fontFamily};">
            <tr>
              <td style="padding:${space["space.5"]}px ${space["space.5"]}px ${space["space.1"]}px ${space["space.5"]}px;font-size:${typeScale.body.smallPx}px;line-height:1.5;color:${defaultEmailTheme.mutedTextColor};">${escapeHtml(
                newsletter.meta.preheader,
              )}</td>
            </tr>
            ${renderedSections}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

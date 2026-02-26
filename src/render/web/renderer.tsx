import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Newsletter } from "../../schemas/newsletter.js";
import { NewsletterPreview, previewStyles } from "./Preview.js";

export function renderPreviewHtml(newsletter: Newsletter): string {
  const body = renderToStaticMarkup(<NewsletterPreview newsletter={newsletter} />);
  const styles = previewStyles();
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Newsletter Preview</title>
    <style>${styles}</style>
  </head>
  <body>${body}</body>
</html>`;
}

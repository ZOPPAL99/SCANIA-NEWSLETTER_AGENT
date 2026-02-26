# Newsletter Creation Agent (TypeScript MVP)

Schema-first newsletter generation with deterministic renderers and QA checks.

## Features

- Strict JSON newsletter schema via Zod (`.strict()` objects).
- Deterministic renderers:
  - Email HTML renderer (table-based, inline styles).
  - Web preview renderer (React SSR) with placeholder Tegel-like tokens in `src/render/web/tokens.ts`.
- QA/validation pipeline:
  - JSON schema validation.
  - Heading order check.
  - Image alt text check.
  - Link text presence check.
  - CTA presence check.
  - Max line length check for paragraph blocks.
  - Markdown QA output (`qa-report.md`).
- Mock mode by default, plus an OpenAI API stub for future integration.

## Project Structure

```text
src/
  schemas/
  agent/
  render/email/
  render/web/
  qa/
  cli/
examples/
tests/
```

## Requirements

- Node.js 20+
- npm (Windows: use `npm.cmd`)

## Install

```powershell
npm.cmd install
```

## Run Generator

```powershell
npm.cmd run generate -- --input examples/input.md --out dist
```

Generated files:

- `dist/newsletter.json`
- `dist/email.html`
- `dist/preview.html`
- `dist/qa-report.md`

Optional mode (currently stubbed and throws):

```powershell
npm.cmd run generate -- --mode openai --input examples/input.md --out dist
```

## Tests

```powershell
npm.cmd test
```

Typecheck:

```powershell
npm.cmd run typecheck
```

## Notes

- The model output contract is strict JSON only; HTML is produced only by deterministic renderers.
- `examples/sample-newsletter.json` and `examples/expected-email.html` provide baseline fixtures for manual inspection.

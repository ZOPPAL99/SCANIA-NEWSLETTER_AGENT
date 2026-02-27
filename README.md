# Newsletter Creation Agent (TypeScript MVP)

Schema-first newsletter generation with deterministic renderers and QA checks.

## Features

- Strict JSON newsletter schema via Zod (`.strict()` objects).
- Deterministic renderers:
  - Email HTML renderer (table-based, inline styles).
  - Web preview renderer (React SSR) with Tegel-aligned spacing/typography tokens in `src/render/web/tokens.ts`.
  - Shared Scania brand theme and assets in `src/render/brand/theme.ts`.
- QA/validation pipeline:
  - Schema validation (`safeParse`) via `src/schemas/newsletter.schema.ts`.
  - Business-rule QA checks via `src/qa/checkNewsletter.ts` and `src/qa/validators.ts`.
  - Markdown QA output (`qa-report.md`) with stable issue codes and pointers.
  - CLI exits non-zero on schema errors or QA error-level findings.
- Mock mode by default, plus `--use-api` mode (JSON-only model output, validated and retried once if invalid).

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
- `dist/assets/fonts/latin/ScaniaSans-Regular.woff`
- `dist/assets/fonts/latin/ScaniaSans-Bold.woff`
- `dist/assets/scania-logotype.svg`

Optional API mode:

```powershell
npm.cmd run generate -- --use-api --input examples/input.md --out dist
```

Authoring template:

- `templates/input-template.md`

## Tests

```powershell
npm.cmd test -- --run
```

Typecheck:

```powershell
npm.cmd run typecheck
```

## Notes

- The model output contract is strict JSON only; HTML is produced only by deterministic renderers.
- Golden expected artifacts are committed under `examples/expected/`:
  - `examples/expected/newsletter.json`
  - `examples/expected/email.html`
  - `examples/expected/preview.html`

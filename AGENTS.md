# AGENTS.md

## Purpose
This repository builds a schema-first newsletter agent with deterministic renderers and QA checks.
All generated newsletter content must be validated by schema and QA before output artifacts are considered acceptable.

## Stack and Dependencies
- Runtime: Node.js 20+
- Language: TypeScript (ESM)
- Core libs: `zod`, `react`, `react-dom`
- Tooling: `tsx`, `vitest`, `typescript`

## Project Conventions
- Keep newsletter data contract in `src/schemas/newsletter.ts` as the source of truth.
- Do not emit model-generated HTML directly; HTML must come from deterministic renderers only.
- Prefer small, composable pure functions for parsing, rendering, and QA checks.
- Keep strict typing; avoid `any` unless unavoidable and justified.
- Use explicit, stable error codes for QA violations.
- Preserve ESM imports with `.js` extension in TS source where applicable.

## Business Rules
- Enforce Tegel rules from `src/tegel/rules.ts` via QA:
  - spacing must use token values only
  - only two body text sizes (base + small)
  - heading sizes limited to 1-2 tokens
  - max 1 hero and max 3 feature cards
  - heading order requires exactly one H1, then H2/H3 without level skips
  - CTA text must be verb-first and <= 5 words
- Every newsletter must include at least one CTA.
- Images must include non-empty alt text.
- Links must include visible text.

## QA and Reporting
- QA checks live in `src/qa/validators.ts`.
- Markdown QA output lives in `dist/qa-report.md`.
- Include clear pointers for each issue:
  - section/block pointer (e.g. `top-stories.blocks[1]`)
  - file pointer for renderer/style violations (e.g. `src/render/email/renderer.ts`)

## Scaffolding Guidelines
When adding new features or scaffolding:
1. Update schema types first if content contract changes.
2. Update mock generator and planner behavior to match schema.
3. Update both renderers (email + web preview) to maintain parity.
4. Add or update QA validators for new business rules.
5. Add/adjust tests in `tests/` for schema, QA, and renderer behavior.

## Required Verification Before Merge
Run all of the following successfully:
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run generate -- --input examples/input.md --out dist`

If QA status is FAIL, address all error-level findings before merging.

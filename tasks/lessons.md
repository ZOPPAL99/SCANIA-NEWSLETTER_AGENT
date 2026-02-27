# Lessons Learned

Use this format after user corrections or preventable mistakes.

## Entry Template
- Date:
- Context:
- Mistake:
- Root Cause:
- Preventive Rule:
- Verification Added:

## Active Rules
- Validate assumptions against repository reality before editing.
- Prefer minimal-impact root-cause fixes over quick patches.
- Do not mark complete without objective verification.

## 2026-02-27
- Date: 2026-02-27
- Context: Newsletter schema/QA/renderer parity and branding rollout.
- Mistake: Documentation drifted from implementation (`--use-api`, QA fail behavior, and expected artifacts), and `typecheck` was referenced without a script.
- Root Cause: Process updates landed in code and tests before docs/scripts were synchronized.
- Preventive Rule: For every CLI contract change, update `README.md`, `package.json` scripts, and verification commands in the same commit.
- Verification Added: `npm.cmd run build`, `npm.cmd run typecheck`, `npm.cmd test -- --run`, and `npm.cmd run generate -- --input examples/input.md --out dist`.

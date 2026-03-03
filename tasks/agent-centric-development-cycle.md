# Agent-Centric Development Cycle

Use this cycle for every feature, bug fix, or refactor.

## Phase 1: Align
- Capture objective, scope, constraints, and acceptance criteria.
- Confirm impacted surfaces (schema, planner/generator, renderers, QA, tests, docs).
- Write the task checklist from `tasks/todo.template.md` into `tasks/todo.md`.

Exit criteria:
- Success criteria are explicit and testable.
- Out-of-scope items are documented.

## Phase 2: Ground
- Inspect repository reality before editing.
- Identify existing contracts and invariants.
- Record assumptions that cannot be proven from code/docs.

Exit criteria:
- Implementation targets are file-specific.
- Risky assumptions are minimized or explicitly logged.

## Phase 3: Design
- Choose approach and data flow.
- Decide API/type changes and compatibility impacts.
- Define verification plan before coding.

Exit criteria:
- Design is decision-complete.
- Verification commands are known.

## Phase 4: Implement
- Make scoped changes.
- Keep schema-first and deterministic-renderer rules.
- Keep business-rule enforcement in QA validators.

Exit criteria:
- Code compiles.
- Behavior aligns with acceptance criteria.

## Phase 5: Verify
- Run required checks:
  - `npm.cmd run typecheck`
  - `npm.cmd test -- --run`
  - `npm.cmd run generate -- --input examples/input.md --out dist`
- Add or update focused tests for the change.

Exit criteria:
- All required checks pass.
- No unverified assumptions remain.

## Phase 6: Learn and Close
- Summarize what changed and why.
- Record preventable mistakes in `tasks/lessons.md` using the template.
- Update docs/scripts affected by contract changes.

Exit criteria:
- `README.md` and relevant docs are synchronized.
- Lessons are captured when applicable.

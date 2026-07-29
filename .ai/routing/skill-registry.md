# Skill registry

## Codex adapters

- `banca-brain-orchestrator`: Project Orchestrator OS for context, approval, routing, worker ownership, loop control, and quality gates.
- `banca-change-impact-gate`: assess affected surfaces, risk, validation, and rollback before a change.
- `banca-change-decision-review`: challenge correctness and alternatives, then request user approval.
- `banca-requirement-gate`: establish implementation readiness.
- `banca-uiux-guard`: protect UX structure and visual consistency.
- `banca-prototype-qc`: validate requirements and regressions.
- `banca-reflection-loop`: detect recurring failures and improve the process.

## Claude adapters

- `banca-feature-implementer`: implement a ready handoff.
- `banca-prototype-patcher`: preserve the prototype architecture.
- `banca-self-check`: validate implementation before handoff.
- `banca-reflection-loop`: record implementation errors and evidence.

## Shared capability references

Codex may also route to installed BA, user-flow, wireframe, UI/UX, visual-design-system, UX-copy, accessibility, testing-strategy, and root-cause-tracing skills. Do not duplicate their generic instructions inside this repository.

## Discovery compatibility

- Claude project adapters are authored under `.claude/skills/`.
- This workspace currently authors and discovers Codex project adapters under `.codex/skills/`.
- Current Codex documentation identifies `.agents/skills/` as the repository-standard discovery path.
- Do not copy or mirror adapters into `.agents/skills/` until the migration gates in `.ai/decisions/ADR-001-AI-WORKSPACE-STRUCTURE.md` confirm that each skill is discovered exactly once.

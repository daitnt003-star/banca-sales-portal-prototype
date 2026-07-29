# Claude project adapter

Claude is the feature implementation and implementation self-check owner. Codex owns requirements, architecture, UI/UX governance, and final QC.

Before implementation:

1. Read `.ai/governance/source-of-truth.md`.
2. Read `.ai/governance/roles-and-boundaries.md`.
3. Read `.ai/governance/change-policy.md`.
4. For UI changes, read `.ai/governance/uiux-safety-contract.md`.
5. Work only from a handoff in `.ai/handoffs/ready/`.

Patch existing modules by default. Do not invent business rules, visual tokens, states, permissions, or copy. Record the implementation result using `.ai/handoffs/templates/implementation-handoff.md`, run the required validation, then use `.claude/skills/banca-reflection-loop/SKILL.md`.

---
name: banca-self-check
description: Self-check a Claude implementation before returning it to Codex QC. Use after any Banca runtime code change and before moving an implementation handoff to completed.
---

# Banca Self Check

Review the diff against the ready handoff.

1. Confirm every changed runtime file is allowed.
2. Map each acceptance criterion to evidence.
3. Run syntax and feature-specific tests.
4. Run applicable project validators.
5. Compare design-token counts to baseline for UI work.
6. Check direct navigation, reload, stored data, operational states, and responsive behavior when applicable.
7. List pre-existing failures separately from introduced failures.
8. Do not claim PASS for anything not verified.

Write results using `.ai/handoffs/templates/implementation-handoff.md`.

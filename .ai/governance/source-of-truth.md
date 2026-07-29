# Source-of-truth order

Use the first applicable source:

1. Current explicit user instruction.
2. `docs/rework-v2/D-source-of-truth-index.md` and the active `docs/rework-v2/` set.
3. Active product and UX specifications under `docs/`.
4. `.ai/decisions/`.
5. Existing runtime behavior.
6. Historical reports and handoffs.

Chat history and generated reports are not product truth. When two active sources conflict, stop implementation and return the conflict to Codex for resolution.

Never change a requirement document merely to make existing code appear correct.

# Change policy

1. Inspect Git status before work.
2. Record a baseline for relevant validators.
3. Use patch-only changes by default.
4. Do not move or regenerate runtime modules without an approved impact analysis.
5. Reuse shared components before creating another implementation.
6. Keep product and channel variation configuration-driven.
7. Do not broaden the file allowlist silently.
8. A pre-existing failure may remain only when unrelated; no change may increase its count or severity.
9. A runtime change is complete only after implementation self-check, project QC, and reflection.
10. Try the same corrective approach at most twice. A third matching failure becomes `RECURRING_BLOCKER`.

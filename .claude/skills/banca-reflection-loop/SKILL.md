---
name: banca-reflection-loop
description: Record implementation failures and evidence for the shared Banca learning loop. Use after a failed implementation check, a repeated correction, or completion of a material feature.
---

# Banca Reflection Loop

Read `.ai/governance/learning-policy.md`.

Record redacted evidence in `.ai/learning/error-ledger.jsonl` using the Codex reflection script when available:

```text
node .codex/skills/banca-reflection-loop/scripts/record-error.js '<json>'
```

Do not promote lessons or change requirements. Report:

- symptom and deterministic evidence;
- cause hypothesis;
- files and phase involved;
- attempt number and result;
- whether the fingerprint recurs.

Stop after two failed attempts under the same hypothesis and return `RECURRING_BLOCKER` to Codex.

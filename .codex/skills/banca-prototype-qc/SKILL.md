---
name: banca-prototype-qc
description: Kiểm định cuối cho thay đổi Banca Sales Portal theo acceptance criteria, source-of-truth, regression, persona, product, state, manifest, terminology và UI/UX. Dùng sau khi Claude triển khai, khi review prototype hoặc trước khi báo hoàn thành.
---

# Banca Prototype QC

Use `.ai/handoffs/templates/qc-report.md`.

## Establish scope

Read the ready handoff, implementation result, Git diff, active source-of-truth, and pre-change baseline. Distinguish pre-existing failures from introduced failures.

## Run deterministic checks

Run applicable commands:

```text
node scripts/validate-manifest.js
node scripts/validate-modules.js
node scripts/validate-terminology.js
node scripts/detect-duplicate-components.js
node scripts/test-foundation.js
node scripts/validate-design-tokens.js
```

Run feature-specific tests declared by the handoff. Add browser smoke evidence when behavior or UI changed.

## Judge

Mark each acceptance criterion `PASS`, `FAIL`, or `NOT_VERIFIABLE`. Check:

- scope and file allowlist;
- business states, permissions, PII, and terminology;
- product and persona isolation;
- loading, empty, error, permission, retry, and recovery states;
- responsive and accessibility requirements;
- deep-link, reload, and stored-data compatibility;
- no increase in relevant validator failures.

Return a corrective handoff for each `FAIL`. Never convert `NOT_VERIFIABLE` to `PASS`. Invoke `banca-reflection-loop` after failures and after material completion.

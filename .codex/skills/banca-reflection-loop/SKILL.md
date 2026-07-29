---
name: banca-reflection-loop
description: Ghi nhận, phân tích và ngăn lỗi lặp trong quá trình BA, UI/UX, code và QC của Banca Sales Portal. Dùng sau validation/QC fail, sau hai lần sửa không thành công, khi lỗi cũ tái xuất hiện, hoặc sau khi hoàn thành thay đổi quan trọng để rút kinh nghiệm có kiểm soát.
---

# Banca Reflection Loop

Read `.ai/governance/learning-policy.md`. Never use learning to silently change product truth.

## Record

Use `scripts/record-error.js` to append a redacted error record to `.ai/learning/error-ledger.jsonl`. Include category, rule, phase, module, component, cause hypothesis, evidence, attempt, and outcome.

## Detect

Run `scripts/detect-recurring-errors.js`. Treat the same normalized category, rule, module, component, and cause as one fingerprint.

## Analyze

Follow `references/root-cause-protocol.md`. Separate:

- trigger;
- proximate defect;
- enabling process gap;
- root cause supported by evidence;
- smallest preventive control.

Change one causal variable per corrective attempt. Stop after two attempts under the same hypothesis. Mark the third matching failure `RECURRING_BLOCKER`.

## Learn

Apply `references/promotion-rules.md`:

- record one occurrence as `OBSERVED`;
- promote repeated or strongly evidenced patterns to `CANDIDATE`;
- promote only after successful prevention and regression to `VALIDATED`;
- require review for `APPROVED`;
- never auto-promote business, legal, permission, state, terminology, or UX-architecture changes.

Update process checklists or routing only after validation. Run `scripts/validate-learning-store.js` before reporting completion.

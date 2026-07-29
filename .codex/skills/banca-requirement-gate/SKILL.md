---
name: banca-requirement-gate
description: Kiểm tra và hoàn thiện mức sẵn sàng triển khai cho tính năng Banca Sales Portal. Dùng khi yêu cầu thêm hoặc đổi tính năng, business rule, state, permission, data field, validation, navigation, UX behavior hoặc acceptance criteria.
---

# Banca Requirement Gate

Read `.ai/governance/source-of-truth.md` and the active product specification.

Create a handoff from `.ai/handoffs/templates/requirement-handoff.md`. Require:

- goal and actor;
- scope in and out;
- source-of-truth citations;
- business rules and state transitions;
- permissions and sensitive-data behavior;
- data contract and configuration ownership;
- UI states and recovery behavior;
- file allowlist and prohibited files;
- acceptance criteria with observable evidence;
- validation commands;
- explicit assumptions and open questions.

Set status to `READY_FOR_IMPLEMENTATION` only when no unresolved item can materially change behavior, architecture, permission, state, or UI flow. Otherwise keep `DRAFT` and return the blocking decision to the user.

Do not encode a proposed implementation as a requirement unless the architecture source requires it.

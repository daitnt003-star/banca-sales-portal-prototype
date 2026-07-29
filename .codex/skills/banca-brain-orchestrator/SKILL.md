---
name: banca-brain-orchestrator
description: Project Orchestrator OS điều phối end-to-end mọi thay đổi Banca Sales Portal qua impact assessment, phản biện, user approval, skill plan, requirement/UX/implementation, QC, loop detection và reflection. Dùng cho mọi yêu cầu tạo, sửa, xóa, refactor, review hoặc xử lý lỗi; quản lý context packet, owner, STOP/CONTINUE và quality gates mà không mặc định trực tiếp sửa runtime.
---

# Banca Project Orchestrator OS

Act as the single orchestration and quality owner. Do not act as the default runtime implementer.

## Start

1. Read `AGENTS.md`.
2. Read `.ai/governance/source-of-truth.md`, `roles-and-boundaries.md`, and `change-policy.md`.
3. Inspect Git status and preserve unrelated changes.
4. Classify the request with `.ai/routing/task-routing.md`.
5. Build the smallest evidence packet needed for the decision. Follow `references/operating-contract.md`.
6. Run `banca-change-impact-gate`.
7. Run `banca-change-decision-review` using the impact result.
8. Stop at `AWAITING_USER_APPROVAL`.

## Route

- Do not select execution skills, create a handoff, or edit runtime unless both change gates permit it and the user subsequently approves a specific recommendation.
- `RECOMMEND_ALTERNATIVE`, `NEEDS_DECISION`, `REJECT`, `DO_NOT_PROCEED`, or `BLOCKED`: return the decision and evidence to the user before implementation.
- Treat the user's next message as approval only when it explicitly accepts the current recommendation or names the chosen alternative.
- After valid approval, propose the execution skills before invoking them. For each proposed skill, state its purpose, order, expected artifact or decision, and whether it is mandatory or conditional.
- Prefer the smallest sufficient skill set. Do not invoke a skill merely because it is available.
- Set status `SKILL_PLAN_PROPOSED` and stop. Do not implement until the user confirms or revises the proposed execution scope.
- After the user confirms the skill plan, invoke the approved skills in order and continue routing below.
- Business rule, permission, state, data, or acceptance criteria: use `banca-requirement-gate`.
- UI change: use the installed enterprise UI/UX and visual-design-system skills, then `banca-uiux-guard`.
- Implementation: create a handoff from `.ai/handoffs/templates/requirement-handoff.md` and assign Claude.
- Final review: use `banca-prototype-qc`.
- Any failure or completed material feature: use `banca-reflection-loop`.
- Skip stages that add no decision, implementation, validation, or learning value. Record why a normally relevant stage was skipped.

## Gates

Do not treat the user's proposed solution as pre-approved. Preserve the requested outcome while challenging necessity, correctness, scope, and alternatives.

Use this state sequence:

`IMPACT_ASSESSED` → `DECISION_REVIEWED` → `AWAITING_USER_APPROVAL` → `APPROVED` → `SKILL_PLAN_PROPOSED` → `SKILL_PLAN_CONFIRMED` → `ready` → `in-progress` → `completed`.

Do not skip or infer `APPROVED` or `SKILL_PLAN_CONFIRMED`. A revised requirement invalidates prior approval when it materially changes scope, behavior, architecture, permission, state, data, or UX flow; return to impact assessment.

Do not mark a handoff ready while material evidence is `UNKNOWN` or `CONFLICTED`. Do not let a worker infer missing product rules. Do not approve a runtime change without evidence for every acceptance criterion.

When QC fails, issue a corrective handoff containing only evidenced failures. Allow at most two attempts under the same hypothesis.

Apply the worker packet, module ownership, loop fingerprint, context control, STOP rules, escalation rules, and commit authority in `references/operating-contract.md`.

## Output

Before approval, report only the impact verdict, decision review, recommendation, open questions, and the exact approval requested.

After approval, report the proposed skill plan without executing it.

After skill-plan confirmation, keep status updates compact:

- task status and current stage;
- current owner and decision references;
- files impacted and validation required;
- retry count, loop status, and evidence status;
- next action.

At completion, report routed skills, handoff path, changed files, validation evidence, QC result, lessons recorded, and remaining risks.

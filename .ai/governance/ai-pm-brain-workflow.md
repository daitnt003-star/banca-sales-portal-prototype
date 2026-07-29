# AI PM Brain workflow

## Purpose

This workflow defines how AI agents should collaborate on the Banca Sales Portal prototype while controlling context size, preserving business ownership, and reducing repeated rework.

The goal is not to make prompts shorter. The goal is to route each request through the right owner, provide each agent only the context it needs, and stop loops before they waste tokens or change business rules by accident.

## Operating principles

1. Current user instruction is the first source of truth.
2. Codex owns requirement, business logic, UX structure, impact analysis, task contract, QC, and reflection.
3. Builder agents only implement an approved task contract.
4. Reviewer agents review diff, acceptance evidence, and regression risk.
5. Runtime changes must use patch or diff mode, not page regeneration.
6. Shared components and design tokens must be reused before creating a new pattern.
7. Same-hypothesis retries stop after two failed attempts.
8. Every completed task must end with a business summary and selectable next actions.

## End-to-end flow

```text
User request
  |
  v
Codex Intake
  |
  v
Context Router
  |
  v
Impact Gate
  |
  v
Decision Review
  |
  v
User Approval
  |
  v
Task Contract
  |
  v
Builder Patch
  |
  v
Reviewer / QC
  |
  v
Reflection
  |
  v
Business Summary + Next Actions
```

## Stage contract

| Stage | Owner | Reads | Output |
|---|---|---|---|
| Codex Intake | Codex | User request, active source of truth | Outcome, actor, scope, task type |
| Context Router | Codex | Source index, decision log, component registry, relevant module only | Small evidence packet |
| Impact Gate | Codex | Evidence packet, governance, affected files | Impact verdict and validation scope |
| Decision Review | Codex | Impact result, source of truth, alternatives | Recommendation for user approval |
| User Approval | User | Recommendation and options | Approved option or revised direction |
| Task Contract | Codex | Approved scope | Ready handoff with file allowlist and acceptance criteria |
| Builder Patch | Builder | Task contract, allowlisted files | Patch, implementation evidence |
| Reviewer / QC | Codex or reviewer | Diff, tests, screenshots when needed | PASS, corrective handoff, or blocker |
| Reflection | Codex | Failure or completed material change | Lesson, recurrence check, prevention rule |
| Business Summary | Codex | Final evidence | Completed work summary and next actions |

## Context router rules

Codex must build the smallest sufficient context packet before any implementation handoff.

Include only:

- current explicit user instruction;
- active source-of-truth files directly related to the request;
- relevant decisions from `.ai/decisions/`;
- component registry entries for affected shared UI;
- affected module files;
- validators and known baseline failures.

Do not include:

- full chat history as product truth;
- unrelated modules;
- old reports unless needed as evidence;
- implementation details that Builder does not need;
- broad file lists without an allowlist.

## Task contract format

Every implementation handoff should be reducible to this shape:

```text
Task
  Business outcome:
  Actor / journey:
  Scope:

Inputs
  Source of truth:
  Current behavior:
  Approved decision:

Allowed files
  - path

Acceptance criteria
  - business-visible result
  - UI / state / permission behavior
  - regression that must not occur

Do not
  - forbidden shortcut
  - unrelated refactor
  - new pattern when shared component exists

Validation
  - command or browser check
  - expected evidence
```

## Builder rules

Builder agents must:

- implement only the approved task contract;
- read only allowed files unless blocked by missing evidence;
- use existing shared components, tokens, data contracts, and terminology;
- patch the smallest code region possible;
- stop on missing business rules, conflicting source of truth, or file scope expansion;
- report changed files, validation commands, and residual risk.

Builder agents must not:

- redefine workflow, state, permission, product rule, or UX architecture;
- regenerate complete pages as a shortcut;
- copy shared components into module code;
- silently broaden the allowlist;
- mark a task complete without validation evidence.

## Reviewer and QC rules

Reviewer should inspect the diff first, then run targeted validation.

Review must answer:

- Does the change satisfy the approved business outcome?
- Does it preserve existing journey, permissions, state, and data ownership?
- Does it reuse the expected shared component or token?
- Are action labels, status labels, and recovery states understandable to business users?
- Do tests or browser checks prove the acceptance criteria?
- Did the patch introduce unrelated churn?

If QC fails, Codex creates a corrective handoff containing only evidenced failures. The same fix hypothesis can be attempted at most twice.

## Stop rules

Stop and return to user or Codex decision when:

- source of truth conflicts;
- business owner decision is required;
- user request changes workflow, state, permission, or legal content materially;
- validation fails twice under the same hypothesis;
- implementation needs files outside the approved allowlist;
- design requires a new page pattern where an existing shared pattern may work;
- regression risk cannot be validated locally.

## Completion summary standard

Every completed request must end with:

1. Business summary: what changed in user/business language.
2. Evidence: tests, browser checks, or files changed.
3. Residual risk: only if meaningful.
4. Next actions as selectable options.

Use this format:

```text
Tác vụ đã hoàn thành
...

Bằng chứng kiểm tra
...

Chọn bước tiếp theo
A — ...
B — ...
C — ...
D — ...
```

The options should be real next actions. Do not ask the user to retype a long instruction when a short option can express the decision.

## Token-control checklist

Before assigning implementation:

- Is there a source-of-truth file instead of repeating old chat?
- Is the affected module identified?
- Is the shared component decision known?
- Is the file allowlist explicit?
- Is the acceptance evidence explicit?
- Can the reviewer validate from diff plus tests?
- Is there a clear stop condition?

If any answer is no, Codex must resolve it before Builder starts.


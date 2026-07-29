# Task contract

Status: DRAFT
Task id:
Owner: Codex
Implementer:
Reviewer: Codex
Created:

## Business outcome

Describe the expected business-visible result in plain language.

- Actor:
- Journey:
- User value:
- Business rule preserved:

## Approved decision

- User approval:
- Approved option:
- Decision review verdict:
- Impact gate verdict:
- Source-of-truth priority:

## Scope in

List exactly what must change.

- 

## Scope out

List nearby items that must not be changed in this task.

- 

## Context packet

Only include evidence needed by the implementer.

### Source-of-truth references

- 

### Current behavior

- 

### Target behavior

- 

### Relevant decisions

- 

### Known baseline issues

- 

## Allowed files

Builder may edit only these files unless Codex approves a scope update.

- 

## Read-only reference files

Builder may read these files but must not edit them.

- 

## Prohibited changes

- Do not redefine business rules, permissions, state transitions, product rules, or UX architecture.
- Do not regenerate full pages when a local patch is enough.
- Do not introduce a new shared UI pattern before checking the component registry.
- Do not copy shared components into module code.
- Do not broaden the file allowlist silently.
- Do not change unrelated copy, navigation, seed data, cache keys, or tests.

## Shared components and tokens

- Required shared component:
- Required design tokens:
- Existing pattern to reuse:
- New component allowed: no

If a new component or token is required, stop and return to Codex.

## Acceptance criteria

Use business-visible criteria first.

- 

## UI and interaction criteria

Complete this section for UI tasks.

- Status, empty, error, disabled, success, and recovery states:
- Primary and secondary action hierarchy:
- Vietnamese production-like copy:
- Responsive behavior:
- Keyboard and focus behavior:
- Accessibility risk:

## Data, permission, and state criteria

Complete this section when behavior depends on customer, team, channel, product, status, or payment state.

- Data owner:
- Permission rule:
- State transition:
- Channel variation:
- Product variation:
- Sensitive data handling:

## Validation plan

### Required commands

```text

```

### Required browser checks

- 

### Expected evidence

- 

## Stop conditions

Builder must stop and report if any condition happens.

- Source-of-truth conflict appears.
- Required business decision is missing.
- Required file is outside the allowlist.
- Existing shared component cannot satisfy the requirement.
- Validation fails twice under the same fix hypothesis.
- Regression risk cannot be checked locally.

## Implementation report required from Builder

Builder must return:

- files changed;
- summary of implementation in business language;
- acceptance criteria evidence;
- validation command output summary;
- UI screenshot or browser check summary when relevant;
- assumptions used;
- remaining risks;
- any scope expansion request.

## QC checklist

Reviewer must verify:

- Diff matches approved scope.
- No unrelated churn.
- Business outcome is satisfied.
- Source-of-truth rules are preserved.
- Shared component and token rules are followed.
- Required tests or browser checks pass.
- Completion summary and next actions are ready for the user.


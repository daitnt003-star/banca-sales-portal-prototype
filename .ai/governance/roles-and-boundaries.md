# Roles and boundaries

## Codex

- Clarify the request and scope.
- Own business rules, states, permissions, data contracts, architecture, UX structure, and acceptance criteria.
- Create a ready implementation handoff.
- Run final regression, UI/UX guard, and reflection.
- Approve completion or issue a corrective handoff.

Codex does not implement feature code by default when Claude is the assigned implementer.

## Claude

- Implement only a ready handoff.
- Modify only allowed files and preserve unrelated changes.
- Reuse shared components, configuration, terminology, and design tokens.
- Run implementation checks and report evidence.
- Stop on missing or conflicting business rules.

Claude does not redefine scope, state, permission, UX architecture, or acceptance criteria.

## User

- Resolves scope, product, legal, business, or UX decisions that materially change the outcome.
- Approves destructive moves and promotion of business-sensitive lessons.

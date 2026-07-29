# ADR-001: AI workspace structure for Claude and Codex

**Status:** Accepted  
**Date:** 2026-07-28  
**Decider:** Project owner

## Context

The project uses Claude for implementation and implementation self-check, Codex for analysis and final QC, and `.ai/` for shared governance and handoffs.

Claude Code officially discovers project skills from `.claude/skills`, subagents from `.claude/agents`, project rules from `.claude/rules`, and project settings from `.claude/settings.json`.

Current Codex documentation discovers repository skills from `.agents/skills`. This workspace currently discovers project adapters from `.codex/skills`. Moving or mirroring those skills without validating both clients can create missing or duplicate skill registrations.

## Decision

Keep the current three-layer architecture:

```text
.
├── AGENTS.md
├── CLAUDE.md
├── .ai/
├── .claude/
│   └── skills/
└── .codex/
    └── skills/
```

Treat `.ai/` as the tool-neutral source of truth. Treat `.claude/` and `.codex/` as thin, tool-specific adapters.

Do not create empty `agents`, `hooks`, `rules`, or `scripts` directories. Add a capability only when a concrete use case exists:

- `.claude/agents/`: a repeatable task requires isolated context or restricted tools;
- `.claude/rules/`: instructions must be scoped by topic or file path;
- `.claude/settings.json`: the team needs shared permissions, hooks, or settings;
- hook scripts: deterministic enforcement is required and registered in settings.

Keep `.codex/skills` as the active authoring location until a clean-session compatibility check proves that `.agents/skills` can be introduced without missing or duplicate registrations. Prefer a reversible compatibility layer over copying skill contents.

## Options considered

### Rebuild `.claude/` to match a generic template

**Pros:** Familiar visual layout; placeholders for future capabilities.  
**Cons:** Adds unused structure, implies capabilities that are not configured, and does not solve Codex compatibility.

### Move all shared content under one tool

**Pros:** One visible configuration tree.  
**Cons:** Couples governance to one client, duplicates knowledge, and weakens role boundaries.

### Incremental normalization

**Pros:** Preserves working discovery, keeps ownership explicit, and supports reversible migration.  
**Cons:** Requires compatibility validation before adopting a newer Codex path.

## Consequences

- Existing Claude and Codex adapters remain stable.
- Shared business and workflow truth must not be duplicated into tool-specific folders.
- New Claude directories require a demonstrated use case.
- Codex path migration remains a separate, testable change.
- The project must keep the skill registry aligned with actual adapters.

## Migration gates

Before introducing `.agents/skills`:

1. Capture the skill list from a clean Codex session using the current tree.
2. Test the candidate compatibility layout in an isolated worktree or copy.
3. Confirm every project skill appears exactly once.
4. Confirm implicit and explicit invocation for representative skills.
5. Confirm `.codex/skills` consumers, including Claude reflection, still resolve.
6. Document rollback and remove the candidate layout if any check fails.

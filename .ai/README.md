# Shared AI operating system

`.ai/` is the tool-neutral source of truth shared by Codex and Claude.

- `governance/`: stable rules and role boundaries.
- `governance/ai-pm-brain-workflow.md`: end-to-end AI operating workflow for intake, context routing, approval, task contracts, builder patching, QC, reflection, and next-action summaries.
- `routing/`: task-to-skill routing and skill inventory.
- `handoffs/`: ready, active, and completed work contracts.
- `learning/`: append-only errors, candidate lessons, approved lessons, and metrics.
- `decisions/`: architecture decision records.

Product requirements remain under `docs/`. Tool-specific files are adapters and must not duplicate business knowledge from `.ai/` or `docs/`.

## Workspace layout

```text
.
├── AGENTS.md              # Codex project instructions
├── CLAUDE.md              # Claude project instructions
├── .ai/                   # Shared truth, workflow state, and decisions
├── .claude/
│   └── skills/            # Claude implementation adapters
└── .codex/
    └── skills/            # Active Codex decision and QC adapters
```

Do not rebuild this tree from a generic template. Add tool-specific directories only for an active capability:

- `.claude/agents/` for reusable custom subagents;
- `.claude/rules/` for topic- or path-scoped Claude rules;
- `.claude/settings.json` for shared Claude settings, permissions, or hook registration;
- `.agents/skills/` only after the compatibility gates in `decisions/ADR-001-AI-WORKSPACE-STRUCTURE.md` pass.

Do not create placeholder directories or copy the same skill into multiple discovery paths.

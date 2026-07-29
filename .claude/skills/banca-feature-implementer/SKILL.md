---
name: banca-feature-implementer
description: Implement an approved Banca Sales Portal feature handoff. Use when a handoff in .ai/handoffs/ready has status READY_FOR_IMPLEMENTATION and Claude is assigned to change runtime code.
---

# Banca Feature Implementer

Read `CLAUDE.md`, the named ready handoff, and all governance files it references.

1. Inspect Git status and the allowed files.
2. Move or copy the handoff state to `in-progress` without changing its requirements.
3. Implement the smallest patch satisfying every acceptance criterion.
4. Reuse shared configuration, components, terminology, and tokens.
5. Stop when a missing decision changes state, permission, data, architecture, or UX.
6. Run the handoff validation commands and `banca-self-check`.
7. Write an implementation result using `.ai/handoffs/templates/implementation-handoff.md`.
8. Run `banca-reflection-loop`.

Do not edit requirement documents to match the implementation.

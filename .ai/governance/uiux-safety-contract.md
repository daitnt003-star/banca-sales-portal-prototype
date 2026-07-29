# UI/UX safety contract

Every UI change must preserve the current design language unless an approved UX specification says otherwise.

## Required

- Reuse page-shell, navigation, card, table, form, modal, drawer, badge, toast, and state patterns.
- Use tokens from `shared/styles/tokens.css`.
- Cover loading, empty, error, permission, disabled, success, and recovery states where applicable.
- Preserve keyboard navigation, visible focus, semantic landmarks, readable contrast, reduced motion, and responsive behavior.
- Use Vietnamese production-like copy and data; do not expose raw enum values.
- Keep primary action hierarchy and next-action wording aligned with business state.
- Compare design-token violations before and after the patch.

## Prohibited without approval

- New arbitrary color, spacing, font-size, radius, shadow, z-index, or motion duration.
- A new page pattern where an existing pattern can satisfy the requirement.
- Copying a shared component into a module.
- Changing navigation, information architecture, or responsive breakpoints as an implementation shortcut.
- Encoding status only by color.

If a requirement conflicts with this contract, Codex must produce an explicit UX impact decision before implementation.

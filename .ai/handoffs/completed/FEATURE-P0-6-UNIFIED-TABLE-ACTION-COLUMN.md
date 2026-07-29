# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Chuẩn hóa mọi interactive action column trong các bảng nghiệp vụ thành một cột dọc với control bằng width/height, chấm dứt việc mỗi trang xếp nút khác nhau.

## Actor and permissions

- Seller/RM, team manager and other existing personas retain current allowed actions.
- Read-only/disabled users retain current absence or disabled state.
- No action is added, removed, promoted or made available to a new role.
- PII/data-scope behavior is unchanged.

## Source-of-truth references

- User approval 2026-07-28: one vertical action column, fixed/equal width and height across pages.
- `.ai/specs/visual/FEATURE-P0-6-UNIFIED-TABLE-ACTION-COLUMN.md`.
- P0.3 Operational Lists and P0.4 Workspace Action Bar contracts.
- `.ai/governance/uiux-safety-contract.md`.

## Scope in

- Shared table-action-cell/action-stack geometry and overlay menu styles.
- Interactive action cells in Quick Advice, Quote list, Policy list, Seller Workspace tables and Team Workspace tables.
- Semantic “Hành động” header for action cells currently using an empty header where changing the label does not alter information architecture.
- Cache versions, focused tests and compatible prior test assertions.

## Scope out

- Audit/event-log “Hành động” data column.
- Document rows and OCR document actions.
- Cards, forms, modals, drawers, action bars and workspace command bars.
- Business action selection, permission, navigation destinations, state, data, resolver, pricing, underwriting, payment, API or seed changes.
- Generic table renderer.

## Business rules and state transitions

- Existing primary/main action remains first.
- Existing secondary/destructive actions remain under the existing “Khác”/overflow trigger.
- A row with only one permitted action renders only that action.
- A row with no permitted action renders an empty action stack/cell, not a fabricated action.
- Existing row-click navigation remains supplemental; explicit action links remain available.
- No state transition changes.

## Data contract

No data, storage, API, configuration, seed or migration change.

## UI/UX specification

Follow `.ai/specs/visual/FEATURE-P0-6-UNIFIED-TABLE-ACTION-COLUMN.md`.

The shared presentation contract:

- `table-action-cell`: action column cell/header geometry.
- `table-action-stack`: one-column action group.
- existing or adapted more/overflow disclosure: overlay; same trigger geometry.
- direct child buttons/links/summary occupy 100% of the shared 144px stack width and the standard small-button height.

## Files allowed

- `shared/styles/components.css`
- `shared/js/head-loader.js`
- `shared/components/quote-list-shell.js`
- `modules/quick-advisory/index.html`
- `modules/unsubmitted-applications/index.html` (loader/cache query only if needed)
- `modules/policies/index.html`
- `modules/seller-workspace/index.html`
- `modules/team-workspace/index.html`
- `scripts/test-p0-unified-table-actions.js`
- `scripts/test-p0-operational-lists.js`
- `scripts/test-p0-page-header-next-action.js` (shared cache assertion only)
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-6-UNIFIED-TABLE-ACTION-COLUMN.md`

## Files prohibited

- Application Workspace runtime and P0.4 action bar.
- Foundation component implementation.
- Document/OCR shared renderers.
- Resolver, permission, state, product, payment, underwriting and seed files.
- Unrelated runtime modules and dirty-worktree files.

## Components and tokens to reuse

- Existing `.btn`, `.btn-sm`, `.operational-more`, Team overflow and sticky action patterns.
- `--space-5xl`, `--space-xs`, `--paper-card`, `--line`, `--radius-sm`, `--shadow-2`, `--z-dropdown`.
- Existing focus/coarse-pointer behavior.

## Acceptance criteria

1. All in-scope interactive action cells use the shared action-cell and one-column stack contract.
2. Visible stack controls measure 144px wide and equal height per row at desktop; coarse-pointer minimum remains 44px.
3. Main action appears above “Khác”; only-more and only-main rows retain the same geometry.
4. Opening Quick Advice/Policy/Team more menus does not change the parent row height.
5. More menus render as overlays and do not push table content.
6. Quote action cells use the same shared geometry without changing CTA label, destination or primary presentation.
7. Seller work queue, recent-draft and applicable Team tables adopt the same vertical geometry.
8. Formal action columns have an observable “Hành động” header; audit log event columns are unchanged.
9. Existing sticky behavior remains on Operational Lists; non-sticky tables are not made sticky without an existing contract.
10. Existing action availability, permissions, row navigation and destinations remain unchanged for RM-01, RM-02 and management personas.
11. Empty, single-action, main+more, only-more, disabled/read-only states render without fake actions or layout breakage.
12. Keyboard focus is visible; native/overflow disclosure can be opened and closed.
13. Table overflow remains contained on desktop/tablet; action labels do not wrap into inconsistent heights.
14. Prior P0.3/P0.1 regressions and relevant privacy/permission checks pass.
15. Token totals do not exceed 1122 errors / 670 warnings.
16. No implementation file outside the corrected allowlist is changed.

## Validation commands

- `node scripts/test-p0-unified-table-actions.js`
- `node scripts/test-p0-operational-lists.js`
- `node scripts/test-p0-page-header-next-action.js`
- `node scripts/test-home-work-queue.js`
- `node scripts/test-privacy-home.js`
- `node scripts/test-privacy-consent.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/validate-design-tokens.js`
- Browser measurements/screenshots for Quick Advice, Quote, Policy, Seller and Team, including open more menus and persona checks.

## Assumptions and open questions

- VERIFIED: current button minimum heights are 34px desktop and 44px coarse pointer.
- VERIFIED: 144px is expressible entirely through the existing spacing scale.
- VERIFIED: Quick Advice and Policy already use native disclosure; Team uses an existing absolute overflow menu.
- VERIFIED: no business/data decision is required.
- No material open question.

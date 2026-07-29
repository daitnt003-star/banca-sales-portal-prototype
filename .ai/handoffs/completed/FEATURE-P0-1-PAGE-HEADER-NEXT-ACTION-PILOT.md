# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Thiết lập Page Header và Next Action pattern dùng chung, rồi áp dụng thử nghiệm trên ba danh sách Tư vấn nhanh, Bản chào và Hợp đồng để giảm CTA cạnh tranh, bổ sung heading semantics và làm rõ mục tiêu trang.

## Actor and permissions

- RM/tư vấn viên được xem các action phù hợp capability hiện hành.
- Persona quản lý thuần không được nhìn thấy action bán hàng bị ẩn bởi permission/selling profile.
- Component chỉ render action do page/state resolver truyền vào; không tự suy permission hoặc business state.

## Source-of-truth references

- User approval 2026-07-28: P0 UX Foundation.
- User approval 2026-07-28: P0.1 foundation + pilot trên Tư vấn nhanh, Bản chào và Hợp đồng.
- `.ai/governance/uiux-safety-contract.md`.
- `docs/rework-v2/D-source-of-truth-index.md`.
- UX audit evidence: 5/6 pages lacked `h1`; 46/177 interactive targets had a dimension below 32px.

## Scope in

- Shared `BANCA.ui.pageHeader(cfg)`.
- Shared `BANCA.ui.nextActionPanel(cfg)`.
- Add an opt-in shell header-action mode with safe default; pilot pages explicitly choose their action set.
- Migrate three list pages to the shared page header.
- Preserve all filters, tables, routes and record-level actions.
- Add deterministic tests for component contract, permission-safe action rendering, heading semantics and pilot adoption.

## Scope out

- No Application Workspace changes; its sticky/action bar belongs to P0.4.
- No changes to seller home Work Queue, team workspace, help, policy detail or submitted application workspace.
- No business state, permission, pricing, underwriting, payment or data-contract changes.
- No broad token migration or visual redesign.

## Business and UX rules

1. Each pilot page has exactly one semantic `h1`.
2. `PageHeader` contains title, optional description, optional summary/status and actions.
3. Maximum one primary page action; maximum two secondary actions. Overflow is not required in this pilot.
4. `NextActionPanel` accepts an already-resolved action. It supports `default`, `disabled`, `loading`, `blocked`, `error` and recovery copy.
5. A disabled/blocked action must include a visible reason.
6. Component must not infer permission, state or next action from global data.
7. Quick Advice list has no local “Bắt đầu tư vấn mới” action. Existing topbar shortcut remains the only new-advice entry on that page.
8. Bản chào list may expose one primary “Tạo bản chào” action when `canSell`; it must not duplicate another primary action within page content.
9. Hợp đồng list has no create action. Its page header describes contract management and record-level actions remain state-driven.
10. Pilot topbar modes:
    - Quick Advice: retain only the existing Quick Advice shortcut from the sales shortcut group; no local duplicate.
    - Bản chào: retain Create Offer as primary; resume may remain secondary only if currently available.
    - Hợp đồng: no sales creation shortcuts; language/demo controls remain.
11. Existing default shell behavior remains unchanged for non-pilot pages.

## Component contract

### `BANCA.ui.pageHeader(cfg)`

- `title`: required escaped text rendered as `h1`.
- `description`: optional escaped text.
- `metaHtml`: optional trusted HTML produced by existing shared helpers.
- `primaryActionHtml`: optional trusted action, maximum one.
- `secondaryActionsHtml`: optional trusted actions, maximum two by caller contract.
- `className`: optional approved variant only.

### `BANCA.ui.nextActionPanel(cfg)`

- `label`, `description`, `actionHtml`, `reason`, `state`, `recoveryHtml`.
- `state` enum: `default|disabled|loading|blocked|error`.
- Announces status/reason in text, never by color only.
- Loading/blocked actions are not actionable.

### `shell(..., opts)`

- Add opt-in `headerActionMode`; accepted modes limited to `DEFAULT`, `QUICK_ADVICE`, `OFFERS`, `POLICIES`.
- Unknown/missing mode falls back to `DEFAULT`.
- Language/demo controls are not affected.

## Visual specification

- Reuse existing page maximum width and card language.
- Use only tokens from `shared/styles/tokens.css`.
- Page header uses existing 24px title scale (`qls-title`) or its corresponding token; do not introduce a new size.
- Spacing follows the existing token scale; no raw shadow, color, radius or z-index.
- Enterprise desktop interactive target minimum: 32×32px; touch breakpoint: 44×44px.
- Visible `:focus-visible` treatment must reuse the current focus token/pattern.
- No palette or sidebar change.

## Files allowed

- `shared/components/foundation-components.js`
- `shared/styles/components.css`
- `shared/js/app-shell.js`
- `modules/quick-advisory/index.html`
- `modules/unsubmitted-applications/index.html`
- `modules/policies/index.html`
- `shared/components/quote-list-shell.js` only if required to remove the legacy duplicate title/action after PageHeader adoption.
- `scripts/test-p0-page-header-next-action.js`
- Implementation report for this feature.

## Files prohibited

- `modules/application-workspace/**`
- `modules/seller-workspace/**`
- `modules/team-workspace/**`
- `modules/submitted-applications/**`
- Product, pricing, underwriting, payment, journey, permission and seed files.
- Unrelated dirty-worktree files and blocked continuity handoffs.

## Acceptance criteria

1. All three pilot pages render exactly one `h1`.
2. Quick Advice has no local start-new CTA and its topbar does not show unrelated Create Offer/Resume actions.
3. Bản chào has one primary Create Offer entry and does not duplicate it inside the page header/body.
4. Hợp đồng topbar has no sales creation shortcuts.
5. Non-pilot pages retain the existing default shell actions.
6. PageHeader and NextActionPanel escape text and do not derive permission/state.
7. Disabled/blocked NextActionPanel includes a visible reason; loading is non-actionable.
8. Existing list filters, tabs, counts, routes and record-level actions remain unchanged.
9. RM and management-only persona visibility remains permission-safe.
10. No new design-token violations; interactive targets introduced by the patch meet the approved minimum.
11. Keyboard focus is visible and heading/landmark semantics pass focused checks.

## Validation commands

- `node scripts/test-p0-page-header-next-action.js`
- `node scripts/test-quick-advice-navigation.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/validate-design-tokens.js`
- Browser smoke at desktop: three pilot pages plus one non-pilot page.
- Keyboard smoke: skip link → page header actions → filters/table actions.

## Baseline

- Design token: 1,153 errors / 685 warnings.
- Interactive target audit across six pages: 46/177 under 32px.
- Pilot semantics before patch: Quick Advice and Hợp đồng have no `h1`; Bản chào has one.

## Assumptions and open questions

- Existing global Quick Advice shortcut is retained because the user prohibited a duplicate button inside the list, not the established header shortcut.
- P0.1 is a reversible pilot; expansion to other pages requires separate QC evidence.

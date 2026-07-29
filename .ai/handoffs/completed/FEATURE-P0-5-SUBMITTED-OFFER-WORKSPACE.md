# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Bố cục lại Bản chào đã nộp theo thứ tự identity → next action → lifecycle → navigation → content, giảm lặp thông tin và đưa người dùng tới đúng dữ liệu/hành động nhanh hơn.

## Actor and permissions

- RM/seller sees the same submitted records and actions allowed by current canonical state/capabilities.
- Manager/read-only sees the same submitted data permitted today and no mutation action.
- Conditional tabs and sensitive data remain governed by existing case state and access logic.

## Source-of-truth references

- User approval 2026-07-28: comprehensive submitted-offer layout.
- `docs/rework-v2/D-source-of-truth-index.md`, Application Workspace + versioning.
- `docs/ux/reviews/cross-screen-layout-review-2026-07-21.md`.
- `.ai/design/CRITIQUE-P0-5-SUBMITTED-OFFER-WORKSPACE.md`.
- `.ai/specs/visual/FEATURE-P0-5-SUBMITTED-OFFER-WORKSPACE.md`.
- `.ai/governance/uiux-safety-contract.md`.

## Scope in

- Submitted Application Workspace identity header, P0.4 command bar placement, lifecycle strip, top/sub navigation and active-tab content shell.
- Overview presentation deduplication.
- Stable content title/description per top/sub tab.
- Responsive layout, accessibility semantics and cache/test compatibility.

## Scope out

- Draft Application Workspace and its stepper/content.
- Tab IDs, URL parameters, deep-link destinations or conditional visibility rules.
- Business state, canonical resolver, permission, PII, pricing, underwriting, confirmation, payment, policy issuance, API, storage or seed changes.
- Tab-specific business component redesign.
- Policy Cockpit and other modules.

## Business rules and state transitions

- `caseView`, `caseFlow`, `caseNextAction()` and `getSubmittedCaseActions()` remain unchanged as business sources.
- `topTabs`, `topActive`, sub-tab aliases and Supplement visibility retain current rules.
- Current tab content branches remain reachable by the same `?id=&tab=` URLs.
- Overview may remove duplicated presentation of current status and detailed timeline only because:
  - current state/next action remains in header/command bar;
  - canonical lifecycle remains in lifecycle strip;
  - detailed events remain in History.
- Health/operational context and business/integration status must not be lost.

## Data contract

No contract, seed, persistence, API or migration change.

## UI/UX specification

Follow `.ai/specs/visual/FEATURE-P0-5-SUBMITTED-OFFER-WORKSPACE.md`.

Content titles:

- Overview: `Tổng quan xử lý`
- Snapshot parent: `Yêu cầu đã nộp`
- Customer: `Thông tin khách hàng`
- Quote: `Gói và phí`
- Declaration: `Nội dung khai báo`
- Documents: `Tài liệu đã nộp`
- Supplement: `Yêu cầu bổ sung`
- Underwriting: `Thẩm định`
- Confirm/pay: `Xác nhận và thanh toán`
- Policy: `Hợp đồng`
- History: `Lịch sử xử lý`

Descriptions must be concise Vietnamese operational copy and must not expose raw enums.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `modules/application-workspace/index.html`
- `shared/styles/components.css`
- `shared/js/head-loader.js`
- `scripts/test-p0-submitted-offer-layout.js`
- `scripts/test-p0-workspace-action-bar.js` (cache/layout compatibility assertions only)
- `scripts/test-p0-page-header-next-action.js` (shared cache-version assertion only)
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-5-SUBMITTED-OFFER-WORKSPACE.md`

## Files prohibited

- Foundation component implementation (reuse existing `BANCA.ui.tabBar`).
- Business resolver, seed, product schema, journey, payment and underwriting files.
- Draft-specific runtime behavior.
- Other modules and unrelated dirty-worktree files.

## Components and tokens to reuse

- `BANCA.ui.tabBar`.
- P0.4 `.workspace-command-bar`, `.workspace-action-group`, `.workspace-action-more`.
- Existing case stepper, status badges, cards and tab content renderers.
- Token values defined in the visual spec; no arbitrary new palette, breakpoint, shadow or z-index.

## Acceptance criteria

1. Submitted page renders five ordered zones: identity, command bar, lifecycle, navigation and content.
2. Identity header contains no lifecycle strip or action controls and remains the only sticky submitted top surface.
3. P0.4 command bar remains behaviorally unchanged, at most one primary, with secondaries under keyboard-operable “Khác”.
4. Canonical lifecycle is rendered once outside the identity header and not duplicated in Overview.
5. Top navigation uses `BANCA.ui.tabBar`; snapshot sub-navigation uses its pill variant.
6. All existing top/sub tab URLs, aliases, active states and conditional Supplement visibility remain compatible on reload/deep-link.
7. Active tab renders the approved Vietnamese content title and description.
8. Overview does not render the duplicate current-status card or duplicate detailed timeline.
9. Overview retains insurance/request summary, health/operational checks where applicable, business/integration context and participant/source information.
10. RM and manager/read-only action availability remains unchanged.
11. Motor and Health submitted records render across pending, more-info, conditional, payment, issued, rejected and cancelled states; PA remains compatible if submitted PA data is introduced.
12. At `<1280px` content/rail is one column; at `<960px` header and command context stack; tabs remain horizontal-scroll navigation.
13. Keyboard focus and `aria-current` are observable on navigation; no navigation depends on row/click-only behavior.
14. Existing tab-specific empty/error/permission/retry states remain present.
15. Relevant regression suites pass and token totals do not exceed 1139 errors / 681 warnings.
16. Implementation touches no files outside the corrected allowlist.

## Validation commands

- `node scripts/test-p0-submitted-offer-layout.js`
- `node scripts/test-p0-workspace-action-bar.js`
- `node scripts/test-p0-page-header-next-action.js`
- `node scripts/test-product-package-quote-continuity.js`
- `node scripts/test-underwriting-routing.js`
- `node scripts/test-payment-gate.js`
- `node scripts/test-privacy-consent.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/validate-design-tokens.js`
- Browser smoke/screenshots for relevant submitted states, RM and manager, desktop and responsive rules.

## Assumptions and open questions

- VERIFIED: current submitted workspace already groups top navigation to 6–7 tabs.
- VERIFIED: shared `BANCA.ui.tabBar` supports underline and pill variants.
- VERIFIED: History contains detailed event data, so Overview timeline duplication can be removed without losing access.
- VERIFIED: no submitted PA seed exists; compatibility can be enforced structurally and through product-agnostic rendering.
- No material open question.

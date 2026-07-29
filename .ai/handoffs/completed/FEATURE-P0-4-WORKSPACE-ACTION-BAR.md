# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Chuẩn hóa vùng hành động của Application Workspace để nút không còn lệch hàng, lệch kích thước hoặc cạnh tranh phân cấp; giữ nguyên hành động nghiệp vụ hiện tại.

## Actor and permissions

- RM/seller sở hữu bản chào được dùng hành động chỉnh sửa theo capability và trạng thái hiện tại.
- Manager/chế độ read-only chỉ xem; không được nhận hành động thay đổi dữ liệu.
- Submitted actions tiếp tục lấy từ canonical case view/resolver.
- Không thay đổi PII hoặc data-scope.

## Source-of-truth references

- User approval 2026-07-28: desktop theo hàng, màn hình hẹp theo cột, control cùng nhóm bằng width/height.
- `docs/ux/reviews/cross-screen-layout-review-2026-07-21.md`, mục Page shell và Draft Application Workspace.
- `docs/rework-v2/D-source-of-truth-index.md`, Application Workspace + versioning.
- `.ai/specs/visual/FEATURE-P0-4-WORKSPACE-ACTION-BAR.md`.
- `.ai/governance/uiux-safety-contract.md`.

## Scope in

- Draft Application Workspace bottom action bar.
- Review-step submit action placement and disabled-state continuity.
- Submitted Application Workspace command bar.
- Responsive action-group layout and native `Khác` disclosure.
- Focus, keyboard, cache version and deterministic feature tests.

## Scope out

- No action normalization inside package cards, document rows, modal bodies, demo tools or Policy Cockpit.
- No navigation, step order, business status, permission, pricing, underwriting, confirmation, payment, API or seed changes.
- No global `.btn` redesign and no new breakpoint.
- No change to product/package continuity.

## Business rules and state transitions

- Draft retains previous/next navigation based on visible non-auto steps.
- Review uses the existing two acknowledgements, `okData` blocker state and `refreshSubmitBtn()` rules.
- “Nộp yêu cầu bảo hiểm” moves to the action bar; it must not remain duplicated in the content card.
- Submitted primary and secondary actions remain derived from `caseView`.
- Exactly one primary action maximum is rendered in each workspace action region.
- Submitted secondary actions are disclosed by “Khác”; issued-policy actions keep their existing destinations and effects.
- No state transition is added, removed or reordered.

## Data contract

No data-contract, storage, API, seed or migration change.

## UI/UX specification

- Use `.ai/specs/visual/FEATURE-P0-4-WORKSPACE-ACTION-BAR.md`.
- Desktop action controls in the same group use equal grid columns and equal height.
- At or below the existing 960px breakpoint, controls stack in one column and occupy full width.
- Draft bottom bar may remain sticky only for the multi-step journey.
- Submitted mode uses a compact command row near the header, not a sticky bottom journey bar.
- Native `details/summary` is required for “Khác”.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `modules/application-workspace/index.html`
- `shared/styles/components.css`
- `shared/js/head-loader.js`
- `scripts/test-p0-workspace-action-bar.js`
- `scripts/test-p0-page-header-next-action.js` (cache-version assertion only)
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-4-WORKSPACE-ACTION-BAR.md`

## Files prohibited

- Business seed and resolver files.
- Product schemas, journey registry, payment and underwriting shared panels.
- Other runtime modules.
- Existing unrelated dirty-worktree files.

Corrective clarification (attempt 1): because `components.css` changes require a deterministic
shared-asset cache bump, the existing P0.1 regression test may update only its hard-coded
`sharedAssetVersion` expectation. No other assertion or runtime scope is expanded.

## Components and tokens to reuse

- Existing `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`.
- Existing focus styles and `details/summary` browser semantics.
- `--space-sm`, `--space-md`, `--paper-card`, `--line`, `--shadow-2`, `--z-sticky`, `--z-dropdown`.
- Existing `caseView`, `caseNextAction()`, `getSubmittedCaseActions()`, `refreshSubmitBtn()` and `submitApp()`.

## Acceptance criteria

1. Draft desktop bottom bar renders previous action and current primary action in one aligned row; controls in its action group have equal width and height.
2. Draft at viewport width <=960px stacks the action controls in one column at full available width.
3. Review has one “Nộp yêu cầu bảo hiểm” control in the action bar and none duplicated in the content card.
4. Review submit remains disabled until existing data blockers and both confirmations are satisfied; its title/reason remains observable.
5. Submitted command bar renders at most one primary action and groups all additional actions in keyboard-operable “Khác”.
6. Submitted action destinations/effects match the pre-change canonical resolver behavior.
7. Issued and read-only/manager states preserve their permissions and action availability.
8. Motor, PA and Health draft/submitted deep links render without error.
9. Keyboard focus is visible and native “Khác” opens with keyboard/click.
10. Design-token violations do not exceed baseline 1140 errors / 682 warnings.
11. No files outside the allowlist are changed by this implementation.

## Validation commands

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
- Browser smoke at desktop and <=960px for Motor, PA, Health, submitted and manager/read-only.

## Assumptions and open questions

- VERIFIED: existing token layer defines the required spacing, elevation, z-index and breakpoint values.
- VERIFIED: business action selection already has canonical state/resolver inputs.
- VERIFIED: current global button minimum heights remain unchanged.
- No material open question.

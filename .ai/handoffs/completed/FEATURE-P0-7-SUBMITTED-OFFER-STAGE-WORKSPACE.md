# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Replace the fragmented submitted-offer lifecycle plus tab navigation with one
four-stage stepper that both communicates progress and opens the information and
actions relevant to the selected enabled stage.

## Actor and permissions

- RM/seller may view the submitted snapshot and perform only actions permitted by
  existing canonical state/capability logic.
- Manager/read-only sees the same permitted information with no mutation action.
- In assisted OTP mode, the RM may initiate and facilitate the flow, but the
  customer remains the confirmation actor and provides/enters the OTP.
- Self-service confirmation remains available through a customer link.
- No role may bypass underwriting, confirmation or payment gates.

## Source-of-truth references

- User approval 2026-07-28: option A and confirmed execution plan.
- `.ai/governance/source-of-truth.md`.
- `docs/rework-v2/D-source-of-truth-index.md`, Application Workspace/state model.
- `docs/rework-v2/B-component-reuse-matrix.md`, shared OTP/UW components.
- `docs/briefs/BRIEF-CONFIRM-PAY.md`.
- `docs/briefs/BRIEF-HEALTH-MULTI-INSURED.md`.
- `.ai/design/CRITIQUE-P0-7-SUBMITTED-OFFER-STAGE-WORKSPACE.md`.
- `.ai/specs/visual/FEATURE-P0-7-SUBMITTED-OFFER-STAGE-WORKSPACE.md`.
- `.ai/governance/uiux-safety-contract.md`.

## Scope in

- Submitted Application Workspace only.
- One four-stage stepper:
  1. `Bản chào đã tạo`
  2. `Thẩm định` / `Đã thẩm định`
  3. `Xác nhận & thanh toán` / `Đã xác nhận & thanh toán`
  4. `Phát hành hợp đồng` / `Đã phát hành hợp đồng`
- Step enablement, completion, selection and locked-stage recovery.
- Composition of existing submitted content under its owning stage.
- Supplement requests/history under Underwriting.
- Confirmation state, assisted/self-service choices, fee, method and payment
  history under Confirmation & payment.
- Policy record/status and policy detail link under Policy issuance.
- Legacy `?tab=` compatibility and canonical `?stage=` links.
- Deterministic tests, cache compatibility, responsive and accessibility styling.

## Scope out

- Draft Application Workspace.
- Canonical resolver, pricing, underwriting, confirmation, payment or policy rules.
- Seed data, API, persistence or storage migration.
- Navigation/list modules and Policy Cockpit.
- A seller confirming or entering OTP on behalf of an absent customer.
- Redesign of shared UW/OTP/payment component internals.

## Business rules and state transitions

Use only `caseView.states`, `caseFlow`, `BANCA.confirmationComplete(app)` and the
existing payment gate as business sources.

| Stage | Enabled when | Complete when |
|---|---|---|
| Created | Submitted record exists | Always for submitted mode |
| Underwriting | Submitted record exists | `caseFlow.uwDecided`; declined remains terminal at this stage |
| Confirmation & payment | UW is approved and case is not declined/cancelled | customer confirmation complete AND payment success |
| Policy issuance | payment success | policy status is issued |

- `NEED_MORE_INFORMATION` remains current at Underwriting.
- Declined/cancelled cases do not unlock later stages.
- Payment processing/failed/expired remains current at Confirmation & payment.
- Issue pending/failed remains current at Policy issuance; payment stays successful
  and UI must state that the customer is not charged again.
- Completed/current stages remain revisitable.
- A locked `?stage=` request resolves to the latest enabled stage and displays a
  non-sensitive reason.

## Data contract

No data-contract change. UI may derive a presentation-only stage model:

```text
id, label, completedLabel, enabled, complete, current, href, lockedReason
```

Do not persist this derived model and do not add new canonical statuses.

## UI/UX specification

Follow the P0.7 critique and visual spec.

- Preserve compact identity header and P0.4 command bar.
- Remove submitted `.submitted-lifecycle`, top TabBar and snapshot pill navigation.
- The stepper is a semantic navigation/ordered process. Use `aria-current="step"`
  for active/current and `aria-disabled="true"` for locked steps.
- Created stage renders, in order:
  1. Thông tin khách hàng
  2. Gói và phí chính thức
  3. Nội dung khai báo
  4. Tài liệu đã nộp
- Underwriting renders result/status, customer-shareable terms, supplementary
  requirements and supplementation history.
- Confirmation & payment renders:
  - customer confirmation status;
  - `Hỗ trợ khách xác nhận OTP tại quầy`;
  - `Gửi link để khách tự xác nhận`;
  - explicit copy that the customer provides/enters OTP;
  - fee due, payment methods and payment history.
- Policy issuance renders the issue status/record and a direct policy detail link
  when `policyId` exists.
- Preserve existing empty, loading, error, permission, disabled and retry messages
  within their owning stage.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `modules/application-workspace/index.html`
- `shared/styles/components.css`
- `shared/js/head-loader.js` only if the existing cache strategy requires a bump
- `scripts/test-p0-submitted-offer-stage-workspace.js`
- `scripts/test-p0-submitted-offer-layout.js` to revise obsolete P0.5 assertions
- `scripts/test-p0-workspace-action-bar.js` only to align its stale shared-cache
  assertion with the already-completed P0.6 baseline; no action-bar behavior change
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-7-SUBMITTED-OFFER-STAGE-WORKSPACE.md`

## Files prohibited

- `shared/mock/seed/case-state-resolver.js`
- `shared/components/confirm-payment.js`
- Other modules, seeds, product schemas, manifests and navigation.
- Unrelated dirty-worktree files.

## Components and tokens to reuse

- Existing P0.4 command bar/actions.
- Existing customer/quote/declaration/document renderers.
- `BANCA.ui.underwritingStatusPanel`.
- Existing confirmation/payment renderer and payment gate.
- Existing policy renderer and Policy Cockpit route.
- Tokens in `shared/styles/tokens.css`; no arbitrary palette, spacing, font,
  radius, shadow, z-index, motion or breakpoint.

## Acceptance criteria

1. Submitted mode renders identity → command bar → exactly one four-stage stepper
   → active stage content; no submitted lifecycle strip or tab bars remain.
2. The four labels and completed labels match the approved Vietnamese copy.
3. Created is always enabled/complete and contains customer, package/official fee,
   declaration and submitted documents without sub-tabs.
4. Underwriting is enabled on submission and contains status/result, supplementary
   requests and supplementation history.
5. Confirmation & payment unlocks only after an approved UW decision, remains
   incomplete until both confirmation and successful payment, and contains
   confirmation, assisted/self-service choices, fee, methods and payment history.
6. Assisted OTP copy keeps the customer as actor; no UI implies seller confirmation
   on behalf of the customer.
7. Policy issuance unlocks only after payment success, displays issuance state and
   links to policy detail when issued.
8. Declined/cancelled cases stop at Underwriting; payment/issuance stay disabled.
9. More-info, payment failure/processing and issue failure/pending remain in the
   correct current stage with existing recovery behavior.
10. Completed/current stages can be revisited; disabled stages cannot be activated
    with pointer or keyboard.
11. Legacy tab aliases map deterministically to stages; locked deep links fail
    closed to the latest enabled stage and reload remains stable.
12. RM versus manager/read-only actions remain unchanged.
13. Desktop steps have equal geometry; responsive stepper remains an ordered,
    horizontally scrollable single row with readable targets.
14. Stepper has a navigation label, `aria-current="step"`, `aria-disabled`, visible
    focus and text/icon status beyond colour.
15. Draft mode and Motor/Health/PA compatibility are not regressed.
16. Relevant tests pass and token counts do not exceed 1,119 errors / 669 warnings.
17. Implementation touches no file outside the allowlist.

## Validation commands

- `node scripts/test-p0-submitted-offer-stage-workspace.js`
- `node scripts/test-p0-submitted-offer-layout.js`
- `node scripts/test-p0-workspace-action-bar.js`
- `node scripts/test-product-package-quote-continuity.js`
- `node scripts/test-underwriting-routing.js`
- `node scripts/test-payment-gate.js`
- `node scripts/test-otp-underwriting-panels.js`
- `node scripts/test-privacy-consent.js`
- `node scripts/validate-manifest.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/test-foundation.js`
- `node scripts/validate-design-tokens.js`
- JavaScript syntax check for the changed runtime/test files.
- Browser smoke for pending UW, more-info, approved waiting confirmation,
  payment pending/failed, issued, rejected and manager/read-only records.

## Assumptions and open questions

- VERIFIED: canonical resolver already exposes UW, confirmation, payment and policy
  states required for the stage model.
- VERIFIED: current submitted content renderers already contain the requested
  information; the change is composition/navigation, not a new data contract.
- VERIFIED: current policy detail route is
  `modules/policies/index.html?view=detail&id={policyId}`.
- VERIFIED: user selected seller-assisted OTP with customer as confirmation actor.
- No material open question.

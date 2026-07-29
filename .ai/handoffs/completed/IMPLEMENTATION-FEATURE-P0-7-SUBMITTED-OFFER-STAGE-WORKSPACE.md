# Implementation report — P0.7 Submitted Offer Stage Workspace

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Attempt: 1 + corrective attempts 1–2
Handoff: `.ai/handoffs/ready/FEATURE-P0-7-SUBMITTED-OFFER-STAGE-WORKSPACE.md`

## Business outcome

- Submitted Application Workspace now renders:
  compact identity → existing P0.4 command bar → one four-stage
  progress/navigation stepper → active stage content.
- The four presentation stages are:
  1. `Bản chào đã tạo`
  2. `Thẩm định` / `Đã thẩm định`
  3. `Xác nhận & thanh toán` / `Đã xác nhận & thanh toán`
  4. `Phát hành hợp đồng` / `Đã phát hành hợp đồng`
- Stage enablement and completion use only the existing `caseView.states`,
  `caseFlow`, `BANCA.confirmationComplete(app)` result and canonical payment state.
  No resolver, gate, confirmation component or seed rule was changed.
- Created composes the existing customer, official package/fee, declaration and
  submitted-document renderers in the approved order.
- Underwriting composes the existing shared UW/status renderer, customer-shareable
  conditions, supplementary workspace and a presentation-only supplementation
  history derived from existing case data.
- Confirmation & payment reuses the existing vertical shared renderer, payment
  gate, fee/method/history components and recovery states. It now presents the two
  approved choices, `Hỗ trợ khách xác nhận OTP tại quầy` and
  `Gửi link để khách tự xác nhận`, with explicit copy that the customer or
  representative provides and enters OTP.
- Corrective attempt 1 separates the assisted-at-counter path from self-service
  link delivery. Assisted confirmation opens a dedicated customer-controlled
  six-digit OTP session and can complete only through explicit customer OTP
  submission. Health opens one assisted session per `insuredUnitId`; bulk sending
  remains self-service link delivery and never becomes one shared family OTP.
- Corrective attempt 2 makes step completion presentation monotonic for legacy
  records: canonical payment success or policy issuance displays the preceding
  combined confirmation/payment stage as completed even when historical
  confirmation evidence is absent. Active-case unlock rules remain unchanged.
- Policy issuance reuses the current issued/pending/failure renderer and now exposes
  a direct Policy detail link in issued content. Existing “do not charge again”
  issue-failure recovery remains unchanged.
- Completed/current stages are links. Locked stages render non-interactive spans
  with `aria-disabled="true"` and a visible reason.
- A locked `?stage=` request fails closed to the latest enabled stage, displays a
  recovery notice and canonicalizes the URL. Legacy `?tab=` aliases map
  deterministically to stages; legacy History resolves to the latest enabled stage.
- Submitted lifecycle, top TabBar and snapshot pill navigation are no longer
  rendered. Draft workspace behavior is unchanged.

## Files changed

- `modules/application-workspace/app-workspace.js`
- `shared/styles/components.css`
- `scripts/test-p0-submitted-offer-stage-workspace.js`
- `scripts/test-p0-submitted-offer-layout.js`
- `scripts/test-p0-workspace-action-bar.js` — Codex-authorized maintenance of one
  stale shared-cache assertion from the completed P0.6 baseline; no action-bar
  behavior/assertion changed.
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-7-SUBMITTED-OFFER-STAGE-WORKSPACE.md`

## Cache compatibility

- Existing Application loader/runtime queries remain `v=46` / `v=20260724l`.
- Existing shared asset version remains the completed P0.6 baseline
  `v=20260728w`.
- No additional cache bump was introduced; the allowlisted P0.5 compatibility test
  and authorized P0.4 stale assertion now reflect the current baseline.

## Deterministic validation

- P0.7 stage-workspace test: PASS, 51/51.
- Revised P0.5 submitted-layout regression: PASS, 13/13.
- P0.4 Workspace Action Bar regression: PASS, 29/29.
- Product/package/quote continuity: PASS, 17/17.
- Underwriting routing: PASS, 42/42.
- Payment gate: PASS, 32/32.
- Shared OTP/UW panels: PASS, 21/21.
- Privacy/consent: PASS, 29/29.
- Foundation regression: PASS, 58/58.
- Manifest validator: PASS (`VALID_MANIFEST`).
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- Duplicate-component validator: PASS.
- Changed runtime and test JavaScript syntax: PASS.
- `git diff --check` for implementation files: PASS.
- Design-token report: 1,119 errors / 669 warnings, exactly at and not above the
  approved P0.7 baseline.

## Scope guard

- `shared/mock/seed/case-state-resolver.js`: not modified.
- `shared/components/confirm-payment.js`: not modified.
- Seeds, product schemas, manifests, navigation and other modules: not modified.
- No data, API, persistence, pricing, underwriting, confirmation, payment or policy
  transition was added or changed.

## Browser and keyboard smoke status

- Browser smoke was not run in this sandbox because local-port serving is blocked
  and exposing the project root was previously rejected.
- Codex QC should verify pending UW, more-info, approved/waiting confirmation,
  payment pending/failed/processing, issue pending/failed, issued and
  rejected/cancelled records; RM and manager/read-only personas; locked deep-link
  recovery; equal desktop step geometry; horizontal responsive scrolling; visible
  focus; and pointer/keyboard non-activation of locked steps.

## Next action

Codex should execute browser/accessibility QC and final reflection. No commit was
created.

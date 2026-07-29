# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Codex

## Goal

Bố cục lại toàn bộ màn `Bản chào đã nộp` để RM đọc được ngay: bản chào đang ở đâu,
việc tiếp theo là gì, ai đang giữ việc, và mỗi bước cần xem/thực hiện nội dung gì.

Giữ lại shared progress stepper đã được duyệt. Không đổi business rule, state,
permission, payment gate, underwriting rule, pricing hoặc policy issuance.

## Source-of-truth references

- Current user approval: ưu tiên fix UIUX, chọn phạm vi toàn bộ `Bản chào đã nộp`.
- `.ai/design/CRITIQUE-P0-7-SUBMITTED-OFFER-STAGE-WORKSPACE.md`
- `.ai/design/CRITIQUE-P0-8-SUBMITTED-STAGE-CLARITY.md`
- `.ai/governance/uiux-safety-contract.md`
- `docs/rework-v2/E-component-registry.md`, `progressStepper`, confirmation/payment and policy shared component rules.

## Scope in

- Add a business-facing summary strip for submitted workspace: current business stage,
  next action, owner, SLA and version.
- Simplify submitted header metadata so the primary visible hierarchy is customer,
  product, status and premium.
- Keep technical references such as quote/ref/version accessible as supporting
  details instead of competing with the main header.
- Add stage-level action guidance for Created, Underwriting, Confirmation/payment
  and Policy stages.
- Keep confirmation/payment and policy content grouped under the approved four-stage
  stepper.
- Update focused regression tests for this UIUX anatomy.

## Scope out

- Do not alter product/package continuity resolver.
- Do not change submitted lifecycle state, payment enablement, underwriting result,
  quote version, policy issuance or permission behavior.
- Do not introduce a new progress stepper, tab system, modal, route or breakpoint.
- Do not change seed data, rating, payment, policy or navigation config.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `shared/styles/components.css`
- `scripts/test-p0-submitted-offer-stage-workspace.js`
- `scripts/test-p0-submitted-stage-clarity.js`
- `scripts/test-p0-submitted-offer-layout.js`
- `.ai/handoffs/ready/FEATURE-P0-10-SUBMITTED-OFFER-UIUX-POLISH.md`
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-10-SUBMITTED-OFFER-UIUX-POLISH.md`
- `.ai/handoffs/completed/QC-FEATURE-P0-10-SUBMITTED-OFFER-UIUX-POLISH.md`
- `.ai/handoffs/completed/REFLECTION-FEATURE-P0-10-SUBMITTED-OFFER-UIUX-POLISH.md`

## Files prohibited

- `shared/mock/seed/*`
- `shared/components/foundation-components.js`
- `shared/components/confirm-payment.js`
- `shared/components/policy-cockpit.js`
- `shared/js/navigation-config.js`
- pricing, underwriting, payment, policy and permission modules.

## Acceptance criteria

1. Submitted workspace renders in this order: identity header, command bar, business summary strip, shared stepper, active stage content.
2. Header no longer competes with process data; quote/UW references are supporting details.
3. Summary strip shows stage, next action, owner, SLA and version with business labels.
4. Each active stage starts with a concise guidance panel explaining what the RM should verify or do next.
5. The four-stage shared stepper remains the only progress navigation and keeps complete/current/disabled semantics.
6. Confirmation/payment and policy stages remain reachable and keep their existing payment/issue behavior.
7. No technical wording newly appears in customer/RM-facing submitted UI.
8. Responsive layout does not create new overflow at 390/768/1280.
9. Existing P0.5/P0.7/P0.8/P0.9 regression tests pass after updates.

## Validation commands

- `node --check modules/application-workspace/app-workspace.js`
- `node scripts/test-p0-submitted-offer-stage-workspace.js`
- `node scripts/test-p0-submitted-stage-clarity.js`
- `node scripts/test-p0-submitted-offer-layout.js`
- `node scripts/test-p0-shared-progress-stepper.js`
- `node scripts/test-p0-workspace-action-bar.js`
- `node scripts/test-otp-underwriting-panels.js`
- `node scripts/test-payment-gate.js`
- `node scripts/test-quote-payment-issue.js`
- `node scripts/test-foundation.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/validate-design-tokens.js`
- `git diff --check`
- Browser smoke on submitted records: underwriting, need-more-info, payment pending and issued.

## Stop conditions

- Any acceptance requires changing state/payment/UW/policy rules.
- A shared component must be edited to make the page work.
- Browser shows a regression in the shared stepper.
- Design-token count increases in a relevant file.

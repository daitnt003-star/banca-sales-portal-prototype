# Implementation report — P0.8 Submitted Stage Clarity

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Attempt: 1 + corrective attempt 1
Handoff: `.ai/handoffs/ready/FEATURE-P0-8-SUBMITTED-STAGE-CLARITY.md`

## Business outcome

- The Submitted Workspace stepper now reads as one connected four-node process.
  A connector joins the nodes and each node has a dedicated circular status marker.
- Business-current and selected-view states are independent:
  - completed nodes remain success/check states;
  - the canonical business-current node is amber and says `Đang thực hiện`;
  - a selected completed node remains green and gains a separate selected surface;
  - issued records have no in-progress node.
- P0.7 enablement, completion, terminal handling and locked deep-link recovery are
  unchanged. Stage selection changes content only.
- Created now labels the package area
  `Gói và phí theo Người được bảo hiểm`.
- Health derives one presentation card for each active `insuredUnitId`. Native links
  preserve selection through `insured=`; missing/invalid selection falls back to
  and canonicalizes to the first active member.
- Motor and PA use the same presentation with one automatically selected insured
  card.
- The selected detail identifies insured person, product, insurer, package, term,
  benefits, conditions/exclusions and member premium status.
- Health individual premium is read only from an explicit member-level field.
  Legacy records without an exact member amount display
  `Chưa tách phí theo người`; no family total is allocated or recomputed as an
  individual amount. The submitted family total is shown separately.
- Active Underwriting content now follows the approved order:
  purpose → current business status → next action → result by insured person →
  one supplementary request/history section when applicable → collapsed supporting
  processing information.
- The active Underwriting renderer uses business wording only. It does not expose
  `derive`, queue names/codes, rule-engine/source codes, raw decision enums or
  explanations of internal algorithms.
- Health overall wording checks every active member before displaying
  `Đã chấp thuận`; pending, need-more-information and declined member states remain
  explicit.
- Corrective attempt 1 gives case-level `NEED_MORE_INFORMATION` and member-level
  `REFERRED`/`NEED_MORE_INFO` priority over generic pending wording. APP-2026-HLT6
  therefore displays `Cần bổ sung` and `Bổ sung hồ sơ theo yêu cầu.` at both the
  relevant member and stage-summary levels.
- The active supplement journey no longer exposes request identifiers such as
  `SUP-01` or the phrase `Bổ sung mang tính kỹ thuật/tài liệu`; functional fields,
  actions and supplementation history remain intact.
- Permission, mutation, underwriting, OTP, payment and policy behavior were not
  changed.

## Files changed

- `modules/application-workspace/app-workspace.js`
- `shared/styles/components.css`
- `scripts/test-p0-submitted-stage-clarity.js`
- `scripts/test-p0-submitted-offer-stage-workspace.js` — compatible P0.7
  presentation assertions only.
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-8-SUBMITTED-STAGE-CLARITY.md`

## Cache compatibility

- Existing Application loader/runtime queries remain `v=46` / `v=20260724l`.
- Existing shared asset version remains `v=20260728w`.
- No cache contract or cache assertion required a P0.8 change.

## Deterministic validation

- P0.8 Submitted Stage Clarity: PASS, 43/43.
- P0.7 Submitted Stage Workspace: PASS, 51/51.
- P0.5 Submitted Layout: PASS, 13/13.
- P0.4 Workspace Action Bar: PASS, 29/29.
- Underwriting routing: PASS, 42/42.
- Payment gate: PASS, 32/32.
- Shared OTP/UW panels: PASS, 21/21.
- Product/package/quote continuity: PASS, 17/17.
- Privacy/consent: PASS, 29/29.
- Foundation regression: PASS, 58/58.
- Manifest validator: PASS (`VALID_MANIFEST`).
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- Duplicate-component validator: PASS.
- Changed runtime/test JavaScript syntax: PASS.
- `git diff --check` for implementation files: PASS.
- Design-token report: 1,119 errors / 669 warnings, at and not above the approved
  P0.8 baseline.

## Scope guard

- Canonical resolver, shared confirm-payment, foundation components, seeds and
  schemas were not modified.
- No pricing, quote, UW routing/decision, stage gate, OTP, payment, policy, API,
  persistence or storage behavior was added or changed.
- No file outside the P0.8 allowlist was changed by this implementation.

## Browser and keyboard smoke status

- Browser smoke was not run by the implementer because local-port serving is
  blocked in this sandbox.
- Codex QC should verify Health mixed-UW and need-more-information records, Health
  multi-insured selection/reload/back behavior, invalid `insured=` recovery,
  Motor/PA single-insured presentation, selected-completed versus business-current
  stage distinction, issued state, locked future stage, manager/read-only views,
  horizontal narrow layouts and keyboard focus.

## Next action

Codex should execute browser/accessibility QC and final reflection. No commit was
created.

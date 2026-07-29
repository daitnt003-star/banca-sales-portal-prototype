# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Improve Submitted Application Workspace clarity by:

1. rendering the four-stage status as a connected process;
2. grouping package/fee information by insured person;
3. restructuring Underwriting around purpose, current outcome and next action
   while removing duplicate and technical wording.

## Actor and permissions

- RM/seller and manager/read-only retain existing data access and mutation rights.
- Selection of a stage or insured card is presentation-only.
- No actor may bypass stage, underwriting, confirmation or payment gates.

## Source-of-truth references

- User approvals and scope update 2026-07-28.
- `.ai/governance/source-of-truth.md`.
- `docs/rework-v2/D-source-of-truth-index.md`.
- `docs/rework-v2/B-component-reuse-matrix.md`.
- `.ai/design/CRITIQUE-P0-8-SUBMITTED-STAGE-CLARITY.md`.
- `.ai/specs/visual/FEATURE-P0-8-SUBMITTED-STAGE-CLARITY.md`.
- `.ai/handoffs/completed/FEATURE-P0-7-SUBMITTED-OFFER-STAGE-WORKSPACE.md`.
- `.ai/governance/uiux-safety-contract.md`.

## Scope in

- Submitted-mode connected four-stage stepper presentation.
- Separate business-current versus selected-view presentation.
- Created-stage package/fee composition by insured person.
- Health multi-insured card selector and per-member detail.
- Motor/PA one-insured compatibility using the same pattern.
- Underwriting information architecture, copy deduplication and member-result cards.
- Stable `insured=` selection query, invalid selection recovery.
- Deterministic tests, responsive and accessibility styling.

## Scope out

- Draft Application Workspace.
- Pricing, package selection, quote, UW routing/decision, confirmation, payment or
  policy business rules.
- Resolver, shared UW/OTP/payment components, seeds, schemas, API and storage.
- Changes to other modules or global navigation.

## Business rules and state transitions

- Stage enablement/completion remains P0.7 canonical behavior.
- Business-current stage:
  - terminal declined/cancelled or UW incomplete → Underwriting;
  - approved but payment incomplete → Confirmation & payment;
  - payment success but policy not issued → Policy issuance;
  - issued → no in-progress node; all eligible stages completed.
- The selected stage may differ from the business-current stage; it changes content
  only and never changes node business state.
- Health package/fee ownership uses active `insuredUnitId`.
- Motor/PA derive one presentation insured unit from current insured/customer data.
- Invalid/missing `insured=` selects the first active insured unit.
- Family total and member premium allocation must remain distinct.
- Underwriting overall wording must not claim full approval while any active Health
  member is pending, needs information or is declined.

## Data contract

No persisted contract change. Presentation-only insured view:

```text
insuredUnitId, name, relationship, age, productName, packageCode,
packageLabel, memberPremium, underwritingDisplayState
```

For Health, derive from active insured members and existing quote breakdown. When
an exact individual premium is unavailable, show `Chưa tách phí theo người` rather
than allocating the family total.

## UI/UX specification

Follow the P0.8 critique and visual spec.

### Stepper

- Connected line, four nodes.
- Completed = green + check.
- Business-current = amber/orange + `Đang thực hiện`.
- Locked = grey + disabled.
- Selected completed stage remains green and receives a separate selected state.

### Package and fee

- Section heading: `Gói và phí theo Người được bảo hiểm`.
- Insured card shows name, relationship, package and concise status.
- Selected detail identifies insurance provider, product, package, term,
  benefits, exclusions/conditions and member premium/allocation status.
- Health family total appears separately.
- Motor/PA auto-select the only insured card.

### Underwriting

Order:

1. `Mục đích thẩm định`
2. `Tình trạng hiện tại`
3. `Việc cần thực hiện`
4. `Kết quả theo Người được bảo hiểm`
5. `Yêu cầu và lịch sử bổ sung` when applicable
6. supporting operational details only when useful

Remove raw/technical wording including `derive`, `queue`, rule-engine/source codes,
raw enums and internal algorithm explanations.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `modules/application-workspace/index.html` only if runtime cache query must bump
- `shared/styles/components.css`
- `shared/js/head-loader.js` only if shared cache version must bump
- `scripts/test-p0-submitted-stage-clarity.js`
- `scripts/test-p0-submitted-offer-stage-workspace.js` for compatible P0.7 updates
- `scripts/test-p0-submitted-offer-layout.js` for cache/layout compatibility only
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-8-SUBMITTED-STAGE-CLARITY.md`

## Files prohibited

- `shared/mock/seed/case-state-resolver.js`
- `shared/components/confirm-payment.js`
- `shared/components/foundation-components.js`
- Seeds, schemas, manifests, navigation and other modules.
- Unrelated dirty-worktree files.

## Components and tokens to reuse

- P0.7 submitted stage model and canonical stage links.
- Existing customer/quote/benefit/member data helpers.
- Existing shared UW status panel only where its output meets approved business
  copy; do not duplicate it merely to preserve old layout.
- Existing cards, badges, buttons and token scales.

## Acceptance criteria

1. Submitted mode renders exactly one connected four-node process.
2. Completed nodes use check + success state, the business-current node uses
   amber/orange + `Đang thực hiện`, and future nodes use grey disabled state.
3. Viewing a completed stage does not change the business-current node; selected
   and current semantics are independently observable.
4. P0.7 stage enablement/completion and locked deep-link behavior are unchanged.
5. Created stage labels the section `Gói và phí theo Người được bảo hiểm`.
6. Health renders one selectable card per active insured unit; card content names
   the person, relationship, package and member status.
7. Selecting an insured card reveals only that person's product/package/benefit/
   condition context and persists through `insured=`.
8. Invalid `insured=` fails closed to the first active member.
9. Family total is separate from member premium; unavailable individual premium
   is not fabricated.
10. Motor/PA render one automatically selected insured card with no empty selector.
11. Underwriting's first content communicates purpose, current status and exactly
    what the RM should do next.
12. Health underwriting results are grouped by member and do not claim overall
    automatic approval while any active member is unresolved.
13. Supplement request/history appears once and only when applicable.
14. Submitted UI contains no user-facing `derive`, `queue`, rule engine/source code
    or raw enum explanation.
15. Existing permission, terminal, OTP, payment and policy behavior is unchanged.
16. Stepper and insured selector are keyboard-operable with visible focus and
    text/icon status beyond colour.
17. Desktop and narrow layouts remain readable; selectors preserve one ordered
    horizontal row where specified.
18. Focused/regression suites pass and token counts do not exceed 1,119/669.
19. No file outside the allowlist is changed by this implementation.

## Validation commands

- `node scripts/test-p0-submitted-stage-clarity.js`
- `node scripts/test-p0-submitted-offer-stage-workspace.js`
- `node scripts/test-p0-submitted-offer-layout.js`
- `node scripts/test-p0-workspace-action-bar.js`
- `node scripts/test-underwriting-routing.js`
- `node scripts/test-payment-gate.js`
- `node scripts/test-otp-underwriting-panels.js`
- `node scripts/test-product-package-quote-continuity.js`
- `node scripts/test-privacy-consent.js`
- `node scripts/validate-manifest.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/test-foundation.js`
- `node scripts/validate-design-tokens.js`
- JavaScript syntax and `git diff --check`.
- Browser smoke: Health mixed UW, Health need-more-info, Health multi-insured
  package/fee switching, Motor single insured, issued, locked future stage and
  manager/read-only where accessible.

## Assumptions and open questions

- VERIFIED: Health active members have stable `insuredUnitId`.
- VERIFIED: current submitted content already has product/package/benefit and
  underwriting data required for presentation.
- VERIFIED: exact member premium is not guaranteed for every legacy record;
  fallback must state that it is unavailable.
- VERIFIED: user approved the combined P0.8 scope and execution plan.
- No material open question.

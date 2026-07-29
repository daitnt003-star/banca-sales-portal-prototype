# Corrective handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude
Attempt: 1

## Goal

Correct the P0.8 design-system mistake by replacing both inline Draft stepper and
the custom Submitted stepper with one shared progress-stepper component matching
the established compact chip pattern.

## Actor and permissions

No permission or business-state change. Callers resolve all states and links; the
shared component only escapes and renders supplied presentation props.

## Source-of-truth references

- User approval 2026-07-28: shared stepper option A.
- `docs/rework-v2/E-component-registry.md`: same interaction = one shared component.
- Existing Draft stepper in `modules/application-workspace/app-workspace.js`.
- `.ai/governance/uiux-safety-contract.md`.
- `.ai/handoffs/completed/FEATURE-P0-8-SUBMITTED-STAGE-CLARITY.md`.

## Scope in

- Add `BANCA.ui.progressStepper(items, cfg)` to foundation components.
- Add one shared CSS family for compact progress chips.
- Adopt it in Draft and Submitted Application Workspace.
- Remove P0.8 custom submitted stepper markup/CSS, including the connected-line
  visual treatment.
- Preserve Draft's established appearance and Submitted's approved business tone.
- Update component registry and deterministic regression.

## Scope out

- Stage definitions, enablement, completion, permissions and navigation rules.
- Submitted content, insured cards, Underwriting clarity, OTP/payment/policy UI.
- Other modules and shared business resolvers.

## Shared component contract

```text
BANCA.ui.progressStepper(items, {
  ariaLabel,
  currentTone: "brand" | "warning",
  className
})

item = {
  id,
  label,
  href,
  ordinal,
  state: "complete" | "current" | "available" | "disabled",
  selected,
  helper,
  selectedLabel
}
```

- Component must not read app, query params, permissions or canonical states.
- `complete`: teal pale chip + teal check.
- `current`: filled tone (`brand` Draft, `warning` Submitted).
- `available`: neutral bordered chip.
- `disabled`: neutral muted non-link with `aria-disabled=true`.
- `selected` is independent from business state and must remain observable without
  overwriting complete/current meaning.
- Links get accessible current/selected wording and visible focus.

## UI/UX specification

- Anatomy follows the existing Draft pattern shown by the user:
  compact inline chips, circular ordinal/check, consistent padding/radius/gap.
- Wrap on wide Draft flows as today; on narrow view use a single horizontally
  scrollable row to avoid ambiguous multi-row progression.
- Draft current remains brand blue.
- Submitted business-current remains amber/orange.
- Completed remains teal/green in both.
- Disabled/future remains grey and non-interactive.
- No connecting line and no separate large submitted step cards.

## Files allowed

- `shared/components/foundation-components.js`
- `shared/styles/components.css`
- `modules/application-workspace/app-workspace.js`
- `modules/application-workspace/index.html` only for runtime cache query if needed
- `shared/js/head-loader.js` for required shared-asset cache bump
- `docs/rework-v2/E-component-registry.md`
- `scripts/test-p0-shared-progress-stepper.js`
- `scripts/test-p0-submitted-stage-clarity.js`
- `scripts/test-p0-submitted-offer-stage-workspace.js`
- `scripts/test-p0-workspace-action-bar.js` and
  `scripts/test-p0-submitted-offer-layout.js` only for cache assertions
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-P0-9-SHARED-PROGRESS-STEPPER.md`

## Files prohibited

- Resolver, confirmation/payment, seed, schema and journey definitions.
- Other modules and unrelated dirty-worktree files.

## Acceptance criteria

1. Exactly one shared renderer `BANCA.ui.progressStepper` owns stepper markup.
2. Both Draft and Submitted call the shared renderer; neither builds step anchors
   or status nodes inline.
3. P0.8 `.submitted-stage-stepper` custom markup/CSS and connector line are removed.
4. Draft retains its established compact chip anatomy and brand-blue current step.
5. Submitted uses the same anatomy with amber current, teal completed and grey
   disabled states.
6. Submitted selected-view remains independent from business-current state.
7. Disabled items are spans/non-links with `aria-disabled`; enabled items are
   keyboard-focusable links.
8. Status meaning includes check/ordinal/text, not colour alone.
9. Narrow layout remains one horizontally scrollable ordered row.
10. Existing Draft and Submitted business/deep-link behavior is unchanged.
11. P0.8 insured-card and Underwriting changes remain intact.
12. Component registry lists the shared progress stepper.
13. Focused and relevant regressions pass; token counts do not exceed 1,119/669.
14. No file outside the allowlist is changed by the corrective.

## Validation commands

- `node scripts/test-p0-shared-progress-stepper.js`
- `node scripts/test-p0-submitted-stage-clarity.js`
- `node scripts/test-p0-submitted-offer-stage-workspace.js`
- `node scripts/test-p0-submitted-offer-layout.js`
- `node scripts/test-p0-workspace-action-bar.js`
- `node scripts/test-product-package-quote-continuity.js`
- `node scripts/test-underwriting-routing.js`
- `node scripts/test-payment-gate.js`
- `node scripts/test-otp-underwriting-panels.js`
- `node scripts/validate-manifest.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/test-foundation.js`
- `node scripts/validate-design-tokens.js`
- JavaScript syntax and `git diff --check`.
- Browser: Draft stepper and Submitted pending/approved/issued/selected-past states
  at desktop and narrow responsive rules.

## Assumptions and open questions

- VERIFIED: existing Draft stepper is inline, so true reuse requires extraction.
- VERIFIED: foundation components are loaded before Application Workspace runtime.
- VERIFIED: `foundation-components.js` contains unrelated dirty changes; preserve
  them and add the new renderer surgically.
- No material open question.

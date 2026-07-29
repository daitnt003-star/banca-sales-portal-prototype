# QC — Corrective P0.9 shared progress stepper

Status: PASSED
Owner: Codex
Date: 2026-07-28

## Business outcome

The Draft and Submitted offer journeys now use the same compact progress-stepper
interaction. Draft keeps the blue active state; Submitted uses orange for the
business-current stage; completed stages are green and future unavailable stages
are grey and disabled.

This correction removes the conflicting page-specific Submitted stepper introduced
in P0.8 without changing lifecycle rules, permissions, deep links, or stage content.

## Acceptance evidence

- One renderer owns the markup: `BANCA.ui.progressStepper`.
- Draft and Submitted both call the shared renderer.
- Legacy `.submitted-stage-stepper` and `.submitted-stage-step*` markup/CSS and
  connector visuals are absent.
- Selected view remains independent from the business-current stage.
- Disabled stages are non-links with `aria-disabled`; enabled stages remain
  keyboard-focusable links.
- Narrow layouts keep a single horizontally scrollable row.
- Component registry records the shared component.

## Automated verification

- Shared stepper: 27/27 PASS.
- Submitted clarity: 43/43 PASS.
- Submitted stage workspace: 51/51 PASS.
- Submitted layout: 13/13 PASS.
- Workspace action bar: 29/29 PASS.
- Product/package continuity: 17/17 PASS.
- Underwriting routing: 42/42 PASS.
- Payment gate: 32/32 PASS.
- OTP/underwriting panels: 21/21 PASS.
- Foundation: 58/58 PASS.
- Manifest, module, terminology, duplicate-component, syntax and diff checks: PASS.
- Design-token scan: 1,118 errors / 667 warnings, within the approved ceiling.

## Browser verification

- Draft route renders the established compact chip anatomy with a blue current
  stage and neutral remaining stages.
- Submitted route renders completed Created in green, current Underwriting in
  orange, and future Confirmation/payment and Policy stages in disabled grey.
- Desktop visual inspection matches the user-provided reference pattern.

## QC decision

PASSED. The corrective is ready for business acceptance testing. No commit was
created.

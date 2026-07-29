# Implementation report — Corrective P0.9 shared progress stepper

Status: IMPLEMENTED — READY_FOR_CODEX_QC  
Implementer: Claude  
Attempt: 1  
Handoff: `.ai/handoffs/ready/CORRECTIVE-P0-9-SHARED-PROGRESS-STEPPER.md`

## Outcome

- Added the single presentation-only renderer `BANCA.ui.progressStepper(items, cfg)`.
- Added one token-based compact chip CSS family.
- Replaced the Draft inline anchor renderer and the Submitted custom renderer with calls to the shared component.
- Preserved caller-owned stage definitions, completion, enablement, business-current, selected-view and links.
- Removed all `.submitted-stage-stepper`, `.submitted-stage-step*` and connector-line markup/CSS.
- Registered the component and bumped shared/application cache keys deterministically.

## Files changed for this corrective

- `shared/components/foundation-components.js`
- `shared/styles/components.css`
- `modules/application-workspace/app-workspace.js`
- `modules/application-workspace/index.html`
- `shared/js/head-loader.js`
- `docs/rework-v2/E-component-registry.md`
- `scripts/test-p0-shared-progress-stepper.js`
- `scripts/test-p0-submitted-stage-clarity.js`
- `scripts/test-p0-submitted-offer-stage-workspace.js`
- `scripts/test-p0-workspace-action-bar.js`
- `scripts/test-p0-submitted-offer-layout.js`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-P0-9-SHARED-PROGRESS-STEPPER.md`

The worktree contained unrelated pre-existing changes, including changes in several allowlisted files. They were preserved. No resolver, confirmation/payment component, seed, schema or journey definition was touched by this corrective.

## Validation

- `test-p0-shared-progress-stepper.js`: PASS 27/27
- `test-p0-submitted-stage-clarity.js`: PASS 43/43
- `test-p0-submitted-offer-stage-workspace.js`: PASS 51/51
- `test-p0-submitted-offer-layout.js`: PASS 13/13
- `test-p0-workspace-action-bar.js`: PASS 29/29
- `test-product-package-quote-continuity.js`: PASS 17/17
- `test-underwriting-routing.js`: PASS 42/42
- `test-payment-gate.js`: PASS 32/32
- `test-otp-underwriting-panels.js`: PASS 21/21
- Manifest/modules/terminology/duplicate-component validators: PASS
- `test-foundation.js`: PASS 58/58
- Design tokens: 1,118 errors / 667 warnings, below the allowed ceiling 1,119 / 669
- JavaScript syntax checks: PASS
- `git diff --check`: PASS
- Targeted search confirms zero legacy Submitted stepper selectors/markup.

## Browser QC

Browser matrix remains for Codex final QC: Draft and Submitted pending/approved/issued/selected-past at desktop and narrow widths. Deterministic DOM/CSS tests cover state mapping, accessible links/non-links, focus, compact anatomy, independent selection and the single-row responsive rule.

## Cache

- Shared asset version: `v=20260728x`
- Application head-loader query: `v=47`
- Application runtime query: `v=20260728m`

No commit was created.

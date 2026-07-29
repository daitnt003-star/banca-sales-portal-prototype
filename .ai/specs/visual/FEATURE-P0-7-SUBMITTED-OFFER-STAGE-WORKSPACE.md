# Visual Spec — P0.7 Submitted Offer Stage Workspace

**Input:** `.ai/design/CRITIQUE-P0-7-SUBMITTED-OFFER-STAGE-WORKSPACE.md`  
**Token source:** `shared/styles/tokens.css`  
**Baseline:** 1,119 errors / 669 warnings from `validate-design-tokens.js`

## Density and rhythm

| Region | Decision | Token |
|---|---|---|
| Workspace section gap | Existing compact rhythm | `--space-lg` |
| Stepper padding | Existing compact card padding | `--space-md` |
| Step item internal gap | Compact | `--space-sm` |
| Stage content section gap | Existing card rhythm | `--space-lg` |
| Inline metadata gap | Compact | `--space-xs` or `--space-sm` |

## Typography

| Element | Size | Weight | Leading |
|---|---|---|---|
| Stage ordinal/state | `--text-xs` | `--weight-bold` | `--leading-snug` |
| Stage label | `--text-sm` | `--weight-bold` | `--leading-tight` |
| Stage helper/status | `--text-xs` | `--weight-regular` | `--leading-snug` |
| Active content title | `--text-lg` | `--weight-bold` | `--leading-tight` |
| Body | `--text-sm` | `--weight-regular` | `--leading-normal` |

## Surface and status

- Stepper surface reuses `--paper-card`, `--line`, `--radius-md`; no new shadow.
- Completed state uses existing success tokens plus a check icon and completed copy.
- Current state uses existing brand tokens plus `aria-current="step"`.
- Available past state remains neutral and visibly interactive.
- Disabled future state uses existing muted tokens plus lock/unavailable copy and
  `aria-disabled`, never colour alone.
- Terminal decline/cancel uses existing danger badge/content treatment; it does not
  convert downstream stages into completed states.

## Anatomy

1. Existing `.submitted-case-header`.
2. Existing `.workspace-command-bar`.
3. New `.submitted-stage-stepper` replacing `.submitted-lifecycle` and
   `.submitted-navigation`.
4. Existing `.submitted-content-header`, renamed copy per stage if necessary.
5. Existing content cards/renderers composed inside one active stage.

No second lifecycle strip, tab bar or sub-tab may remain in submitted mode.

## Sizing and responsive behavior

- Desktop: `grid-template-columns: repeat(4,minmax(0,1fr))`.
- Each step uses the same minimum block size and full clickable surface.
- At the existing medium breakpoint, use one horizontal non-wrapping track with
  overflow; each item keeps a readable minimum width.
- Focus uses the existing focus token/ring.
- Touch/coarse-pointer minimum target is 44px; desktop minimum target is 32px.
- Respect `prefers-reduced-motion`; no new motion is required.

## Stage content composition

- Created: four titled sections in this order — customer, package and official fee,
  declaration, submitted documents.
- Underwriting: status/result, customer-shareable conditions, supplementary
  requirements, supplementation history.
- Confirmation & payment: customer confirmation state, assisted OTP/self-service
  link actions, fee due, payment method, payment history.
- Policy issuance: issuance record/status and policy-detail link. Failure retains
  the “do not charge again” recovery message.

## Visual acceptance

- One and only one progress/navigation strip exists in submitted mode.
- Four steps have equal geometry at desktop.
- Active, completed, disabled and terminal meanings are readable without colour.
- Stage content begins immediately below the stepper with no legacy tabs.
- Token totals do not exceed 1,119 errors / 669 warnings.


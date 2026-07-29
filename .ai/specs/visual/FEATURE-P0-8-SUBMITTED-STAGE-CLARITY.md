# Visual Spec — P0.8 Submitted Stage Clarity

**Token source:** `shared/styles/tokens.css`  
**Baseline:** 1,119 errors / 669 warnings

## Connected stepper

- Container reuses the existing submitted stepper surface.
- Nodes are placed on one line; a token-coloured connector runs between node
  centres.
- Node sizes use existing spacing/dimension tokens and meet 32px desktop / 44px
  coarse-pointer targets.
- Completed: `--teal-600`, check icon, `Hoàn tất`.
- Current business stage: existing amber tokens, `Đang thực hiện`.
- Locked future: existing neutral line/ink tokens, lock icon, `Chưa mở`.
- Selected completed step: neutral/brand focus surface or outline only; its node
  remains completed green.
- No new palette, shadow, radius, motion duration or breakpoint.

## Insured selector and detail

- Desktop selector: equal cards in a responsive grid; Health may overflow
  horizontally rather than compress text below readable width.
- Card padding/gap/radius use existing `--space-*` and `--radius-*`.
- Selected card uses existing brand border/focus treatment plus `aria-current`.
- Detail panel begins with:
  `Người được bảo hiểm` → `Sản phẩm` → `Gói` → `Phí của người này`.
- Family total appears in a separate summary surface.
- Monetary values remain right aligned and use existing VND formatting.

## Underwriting

- Purpose intro uses normal body copy, not an alert.
- Current status/next action uses one prominent banner/card.
- Member results use the insured-card pattern to maintain object consistency.
- Supplement and history use one section with a single heading.
- Technical/operational detail, if retained, is secondary and collapsed.

## Responsive and interaction

- `<960px`: connected stepper and insured selector remain one horizontal,
  scrollable row; content stacks.
- Keyboard focus remains visible.
- Reduced motion is respected; no motion is required.
- Empty/error/permission/recovery states remain inside their owning section.

## Visual acceptance

- The stepper is read as one connected process, not four unrelated cards.
- Business current state is amber even while the user views a completed step.
- Package/fee ownership is identifiable from the selected insured card without
  reading the detail panel.
- Underwriting's first viewport contains purpose, current state and next action.
- Token counts do not exceed 1,119 errors / 669 warnings.


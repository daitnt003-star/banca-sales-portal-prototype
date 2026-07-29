# Design Critique — P0.7 Submitted Offer Stage Workspace

## Overall impression

Submitted Offer currently asks the RM to reconcile a lifecycle strip, a seven-item
top navigation, snapshot sub-navigation and a command bar. The information exists,
but the interaction model is split across too many navigation concepts. A single
four-stage stepper is the correct primary mental model for a submitted offer.

## Usability findings

| Finding | Severity | Recommendation |
|---|---|---|
| Lifecycle and content navigation are separate | Critical | Make one four-stage stepper both progress indicator and content selector. |
| Snapshot data is split across four sub-tabs | Moderate | Compose customer, package/fee, declaration and submitted documents into the first stage. |
| Supplement request and history are separated from underwriting | Moderate | Place both in the Underwriting stage so the request and response remain in context. |
| Confirmation and payment are already related but the current navigation retains legacy aliases | Moderate | Render one vertical stage containing confirmation, assisted/self-service choices, fee, method and payment history. |
| Policy stage can appear before prerequisites are met | Moderate | Keep it visible for orientation but disabled until payment succeeds. |
| Terminal declined/cancelled cases can imply forward progress | Critical | Stop progression, display the terminal reason at Underwriting and keep later stages disabled. |

## Information hierarchy

1. Compact case identity and current status.
2. Existing command bar with exactly one primary action.
3. One four-stage progress/navigation control.
4. Title and description for the active stage.
5. Stage-specific business information and history.

The stepper must communicate completed, current, available and disabled states
with icon/text in addition to colour. The command bar remains the operational
next-action surface; the stepper remains the case-orientation surface.

## Interaction decision

- Completed and current stages are links/buttons and may be revisited.
- A future stage is disabled until its canonical prerequisite is satisfied.
- A query requesting a locked stage resolves to the latest enabled stage and shows
  a concise reason; it must not reveal inaccessible content.
- Legacy `?tab=` deep links map to a stage:
  - overview/customer/quote/declaration/documents → `created`
  - supplement/uw → `underwriting`
  - confirm/payment/comm/confirmpay → `confirmation-payment`
  - policy → `policy`
  - history → the stage matching the event context; default latest enabled stage
- The canonical URL uses `?stage=` while retaining `id`.

## Confirmation actor

“Hỗ trợ OTP tại quầy” means the RM may initiate the assisted flow and expose the
OTP input, while the customer remains the confirmation actor and provides/enters
the OTP. The UI must never say or imply that the RM confirms on the customer's
behalf. A separate action sends a self-service link to the customer.

## Accessibility and responsive expectations

- Use a semantic ordered list/navigation landmark and `aria-current="step"`.
- Disabled stages expose `aria-disabled="true"` and are not keyboard-activatable.
- Every enabled stage has visible focus.
- At desktop, show four equal-width stage items in one row.
- At narrower widths, preserve order and scanability with horizontal scrolling;
  do not wrap into an ambiguous multi-row journey.
- Loading, empty, permission, terminal and retry content remains inside the
  relevant stage.

## Priority recommendations

1. Replace the entire submitted tab system with the four-stage stepper.
2. Derive enablement/completion from `caseView.states`/`caseFlow`, never UI status.
3. Compose existing renderers into stage content without changing pricing,
   underwriting, confirmation, payment or issuance rules.


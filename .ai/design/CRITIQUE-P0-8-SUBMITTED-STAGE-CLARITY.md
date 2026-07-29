# Design Critique — P0.8 Submitted Stage Clarity

## Outcome

The P0.7 information architecture is correct, but three presentation problems
remain:

1. The four stages read like four separate cards rather than one connected process.
2. Package/fee content does not make the insured person the primary grouping key.
3. Underwriting exposes implementation language and repeats status without telling
   the RM what the stage is for or what must happen next.

## Stepper decision

- Use one connected horizontal progress line with four nodes.
- Business state owns node colour:
  - completed: success colour and check icon;
  - current business stage: amber/orange and “Đang thực hiện”;
  - future locked: neutral grey and disabled;
  - completed stages remain clickable.
- Selection is separate from business state. Viewing a completed stage keeps its
  green check and receives a subtle selected/focus surface; it must not turn amber.
- Disabled stages are not links and remain non-activatable by pointer/keyboard.

## Package and fee decision

The first question must be “gói/phí này thuộc Người được bảo hiểm nào?”.

- Render an insured-person selector as cards.
- Card summary: full name, relationship/role, age where available, selected
  package and member status.
- Selecting a card reveals that person's:
  - insurance product and provider;
  - package and term;
  - benefits/limits;
  - exclusions/special terms;
  - individual premium or a clear allocation note.
- Health renders one card per active insured unit.
- Motor/PA render the same pattern with one automatically selected card.
- Family total remains a separate summary and must not be presented as the selected
  member's individual premium.
- Use query `insured=` for selection so reload/back/forward is stable; invalid IDs
  fail closed to the first active insured unit.

## Underwriting decision

The stage must answer in this order:

1. What is underwriting doing?
2. What is the current business outcome?
3. What does the RM need to do now?
4. What is the result for each insured person?
5. What supplementary requests/history exist?

Approved anatomy:

- Purpose intro: insurer assesses eligibility, premium and coverage terms.
- Current status/next-action banner with one clear instruction.
- For Health: insured-person result cards; no overall “automatic approval” unless
  every active member is approved.
- For Motor/PA: one result card using the same business vocabulary.
- Supplement request/history appears once, only when applicable.
- Operational metadata such as processor and expected completion may remain in a
  collapsed/supporting area, but raw queue codes, enums, rule-engine labels,
  “derive” and system implementation explanations are prohibited.

## Copy rules

Prohibited customer/RM-facing phrases include:

- `Trạng thái tổng (derive)`
- `Trạng thái tổng suy ra`
- `queue`
- `rule engine`
- raw decision/status enums
- explanations about internal derivation algorithms

Use concise business labels: `Đang thẩm định`, `Cần bổ sung`, `Đã chấp thuận`,
`Chấp thuận có điều kiện`, `Không được chấp thuận`, `Chưa cần thao tác`,
`Bổ sung hồ sơ`, `Gửi khách xác nhận`, `Tiếp tục xác nhận & thanh toán`.

## Accessibility and responsive

- Stepper remains a labelled navigation ordered list.
- Completed/current state uses icon + text, never colour alone.
- Insured cards are native links/buttons with selected state and visible focus.
- On narrow screens, stepper and insured-card selector scroll horizontally in one
  row; detail content remains one column.


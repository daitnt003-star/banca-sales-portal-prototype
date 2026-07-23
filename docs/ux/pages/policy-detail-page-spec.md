# Policy Detail Page UX Spec

**Module:** Policies / Hợp đồng  
**Page:** Chi tiết hợp đồng  
**Updated:** 2026-07-21 11:12  
**Mode:** Enterprise UI/UX redesign — page-level refinement

---

## 1. UX problem

Current screen exposes correct policy data but organizes it as a long stacked sequence of tables. This causes:

- weak scan hierarchy: user cannot quickly answer “hợp đồng này có ổn không?”;
- too much equal-weight information;
- important operational data such as commission, NTH, status, expiry, and actions are scattered;
- repeated table layouts create fatigue;
- related document links and value columns are not aligned consistently.

## 2. Design direction — Policy Cockpit

Redesign the page as a **Policy Cockpit**:

1. **Top command row** — back link + primary actions + more dropdown.
2. **Policy hero** — policy ID/status/GCN/product/package/customer/vehicle in one readable header.
3. **Decision summary strip** — premium, IDV, deductible, days remaining, commission.
4. **Sticky section nav** — quick scroll; equal-width buttons.
5. **Two-column content area**:
   - **Main column:** coverage, fees/payment, related documents, history.
   - **Sticky side rail:** involved parties, beneficiary/NTH, seller/channel, commission detail, operational notes.

## 3. Information hierarchy

### Primary information above the fold

- Policy ID + status
- Certificate number
- Product/package/issue type
- Customer name
- Vehicle summary
- Premium / IDV / deductible / expiry / commission
- Available actions

### Main column sections

1. **Quyền lợi bảo hiểm**
   - Show as benefit cards/table hybrid.
   - Keep amounts visible.
2. **Phí & thanh toán**
   - Premium waterfall first.
   - Payment history below.
3. **Tài liệu liên quan**
   - Document name is the hyperlink.
   - No separate “Liên kết” column.
4. **Lịch sử**
   - Keep tree/timeline pattern.
   - Group endorsement, claim, audit under clear subheads.

### Side rail sections

1. **Định danh & các bên**
   - Align labels with 250px baseline when using tables; inside side rail use compact label/value stack.
2. **Bên thụ hưởng / NTH**
   - Highlight when mortgaged.
3. **Hoa hồng dự kiến**
   - Always visible in detail when commission feature allows.
   - Read-only; state is accrued/estimated.
4. **Policy control note**
   - Sales Portal reads from Core; actions create requests, not direct master edits.

## 4. Interaction rules

- Primary action group remains top-right.
- `Khác` opens dropdown; no visible action matrix.
- Section nav scrolls to anchors.
- Related document links:
  - page link navigates;
  - file link downloads / demo alert.
- Commission is not editable on this screen.

## 5. Accessibility and density

- Avoid low-contrast KPI text.
- Label/value alignment: use consistent 250px label column in wide content tables.
- Cards must have clear headings and subtext.
- Dense secondary data should be in compact cards/details, not one endless table.
- Sticky side rail must not block content on smaller screens; stack under main column if viewport is narrow.

## 6. Acceptance criteria

- User can understand policy status, premium, expiry, customer, vehicle, and commission without scrolling deep.
- Related document names are clickable links; no separate link column.
- Commission appears in contract detail page.
- Key value rows align consistently.
- Existing data remains available: parties, vehicle, benefits, terms, fees, payment, documents, endorsement, claims, audit.
- Page does not expose internal logic matrix.

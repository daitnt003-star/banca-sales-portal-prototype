# Template Alignment Report

**Updated:** 2026-07-19  
**Primary template-aligned demo:** `showcase-template.html`  
**Entry:** `index.html` redirects to `showcase-template.html`

---

## 1. What was corrected

The previous showcase used a custom dashboard/hero layout and did not follow the user-provided FPT IS insurance template closely enough.

This version realigns to the provided template style:

- Dark FPT IS primary sidebar.
- Secondary contextual sidebar.
- Compact enterprise SaaS density.
- Light paper/card content area.
- Compact KPI cards.
- Compact tables for HSYCBH lists.
- Compact product cards with status badges and chips.
- No marketing-style oversized hero.
- No technical/BA wording in visible UI.

---

## 2. Workflow updated

Workflow document created:

`projects/sales-service-prototype/PROTOTYPE-WORKFLOW.md`

Mandatory sequence:

```text
BA / Requirements analysis
→ Scope and plan confirmation
→ Portal Prototype Builder architecture
→ UI/UX Design using approved template
→ Build HTML/CSS/JS prototype
→ Validate business demo + modular handoff
```

---

## 3. Browser validation

Opened over HTTP:

```text
http://127.0.0.1:8792/showcase-template.html
```

Observed:

```json
{
  "title": "Banca Sales Portal — FPT IS Template",
  "h1": "Xin chào, Nguyễn Văn An",
  "hasSb1": true,
  "hasSb2": true,
  "sections": [
    {"x":"HSYCBH chưa hoàn thành","found":true},
    {"x":"HSYCBH đã hoàn thành","found":true},
    {"x":"Sản phẩm có thể bán","found":true}
  ],
  "viewAllCount": 3,
  "oldBad": [],
  "kpis": ["2","2","2","0"],
  "productCards": 2
}
```

Scenario switching tested:

- RM-01: 2 open HSYCBH, 2 completed HSYCBH, 2 products.
- RM-02: 1 open HSYCBH, 1 completed HSYCBH, Motor conditional, Health blocked.
- SVC-ERR: empty HSYCBH, products shown as not verified.

Browser console error check returned no errors.

---

## 4. Screenshot

Latest template-aligned screenshot:

`/Users/trixie/aicoworker/openclaw/media/browser/9dc51608-9d63-43a0-8450-0237f17a4d69.jpg`

---

## 5. Remaining note

This is still Sprint 1 / Seller Foundation scope. It shows HSYCBH lists as mock dashboard data only; it does not yet implement full quote/application/payment/policy journeys.

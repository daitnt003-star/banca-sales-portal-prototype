# Cross-screen Layout Review — Banca Sales Portal

**Date:** 2026-07-21 11:26  
**Skill:** enterprise-uiux-skill  
**Scope:** Seller Home, Draft Journey, Submitted Application Tracking, Lists, Policy Detail, Manager Workspace, Help/Profile patterns.

---

## 1. Executive summary

The prototype has strong business coverage but layout patterns are now inconsistent because screens evolved through many patch batches. The biggest issue is not visual style alone; it is **pattern drift**:

- Draft Journey uses a sticky summary + horizontal stepper + full-width dense tables.
- Submitted Tracking uses sticky summary + tabbar + dense tab-specific cards.
- Policy Detail now uses a new Policy Cockpit pattern.
- Home uses dashboard cards + many tables.
- Lists use filter drawer + single dense table but no section header/summary.
- Manager Workspace uses KPI + pipeline + tables but no unified page pattern.

This creates a feeling that each screen belongs to a different product.

---

## 2. Recommended global layout standards

### A. Page shell standard

Every business page should follow this order:

1. Topbar from app shell.
2. Optional page command row: back / primary actions / more menu.
3. Page hero or compact summary, depending on page type.
4. Local navigation: stepper / tabs / section nav.
5. Content body using consistent card/table patterns.
6. Bottom action bar only for wizard/journey steps.

### B. Summary pattern standard

Use one of only three summary patterns:

| Pattern | Use for | Rule |
|---|---|---|
| `summary-strip` | Home, Manager, Policy Detail | 4–6 KPI cards, equal height |
| `case-summary-sticky` | Application Workspace | sticky compact header, no oversized cards |
| `list-filter-header` | list pages | search/filter/count/quick chips in one consistent block |

### C. Navigation pattern standard

| Context | Pattern |
|---|---|
| Multi-step creation | Stepper with equal height, compact icons, no overflow onto multiple visual styles |
| Tracking/application detail | Tabs; tab count > 7 should be grouped or horizontally scrollable with stable spacing |
| Long read-only detail | Section nav + side rail (Policy Cockpit) |
| Lists | Filter drawer + active tags + result count |

### D. Dense table pattern standard

- Tables with > 7 columns should either:
  - freeze first column/action column, or
  - move secondary fields into subtext under primary column, or
  - convert row actions into a single compact action menu.
- File/document tables should use **one action model** across draft/submitted/policy detail.
- Value columns should align from a shared label width baseline: 250px in wide content, compact stack in side rail.

---

## 3. Findings by screen

### 3.1 Draft Application Workspace — Documents step

**Observed from screenshot and browser:**
- Full-width document tables span ~1400px.
- Two document groups are correct logically but visually too flat.
- Stepper chips, legend, tables, footnote, and bottom nav compete for attention.
- Actions `Xem / Thay thế / Tải lên` are repeated per row and create right-side noise.
- Required/other sections use the same table weight, so user must read carefully to know what matters.

**Severity:** P0/P1 UX consistency issue.

**Recommendation:**
- Convert Document step to a two-panel pattern:
  - Left: required checklist card with progress `2/2` and only missing blockers.
  - Right/main: document library table grouped with status chips.
- Use same document row component across Draft Documents and Submitted Documents.
- Keep bottom nav sticky or visually anchored, not floating after long table.
- Row actions should collapse into one action menu or link-style actions.

---

### 3.2 Draft Application Workspace — General journey pattern

**Issue:** The wizard currently mixes sticky summary, stepper, card grids, tables, full-width controls, and bottom nav without a consistent content container.

**Recommendation:**
- Define a `journey-page` pattern:
  - sticky case header;
  - stepper row;
  - step title + short instruction;
  - content card;
  - sticky bottom action row.
- Avoid multiple full-width tables inside the wizard unless absolutely required.

---

### 3.3 Submitted Application Tracking

**Issue:** 10 tabs create high horizontal density. Some tabs are read-only detail, some are action tabs, some are lifecycle tabs; visually they have the same weight.

**Recommendation:**
- Group tabs into clusters:
  - Hồ sơ: Tổng quan, Khách hàng, Gói & phí, Khai báo, Tài liệu
  - Xử lý: Bổ sung, Thẩm định, Xác nhận KH, Thanh toán
  - Kết quả: Hợp đồng, Lịch sử
- If grouping is too much for prototype, at least add separators or use a two-row grouped tabbar.

---

### 3.4 List pages — Unsubmitted / Submitted

**Issue:** Lists have good filter drawer, but no consistent list header summary. They jump straight from page title to filters/table.

**Recommendation:**
- Add `list-filter-header` pattern:
  - total count;
  - current filtered count;
  - search;
  - quick chips;
  - filter drawer button;
  - active tags.
- Normalize table density and action placement across both list pages.

---

### 3.5 Seller Home

**Strength:** Home has clear dashboard intent and 5-card KPI row.

**Issue:** Too many table sections below hero compete equally. Home risks becoming a mixed list dump.

**Recommendation:**
- Keep KPI row.
- Convert work queues to priority cards:
  - Pinned urgent items first: supplement overdue, quote expiry, payment timeout.
  - Tables should be limited to 3–5 rows with clear `Xem tất cả`.

---

### 3.6 Policy Detail

**Current status:** Recently improved into Policy Cockpit.

**Remaining watch-outs:**
- This screen now has a stronger pattern than others, so it exposes inconsistency elsewhere.
- Do not let Policy Detail become the only redesigned screen; extract its successful patterns for other detail screens.

---

### 3.7 Manager Workspace

**Issue:** KPI row now has 6 cards and is readable, but Manager Workspace still uses tables for everything. It lacks a hierarchy between coaching/exception/actionable insights and raw seller comparison.

**Recommendation:**
- Add a manager cockpit layout:
  - KPI strip;
  - exception queue cards;
  - seller comparison table;
  - commission table as secondary panel/tab.
- Keep tables, but add summary cards/insights above them.

---

## 4. Priority backlog

### P0 — Standardize inconsistent application workspace layout

1. Redesign Draft Documents step.
2. Create shared document row pattern used by draft/submitted/policy docs.
3. Make wizard bottom nav sticky/anchored.
4. Normalize table action style.

### P1 — Standardize detail/list patterns

1. Add list header pattern to Unsubmitted and Submitted lists.
2. Group tracking tabs or visually separate tab clusters.
3. Apply compact side rail pattern to submitted tracking Overview where appropriate.

### P2 — Dashboard polish

1. Convert Home queues into priority cards with limited rows.
2. Refine Manager Workspace into Manager Cockpit.
3. Document global page pattern usage in `docs/ux/page-patterns.md`.

---

## 5. Proposed next implementation batch

Recommended first patch batch:

1. **Application Workspace Documents step** — fix the screenshoted inconsistency first.
2. **Submitted Documents tab** — reuse same component/pattern.
3. **List header pattern** for both list pages.
4. **Tracking tab grouping** if time allows.

This will create the biggest consistency improvement without rewriting the whole portal.

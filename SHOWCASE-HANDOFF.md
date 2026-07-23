# Sprint 1 Showcase Handoff

**Primary demo:** `showcase.html`  
**Redirect entry:** `index.html` → `showcase.html`  
**Purpose:** Business-facing stakeholder demo, visually polished and self-contained.

---

## Why this exists

The modular prototype is useful for maintainability, but it made the first user experience feel too technical. The showcase page is the presentation layer: beautiful first, clear business story, minimal technical scaffolding.

---

## Demo scenarios

Use the persona selector in the left sidebar:

- `RM-01`: Motor READY, PA READY
- `RM-02`: Motor CONDITIONAL, Health BLOCKED
- `CRM-01`: SME Property CONDITIONAL
- `TS-01`: Telesales quote/link only
- `SUP-01`: Delegated support only
- `SVC-ERR`: SERVICE_UNVERIFIED, default deny

---

## Important boundary

This is Sprint 1 only:

- Seller identity
- Data scope
- Product authorization
- License/training/readiness
- CTA enable/disable states

Not included yet:

- Quote journey
- HSYCBH
- Payment
- Policy issue
- CRM/Admin/Product Builder

---

## Run

```bash
cd /Users/trixie/aicoworker/openclaw/workspace-bancassurance/projects/sales-service-prototype/prototype/sprint1
python3 -m http.server 8787
```

Open:

```text
http://127.0.0.1:8787/showcase.html
```

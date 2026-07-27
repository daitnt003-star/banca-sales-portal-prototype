# Sprint 1 Business Demo Handoff

**Status:** Business-demo draft ready for user review  
**Updated:** 2026-07-19  
**Entry point:** `index.html`

---

## What changed

The Sprint 1 prototype was rebuilt from a technical scaffold into a business-facing demo for RM/seller users.

Key UX changes:

- `index.html` is now **Trang chủ Seller**.
- Technical **Overview/Auth** pages are no longer the main landing experience.
- Main navigation is business-facing only:
  - Trang chủ
  - Sản phẩm được phép bán
  - Readiness của tôi
  - Hồ sơ người bán
- Persona switching is now under a collapsed **Chế độ demo** control.
- Product catalog is card-based and business-readable.
- Readiness page explains seller readiness in a user-friendly way.
- Seller profile explains bank identity / insurance producer mapping without overwhelming the user.

---

## How to run locally

```bash
cd /Users/trixie/aicoworker/openclaw/workspace-bancassurance/projects/sales-service-prototype/prototype/sprint1
python3 -m http.server 8787
```

Open:

```text
http://127.0.0.1:8787/index.html
```

---

## Validation observed

Commands run successfully during rebuild:

```text
VALID_MANIFEST
VALID_MODULES
VALID_MANIFEST_SYNC
```

Runtime persona matrix preserved:

```text
RM-01: Motor READY, PA READY
RM-02: Motor CONDITIONAL, Health BLOCKED
SVC-ERR: SERVICE_UNVERIFIED, default deny
```

---

## Important boundary

This is still Sprint 1 only:

- No real SSO/backend.
- No quotation journey.
- No HSYCBH.
- No payment.
- No policy issue.

The purpose is to demo **Seller Identity, Access & Readiness** in a user-friendly interface before moving to Sprint 2.

---

## Supporting reports

- `docs/reports/UX-REDESIGN-REPORT.md`
- `docs/reports/VALIDATION-REPORT.md`
- `SPRINT1-BUILD-SCOPE-2026-07-19.md`

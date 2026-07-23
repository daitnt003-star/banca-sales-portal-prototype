# Sprint 1 UX Redesign Report

**Reason:** User feedback: previous overview/auth-first UI was too technical and not suitable for business-user demo.  
**Status:** Rebuilt as business demo functional draft.

---

## 1. What changed

- `index.html` is now a polished **Trang chủ Seller**, not a technical overview.
- Main navigation now contains business pages only:
  - Trang chủ
  - Sản phẩm được phép bán
  - Readiness của tôi
  - Hồ sơ người bán
  - Thông báo
  - Trợ giúp
- Auth is reframed as **Demo setup / Persona** and moved into dev/demo controls, not the main user flow.
- Seller Home now shows:
  - Hero greeting
  - RM identity / partner / branch / role
  - READY / CONDITIONAL / BLOCKED/PENDING KPI strip
  - Product cards
  - Alerts and next actions
  - Clear Sprint 1 boundary: no quote/HSYCBH/payment/policy yet
- Product Access is now a product catalog card grid instead of a technical table.
- Readiness is now a seller readiness center with business explanation and progress/checklist cards.
- Seller Profile is now business-readable with identity mapping explained simply.

---

## 2. UX validation

Expected business-demo behavior:

- Stakeholder opens `index.html` and lands on Seller Home.
- No Auth / Overview / Prototype technical page appears in primary nav.
- Persona switcher remains available as Demo persona control.
- Product states remain demonstrable.

Observed checks:

```json
{
  "title": "Trang chủ Seller",
  "hasHero": true,
  "nav": [
    "Trang chủ",
    "Sản phẩm được phép bán",
    "Readiness của tôi",
    "Hồ sơ người bán",
    "Thông báo",
    "Trợ giúp"
  ],
  "hasAuthInMainNav": false,
  "hasBusinessCopy": true
}
```

---

## 3. Runtime persona matrix still valid

Observed via Node runtime evaluation of the same mock seed/handler files:

```text
RM-01 [{"id":"motor","state":"READY","caps":["can_advise","can_quote","can_submit","can_bind","can_collect_payment"]},{"id":"pa","state":"READY","caps":["can_advise","can_quote","can_submit","can_bind"]}]
RM-02 [{"id":"motor","state":"CONDITIONAL","caps":["can_advise","can_quote","can_submit"]},{"id":"health","state":"BLOCKED","caps":[]}]
SVC-ERR [{"id":"motor","state":"SERVICE_UNVERIFIED","caps":[]},{"id":"health","state":"SERVICE_UNVERIFIED","caps":[]}]
```

---

## 4. Technical validation

Commands passed:

```bash
node scripts/validate-manifest.js
node scripts/validate-modules.js
node scripts/validate-manifest-sync.js
node -c shared/js/app-shell.js
node -c shared/js/app-manifest.js
```

Results:

- `VALID_MANIFEST`
- `VALID_MODULES`
- `VALID_MANIFEST_SYNC`
- JS syntax checks passed

---

## 5. Remaining note

This is still **Sprint 1 only**:

- No real SSO/backend.
- No quote engine.
- No HSYCBH.
- No payment/policy issue.

Next business review should focus on whether the landing/home/product/readiness experience is demo-friendly enough before moving to Sprint 2.

---

## 6. Advisor follow-up fixes

After advisor review, additional user-visible issues were fixed:

- Demo controls moved behind collapsed **Chế độ demo** details control.
- Primary navigation reduced to business pages only:
  - Trang chủ
  - Sản phẩm được phép bán
  - Readiness của tôi
  - Hồ sơ người bán
- Removed business-menu links that previously pointed to dev/state-gallery.
- CTA links are now context-aware via `productHref()`.
- Footer and visible copy no longer use "mock-only" / "Static business demo" / technical overview wording.
- Default landing resets to RM-01 when prior persisted persona was `SVC-ERR`.

## 7. Final browser QA evidence

Observed from HTTP runtime:

```json
{
  "title": "Trang chủ Seller",
  "persona": "RM-01",
  "hasHero": true,
  "nav": [
    "Trang chủ",
    "Sản phẩm được phép bán",
    "Readiness của tôi",
    "Hồ sơ người bán"
  ],
  "hasAuthInMainNav": false,
  "demoCollapsed": true,
  "bodyHasMockOnly": false
}
```

CTA links observed:

```text
/modules/product-access/index.html
/modules/seller-readiness/index.html
/modules/product-access/index.html#motor
/modules/product-access/index.html#pa
```

Screenshots captured:

- Mobile/narrow: `/Users/trixie/aicoworker/openclaw/media/browser/25179f07-edfe-45f5-b338-deb6f3f06704.jpg`
- Desktop: `/Users/trixie/aicoworker/openclaw/media/browser/0ea7cc75-7c24-450b-9e57-b1463a2468e6.jpg`

Final label: **business-demo draft ready for user review**.

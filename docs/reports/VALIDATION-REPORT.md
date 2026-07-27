# Sprint 1 Prototype Validation Report

**Validated:** 2026-07-19  
**Prototype root:** `projects/sales-service-prototype/prototype/sprint1/`

---

## 1. Build output

Generated modular Sprint 1 static prototype:

- Root overview: `index.html`
- Manifest: `app-manifest.json`
- Shared CSS: `shared/styles/tokens.css`
- Shared JS/mock data: `shared/js/app-shell.js`, `shared/mock/mock-data.js`
- Modules:
  - `modules/auth/index.html`
  - `modules/seller-workspace/index.html`
  - `modules/seller-profile/index.html`
  - `modules/seller-readiness/index.html`
  - `modules/product-access/index.html`
- State gallery: `dev/state-gallery.html`
- Validation scripts:
  - `scripts/validate-manifest.js`
  - `scripts/validate-modules.js`

Total files generated/validated: 57.

---

## 2. Commands run

```bash
node scripts/validate-manifest.js
node scripts/validate-modules.js
rg 'AC-S1-|READY|CONDITIONAL|BLOCKED|SERVICE_UNVERIFIED|can_advise|can_quote|can_bind|Access Denied|ACCESS_DENIED|Janus white-label' -n .
```

Observed:

- `VALID_MANIFEST`
- `VALID_MODULES`
- Required HTML files present
- AC/status/persona strings found in manifest/pages/mock data

---

## 3. Browser validation

Opened:

```text
file:///Users/trixie/aicoworker/openclaw/workspace-bancassurance/projects/sales-service-prototype/prototype/sprint1/index.html
```

Observed root overview renders:

- Sprint 1 scope card
- 6 personas
- AC coverage
- Modular navigation
- No CRM/Motor quote/HSYCBH/payment/policy content in Sprint 1

Opened product module and switched persona to `RM-02`.

Observed:

- Motor = `CONDITIONAL`
- Motor CTA = `Tạo quote (giới hạn)`
- Health = `BLOCKED`
- Health CTA = `Không khả dụng`
- Janus white-label presentation visible
- No browser console errors captured for product module

---

## 4. Sprint 1 AC coverage

| AC | Covered by |
|---|---|
| AC-S1-01 | Seller profile identity mapping + auth/persona selector |
| AC-S1-02 | RM-01 mock data: Motor + PA READY |
| AC-S1-03 | RM-02 mock data: Motor CONDITIONAL, quote enabled, bind omitted |
| AC-S1-04 | RM-02 Health BLOCKED, no action |
| AC-S1-05 | Hidden products section and visible product filtering |
| AC-S1-06 | BLOCKED/SERVICE_UNVERIFIED states disable CTA |
| AC-S1-07 | Product access direct URL denial state panel |
| AC-S1-08 | Janus white-label theme and product branding |
| AC-S1-09 | Seller menu excludes Admin/Manager/Product Builder/Commission Setup |
| AC-S1-10 | Alerts/reasons/next action displayed for license/training/readiness |

---

## 5. Known limitations

- Static HTML/CSS/JS mock only; no backend.
- Route guard is demonstrated as mock UX/state, not an actual server-side enforcement layer.
- Sprint 2+ flows are intentionally not implemented.
- Quote/HSYCBH/payment/policy are not built in Sprint 1.

---

## 6. Next recommended step

Review Sprint 1 prototype visually. If accepted, proceed to Sprint 2 planning/build: Sales Entry & Customer Context.

---

## 7. Advisor hardening pass

After advisor review, architecture was hardened:

- Split mock data into seed/scenario/handler files:
  - `shared/mock/seed/sellers.js`
  - `shared/mock/seed/products.js`
  - `shared/mock/scenarios/*.js`
  - `shared/mock/handlers/*.js`
- `shared/mock/mock-data.js` reduced to compatibility note only, avoiding a new mock-data god file.
- Generated `shared/js/app-manifest.js` from `app-manifest.json`.
- Runtime navigation now derives from `BANCA.manifest.modules` instead of a hardcoded navigation list.

## 8. HTTP smoke test evidence

Served prototype via local HTTP server:

```bash
python3 -m http.server 8787
```

Opened:

```text
http://127.0.0.1:8787/index.html
```

Observed via browser evaluate:

```json
{
  "title": "Prototype Overview",
  "nav": [
    "Đăng nhập & Mock Account",
    "Trang chủ Seller",
    "Hồ sơ người bán",
    "Readiness & License",
    "Sản phẩm được phép bán",
    "State Gallery"
  ],
  "persona": "RM-01",
  "errors": []
}
```

Smoke matrix loaded all required pages for personas:

- `RM-01`
- `RM-02`
- `SVC-ERR`

Pages tested:

- `index.html`
- `modules/auth/index.html`
- `modules/seller-workspace/index.html`
- `modules/seller-profile/index.html`
- `modules/seller-readiness/index.html`
- `modules/product-access/index.html`
- `dev/state-gallery.html`

All returned `loaded: true`.

## 9. Persona readiness evidence

Observed product readiness/capability matrix from runtime JS:

```json
[
  {
    "persona": "RM-01",
    "products": [
      {"id":"motor","state":"READY","caps":["can_advise","can_quote","can_submit","can_bind","can_collect_payment"]},
      {"id":"pa","state":"READY","caps":["can_advise","can_quote","can_submit","can_bind"]}
    ]
  },
  {
    "persona": "RM-02",
    "products": [
      {"id":"motor","state":"CONDITIONAL","caps":["can_advise","can_quote","can_submit"]},
      {"id":"health","state":"BLOCKED","caps":[]}
    ]
  },
  {
    "persona": "SVC-ERR",
    "products": [
      {"id":"motor","state":"SERVICE_UNVERIFIED","caps":[]},
      {"id":"health","state":"SERVICE_UNVERIFIED","caps":[]}
    ]
  }
]
```

Browser console error check returned no error messages.

## 10. Final status

Sprint 1 prototype status: **functional draft validated**.

It is ready for visual/business review, but not yet a production implementation. Sprint 2+ remains out of scope.

---

## 11. Final AC-S1 hardening evidence

After final advisor review, AC-S1-07 was hardened from a static denial card into an actual hash-route guard.

Tested URL:

```text
http://127.0.0.1:8787/modules/product-access/index.html#travel
```

Persona:

```text
RM-02
```

Observed runtime result:

```json
{
  "title": "ACCESS_DENIED",
  "denied": true,
  "hiddenNameExposed": false,
  "persona": "RM-02"
}
```

This confirms a direct route/hash to an unauthorized product is denied and protected product name/content is not exposed.

Persona persistence and default-deny service state also tested:

```json
{
  "persona": "SVC-ERR",
  "selected": "SVC-ERR",
  "serviceUnverified": true,
  "noReadyDefault": true
}
```

Final browser console error check returned no error messages.

## 12. PASS / PARTIAL / PENDING status

| AC | Status | Evidence |
|---|---|---|
| AC-S1-01 | PASS | RM persona/profile mappings render in auth/profile/workspace |
| AC-S1-02 | PASS | Runtime matrix: RM-01 has Motor + PA READY |
| AC-S1-03 | PASS | Runtime matrix: RM-02 Motor CONDITIONAL with can_advise/can_quote/can_submit only |
| AC-S1-04 | PASS | Runtime matrix: RM-02 Health BLOCKED with no caps/action |
| AC-S1-05 | PASS | Product list filters visible products by persona; hidden products not rendered in active list |
| AC-S1-06 | PASS | BLOCKED and SERVICE_UNVERIFIED produce no action capabilities |
| AC-S1-07 | PASS | Direct hash route `#travel` renders ACCESS_DENIED without exposing hidden product name/content |
| AC-S1-08 | PASS | Janus white-label theme/product branding visible in shell/product list |
| AC-S1-09 | PASS | Runtime Seller menu excludes Admin/Manager/Product Builder/Commission Setup |
| AC-S1-10 | PASS | Alerts/reasons/next action visible for license/training/readiness states |

Final status remains: **functional draft validated**, ready for user visual/business review.

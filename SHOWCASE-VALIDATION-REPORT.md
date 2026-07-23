# Showcase Validation Report

**Primary demo:** `showcase.html`  
**Validated:** 2026-07-19  
**Status:** Improved visual showcase draft

---

## 1. Render check

Opened over HTTP:

```text
http://127.0.0.1:8788/showcase.html
```

Observed:

```json
{
  "title": "Banca Sales Portal — Sprint 1 Showcase",
  "h1": "Biết ngay seller được bán gì — và vì sao bị giới hạn",
  "nav": [
    "🏠 Trang chủ",
    "🛡️ Sản phẩm được phép bán",
    "✅ Readiness của tôi",
    "👤 Hồ sơ người bán"
  ],
  "cards": 2,
  "kpis": 4,
  "persona": "RM-01",
  "hasHero": true
}
```

---

## 2. Scenario interaction check

Persona switcher tested for:

### RM-01

- Motor = READY
- Personal Accident = READY
- KPI = `2 READY / 0 CONDITIONAL / 0 BLOCKED / 4 scopes`

### RM-02

- Motor = CONDITIONAL
- Health = BLOCKED
- KPI = `0 READY / 1 CONDITIONAL / 1 BLOCKED / 2 scopes`

### SVC-ERR

- Motor = SERVICE_UNVERIFIED
- Health = SERVICE_UNVERIFIED
- CTA disabled/default deny

---

## 3. Console check

Browser console error check returned no error messages.

---

## 4. Screenshot evidence

- Earlier SVC-ERR test screenshot: `/Users/trixie/aicoworker/openclaw/media/browser/43d8def3-608d-4980-8ba7-2af28c9562c0.jpg`
- Final RM-01 default showcase screenshot: `/Users/trixie/aicoworker/openclaw/media/browser/3743a1f4-8260-4af4-9a09-7eab917e9deb.jpg`

---

## 5. Honest assessment

This is materially better than the prior modular scaffold because it is:

- single-page presentation-first,
- visually hierarchical,
- more business-readable,
- self-contained,
- easier to demo to stakeholders.

It remains Sprint 1 only and does not implement quote/HSYCBH/payment/policy.

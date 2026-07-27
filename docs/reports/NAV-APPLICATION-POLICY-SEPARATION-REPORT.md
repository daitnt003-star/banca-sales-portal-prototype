# Navigation + HSYCBH / Policy Separation Report

**Updated:** 2026-07-19  
**File changed:** `showcase-template.html`

---

## 1. User feedback addressed

- HSYCBH đã hoàn thành and Hợp đồng are separate concepts.
- Some completed applications may not yet have a policy number.
- Overview should only show Trang chủ, no submenu clutter.
- Tư vấn & bán hàng should not show Trang chủ; add Tư vấn nhanh.
- Remove the product module from visible navigation/home.

---

## 2. Changes made

### Navigation

Primary sidebar now shows:

```text
Trang chủ
Tư vấn & bán hàng
- Tư vấn nhanh
- HSYCBH
- Hợp đồng
```

Removed visible product module/menu.

### Secondary sidebar

Now shows:

```text
Trang chủ
HSYCBH chưa hoàn thành
HSYCBH đã hoàn thành
Hợp đồng đã phát hành
```

### Homepage sections

Now shows:

1. HSYCBH chưa hoàn thành
2. HSYCBH đã hoàn thành
3. Hợp đồng đã phát hành

The product section was removed from the homepage.

### Data separation

`done` applications are separate from `policies`.

Example in `HSYCBH đã hoàn thành`:

```text
HS-2407-0158 — Đã hoàn tất hồ sơ — Chờ cấp số HĐ
```

This demonstrates the case where HSYCBH is completed but no policy has been issued yet.

---

## 3. Browser validation

Observed:

```json
{
  "h1": "Xin chào, Nguyễn Văn An",
  "primaryNav": ["Trang chủ", "Tư vấn nhanh", "HSYCBH", "Hợp đồng"],
  "sb2": ["Trang chủ", "HSYCBH chưa hoàn thành", "HSYCBH đã hoàn thành", "Hợp đồng đã phát hành"],
  "sections": [
    {"x":"HSYCBH chưa hoàn thành","found":true},
    {"x":"HSYCBH đã hoàn thành","found":true},
    {"x":"Hợp đồng đã phát hành","found":true}
  ],
  "viewAllCount": 3,
  "hasQuickAdvice": true,
  "hasProductModuleNav": false,
  "hasProductSection": false,
  "completedMentionsNoPolicy": true,
  "policyRows": 1
}
```

---

## 4. Screenshot

Latest screenshot:

`/Users/trixie/aicoworker/openclaw/media/browser/19e88442-4a8f-49d0-ae3d-fd0f8116cb4f.jpg`

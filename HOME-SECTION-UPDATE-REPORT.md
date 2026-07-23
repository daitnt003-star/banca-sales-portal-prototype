# Home Section Update Report

**Updated:** 2026-07-19  
**File changed:** `showcase.html`

---

## User request

- Remove section “hệ thống hỗ trợ bạn”.
- Remove final note at bottom.
- Remove section “Điều kiện bán và việc cần xử lý”.
- Add sections:
  - HSYCBH chưa hoàn thành
  - HSYCBH đã hoàn thành
- Add “Xem tất cả” button to:
  - HSYCBH chưa hoàn thành
  - HSYCBH đã hoàn thành
  - Sản phẩm có thể bán
- Remove hero copy:
  - “Hôm nay bạn có thể bán sản phẩm nào?”
  - “Bạn đã đủ điều kiện bán Motor...”
  - “Xem sản phẩm được phép bán”
  - “Kiểm tra điều kiện bán”
- Replace with greeting by seller name.

---

## Changes made

- Hero now says: `Xin chào, Nguyễn Văn An`.
- Removed old hero CTAs.
- Added section `HSYCBH chưa hoàn thành` with sample incomplete applications.
- Added section `HSYCBH đã hoàn thành` with sample completed/issued cases.
- Added `Xem tất cả` to both HSYCBH sections and product section.
- Removed the previous guidance/status-flow section.
- Removed the final demo limitation note.

---

## Browser validation

Observed from browser runtime:

```json
{
  "h1": "Xin chào, Nguyễn Văn An",
  "removed": [],
  "hasIncomplete": true,
  "hasCompleted": true,
  "viewAllCount": 3,
  "productSection": true,
  "productCount": 2
}
```

---

## Screenshot

Latest screenshot:

`/Users/trixie/aicoworker/openclaw/media/browser/e177a983-98b9-4de2-8639-07883c0c0b5d.jpg`

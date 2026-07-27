# DOC-MGMT-REPORT

## Files changed
- `modules/policies/index.html`
- `shared/mock/seed/policies.js`
- `shared/js/head-loader.js`
- `docs/reports/DOC-MGMT-REPORT.md`

## What changed
- Replaced separate policy-detail document actions with one primary action: "Tài liệu & gửi khách".
- Added a shared document management component used by both PA and Motor detail renderers.
- Added selectable document rows with checkbox, select all, selected count, download, send, clear, preview, per-document status, permissions, previous-version grouping, and mobile sticky action bar.
- Added `?tab=documents#related-documents` support and action click behavior: scroll to `related-documents`, highlight section, enter selectable document context, without auto-selecting, downloading, or sending.
- Added one-file demo download and multi-file simulated ZIP download named `POL-<polId>-documents-YYYYMMDD.zip`.
- Added send-to-customer confirmation modal with recipient, email, phone, channel, link expiry, message, consent, and language fields.
- Added send validation for selection, channel contact format, consent, link expiry, non-customer-sendable documents, and blocked internal documents.
- Added localStorage-backed audit for downloads and sends, latest-send summary, and timeline entries without exposing sensitive link content.
- Standardized customer-facing document terms in the policy detail UI: "Giấy chứng nhận bảo hiểm", "Điều khoản bảo hiểm", "Yêu cầu bảo hiểm đã phát hành hợp đồng này", "Thư kết quả thẩm định".

## Data model
Policy seed now supports `documents`:

```js
{
  id,
  name,
  fileName,
  kind,
  version,
  issuedAt,
  effectiveFrom,
  source,
  status,
  canView,
  canDownload,
  canSendToCustomer,
  restrictedReason,
  expired,
  isPrevious,
  hiddenFromDocumentList
}
```

Seed examples were added for Motor `JB-POL-2026-0207` and PA `JB-PA-2026-1201`, including certificate, wording, source request, VAT invoice, underwriting letter, previous wording version, and hidden internal note.

## Root cause
The old detail page had two divergent document implementations: PA rendered a static mini list while Motor rendered a link list with immediate alert/download behavior. The action bar also split download and send into separate primary-like actions, so permissions, validation, audit, and timeline behavior could not be applied consistently.

## Remaining issues
- ZIP generation is intentionally simulated with a Blob because this prototype has no ZIP library.
- Preview is a toast-only placeholder.
- Audit is localStorage overlay only; no backend persistence exists in this prototype.

## Validation
- `node --check` on every `.js` file: PASS.
- Inline scripts in `modules/policies/index.html` parsed with `new Function(code)`: PASS.
- `node scripts/validate-terminology.js`: PASS.

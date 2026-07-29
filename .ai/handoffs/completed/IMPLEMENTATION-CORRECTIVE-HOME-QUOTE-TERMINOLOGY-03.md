# Implementation result

Status: IMPLEMENTED_PENDING_QC
Feature: CORRECTIVE-HOME-QUOTE-TERMINOLOGY-03
Implementer: Claude

## Files changed

- `modules/seller-workspace/index.html`
  - Đổi object chính trên Home từ “yêu cầu” sang “Bản chào” tại subtitle, action
    queue/chips, cột bảng, overflow link, danh sách gần đây, empty state và section
    theo dõi sau nộp.
  - Giữ nguyên state, route, CTA behavior và privacy guard theo channel profile.
  - Tách chuỗi style dùng chung của hai nhánh privacy exception để loại hai cảnh
    báo `BULKY_INLINE_STYLE` do attempt 2 đưa vào.
- `scripts/test-privacy-home.js`
  - Làm fixture draft đi tới `REVIEW_AND_SUBMIT` để render deterministic cả item
    “có thể nộp”.
  - Bổ sung assertions terminology cho cả `BANCA_INTEGRATED` và `AGENT_BROKER`.
- `.ai/handoffs/in-progress/CORRECTIVE-HOME-QUOTE-TERMINOLOGY-03.md`
  - Bản sao byte-for-byte của ready handoff để ghi nhận trạng thái triển khai.
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-HOME-QUOTE-TERMINOLOGY-03.md`
  - Báo cáo implementation này.

Không sửa `scripts/validate-terminology.js`: các chuỗi legacy tương tự vẫn tồn tại
hợp lệ hoặc ngoài scope Home ở module khác, nên thêm global rule sẽ tạo
false-positive/broaden scope. Deterministic rendered-DOM test là prevention đúng
phạm vi.

## Acceptance criteria evidence

1. `test-privacy-home.js` xác nhận DOM của cả hai profile không chứa:
   `yêu cầu chưa nộp`, `yêu cầu cần bổ sung`, `yêu cầu có thể nộp`,
   `mã yêu cầu`, `yêu cầu bảo hiểm chưa nộp`.
2. Cùng test xác nhận cả hai DOM có object “Bản chào”, queue
   “Bản chào cần bổ sung”/“Bản chào có thể nộp”, cột “Mã bản chào” và theo dõi
   “bản chào đã nộp”.
3. Privacy regression PASS: Banca anonymous không có tên/CIF, vẫn có anonymous ref;
   Agent/Broker vẫn có tên và CIF.
4. `validate-terminology.js` PASS; Home DOM test PASS 28/28.
5. Design-token từ baseline `1157 errors / 689 warnings` xuống
   `1156 errors / 687 warnings`; `BULKY_INLINE_STYLE` từ 423 xuống 421.
6. Runtime/test/handoff changes của corrective nằm trong file allowlist; không sửa
   các thay đổi unrelated đã có trong dirty worktree.

## Validation results

- `node scripts/test-privacy-home.js` — PASS, 28/28.
- `node scripts/validate-terminology.js` — PASS, quét 93 files.
- `node scripts/validate-design-tokens.js` — PASS (report mode),
  1156 errors / 687 warnings.
- `node scripts/validate-manifest.js` — PASS, `VALID_MANIFEST`.
- `node scripts/validate-modules.js` — PASS, `VALID_MODULES`.
- `node scripts/detect-duplicate-components.js` — PASS,
  `DUPLICATE_COMPONENT_SCAN_OK`.
- `node scripts/test-foundation.js` — PASS, 58/58.
- `git diff --check -- modules/seller-workspace/index.html scripts/test-privacy-home.js`
  — PASS.
- Ready/in-progress handoff `cmp` — PASS, byte-for-byte identical.

## UI/UX safety check

- Chỉ đổi terminology/copy, không đổi layout, responsive breakpoint, navigation,
  component, token hoặc action hierarchy.
- Không thêm màu, spacing, font, radius, shadow, z-index hay motion.
- Privacy behavior giữ nguyên theo channel profile và được kiểm tra trực tiếp trên
  rendered DOM.

## Assumptions used

- “nộp”, “chưa nộp”, “đã nộp” tiếp tục là action/lifecycle hợp lệ khi gắn với
  object “Bản chào”.
- “Yêu cầu bổ sung/điều chỉnh” được giữ khi là hành động yêu cầu ai đó cung cấp
  thông tin hoặc sửa khách hàng, không phải tên object bảo hiểm.

## Errors encountered and resolved

- Baseline design-token có 689 warnings, cao hơn gate 687. Nguyên nhân đúng với
  handoff: hai nhánh conditional privacy lặp inline style dài. Đã tách chuỗi style
  dùng chung; hậu kiểm còn 687 warnings.
- Không có validation failure sau patch.

## Remaining risks

- `validate-terminology.js` vẫn là static source scanner và không tự hiểu mọi copy
  được ghép trong template literal. Risk riêng của Home đã được chặn bằng rendered
  DOM regression cho hai channel profile.
- Reflection ledger không được ghi trong implementation vì
  `.ai/learning/error-ledger.jsonl` nằm ngoài file allowlist; Codex final QC owner
  cần chạy reflection theo governance sau khi review.

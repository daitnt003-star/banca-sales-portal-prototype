# CONFIRM-PAY REPORT — Thiết kế lại tab "Xác nhận & thanh toán" (Motor + Health)

## 1. Files đã sửa
| File | Thay đổi chính |
|------|----------------|
| `shared/mock/seed/case-state-resolver.js` | Thêm gating helpers `BANCA._payAmount`, `BANCA.confirmationComplete`; thêm trường `canInitiatePayment` (siết business gating); tổng quát hoá branch §5 (Motor điều kiện + Health per-member); relabel §6. |
| `modules/application-workspace/app-workspace.js` | Gộp confirm/payment/comm thành **1 trang dọc 6 section** (`renderConfirmPay`); BỎ tab "Liên hệ" + sub-tab confirmpay; 3 cách thanh toán hiển thị trực tiếp (`openPayFlow`, bỏ bước "Chọn cách thanh toán"); trạng thái thanh toán VN + vùng "Chi tiết kỹ thuật" thu gọn; bảng lịch sử → chi tiết (`openTxnDetail`); breakdown khớp tổng phí; guard banner phát hành theo `policyStatus==='ISSUED'`. |
| `shared/mock/seed/applications.js` | Migrate combo sai; thêm 2 seed Health cho retest. |
| `shared/js/head-loader.js` | Cache-bust `v=20260723v` → **`v=20260723w`**. |
| `scripts/test-post-submit.js` | Fixture test 11 thêm `premium` (METHOD_REQUIRED thực tế luôn có amount>0 — phù hợp gate mới). |

## 2. Thay đổi deriveCaseViewState / gating (cốt lõi)
- **`canInitiatePayment`** (nguồn chân lý duy nhất, gán vào cả `canCreatePaymentIntent` để tương thích code cũ) chỉ `true` khi **tất cả**:
  1. UW đã chấp thuận — `APPROVED_STP | APPROVED | APPROVED_WITH_CONDITION`.
  2. Xác nhận khách hàng đủ — `BANCA.confirmationComplete(app)`:
     - Health multi-insured (có theo dõi per-member): **TẤT CẢ** thành viên active `confirmation.status==='CONFIRMED'`.
     - Motor chấp thuận-có-điều-kiện: cần `app.confirm` (OTP verified / confirmedAt).
     - Chấp thuận thường: xác nhận đã thực hiện khi nộp.
  3. Quote còn hiệu lực (`quoteStatus` ≠ EXPIRED/INVALID) + `amount>0`.
  4. Không blocker (không CANCELLED / DECLINED / NEED_MORE_INFORMATION).
  5. Chưa có payment đang chạy/đã thành công (`paymentStatus` ∉ {PENDING, PROCESSING, SUCCESS}).
- Branch §5 tổng quát: `approved && chưa SUCCESS && chưa PENDING/PROCESSING && !confirmationComplete` → `CUSTOMER_CONFIRMATION_REQUIRED` (khoá payment). Bắt cả Motor điều kiện lẫn Health per-member chưa đủ xác nhận (AC03/AC08).
- Không đổi các branch declined/cancelled/NMI/UW-pending → không regression list/dashboard/queue.
- **Seller không tự mark success**: resolver không expose action set-success; `settlePayment` = mô phỏng callback gateway (Demo Tools). Không phát hành khi payment chưa SUCCESS; banner "Hợp đồng đã phát hành thành công" chỉ hiện khi `policyStatus==='ISSUED'`.

## 3. Trang dọc 6 section (Motor + Health chung layout, chỉ khác renderer)
1. **Trạng thái xử lý** — stepper Chấp thuận → Xác nhận → Chờ thanh toán → Đang xử lý → Thành công → Phát hành + note phát hành đúng trạng thái.
2. **Xác nhận khách hàng** — Motor: 1 gói xác nhận (người/vai trò/SĐT/nội dung/trạng thái/gửi-gửi lại-evidence). Health: per-insuredUnitId (≥18 SĐT+OTP riêng; <18 người đại diện; "Gửi hàng loạt" nhưng KHÔNG 1 OTP chung).
3. **Phí cần thanh toán** — Tổng phí / Đã thanh toán / Còn phải thanh toán + breakdown; có dòng "Điều chỉnh" reconcile để **breakdown luôn khớp tổng phí** (AC09). Health thêm phí theo thành viên (tham khảo).
4. **Ba cách thanh toán (trực tiếp)** — Quét QR tại quầy / Gửi yêu cầu từ xa / Thanh toán trên thiết bị này. Click → mở thẳng flow (KHÔNG bước chọn). Disabled khi chưa đủ điều kiện + nêu rõ ai còn thiếu xác nhận. Intent chỉ tạo khi seller xác nhận cấu hình.
5. **Trạng thái thanh toán** — chỉ hiện khi đã có intent; wording VN (Chưa khởi tạo/Đang chờ/Đang xử lý/Thành công/Thất bại/Hết hạn/Đã hủy); English (Experience/Instrument/Delivery/Gateway…) đưa vào `<details>` "Chi tiết kỹ thuật"; Demo Tools callback khi PENDING.
6. **Lịch sử thanh toán** — bảng Mã GD/Cách/Người/Thời gian/Số tiền/Trạng thái/Tham chiếu; row → modal chi tiết (KHÔNG lặp key-value dưới bảng).

Sub-tab confirmpay & tab "Liên hệ" đã bỏ; `tab=confirm|payment|comm` alias → cùng trang (deep-link/reload không đổi state).

## 4. Demo data migration (source-of-truth, before/after)
| App | Before | After | Root cause |
|-----|--------|-------|-----------|
| `APP-2026-109` | APPROVED_WITH_EXCLUSION + payment SUCCESS + policy ISSUING, **thiếu confirm** → combo "confirmation incomplete + payment success/issued" | Thêm 5-field states + `confirm{confirmedAt,otp:VERIFIED}` + payment/gateway fields đầy đủ | Chấp thuận-có-điều-kiện đã thanh toán bắt buộc phải có xác nhận khách. |
| `APP-2026-HLT1` | Issued, members không có `confirmation` | Thêm `underwriting:APPROVED_STP` + `confirmation:CONFIRMED` cho từng member | Bản đã phát hành phải là confirmation-complete. |
| `APP-2026-HLT3` *(mới)* | — | Health family: 3 member APPROVED_STP nhưng 1 member mới `SENT` (chưa CONFIRMED) → payment khoá | Seed retest: Health confirmation dở → 3 cách disabled (AC08). |
| `APP-2026-HLT4` *(mới)* | — | Health family: tất cả APPROVED_STP + CONFIRMED, METHOD_REQUIRED → 3 cách mở | Seed retest: Health đủ điều kiện. |

Seed retest sẵn có: Motor `APP-2026-113` (APPROVED_WITH_CONDITION chưa xác nhận → disabled), Motor `APP-2026-107` (confirmed → payment PENDING), `APP-2026-HLT3` (Health dở), `APP-2026-HLT4` (Health đủ). Motor `APP-2026-106` (METHOD_REQUIRED, confirmed → enabled).

Quét toàn bộ SUBMITTED apps qua resolver: **0 combo sai** ((confirmation incomplete + payment success), (… + policy issued), (payment incomplete + policy issued)).

## 5. Validation (đều PASS — không chạy server/browser)
- `node --check` mọi `.js` (modules/shared/scripts): **PASS**.
- Parse mọi inline `<script>` bằng `new Function()`: **13/13 PASS**.
- `node scripts/validate-terminology.js`: **PASS** (80 files) — KHÔNG thay token tiếng Anh trong code.
- `node scripts/test-post-submit.js`: **16/16 PASS**.
- `node scripts/test-foundation.js`: **58/58 PASS**; `detect-duplicate-components`: OK.
- Gating harness trên seed: 4 demo-case đúng kỳ vọng, không invalid combo.

## 6. Ràng buộc kỹ thuật đã tuân thủ
- CHỈ đổi chuỗi hiển thị; enum/key/param/class giữ nguyên (English tokens gom vào "Chi tiết kỹ thuật").
- Guard mọi `.vehicle.*`; `renderConfirmPay` không truy cập `.vehicle` (Health/PA an toàn).
- `shell()` dùng innerHTML → ưu tiên inline `onclick`/hàm global (`openPayFlow`, `openTxnDetail`, `settlePayment`, `healthMemberConfirm*`).

## 7. Remaining / notes
- `validate-modules` / `validate-manifest` fail sẵn có (thiếu dir `product-access`, `seller-profile`, `seller-readiness`) — KHÔNG liên quan diff này.
- `communicationLog()` giữ lại (dead code, không render) sau khi bỏ tab Liên hệ — vô hại; có thể dọn sau.
- Handler `settlePayment` phát hành 2 bước đồng bộ (ISSUING→ISSUED) rồi điều hướng tab Hợp đồng; nếu cần trình diễn trạng thái "đang phát hành" lâu hơn, tách bước sau.

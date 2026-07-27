# HEALTH MULTI-INSURED REPORT — Bảo hiểm sức khỏe (gia đình)

Nâng luồng **Bảo hiểm sức khỏe** lên kiến trúc **multi-insured** (mỗi người được bảo hiểm = 1 `InsuredCoverageUnit` độc lập), dùng chung Application Workspace / shell / stepper với Motor & PA — **không** tạo module Health riêng. Render từ ProductJourneyDefinition (mở rộng `multiInsured`).

## Files đã sửa / thêm

### Thêm mới
- `shared/mock/seed/insured-units.js` — data model `InsuredCoverageUnit` + toàn bộ helper multi-insured.

### Sửa
- `shared/mock/seed/journey-registry.js` — thêm block `health.multiInsured` (§14).
- `shared/js/head-loader.js` — nạp `insured-units.js` (sau `product-schemas.js`); **bump `V='v=20260723t' → 'v=20260723u'`**.
- `modules/application-workspace/app-workspace.js` — Member Navigator, per-member Bước 2..6, review member matrix, submit guard, submitted member matrix (thẩm định + xác nhận), consolidated payment, multi-GCN issuance, các window function per-member.
- `shared/mock/seed/applications.js` — `DRAFT-2026-HLT1` thành family draft (3 người: 1 hoàn tất, 1 trẻ thiếu khai sinh, 1 người ngoài độ tuổi); thêm submitted family app `APP-2026-HLT2` (member matrix thẩm định).
- `shared/mock/seed/policies.js` — `JB-HEALTH-2026-2201`: per-member `certificateNumber` (multi-GCN), `certificateMode`/`issueMode`.
- `modules/policies/index.html` — policy view-only multi-insured: danh sách thành viên click mở quyền lợi/hạn mức/đồng chi trả/thời gian chờ + số GCN riêng.
- `modules/unsubmitted-applications/index.html` + `modules/submitted-applications/index.html` — summary member-centric (số người BH · tổng phí · tiến độ / trạng thái tổng derive).
- `modules/advisory-workspace/index.html` — Quick Advice Health: card ước tính gói gia đình theo nhóm tuổi + tổng + cảnh báo thời gian chờ.

## Data model — InsuredCoverageUnit (lưu trong `app.insuredMembers[]`, overlay draft)
Mỗi unit độc lập, KHÔNG chia sẻ giữa các thành viên:
```
{ insuredUnitId, name, dob, age(hydrated), gender, relationship, identityNumber, occupation,
  guardianName/guardianRelationship/guardianPhone,   // trẻ <18
  active,                                             // loại thành viên là CHỦ ĐỘNG
  package,                                            // gói riêng (PER_MEMBER)
  riskAnswers{},                                      // khai báo sức khỏe RIÊNG (adult vs child)
  docs{},                                             // tài liệu RIÊNG (BIRTH_CERT, MEDICAL_RECORD…)
  beneficiaries[],                                    // người thụ hưởng RIÊNG (điều kiện)
  confirmation{status,otp,…},                         // xác nhận/OTP RIÊNG (per-member session)
  underwriting{decision,…},                           // thẩm định RIÊNG
  certificateNumber }                                 // GCN riêng (CERTIFICATE_PER_MEMBER)
```
Helper chính: `healthUnitsOf`, `hydrateInsuredUnit`, `healthUnitEligibility`, `healthUnitQuestions` (ADULT/CHILD), `rateHealthUnit`, `healthFamilyRating` (PER_MEMBER_THEN_AGGREGATE + chiết khấu gia đình ≥3), `healthUnitStatus` (✓/!/×), `healthSubmitReadiness` (ALL_ACTIVE_MEMBERS_READY), `healthDeriveOverallUw` (derive tổng), `healthMemberSummary`, `healthQuickAdviceEstimate`.

## Journey config (§14) — `ProductJourneyDefinitions.health.multiInsured`
`insuredMode:MULTI_INSURED` · `assignment{productMode:SAME_PRODUCT_LINE, packageMode:PER_MEMBER, addOnMode:PER_MEMBER}` · `effectiveDateMode/termMode:COMMON` · `ratingMode:PER_MEMBER_THEN_AGGREGATE` · `questionnaireMode/memberUnderwritingMode/confirmationMode:PER_MEMBER` · `beneficiaryMode:PER_MEMBER_CONDITIONAL` · `documentMode:COMMON_AND_PER_MEMBER` · `submissionMode:ALL_ACTIVE_MEMBERS_READY` · `consolidatedPayment:CONSOLIDATED` · `issuePolicyMode:ONE_POLICY_MULTI_INSURED` · `certificateMode:CERTIFICATE_PER_MEMBER`.
Đặt trong object `multiInsured` riêng để **không đụng** field cấp cao đang dùng (`underwritingMode:'STP'`, `paymentMode:'STANDARD'`) → không regression PA/Motor.

## Luồng đã hiện thực (6 bước, dùng chung khung Motor)
1. **Bên mua** — giữ nguyên (nguồn/KYC/consent/hiệu lực).
2. **Người được BH** — thẻ per-member: họ tên/DOB/quan hệ/giới tính/giấy tờ/nghề; người đại diện cho trẻ <18; **eligibility sơ bộ ngay** (báo lỗi tuổi tức thì); duplicate check (không auto-merge); loại/khôi phục thành viên chủ động; "+ Thêm người được bảo hiểm".
3. **Sản phẩm & quyền lợi** — **Member Navigator** + sticky summary; header "Đang cấu hình cho <tên·tuổi·quan hệ>"; card gói health đầy đủ quyền lợi + phí RIÊNG mỗi người; "Áp dụng gói cho thành viên đủ điều kiện" (vẫn quote riêng); báo giá gia đình (từng người → chiết khấu → tổng); **Beneficiary section có điều kiện** (chỉ khi gói có quyền lợi tử vong; tổng %/người=100%, không cộng chéo).
4. **Khai báo sức khỏe** — per-member; **bộ câu hỏi NGƯỜI LỚN vs TRẺ EM khác nhau**; dynamic branch (chi tiết/loading/referral); Navigator hiện tiến độ.
5. **Tài liệu** — Nhóm 1 chung (định danh bên mua/consent/eKYC/biên bản tư vấn) + Nhóm 2 theo người (giấy khai sinh trẻ, hồ sơ y tế phát sinh); dùng chung document center.
6. **Kiểm tra & nộp** — thông tin chung + **Member Review Matrix** (thành viên | gói | phí | sức khỏe | tài liệu | thụ hưởng | xác nhận); click ô lỗi mở đúng member+section; **submit guard ALL_ACTIVE_MEMBERS_READY** (blocker "Bổ sung <X> cho <tên>").

## Sau nộp
- **Thẩm định per-member** (member matrix): mỗi người decision riêng (APPROVED_STP / IN_UW / NEED_MORE_INFO / LOADING / REJECTED…); **trạng thái tổng DERIVE** — không hiện "Đã chấp thuận tự động" cho toàn yêu cầu nếu chỉ 1 phần duyệt.
- **Member Confirmation Package** per-member: ≥18 SĐT+OTP riêng; <18 người đại diện; gửi hàng loạt (mỗi người 1 phiên).
- **Thanh toán CONSOLIDATED** (1 lần cho tổng phí) — dùng lại pipeline payment hiện có với tổng gia đình.
- **Phát hành ONE_POLICY_MULTI_INSURED + CERTIFICATE_PER_MEMBER** (1 số HĐ chung + GCN/thẻ mỗi thành viên); GCN preview + policy view-only hiển thị per-member.
- **Policy view-only** nhiều GCN: danh sách thành viên (quan hệ/gói/trạng thái/GCN) click mở quyền lợi/hạn mức/đồng chi trả/thời gian chờ/loại trừ; 0 field Motor.

## Demo seed (retest)
- `DRAFT-2026-HLT1` (draft, CUS-002): 3 người — Lê Hoàng Nam 36t (hoàn tất) · Lê Minh Anh 7t (trẻ, **thiếu giấy khai sinh** → chặn) · Lê Văn Bình 73t (**ngoài độ tuổi 0–65** → không đủ điều kiện). Submit bị chặn, blocker trỏ đúng member+section.
- `APP-2026-HLT2` (submitted, CUS-001): 3 người — bản thân **APPROVED_STP** · vợ **IN_UW** (tiểu đường, đã nộp hồ sơ y tế) · con **APPROVED_STP** → **trạng thái tổng derive = Đang thẩm định** (member matrix ở tab Thẩm định).
- `JB-HEALTH-2026-2201` (policy đã có, 2 thành viên): thêm `certificateNumber` `GCN-2201-01/02` → policy view multi-GCN.

## Root cause (vì sao cần thay đổi)
Health trước đó chỉ là journey đơn insured với 1 mảng `insuredMembers` phẳng — phí gộp, khai báo/tài liệu/thụ hưởng/thẩm định dùng chung, không có khái niệm đơn vị bảo hiểm độc lập, không có Member Navigator, không có submit guard theo thành viên, không có member matrix/derive tổng, GCN đơn. Kiến trúc mới đưa mỗi người thành `InsuredCoverageUnit` và điều khiển UI qua `multiInsured` config.

## Ràng buộc kỹ thuật đã tuân thủ
- **Không thay token tiếng Anh trong code** (biến/key/enum/class giữ nguyên; chỉ đổi chuỗi hiển thị tiếng Việt).
- **Guard mọi `.vehicle`**: code multi-insured không đọc `.vehicle`; các chỗ chung vẫn `app.vehicle&&…` / `(app.vehicle||{})` / nhánh theo product.
- **Không regression Motor & PA**: block `multiInsured` tách riêng, `underwritingMode/paymentMode` cấp cao giữ nguyên; nhánh health thêm mới, không đổi nhánh Motor/PA.

## Validation (đã chạy, KHÔNG chạy server/browser)
- `node --check` mọi `.js`: **PASS** (fail=0).
- Parse mọi inline `<script>` bằng `new Function()`: **PASS** (10 script, 0 fail).
- `node scripts/validate-terminology.js`: **PASS** (80 files).
- `node scripts/test-foundation.js`: **PASS 58/0** · `node scripts/test-post-submit.js`: **PASS 16/0** (không regression).
- Runtime smoke (vm sandbox load seeds): units/eligibility/family rating/submit readiness/derive UW/quick estimate/policy multi-GCN/`deriveCaseViewState` — không throw.

## Remaining issues / giới hạn (demo-level)
- Rating/eligibility/OTP/thẩm định là **mô phỏng** (DEMO_TARIFF), không backend thật; upload tài liệu đánh dấu trạng thái, không lưu file thật.
- `certificateMode PER_MEMBER` sinh số GCN theo pattern `GCN-<polTail>-NN` khi phát hành (demo).
- Beneficiary section chỉ hiện khi gói có quyền lợi tử vong — các gói health hiện tại không có, nên section hiển thị ghi chú "không cần" (đúng logic có điều kiện).
- Quick Advice Health dùng gia đình minh họa (2 người lớn + 1 trẻ) theo gói được chọn; chưa thu compo thành viên thực từ form advisory (đúng tinh thần quick advice: không thu khai báo/OTP/tài liệu y tế).
- Không chạy server/browser theo brief (orchestrator retest).

---
## Trạng thái verify (orchestrator retest, 2026-07-23)
**Đã verify qua browser (evaluate DOM):** AC1 (shared workspace), AC2/AC5 (InsuredCoverageUnit + Member Navigator + phí riêng/tổng/chiết khấu), AC11 (submitted member matrix + derived overall status "Đang thẩm định" với 3 thành viên trạng thái hỗn hợp), AC14/AC15 (policy view-only member list + GCN per member, 0 field Motor). Không regression Motor/PA/home. node --check + inline parse + validate-terminology PASS.

**Guard bổ sung:** app-workspace.js branch `RISK_OBJECT` nay guard `journeyStageComponent==='motorVehicle'` — chặn mọi product non-motor render template xe (reproduce: health+step=RISK_OBJECT không còn hiện xe; motor vẫn hiện xe).

**CHƯA deep-test qua browser (NOT tested — cần test tay/mobile):** AC7-9 (OTP per-member ≥18/<18 flow đầy đủ), AC10 (submit guard chặn khi thành viên chưa xong), AC12-13 (payment CONSOLIDATED + breakdown end-to-end), responsive/mobile sticky bar + full-screen sheet, ZIP filename thực tế, deep-link reload, role không quyền tải/gửi. Các mục này đã implement trong code/seed nhưng CHƯA được orchestrator xác nhận trực quan (screenshot browser đang lỗi timeout).

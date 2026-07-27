# BRIEF — Health MULTI-INSURED journey (retail individual + family) — Banca Sales Portal

Bạn là Senior BA + Product Engineer + UI/UX bảo hiểm. Nâng luồng **Bảo hiểm sức khỏe (health)** hiện tại lên kiến trúc **multi-insured (gia đình)** đầy đủ theo spec. DÙNG CHUNG khung Application Workspace/shell/stepper với Motor — KHÔNG tạo module Health riêng; nội dung render từ ProductJourneyDefinition.

## NỀN HIỆN CÓ (đã build, mở rộng trên đó — đừng làm lại từ đầu)
- `shared/mock/seed/journey-registry.js`: đã có `ProductJourneyDefinitions.health` (riskObjectType INSURED_PERSON, stages CUSTOMER_INFO/INSURED_PARTY/PACKAGE_AND_QUOTE/RISK_DECLARATION/DOCUMENTS/REVIEW_AND_SUBMIT...). Mở rộng cấu hình theo mục 14 spec.
- `modules/application-workspace/app-workspace.js`: đã có render health (healthInsuredPerson/healthPackage/healthDeclaration/healthDocuments), tính tuổi từ DOB, "Thêm thành viên". Nâng lên per-member đầy đủ.
- `shared/mock/seed/`: `healthPackages`, `product-schemas.js` (health schema), `policies.js` (health policy `JB-HEALTH-2026-2201`), `applications.js` (health app).
- `modules/policies/index.html`: đã có health policy detail renderer (không field Motor) + document center dùng chung.
- Reference journey PA (đối tượng người, có sẵn) để mô phỏng pattern per-member.
- `shared/js/head-loader.js`: cache-bust `const V='v=20260723t'` → BUMP lên u.
- `shared/js/app-shell.js`: `shell()` set body qua innerHTML NHƯNG đã có patch re-execute `<script>` nhúng trong `main#main-content` (dùng được nếu cần JS tương tác; vẫn ưu tiên inline onclick / hàm global).

## YÊU CẦU (bám sát spec, prototype demo-level — OTP/eligibility/rating mô phỏng)

### Data model (cốt lõi)
Mỗi người được bảo hiểm = 1 **InsuredCoverageUnit** (insuredUnitId) độc lập gồm: thông tin cá nhân, product/package assignment, quyền lợi+hạn mức, phí riêng, questionnaire riêng, document checklist riêng, beneficiary riêng, confirmation/OTP riêng, underwriting result riêng. KHÔNG dùng chung câu trả lời sức khỏe/tài liệu y tế/người thụ hưởng/kết quả thẩm định giữa các thành viên. Lưu trong overlay draft (localStorage), autosave qua điều hướng member.

### Stepper (6 bước, dùng chung khung Motor)
1. Bên mua bảo hiểm 2. Người được bảo hiểm 3. Sản phẩm và quyền lợi 4. Khai báo sức khỏe 5. Tài liệu 6. Kiểm tra và nộp.

### Member Navigator (component bổ sung, không đổi layout tổng)
Từ bước 3: danh sách thành viên với trạng thái (✓ hoàn tất / ! còn thiếu / × không đủ điều kiện), gói + phí + cảnh báo mỗi người. Click đổi context nội dung chính theo insuredUnitId. Sticky summary: số thành viên, thành viên hiện tại, gói + phí từng người, chiết khấu, tổng phí, tiến độ, cảnh báo chặn.

### Bước 1 — Bên mua: nguồn (Bank CRM/khách NH/lead/tạo mới/Quick Advice), thông tin định danh + KYC + consent + ngày hiệu lực + địa chỉ nhận chứng từ. Câu hỏi "Bên mua đồng thời là người được BH?" Có→tạo member đầu từ bên mua. Validation (bắt buộc/định dạng/duplicate/consent/không sửa Customer Master).

### Bước 2 — Người được BH: "+ Thêm người được bảo hiểm" modal (dùng bên mua / khách NH / lead / tạo mới). Dữ liệu từng người (họ tên, DOB, tuổi BH tại hiệu lực read-only, giới tính, giấy tờ, quan hệ, nghề nghiệp, người đại diện nếu <18). Duplicate check (CIF→giấy tờ→tên+DOB→SĐT, không auto-merge vì chung SĐT gia đình). **Eligibility sơ bộ ngay** (tuổi min/max, quan hệ, trẻ cần cha/mẹ, số thành viên tối đa, nghề loại trừ) — báo lỗi tuổi NGAY, không chờ tới khai báo.

### Bước 3 — Sản phẩm/gói/quyền lợi/báo giá: assignment mode theo cấu hình (SAME_PRODUCT_LINE / PER_MEMBER_PACKAGE...). Header "Đang cấu hình cho <tên · tuổi · quan hệ>". Card gói health đủ quyền lợi (hạn mức năm/nội trú/ngoại trú/phẫu thuật/nha khoa/thai sản/đồng chi trả/thời gian chờ/loại trừ/phí thành viên) + Xem chi tiết + So sánh + Chọn. Phí riêng từng người → chiết khấu gia đình → tổng. "Áp dụng gói này cho thành viên đủ điều kiện" nhưng vẫn tạo quote riêng mỗi insuredUnitId. **Beneficiary**: section có điều kiện (chỉ khi gói có quyền lợi tử vong), mỗi người danh sách thụ hưởng riêng, tổng tỷ lệ mỗi người=100% (không cộng chéo thành viên).

### Bước 4 — Khai báo sức khỏe: per member (Member Navigator hiện tiến độ). Bộ câu hỏi NGƯỜI LỚN vs TRẺ EM khác nhau (không dùng bộ người lớn cho trẻ). Dynamic branch (1 câu trả lời → câu phụ / yêu cầu tài liệu / chuyển thẩm định / phụ phí / loại trừ / giảm quyền lợi / từ chối). Lưu vết mỗi câu (insuredUnitId, version, questionId, answer, người nhập, thời điểm, before/after, trigger).

### Bước 5 — Tài liệu: Nhóm 1 chung (định danh bên mua, consent, eKYC, biên bản tư vấn). Nhóm 2 theo người (giấy khai sinh trẻ, giấy ra viện phát sinh từ khai báo...). Checklist sinh từ product/package/tuổi/quan hệ/nghề/câu trả lời/kết quả thẩm định/quyền lợi. Mỗi doc item: người BH, loại, nguồn yêu cầu, bắt buộc, trạng thái upload/kiểm tra/chấp nhận/từ chối+lý do, phiên bản. Tài liệu OCR CHUNG layout (không section OCR riêng). Dùng chung document center đã build.

### Bước 6 — Kiểm tra/xác nhận/nộp: thông tin chung (bên mua/hiệu lực/kỳ hạn/tổng phí/chiết khấu/địa chỉ/consent/tuyên bố trung thực). **Member Review Matrix** (bảng: thành viên | gói | phí | sức khỏe | tài liệu | thụ hưởng | xác nhận). Click lỗi mở đúng member + đúng section.

### OTP/xác nhận per member (mục 6 spec)
≥18: SĐT riêng, phiên xác nhận riêng, OTP/e-sign riêng, evidence theo insuredUnitId (không cho bên mua/seller nhập thay). <18: người đại diện (cha/mẹ/giám hộ) xác nhận, lưu người đại diện+quan hệ+SĐT+căn cứ+thời gian+evidence. **Member Confirmation Package** (gộp sản phẩm+khai báo+thụ hưởng+tài liệu+consent → gửi 1 lần/người); gửi hàng loạt được nhưng mỗi người 1 session. Đổi dữ liệu quan trọng của 1 người → chỉ invalidate confirmation người đó.

### Điều kiện nộp: submissionMode ALL_ACTIVE_MEMBERS_READY. CTA "Nộp yêu cầu bảo hiểm" chỉ bật khi mọi thành viên active đủ (eligibility+gói+quote+khai báo+tài liệu+thụ hưởng+OTP). Thiếu → chặn + CTA "Bổ sung <X> cho <tên>". Loại thành viên không đủ điều kiện là chủ động (không âm thầm) → tính lại phí.

### Sau nộp — Thẩm định per member: mỗi thành viên kết quả riêng (chấp thuận tự động/đang thẩm định/cần bổ sung/có điều kiện/phụ phí/loại trừ/giảm quyền lợi/khám bổ sung/từ chối). Trạng thái tổng DERIVE (có ai cần bổ sung→Cần bổ sung; còn ai đang thẩm định→Đang thẩm định; tất cả active duyệt→Chờ chọn cách thanh toán). KHÔNG hiện toàn yêu cầu "Đã chấp thuận tự động" nếu chỉ 1 người duyệt.

### Thanh toán/phát hành: paymentMode CONSOLIDATED (1 lần cho tổng phí), chỉ mở khi mọi active đủ điều kiện; 1 người bị từ chối → loại → tính lại → khách xác nhận tổng mới → mở thanh toán. issueMode ONE_POLICY_MULTI_INSURED, certificateMode CERTIFICATE_PER_MEMBER (1 số HĐ chung + GCN/thẻ mỗi thành viên).

### Quick Advice Health (mục 10): layout như Motor, câu hỏi khác (cá nhân/gia đình, số thành viên, nhóm tuổi, quan hệ, nhu cầu nội/ngoại trú/nha khoa/thai sản, mạng lưới, phạm vi, đồng chi trả, ngân sách). KHÔNG thu khai báo sức khỏe/thụ hưởng/OTP/tài liệu y tế/định danh đầy đủ. Đầu ra: gói đề xuất + quyền lợi + phí ước tính theo nhóm tuổi + tổng gia đình + điều kiện cần kiểm + cảnh báo thời gian chờ. CTA "Tạo yêu cầu bảo hiểm".

### List chưa nộp (mục 11) + Submitted (mục 12) + Policy (mục 13): dùng chung module, summary member-centric. List row: bên mua, số người BH, sản phẩm, tổng phí, bước hiện tại, tiến độ thành viên, cảnh báo, next action; click mở đúng stage+insuredUnitId+item thiếu. Submitted: tab thẩm định member matrix, tab tài liệu chung/riêng, tab xác nhận evidence riêng, payment tổng. Policy view-only: header + danh sách thành viên (quan hệ/gói/trạng thái/GCN-thẻ), click member xem quyền lợi/hạn mức/đồng chi trả/thời gian chờ/phụ phí/loại trừ/thụ hưởng/số GCN; phí breakdown theo thành viên; tài liệu (HĐ chung/điều khoản/hóa đơn/yêu cầu nguồn/GCN-thẻ từng người) + "Tài liệu & gửi khách". **0 field Motor** (xe/biển số/số khung/garage/NCD/TNDS).

## ProductJourneyDefinition (mục 14) — áp cho HEALTH_RETAIL_FAMILY (và INDIVIDUAL là family với 1 người)
insuredMode MULTI_INSURED; assignment {productMode SAME_PRODUCT_LINE, packageMode PER_MEMBER, addOnMode PER_MEMBER}; effectiveDateMode/termMode COMMON; ratingMode PER_MEMBER_THEN_AGGREGATE; questionnaireMode/beneficiaryMode(PER_MEMBER_CONDITIONAL)/documentMode(COMMON_AND_PER_MEMBER)/confirmationMode/underwritingMode PER_MEMBER; submissionMode ALL_ACTIVE_MEMBERS_READY; paymentMode CONSOLIDATED; issueMode ONE_POLICY_MULTI_INSURED; certificateMode CERTIFICATE_PER_MEMBER; stages [POLICYHOLDER, INSURED_MEMBERS, PRODUCT_AND_BENEFITS, HEALTH_DECLARATION, DOCUMENTS, REVIEW_CONFIRM_AND_SUBMIT] (map sang stage id hiện có: CUSTOMER_INFO/INSURED_PARTY/PACKAGE_AND_QUOTE/RISK_DECLARATION/DOCUMENTS/REVIEW_AND_SUBMIT).

## 15 ACCEPTANCE CRITERIA (phải đạt) — xem mục 15 spec.

## RÀNG BUỘC KỸ THUẬT (BẮT BUỘC — bài học nhiều lần)
- CHỈ đổi chuỗi hiển thị; KHÔNG thay token tiếng Anh trong code (biến/tham số/object key/query param/class CSS/enum).
- GUARD mọi truy cập `.vehicle.*` (Health/PA không có vehicle) — tránh crash trắng trang.
- KHÔNG regression Motor & PA (dùng chung app-workspace/policies/shell).
- Sau khi sửa PHẢI: `node --check` mọi .js; parse mọi inline `<script>` bằng `new Function()`; `node scripts/validate-terminology.js` PASS. Sửa tới khi sạch.
- Vanilla JS/HTML/CSS, tiếng Việt UI, giữ token style. BUMP head-loader V lên u.
- Ghi `docs/reports/HEALTH-MULTI-INSURED-REPORT.md`: file đã sửa + data model InsuredCoverageUnit + journey config + demo seed (1 family app 2-3 người) + root cause + remaining issues.
- Không chạy server/browser (orchestrator retest). Khi xong chạy: openclaw system event --text "Claude done: health multi-insured" --mode now
- Seed 1 draft family app (2-3 người, có 1 người thiếu tài liệu, 1 người không đủ tuổi) + 1 submitted family app (member matrix) để retest.

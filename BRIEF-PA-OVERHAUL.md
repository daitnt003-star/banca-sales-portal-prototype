# BRIEF — Đại tu flow Personal Accident (PA) — Banca Sales Portal

Bạn là Senior BA + Product Engineer + UI/UX Designer hệ thống bảo hiểm. Sửa TOÀN BỘ flow Personal Accident từ Start Sale → Policy Detail. KHÔNG chỉ sửa wording — sửa product-specific data model, rendering, routing, payment UX. Đây là prototype HTML/CSS/JS thuần (không framework), dữ liệu mock trong localStorage/overlay.

## KIẾN TRÚC & FILE CHÍNH (đã khảo sát)
- Root: thư mục hiện tại (`.../prototype/sprint1`).
- `modules/application-workspace/app-workspace.js` (~1996 dòng): render toàn bộ journey Edit + Tracking cho CẢ Motor lẫn PA (chung file). Các nhánh PA:
  - Insured Party: search `component==='paInsuredPerson'` / `paSetField` / `insuredAge` (dòng ~364-378).
  - Package: `else if(cur.id==='PACKAGE_AND_QUOTE' && ...==='paPackage')` dòng ~381; dùng `BANCA.paPackages` (dòng ~384, ~934).
  - Risk declaration: `paDeclaration` component; câu hỏi từ `BANCA.journeyFor('pa').declarationSchemaId`.
  - Review: `reviewLayout:'paReview'`, `reviewSections:['customer','insuredPerson','package','riskDeclaration','quote']` (journey-registry.js).
  - Payment + issue: nhiều hàm dùng `alert()` (dòng ~1839-1996): `window.createPaymentIntent`, sim callbacks, `simPaySuccess`, QR/card/transfer sims.
- `modules/policies/index.html` (285 dòng): render Policy Detail + list. HIỆN hard-code section `#vehicle` "Xe & thời hạn" (dòng ~187) — dùng cho MỌI product ⇒ PA cũng hiện field xe. List row routing `?view=detail&id=${x.id}` (dòng 254, 265).
- `shared/mock/seed/journey-registry.js`: định nghĩa `ProductJourneyDefinitions.pa` (stages, schema ids). `journeyEditStages`, `journeyStageComponent`, `journeyStageLabel`.
- `shared/mock/seed/status-model.js`: `BANCA.STAGES`, stage labels, state machine statuses.
- `shared/mock/seed/`: các seed khác — `paPackages`, `paOccupationClasses`, `applications.js`, `policies` store. TÌM file định nghĩa `BANCA.paPackages` và `BANCA.policies` để bổ sung field PA.
- `shared/js/app-shell.js`: shell/nav dùng chung.

## GIỮ NGUYÊN (không regression)
- State machine: SUBMITTED → UW_PROCESSING → APPROVED_STP → PAYMENT_METHOD_REQUIRED → PAYMENT_PENDING → PAYMENT_SUCCESS → POLICY_ISSUING → POLICY_ISSUED.
- Tab thẩm định STP: Decision ID, decision source, rule set/version, decision timestamp, loading, exclusion, condition, additional document, payment allowed.
- KHÔNG phá Motor flow và manual/referral flow.

## YÊU CẦU (2–8)

### 2. PA Product Journey
A. Insured Party: KHÔNG nhập tuổi thủ công. Tính tuổi bảo hiểm từ ngày sinh (DOB) + ngày hiệu lực → hiển thị read-only. Hỗ trợ buyerIsInsured true/false; nếu false hiển thị block người được BH riêng. Thu thập occupationCode + occupationClass. Hiển thị eligibility theo occupation class.
B. Package: mỗi gói hiển thị Accidental death sum insured, Permanent disability benefit, Medical expense limit, Daily hospital allowance, Coverage term, Key exclusions, Premium. Thêm action "So sánh các gói" + "Xem quyền lợi chi tiết".
C. Risk declaration: giữ 3 câu hỏi hiện có + dynamic branch. VD dangerousActivity=YES → activityType → frequency → professionalOrRecreational → referral/loading result. occupationClass bị loại trừ → BLOCKED hoặc REFERRED.
D. Review trước submit: Policyholder, Insured, Package & benefits, Effective date, Coverage term, Premium, Risk answers, Key exclusions, Advice record, Consent, Truth declaration, Customer confirmation/OTP nếu cấu hình yêu cầu.
E. Documents khi Bank KYC accepted: KHÔNG bắt upload CCCD; hiển thị "Đã xác minh từ Janus Bank"; hiển thị "Không yêu cầu tài liệu bổ sung" khi STP.

### 3. Policy & Certificate theo product
Tạo renderer RIÊNG theo productType. KHÔNG tái dùng Motor template cho PA.
PA Policy Detail TUYỆT ĐỐI KHÔNG hiển thị: Vehicle, License plate, Chassis/engine, TNDS mandatory, IDV, Garage, NCD, Vehicle value, Motor deductible, Motor physical damage. Không hiện chữ "Chủ xe", "Xe", "Biển số", "TNDS", "Vật chất xe".
PA Policy Detail PHẢI hiển thị:
- Header: Policy number, Certificate number, Status, Effective date, Expiry date, Remaining term, Annual premium.
- Parties: Policyholder, Insured person, Relationship, Beneficiary (nếu có), DOB, Identity number, Occupation class, Contact.
- Coverage: Package, Accidental death, Permanent total disability, Permanent partial disability, Medical expenses, Daily hospital allowance, Sum insured per benefit, Territorial scope, Exclusions, Special conditions.
- Payment: Premium, Payment date, Actual payment method, Transaction reference.
- Documents: Certificate PDF, Policy wording, Application, Invoice (nếu có).
Sửa certificate preview tương ứng PA.

### 4. Payment Method UX
Tách rõ 3 khái niệm:
- paymentExperience: CUSTOMER_PRESENT_QR | CUSTOMER_REMOTE | SELLER_DEVICE_ASSISTED
- paymentInstrument: QR | CARD | BANK_ACCOUNT | BANK_TRANSFER
- deliveryChannel: SMS | EMAIL | COPY_LINK | NONE
Bước 1: 3 card ngang hàng: (1) Quét QR tại quầy (2) Nhận yêu cầu thanh toán từ xa (3) Thanh toán trên thiết bị này. Mỗi card: Icon, Title, Description, Best-use-case, CTA "Tiếp tục", Recommended badge nếu phù hợp. KHÔNG đặt SMS/Email/Copy link ngang cấp 3 experience.
Bước 2:
- A. CUSTOMER_PRESENT_QR: Generate QR, Amount, Reference, Expiry, Realtime status.
- B. CUSTOMER_REMOTE: chọn SMS/Email/Copy link, Recipient, editable theo permission, Consent, Link expiry, Message preview, CTA "Tạo và gửi yêu cầu thanh toán".
- C. SELLER_DEVICE_ASSISTED: Payer identity, Payer relationship, Payment instrument, khách nhập dữ liệu nhạy cảm, khách xác nhận OTP, seller KHÔNG được mark payment success.
KHÔNG tạo payment intent khi mới mở modal. Chỉ tạo sau khi seller xác nhận bước 2.

### 5. Payment Summary
- Trước selection: Cách thanh toán: Chưa chọn / Payment ID: Không có / Status: METHOD_REQUIRED.
- Sau gửi link: Experience: Khách thanh toán từ xa / Delivery channel: SMS/Email / Status: PENDING / Expiry hiển thị ĐỒNG NHẤT ở summary & detail.
- Sau success: Actual payment instrument, Paid amount, Paid at, Gateway reference.
- KHÔNG hiện "QR · Thẻ · Chuyển khoản" như thể tất cả đã chọn.
- Phân biệt rõ: paymentId, merchantReference, gatewayTransactionId.

### 6. Success feedback
KHÔNG dùng window.alert(). Thay bằng: Toast "Đã nhận thanh toán"; inline progress "Đang phát hành hợp đồng"; success state "Hợp đồng đã phát hành"; auto navigate hoặc CTA tới Policy tab. Các nút mô phỏng callback đưa vào khu "Demo tools — không thuộc production UI".

### 7. Policy Detail Routing
Mọi entry point mở CÙNG route: `/modules/policies/index.html?view=detail&id={policyId}`. Cho phép mở từ: policy number trong list, click toàn bộ row, nút Xem chi tiết, Submitted Case Workspace, Notification, Dashboard. Dùng event delegation cho row render động. Sau policy issue: persist policy vào shared policy store, refresh policy list, store ĐÚNG policyId (không dùng applicationId thay policyId). Nếu thiếu policy: hiển thị not-found state + nút quay lại danh sách.

### 8. Dữ liệu thời hạn
KHÔNG hard-code "367 ngày". Tính remainingDays từ effectiveDate, expiryDate, currentDate. Hiển thị: Thời hạn 12 tháng, Ngày hiệu lực, Ngày hết hiệu lực. Thống nhất inclusive/exclusive.

## ACCEPTANCE CRITERIA (phải đạt hết)
AC01 PA policy detail không chứa field Motor. AC02 PA certificate đúng insured person + PA benefits. AC03 tuổi tính từ DOB, không nhập tay. AC04 payment 2 bước experience→config. AC05 SMS/Email/Copy chỉ hiện sau khi chọn remote. AC06 không tạo intent trước xác nhận. AC07 summary phản ánh lựa chọn thực. AC08 không browser alert cho success. AC09 policy mới mở được từ danh sách Hợp đồng. AC10 số HĐ/row/nút Xem chi tiết đều click được. AC11 route dùng policyId, sống qua refresh. AC12 thời hạn tính đúng, không hiện 367 ngày sai.

## KỊCH BẢN RETEST (implement để chạy được thông)
Bank customer → PA → PA Standard → risk declaration → STP approved → payment method required → gửi SMS → payment pending → callback success → policy issued → mở từ Submitted Workspace → quay lại danh sách Hợp đồng → click row vừa phát hành → mở đúng PA Policy Detail → refresh trang detail vẫn giữ dữ liệu.

## RÀNG BUỘC KỸ THUẬT
- Vanilla JS/HTML/CSS, giữ style/token hiện có (`var(--brand-600)` v.v.), tiếng Việt cho UI end-user.
- KHÔNG dùng framework mới. Giữ pattern render string + innerHTML hiện tại.
- Ưu tiên tách hàm render theo productType: vd `BANCA.renderPolicyDetail(pol)` chọn `paPolicyDetail(pol)` vs `motorPolicyDetail(pol)`.
- Persist bằng localStorage overlay như code hiện tại.
- Sau khi xong, ghi tóm tắt vào `PA-OVERHAUL-REPORT.md`: danh sách file đã sửa + root cause từng nhóm lỗi + ghi chú remaining issues. KHÔNG kết luận PASS nếu Policy Detail còn field Motor hoặc HĐ mới không mở được từ danh sách.
- KHÔNG chạy server hay browser test — chỉ sửa code + self-review. Việc retest browser + screenshot do orchestrator làm.

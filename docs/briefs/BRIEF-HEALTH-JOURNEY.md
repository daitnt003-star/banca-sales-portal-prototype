# BRIEF — Build Health journey (Bảo hiểm sức khỏe) — Banca Sales Portal

Bạn là Senior BA + Product Engineer + UI/UX bảo hiểm. Sản phẩm **Health (Bảo hiểm sức khỏe)** hiện KHÔNG có journey riêng → `BANCA.journeyFor('health')` fallback về `motor` → bước "Đối tượng bảo hiểm" render template XE. Hãy xây journey Health hoàn chỉnh, KHÔNG dùng field xe.

## MẪU THAM CHIẾU: journey PA (đã hoạt động tốt)
Học theo cách PA được làm — Health tương tự PA (đối tượng = người được bảo hiểm, không phải xe), nhưng có đặc thù sức khỏe. Đọc các chỗ PA để mô phỏng:
- `shared/mock/seed/journey-registry.js`: `ProductJourneyDefinitions.pa` (stages, riskObjectType:'INSURED_PERSON', schema ids, reviewSections, certificateTemplate). journeyFor fallback ở ~L170.
- `modules/application-workspace/app-workspace.js`: nhánh render PA — insured party (`paInsuredPerson`/`paSetField`/tính tuổi từ DOB, buyerIsInsured, occupation), package (`paPackage` dùng `BANCA.paPackages`), declaration (`paDeclaration`), review (`paReview`).
- `shared/mock/seed/`: `paPackages`, `paOccupationClasses`, `product-schemas.js` (paQuickRating/paFullRisk/paDeclaration/paPackages schema), `policies.js` (PA policy `JB-PA-2026-1201` có renderer PA riêng trong `modules/policies/index.html`).
- `shared/js/head-loader.js`: cache-bust `const V='v=20260723s'` → BUMP lên t khi xong.

## YÊU CẦU HEALTH JOURNEY

### 1. journey-registry.js — thêm `ProductJourneyDefinitions.health`
- productId 'health', riskObjectType **'INSURED_PERSON'** (KHÔNG 'VEHICLE').
- stages: CUSTOMER_INFO → INSURED_PARTY (label 'Người được bảo hiểm', component 'healthInsuredPerson') → PACKAGE_AND_QUOTE (label 'Gói & phí', component 'healthPackage') → RISK_DECLARATION (component 'healthDeclaration') → DOCUMENTS (component 'healthDocuments') → REVIEW_AND_SUBMIT (label 'Review') → UNDERWRITING → PAYMENT → ISSUANCE.
- schema ids trỏ tới health schema (tạo ở product-schemas). reviewSections: ['customer','insuredPerson','package','riskDeclaration','quote']. certificateTemplate 'healthCertificate@1'. supportedEntryModes gồm BANK_CUSTOMER, PRODUCT_FIRST, NEW_PROSPECT, REFERRAL, QUICK_ADVICE_CONVERSION, RENEWAL. underwritingMode phù hợp (Health thường có thẩm định — có thể MANUAL hoặc STP tùy gói; chọn hợp lý, giữ tab thẩm định STP dùng chung).

### 2. app-workspace.js — render Health (KHÔNG field xe)
- **Insured Party (healthInsuredPerson)**: KHÔNG nhập tuổi tay — tính tuổi bảo hiểm từ DOB + ngày hiệu lực (read-only, như PA). Hỗ trợ buyerIsInsured true/false; nếu false hiển thị người được BH riêng. Health có thể có **nhiều người được bảo hiểm** (gia đình): cho phép thêm thành viên (tên, DOB, quan hệ) — tối thiểu hỗ trợ 1 người + khả năng thêm thành viên (có thể làm gọn nếu phức tạp, nhưng KHÔNG dùng field xe).
- **Package (healthPackage)**: mỗi gói hiển thị quyền lợi Health: Quyền lợi nội trú, Quyền lợi ngoại trú, Nha khoa, Thai sản (nếu có), Giới hạn/năm, Đồng chi trả, Thời hạn, Loại trừ chính, Phí. Action So sánh gói + Xem quyền lợi chi tiết.
- **Risk declaration (healthDeclaration)**: câu hỏi sức khỏe (bệnh có sẵn, tiền sử điều trị, hút thuốc...) + dynamic branch (VD có bệnh nền → chi tiết → referral/loading). Bệnh nghiêm trọng → BLOCKED/REFERRED.
- **Documents (healthDocuments)**: Bank KYC accepted → không bắt CCCD; STP → "Không yêu cầu tài liệu bổ sung"; nếu cần: hồ sơ y tế theo điều kiện.
- **Review**: đầy đủ policyholder/insured/package&benefits/effective/term/premium/risk answers/exclusions/consent/truth declaration.

### 3. Seed + schema
- `shared/mock/seed/`: tạo `BANCA.healthPackages` (vài gói: Cơ bản/Tiêu chuẩn/Nâng cao với benefit nội trú/ngoại trú/nha khoa/giới hạn/đồng chi trả/phí). product-schemas: healthQuickRating/healthFullRisk/healthDeclaration/healthPackages/healthDocuments. Rating strategy hợp lý (theo tuổi × gói).
- Thêm ít nhất 1 **health policy** vào `policies.js` (productType:'health') + 1 app health (để test policy detail).

### 4. Policy Detail + Certificate cho Health (modules/policies/index.html)
- Renderer Health riêng (như PA), KHÔNG field Motor (không Xe/Biển số/TNDS/IDV/khấu trừ). Hiển thị: header (số HĐ/GCN/hiệu lực/hết hạn/còn lại tính động/phí năm), Người được bảo hiểm (danh sách thành viên nếu có), Quyền lợi sức khỏe (nội trú/ngoại trú/nha khoa/giới hạn/đồng chi trả/lãnh thổ/loại trừ), Thanh toán, Tài liệu (dùng document center đã có). Certificate preview Health.
- Dùng chung document center + doc-mgmt vừa build (thêm `documents` cho health policy trong seed).

## RÀNG BUỘC KỸ THUẬT (BẮT BUỘC — bài học 2 lần trước)
- CHỈ đổi chuỗi hiển thị; KHÔNG thay token tiếng Anh trong code (biến/tham số/object key/query param/class CSS/enum). 
- `shell()` set body qua innerHTML → nếu cần JS tương tác, KHÔNG dựa vào `<script>` nhúng tự chạy (đã có patch re-exec ở app-shell nhưng ưu tiên inline onclick / hàm global như PA).
- Sau khi sửa PHẢI: `node --check` mọi .js; parse mọi inline `<script>` bằng `new Function()`; `node scripts/validate-terminology.js` PASS. Sửa tới khi sạch.
- **Guard vehicle**: mọi chỗ render giả định `.vehicle.*` phải guard (Health/PA không có vehicle) — tránh crash trắng trang như bug trang chủ vừa rồi.
- Vanilla JS/HTML/CSS, tiếng Việt UI, giữ token style. BUMP head-loader V lên t.
- Ghi `docs/reports/HEALTH-JOURNEY-REPORT.md`: file đã sửa + journey/schema/packages + policy seed + root cause + remaining issues.
- Không chạy server/browser (orchestrator retest). Khi xong chạy: openclaw system event --text "Codex done: health journey" --mode now

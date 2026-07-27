# PA Overhaul Report

## Files changed
- `modules/application-workspace/app-workspace.js`
- `modules/policies/index.html`
- `shared/mock/seed/product-schemas.js`
- `shared/mock/seed/journey-registry.js`
- `shared/mock/seed/policies.js`

## Root cause
- PA journey dùng chung nhiều giả định Motor: tuổi nhập tay, package card thiếu benefit PA, documents vẫn đi qua checklist xe/CCCD, certificate preview mặc định Motor.
- Policy Detail chỉ có một renderer Motor nên PA bị leak field xe, TNDS, IDV, khấu trừ, garage/NCD và wording Motor.
- Payment UX trộn `experience`, `instrument`, `delivery`; SMS/Email/Copy link bị đặt ngang cấp với QR/card; intent được tạo ngay khi chọn option thay vì sau bước cấu hình.
- Payment summary dùng copy tổng quát "QR · Thẻ · Chuyển khoản" thay vì trạng thái/lựa chọn thực, và chưa phân biệt rõ `paymentId`, `merchantReference`, `gatewayTransactionId`.
- Callback success dùng `window.alert()` và policy issue persist thiếu data model PA, có nguy cơ route bằng application context thay vì policy master.
- Remaining term dùng ngày cố định trong màn policy, làm số ngày còn lại lệch khi thời gian demo thay đổi.

## Implemented
- PA insured party tính tuổi bảo hiểm từ DOB + ngày hiệu lực dự kiến, read-only; hỗ trợ buyer/insured khác nhau, relationship, occupation code/class và eligibility theo nhóm nghề.
- PA package card hiển thị benefit limit, term, exclusions, premium; thêm modal so sánh gói và quyền lợi chi tiết.
- PA risk declaration giữ 3 câu hỏi và thêm branch hoạt động nguy hiểm: activity type, frequency, professional/recreational; underwriting router chuyển referral/block theo occupation/risk.
- PA documents hiển thị KYC Janus Bank accepted và không yêu cầu CCCD khi bank KYC đã có; STP hiển thị không yêu cầu tài liệu bổ sung.
- Certificate preview trong workspace dispatch PA vs Motor.
- Policy Detail có renderer PA riêng, không đi qua Motor template; list policy dùng event delegation và route `?view=detail&id={policyId}`.
- Payment modal thành wizard 2 bước: experience -> config; intent chỉ tạo ở bước 2. Summary hiển thị actual experience/instrument/delivery/expiry/reference.
- Payment success không dùng alert trong callback mới; persist policy PA đầy đủ vào shared policy store với đúng `policyId`.
- Remaining days trong policy list/detail tính từ ngày runtime hiện tại đến expiry date.

## Verification
- Ran `node --check` on changed JS seed/workspace files.
- Parsed `modules/policies/index.html` inline script with `new Function(...)`.
- Did not run server or browser test per instruction.

## Remaining issues
- Legacy Motor/demo helper functions still contain some `alert()` calls for non-PA or old demo actions. The new PA payment callback path no longer uses alert for success.
- Submitted Case Workspace quote/overview tabs still include some Motor-oriented labels when viewing non-Motor submitted cases outside the PA-specific journey steps; primary PA retest path uses the updated PA edit, payment, policy issue, certificate, and policy detail surfaces.

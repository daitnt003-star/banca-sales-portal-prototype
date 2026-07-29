# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Giảm nhầm lẫn trong Tư vấn nhanh bằng cách tách tuần tự lựa chọn sản phẩm, lựa chọn gói và so sánh gói; khi chuyển sang tạo bản chào trong kênh Banca tích hợp, sử dụng đối tượng khách hàng đã có trong phiên thay vì yêu cầu chọn lại.

## Actor and permissions

- Actor chính: RM/tư vấn viên đang có quyền sử dụng Tư vấn nhanh và được phép bán sản phẩm.
- `BANCA_INTEGRATED`: phiên được mở từ khách hàng đã chọn trên hệ thống ngân hàng; không được hiển thị danh sách hoặc chức năng đổi khách hàng trong happy path.
- `BANCA_STANDALONE` và `AGENT_BROKER`: chỉ yêu cầu gắn/chọn khách hàng khi phiên chưa có customer context hợp lệ.
- Hiển thị PII tiếp tục phụ thuộc `CustomerDataAccessStage` và consent; `externalCustomerRef` không đồng nghĩa với quyền xem toàn bộ PII.
- Sản phẩm/gói không đủ điều kiện bán chỉ được xem lý do hoặc chuyển đúng người có quyền, không được chọn để tạo bản chào.

## Source-of-truth references

- Yêu cầu người dùng ngày 2026-07-28: danh sách sản phẩm theo nhu cầu → chọn sản phẩm → gói đề nghị → so sánh.
- Yêu cầu người dùng ngày 2026-07-28: tạo bản chào từ Tư vấn nhanh sử dụng đối tượng đã chọn trên hệ thống ngân hàng; bỏ bước chọn khách hàng chỉ cho channel banca.
- `docs/rework-v2/D-source-of-truth-index.md`, mục 6 Phase 2 và Phase 3.
- `docs/rework-v2/A-impact-analysis.md`, mục 1, các dòng §4.1, §4.2, §5/§18 và §6.
- `.ai/governance/uiux-safety-contract.md`.
- `docs/advice-product-package-banca-conversion/srs/advice-product-package-banca-conversion-userflow.md`.

## Scope in

- Cấu trúc lại khu vực đề nghị trong `advisory-workspace` thành hai tầng tuần tự: sản phẩm và gói.
- Chỉ bật so sánh sau khi người dùng đã chọn một sản phẩm và chọn ít nhất hai gói của sản phẩm đó vào danh sách so sánh.
- Duy trì `selectedProductId` độc lập với `selectedOffer`; chỉ tạo `selectedOffer` khi người dùng chọn gói cuối cùng.
- Khi đổi sản phẩm, xóa lựa chọn gói, `selectedOffer`, phương án cũ và compare set không còn hợp lệ.
- `BANCA_INTEGRATED` chuyển thẳng đến bước xác nhận bàn giao bằng customer context hiện có, không mở modal chọn khách hàng.
- Kênh khác giữ nhánh gắn khách hàng khi thiếu context.
- Thêm regression test cho phân cấp lựa chọn, reset state, channel isolation và bảo toàn customer context.

## Scope out

- Không thay đổi underwriting, khai báo rủi ro, pricing chính thức, payment hoặc phát hành hợp đồng.
- Không thay đổi consent policy hoặc mở rộng quyền xem PII.
- Không cho phép đổi khách hàng trong hành trình chuyển đổi Banca tích hợp.
- Không so sánh chéo gói thuộc nhiều sản phẩm.
- Không sửa toàn bộ vi phạm design token lịch sử; chỉ không được làm tăng baseline liên quan.
- Không xử lý lại feature continuity đang ở trạng thái blocked.

## Business rules and state transitions

1. `RECOMMENDED_NO_PRODUCT`: có kết quả tư vấn nhưng chưa chọn sản phẩm; hiển thị danh sách sản phẩm duy nhất theo nhu cầu.
2. `PRODUCT_SELECTED`: có `selectedProductId`, chưa có `selectedPackageId`/`selectedOffer`; hiển thị các gói đề nghị của đúng sản phẩm.
3. `PACKAGES_MARKED_FOR_COMPARE`: compare set chỉ nhận khóa gói thuộc `selectedProductId`; CTA mở so sánh khả dụng khi có từ hai gói.
4. `PACKAGE_SELECTED`: chọn một gói tạo `selectedOffer = product + package + recommendationVersion`; cho phép sang kết quả/chuyển bán.
5. Đổi sản phẩm: đặt lại package, selected offer, selected plan và compare set trước khi render gói mới.
6. Không tự động chọn sản phẩm hoặc gói. Không dùng package có fit cao nhất để ngầm tạo `selectedOffer`.
7. Tầng sản phẩm thể hiện nhu cầu đáp ứng và lý do đề nghị; phần trăm Fit chỉ xuất hiện ở tầng gói để tránh độ chính xác giả.
8. Kênh `BANCA_INTEGRATED` có customer context: `Tạo bản chào` → xác nhận tóm tắt → tạo handoff.
9. Kênh `BANCA_INTEGRATED` thiếu `externalCustomerRef/customerRef`: chặn chuyển đổi, thông báo phiên không đủ ngữ cảnh và hướng dẫn quay lại hệ thống ngân hàng; không fallback sang danh sách khách hàng.
10. Kênh khác thiếu customer context: mở nhánh gắn khách hàng hiện hành.
11. Reload phải khôi phục state hợp lệ; dữ liệu legacy có `selectedOffer` nhưng thiếu `selectedProductId` được suy ra từ offer mà không làm thay đổi lựa chọn của người dùng.

## Data contract

- Dùng các field hiện hành: `selectedProductId`, `selectedPackageId`, `selectedOffer`, `compareSet`, `recommendationVersion`, `customerRef`, `customerName`, `mode`.
- Customer context chuẩn lấy từ `SalesEntryContext`/advice session; channel lấy qua `BANCA.channelProfile()`.
- Compare key tiếp tục là `productRef:packageRef`, nhưng phải lọc theo `selectedProductId`.
- Không thêm PII vào localStorage ngoài dữ liệu hiện hành; render tên/CIF phải qua data-access stage hiện hành.

## UI/UX specification

- Primary device: desktop 1024px+, responsive về tablet.
- Một vùng đề nghị chính, progressive disclosure:
  1. “Sản phẩm phù hợp với nhu cầu”;
  2. sau khi chọn: “Gói đề nghị của [sản phẩm]”;
  3. drawer so sánh chỉ cho các gói đã đánh dấu trong cùng sản phẩm.
- Tầng sản phẩm không lặp Basic/Standard và không có CTA so sánh.
- CTA chính theo trạng thái: `Chọn sản phẩm` → `Chọn gói` → `Tạo bản chào từ tư vấn này`.
- Có trạng thái loading, empty, unavailable/permission, selection, disabled compare, lỗi context Banca và recovery.
- Lỗi tải sản phẩm/gói giữ người dùng tại tầng hiện hành và cung cấp thao tác thử lại hoặc quay lại nhu cầu/sản phẩm.
- Bỏ gói khỏi compare làm danh sách còn dưới hai gói phải đóng/không cho mở drawer và đưa người dùng về danh sách gói.
- Tạo bản chào có trạng thái submitting để chống gửi lặp, success đi theo workspace hiện hành, failure giữ nguyên advice/selection và cho thử lại.
- Channel ngoài Banca: gắn khách hàng thành công quay lại xác nhận; hủy quay lại kết quả tư vấn; lỗi/không tìm thấy/không đủ quyền giữ tại màn gắn khách hàng với lý do và recovery.
- Tái dùng card, badge, button, drawer, modal, toast, focus ring và token hiện hành.
- Baseline design-token toàn dự án ngày 2026-07-28: 1.153 lỗi, 685 cảnh báo; `modules/advisory-workspace/index.html`: 125 vi phạm. Thay đổi không được tăng số liên quan.

## Files allowed

- `modules/advisory-workspace/index.html`
- `shared/mock/seed/advice-sessions.js` chỉ khi cần normalization/config dùng chung có bằng chứng.
- `scripts/test-advice-product-package-hierarchy.js`
- Tài liệu user-flow và báo cáo/handoff/QC thuộc feature này.

## Files prohibited

- `modules/application-workspace/**`
- `shared/components/sales-context-offer.js`
- Các module underwriting, payment, policy và team.
- Các handoff đang blocked hoặc thay đổi không liên quan trong working tree.

## Components and tokens to reuse

- `BANCA.channelProfile()`, `BANCA.channelShowsCustomerList()`.
- Customer data access/customer context component hiện hành.
- Card, button, badge, drawer, modal và toast hiện có trong advisory workspace/shared styles.
- Token từ `shared/styles/tokens.css`; không thêm giá trị thị giác tùy ý.

## Acceptance criteria

1. Màn đề nghị ban đầu chỉ hiển thị sản phẩm duy nhất theo nhu cầu, không hiển thị đồng thời các gói.
2. Chọn sản phẩm mới hiển thị gói của đúng sản phẩm; không tự chọn gói.
3. So sánh bị vô hiệu khi dưới hai gói và chỉ chứa gói thuộc sản phẩm đang chọn.
4. Đổi sản phẩm xóa toàn bộ package/offer/compare state cũ.
5. Chọn gói tạo đúng một canonical `selectedOffer` và không làm vỡ bước kết quả.
6. `BANCA_INTEGRATED` có context không hiển thị UI chọn/đổi khách hàng trong chuyển đổi.
7. `BANCA_INTEGRATED` thiếu context bị chặn có lý do và recovery; không mở customer list.
8. Channel khác thiếu context vẫn dùng nhánh gắn khách hàng hiện hành.
9. Tên/CIF không hiển thị khi data-access stage chưa cho phép.
10. Reload và dữ liệu advice legacy vẫn phục hồi đúng.
11. Keyboard, focus, responsive desktop/tablet và empty/error/disabled states đạt UI/UX guard.
12. Không tăng vi phạm design token liên quan và không phát sinh regression trong test advice outcome.
13. Loading/empty/load-error/permission của tầng sản phẩm và gói đều có trạng thái cùng recovery quan sát được.
14. Tạo handoff chống double-submit; thành công đi tiếp theo route hiện hành, thất bại không làm mất lựa chọn và có thể thử lại.
15. Channel ngoài Banca có đủ nhánh attach success/cancel/error/no-permission.

## Validation commands

- `node scripts/test-advice-product-package-hierarchy.js`
- `node scripts/test-advice-outcome.js`
- `node scripts/validate-design-tokens.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- Browser smoke: Banca có context, Banca thiếu context, Standalone thiếu context, chọn/đổi sản phẩm, chọn/so sánh gói, reload.

## Assumptions and open questions

- Giả định đã được nguồn hiện hành hỗ trợ: primary device là enterprise desktop; tablet là breakpoint bắt buộc kiểm tra.
- Giả định “channel banca” trong yêu cầu là `BANCA_INTEGRATED`; `BANCA_STANDALONE` không được bỏ bước gắn khách hàng khi thiếu context.
- Open Question không chặn prototype: đích chính xác sau khi tạo handoff thành công sẽ dùng route hiện hành được xác minh khi triển khai; không tạo page mới.
- Open Question không chặn prototype: dữ liệu legacy stale không còn trong catalog phải bị loại khỏi lựa chọn; recovery cụ thể sẽ dùng empty/error pattern hiện hành sau khi kiểm tra runtime, không tự ánh xạ sang sản phẩm/gói khác.
- User-flow đã được user chốt và qua UX review; handoff sẵn sàng triển khai.

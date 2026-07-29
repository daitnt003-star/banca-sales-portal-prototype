# Feature handoff

Status: READY_FOR_IMPLEMENTATION
Owner: Codex
Implementer: Claude
Priority: P0
Attempt: 3 — new hypothesis

## Goal and actor

Đóng recurring blocker còn lại của `CORRECTIVE-BANCA-MEETING-ALIGNMENT-HYBRID-UW-02`
cho Retail RM/Telesales trên Trang chủ: dùng object nghiệp vụ trung tâm **Bản chào**
thay cho object cũ “yêu cầu”, đồng thời bổ sung deterministic DOM coverage để lỗi
không tái diễn.

Hypothesis mới: attempt 2 chỉ sửa privacy/Quote Workspace và validator tĩnh chưa bao
phủ copy được tạo trong template literal của Home. Corrective này mở rộng có kiểm
soát đúng một màn Home và kiểm tra DOM render, không lặp lại hypothesis cũ.

## Scope in

- `modules/seller-workspace/index.html`
  - Đổi mọi copy Home đang dùng “yêu cầu” như object chính sang “Bản chào”.
  - Được giữ “chưa nộp/đã nộp” khi nó chỉ mô tả lifecycle/filter, nhưng không ghép
    thành object “yêu cầu chưa nộp/đã nộp”.
  - Các copy bắt buộc xử lý gồm subtitle đầu trang, action kind/chips, header/cột
    bảng, overflow link, section gần đây, section theo dõi xử lý và empty state.
  - CTA nghiệp vụ như “Bổ sung”, “Tính phí lại”, “Kiểm tra & nộp” được giữ nếu đúng
    action hiện tại.
  - Giữ nguyên privacy guard: Banca anonymous không lộ PII; Agent/Broker vẫn thấy
    customer context.
- `scripts/test-privacy-home.js`
  - Bổ sung DOM assertions cho terminology Home ở cả profile Banca và Agent/Broker.
  - Test phải fail với ba copy có bằng chứng cũ:
    `yêu cầu chưa nộp`, `yêu cầu cần bổ sung`, `yêu cầu có thể nộp`.
  - Test phải xác nhận object “Bản chào” xuất hiện trong Home.
- `scripts/validate-terminology.js`
  - Chỉ được bổ sung rule nếu rule chính xác, không false-positive với tài liệu lịch
    sử hoặc câu mô tả action không dùng “yêu cầu” làm object.
- Refactor đúng các template string do attempt 2 tạo ra nếu cần để cảnh báo
  `BULKY_INLINE_STYLE` không tăng so với baseline trước attempt 2 là 687.

## Scope out

- Không đổi business state, permission, navigation, route, data contract hoặc CTA
  behavior.
- Không cleanup terminology toàn portal.
- Không sửa active product docs để hợp thức hóa runtime.
- Không xử lý backlog Phase 4–8 hoặc P0/P1/P2 trong UX review.
- Không thay design language, layout, responsive breakpoint hoặc shared component.

## Source of truth

1. `docs/rework-v2/D-source-of-truth-index.md` §2: một object “Bản chào” +
   “Hợp đồng”; chưa/đã nộp chỉ là filter theo nhóm status.
2. `.ai/handoffs/completed/QC-CORRECTIVE-BANCA-MEETING-ALIGNMENT-HYBRID-UW-02.md`
   mục `NON-LIFE-TERMINOLOGY`.
3. `.ai/governance/uiux-safety-contract.md`.

Các brief terminology cũ dùng “Yêu cầu bảo hiểm” đã bị nguồn rework-v2 mới hơn
supersede và không được dùng để đảo quyết định này.

## Rules, permissions, states and recovery

- Copy đổi nhãn, không đổi state hoặc transition.
- `BANCA_INTEGRATED` trước consent vẫn fail-closed cho PII/customer browse.
- `AGENT_BROKER` vẫn giữ customer context.
- Empty state và link phục hồi vẫn đưa user đến luồng Bản chào hiện có.

## Data/config ownership

Không đổi data/config. Chỉ render copy từ dữ liệu hiện có.

## File allowlist

- `modules/seller-workspace/index.html`
- `scripts/test-privacy-home.js`
- `scripts/validate-terminology.js`
- `.ai/handoffs/in-progress/CORRECTIVE-HOME-QUOTE-TERMINOLOGY-03.md`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-HOME-QUOTE-TERMINOLOGY-03.md`

Mọi file khác bị cấm.

## Acceptance criteria and evidence

1. DOM Home không chứa `yêu cầu chưa nộp`, `yêu cầu cần bổ sung`,
   `yêu cầu có thể nộp`, `Mã yêu cầu`, hoặc section dùng “Yêu cầu bảo hiểm” làm
   object chính.
2. DOM Home dùng “Bản chào” cho subtitle, queue, bảng gần đây và theo dõi xử lý.
3. Banca anonymous privacy test vẫn PASS; Agent/Broker regression vẫn PASS.
4. `validate-terminology.js` PASS và deterministic Home test bắt được copy legacy.
5. Design-token errors không tăng trên baseline 1.157; warnings phải <= 687 để xử lý
   hai warning `BULKY_INLINE_STYLE` được attempt 2 đưa vào.
6. Không có thay đổi ngoài allowlist.

## Validation commands

```text
node scripts/test-privacy-home.js
node scripts/validate-terminology.js
node scripts/validate-design-tokens.js
node scripts/validate-manifest.js
node scripts/validate-modules.js
node scripts/detect-duplicate-components.js
node scripts/test-foundation.js
```

## Assumptions and open questions

- Assumption: “nộp” vẫn hợp lệ như action/lifecycle; blocker là dùng “yêu cầu” làm
  object thay cho “Bản chào”.
- Không có open question có thể làm đổi behavior, permission, state hoặc UI flow.

---
name: banca-uiux-guard
description: Đánh giá và bảo vệ cấu trúc UI/UX hiện tại của Banca Sales Portal trước và sau thay đổi. Dùng cho màn hình mới, thay layout, component, navigation, form, bảng, modal, responsive, accessibility, UX copy hoặc khi validator design-token thay đổi.
---

# Banca UI/UX Guard

Read `.ai/governance/uiux-safety-contract.md` and the relevant UX specification.

## Before implementation

1. Identify the existing page and component pattern to reuse.
2. Capture relevant design-token validation counts.
3. Record desktop, tablet, keyboard, loading, empty, error, permission, and recovery expectations.
4. Reject arbitrary visual values and duplicated shared components.

## After implementation

1. Compare the implementation to the approved flow and page anatomy.
2. Verify action hierarchy, Vietnamese copy, labels, status communication, and realistic data.
3. Verify focus, landmarks, keyboard operation, contrast, reduced motion, and responsive layout.
4. Run `node scripts/validate-design-tokens.js`.
5. Fail when the change introduces a new token violation or increases a relevant violation count.

Classify findings as `BLOCKER`, `MAJOR`, or `MINOR`, and cite the affected file and evidence. Do not redesign unrelated screens during a guard review.

# ChatGPT Onboarding Message

Copy this message and send to ChatGPT:

---

## Project Context

Tôi có một dự án **Banca Sales Portal** (prototype cho hệ thống bán bảo hiểm qua kênh Bancassurance).

**GitHub Repo:** https://github.com/daitnt003-star/banca-sales-portal-prototype

**Branch:** main

---

## Yêu cầu

Trước khi trả lời bất kỳ câu hỏi nào, bạn PHẢI:

1. **Clone repo** và đọc file **`ESSENTIAL-READING.md`** ở root của project
2. File này sẽ hướng dẫn bạn đọc các file nào theo thứ tự nào để hiểu:
   - Context & philosophy của workspace
   - Product overview & business logic
   - Latest architecture decisions (rework-v2)
   - UI/UX rules & design system
   - Recent changes & superseded decisions

---

## Quick Start (Nếu chỉ có 5 phút)

Đọc 5 file này trong project root và `sprint1/`:

1. **`MEMORY.md`** (workspace root) — Lessons learned & work philosophy
2. **`projects/banca-sales-portal/PROJECT_OVERVIEW.md`** — Product spec v1
3. **`sprint1/docs/rework-v2/D-source-of-truth-index.md`** — Latest decisions & superseded items
4. **`sprint1/docs/module-map.md`** — Module structure
5. **`sprint1/shared/css/tokens.css`** — Design system (xem qua `sprint1/dev/design-reference.html`)

---

## Critical Rules

- **Requirements → Design → Code** (NEVER skip steps)
- **Design tokens ONLY** (no hardcoded CSS values)
- **Validate before commit** (`scripts/validate-design-tokens.js --strict`)
- **User approval required** (via banca-orchestrator CONFIRM GATE)
- **QC always runs** (before reporting completion)

---

## Sau khi đọc xong

Hãy confirm với tôi:
1. Bạn đã đọc những file nào?
2. Bạn hiểu project này làm gì?
3. Bạn có câu hỏi gì về context/architecture/rules không?

Sau đó tôi sẽ giao việc cụ thể.

---

**Last updated:** 2026-07-29

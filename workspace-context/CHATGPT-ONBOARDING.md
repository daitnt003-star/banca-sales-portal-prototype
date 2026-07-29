# ChatGPT Onboarding Message

Copy this message and send to ChatGPT:

---

## 📦 Project Context

Tôi có một dự án **Banca Sales Portal** (prototype cho hệ thống bán bảo hiểm qua kênh Bancassurance).

**GitHub Repository:** https://github.com/daitnt003-star/banca-sales-portal-prototype

**Branch:** `main`

---

## 📖 Yêu cầu

Trước khi trả lời bất kỳ câu hỏi nào, bạn PHẢI:

1. **Clone repository:**
   ```bash
   git clone https://github.com/daitnt003-star/banca-sales-portal-prototype.git
   cd banca-sales-portal-prototype
   ```

2. **Đọc file `ESSENTIAL-READING.md`** ở root của project
   - File này hướng dẫn bạn đọc các file nào theo thứ tự nào
   - Bao gồm: Context, Product, Architecture, UI/UX, Implementation

3. **Cấu trúc repository:**
   ```
   banca-sales-portal-prototype/  (root)
   ├── ESSENTIAL-READING.md       ← ĐỌC ĐẦU TIÊN
   ├── workspace-context/          ← Workspace philosophy & memory
   │   ├── MEMORY.md               ← Lessons learned
   │   ├── AGENTS.md               ← Agent identity
   │   ├── SOUL.md                 ← Core values
   │   ├── USER.md                 ← User preferences
   │   └── memory/                 ← Daily logs (2026-07-16 → 2026-07-29)
   ├── docs/                       ← Product & architecture docs
   │   ├── product-overview.md
   │   ├── module-map.md
   │   ├── status-model.md
   │   ├── rework-v2/              ← LATEST decisions
   │   │   ├── D-source-of-truth-index.md  ← Superseded items
   │   │   ├── A-impact-analysis.md
   │   │   ├── B-component-reuse-matrix.md
   │   │   └── C-state-transition-map.md
   │   └── standards/              ← UX copy rules
   ├── shared/                     ← Shared components & design system
   │   ├── css/tokens.css          ← Design tokens (MANDATORY)
   │   ├── components/
   │   └── js/
   ├── modules/                    ← Feature modules
   ├── scripts/                    ← Validation scripts
   ├── dev/design-reference.html   ← Token visualization
   └── .ai/                        ← AI operating system
   ```

---

## 🚀 Quick Start (Nếu chỉ có 5 phút)

Đọc 5 file này:

1. **`workspace-context/MEMORY.md`** ⭐ — Lessons learned & philosophy
2. **`../banca-sales-portal/PROJECT_OVERVIEW.md`** ⭐ — Product spec v1
3. **`docs/rework-v2/D-source-of-truth-index.md`** ⭐ — Latest decisions
4. **`docs/module-map.md`** — Module structure
5. **`shared/css/tokens.css`** — Design system

---

## 🎯 Deep Dive (Nếu có 30 phút)

Thêm 5 file này:

6. **`workspace-context/AGENTS.md`** + **`workspace-context/SOUL.md`** — Work philosophy
7. **`docs/persona-and-permission.md`** — Who uses the system
8. **`docs/rework-v2/C-state-transition-map.md`** — State model
9. **`docs/standards/UX-COPY-RULES.md`** — UX guidelines
10. **`workspace-context/memory/2026-07-27.md`** — Recent architectural decisions

---

## 🚨 Critical Rules (PHẢI NHỚ)

1. ✅ **Requirements → Design → Code** (NEVER skip steps)
2. ✅ **Design tokens ONLY** (no hardcoded CSS values)
3. ✅ **Validate before commit** (`scripts/validate-design-tokens.js --strict`)
4. ✅ **User approval required** (via banca-orchestrator CONFIRM GATE)
5. ✅ **QC always runs** (before reporting completion)
6. ✅ **Document decisions** (update MEMORY.md + daily memory/)

---

## ✅ Sau khi đọc xong

Hãy confirm với tôi:

1. ✓ Bạn đã clone repo và đọc những file nào?
2. ✓ Bạn hiểu project này làm gì? (Nêu tóm tắt 2-3 câu)
3. ✓ Bạn đã đọc ít nhất 5 file Quick Start chưa?
4. ✓ Bạn hiểu 5 critical rules chưa?
5. ✓ Có câu hỏi gì về context/architecture/rules không?

**Chỉ sau khi confirm đầy đủ, tôi mới giao việc cụ thể.**

---

**Repository:** https://github.com/daitnt003-star/banca-sales-portal-prototype  
**Branch:** main  
**Last updated:** 2026-07-29

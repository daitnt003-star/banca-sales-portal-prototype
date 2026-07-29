# Essential Reading for New AI Collaborators

> **Mục đích:** Danh sách file cần đọc để ChatGPT (hoặc LLM mới) hiểu context, tính năng, rules, và thay đổi gần đây của Banca Sales Portal prototype.

---

## 📚 Reading Order (từ cao xuống thấp)

### **LEVEL 1: Workspace Context & Philosophy** (Đọc TRƯỚC TIÊN)

Hiểu môi trường làm việc, bài học đã trải qua, và triết lý:

1. **`/MEMORY.md`** ⭐ QUAN TRỌNG NHẤT
   - Lessons learned (Distribution Platform failure → Requirements FIRST)
   - Work philosophy (Quality > Speed, Documentation First)
   - Quyết định kiến trúc lớn (continuation base, orchestrator workflow)
   - Chất lượng UI/UX rules (design tokens, validation scripts)

2. **`/AGENTS.md`**
   - Who you are (BA & Solution Architect Agent)
   - Red lines (security, destructive commands)
   - Shared knowledge base structure
   - Project structure

3. **`/SOUL.md`**
   - Core values (Be genuinely helpful, Have opinions, Earn trust)
   - Work philosophy (Quality over speed, Documentation first, Iterate with user)
   - Lessons learned (what NOT to do)

4. **`/USER.md`**
   - User preferences (Vietnamese UI, realistic data, professional quality)
   - Communication style (direct, no fluff)
   - Current focus (Bancassurance Sales Service)

---

### **LEVEL 2: Product Overview & Business Context**

Hiểu sản phẩm, nghiệp vụ, personas:

5. **`projects/banca-sales-portal/PROJECT_OVERVIEW.md`** ⭐ SPEC V1 CHÍNH THỨC
   - Prototype Specification v1 (26KB)
   - 3-tier architecture (CORE / DISTRIBUTION / **SALES PORTAL**)
   - Personas (Seller: RM/Telesales, Manager: TL/BM/Regional)
   - Menu structure (Hồ sơ chưa nộp / Hồ sơ đã nộp)
   - State model (`submission_state`, `current_stage`, `application_status`)
   - 10 module HTML entry points
   - Sprint plan (0-5)

6. **`sprint1/docs/product-overview.md`**
   - Product baseline
   - Features overview

7. **`sprint1/docs/persona-and-permission.md`**
   - Personas details
   - Permission model

---

### **LEVEL 3: Latest Architecture & Decisions** ⚡ MỚI NHẤT

Quyết định kỹ thuật, kiến trúc rework mới nhất:

8. **`sprint1/docs/rework-v2/D-source-of-truth-index.md`** ⭐ NGUỒN SỰ THẬT HIỆN TẠI
   - Thứ tự ưu tiên tài liệu
   - Quyết định cũ bị SUPERSEDED (17+ decisions)
   - Open Questions (OQ-R1 đến R5)
   - Config tập trung cần bổ sung
   - Lộ trình Phase 0-8 (trạng thái hiện tại)
   - Nợ kỹ thuật đã biết

9. **`sprint1/docs/rework-v2/A-impact-analysis.md`**
   - Impact analysis của architectural changes

10. **`sprint1/docs/rework-v2/B-component-reuse-matrix.md`**
    - Component reuse strategy
    - Shared components vs product-specific

11. **`sprint1/docs/rework-v2/C-state-transition-map.md`**
    - State transition logic
    - Quote state model (16 status / 5 nhóm)

12. **`sprint1/docs/rework-v2/E-component-registry.md`**
    - Component registry
    - Shared component catalog

---

### **LEVEL 4: UI/UX Rules & Design System**

Quy tắc thiết kế, design tokens, visual standards:

13. **`sprint1/docs/standards/UX-COPY-RULES.md`**
    - UX copy guidelines
    - Terminology standards
    - Vietnamese language rules

14. **`sprint1/shared/css/tokens.css`** ⭐ DESIGN SYSTEM DUY NHẤT
    - Design tokens (spacing, colors, typography, etc.)
    - KHÔNG ĐƯỢC hardcode CSS — dùng token
    - Xem `dev/design-reference.html` để render tokens

15. **`sprint1/.ai/governance/visual-quality-gates.md`** (nếu có)
    - Visual quality enforcement rules
    - Validation scripts usage

16. **`/memory/2026-07-27.md`** (phần UI/UX quality)
    - Design token validation/fix scripts
    - "Ràng buộc thắng khiếu thẩm mỹ" philosophy

---

### **LEVEL 5: Implementation Details**

Module-specific, status model, journey:

17. **`sprint1/docs/module-map.md`** ⭐ MODULE BASELINE
    - Module structure (KEEP/PATCH/NEW)
    - Implementation history
    - Module dependencies

18. **`sprint1/docs/status-model.md`**
    - Status baseline
    - Lifecycle states

19. **`sprint1/docs/assumptions-and-open-questions.md`**
    - Unresolved decisions
    - Known assumptions

20. **`sprint1/shared/js/navigation-config.js`** (nếu đã tồn tại)
    - Navigation config (§16 D-source-of-truth-index)
    - Nav phẳng 5 mục

21. **Module READMEs** (theo nhu cầu):
    - `sprint1/modules/auth/README.md`
    - `sprint1/modules/seller-workspace/README.md`
    - `sprint1/modules/employee-profile/README.md`

---

### **LEVEL 6: Recent Changes & Changelog**

Thay đổi gần đây:

22. **`/memory/2026-07-27.md`** ⭐ NGÀY QUAN TRỌNG
    - Banca Orchestrator skill created
    - Visual Design System skill created
    - Design token validation/fix scripts
    - "Workflow cần confirm gate" decision

23. **`/memory/2026-07-20.md`** (nếu tồn tại)
    - Project kickoff
    - Spec v1 finalization

24. **`sprint1/docs/rework-v2/G-test-report.md`** (nếu có)
    - Latest test results
    - Regression status

---

### **LEVEL 7: AI Operating System** (Advanced)

Workflow, routing, governance:

25. **`sprint1/.ai/README.md`**
    - Shared AI operating system
    - Tool-neutral source of truth
    - Workspace layout

26. **`sprint1/.ai/governance/ai-pm-brain-workflow.md`** (nếu tồn tại)
    - End-to-end AI workflow
    - Task contracts, QC, reflection

27. **`~/.codex/skills/banca-orchestrator/SKILL.md`**
    - Orchestrator workflow (hiểu vấn đề → CONFIRM GATE → BA → Designer → Dev FE → QC)
    - Role subagents (ba, designer, frontend, qc)

---

## 🎯 Quick Start Guide

**Nếu chỉ có 10 phút, đọc 5 file này:**

1. `/MEMORY.md` — Lessons learned & work philosophy
2. `projects/banca-sales-portal/PROJECT_OVERVIEW.md` — Product spec v1
3. `sprint1/docs/rework-v2/D-source-of-truth-index.md` — Latest decisions & superseded items
4. `sprint1/docs/module-map.md` — Module structure
5. `sprint1/shared/css/tokens.css` — Design system (view in `dev/design-reference.html`)

**Nếu có 30 phút, thêm:**

6. `/AGENTS.md` + `/SOUL.md` — Philosophy & constraints
7. `sprint1/docs/persona-and-permission.md` — Who uses the system
8. `sprint1/docs/rework-v2/C-state-transition-map.md` — State model
9. `sprint1/docs/standards/UX-COPY-RULES.md` — UX guidelines
10. `/memory/2026-07-27.md` — Recent architectural decisions

---

## 🚨 Critical Rules to Remember

1. **Requirements → Design → Code** (NEVER skip steps)
2. **Design tokens ONLY** (no hardcoded CSS values)
3. **Validate before commit** (run `scripts/validate-design-tokens.js --strict`)
4. **User approval required** (via banca-orchestrator CONFIRM GATE)
5. **QC always runs** (before reporting completion)
6. **Document decisions** (update MEMORY.md + daily memory/YYYY-MM-DD.md)

---

## 📝 Changelog Location

- **Long-term:** `/MEMORY.md`
- **Daily logs:** `/memory/YYYY-MM-DD.md`
- **Architecture decisions:** `sprint1/.ai/decisions/` (if exists)
- **Rework v2:** `sprint1/docs/rework-v2/D-source-of-truth-index.md` (superseded items table)

---

**Last updated:** 2026-07-29  
**For:** ChatGPT, Claude, or any new AI collaborator entering the project

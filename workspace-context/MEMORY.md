# MEMORY.md - Long-Term Memory

**Workspace:** Bancassurance Sales Service Projects  
**Created:** 2026-07-16  

---

## Lessons Learned

### ❌ Insurance Distribution Platform (Failed)

**What happened:**
- Built prototype too fast without full requirements validation
- Made assumptions about business logic (2 management models, authorization check)
- Didn't show wireframes for approval before coding
- Result: Prototype didn't match actual requirements

**Why it failed:**
- Rushed to code without deep requirements analysis
- Assumed technical complexity was the goal (it wasn't)
- Built what seemed impressive vs. what was actually needed

**Lessons:**
1. ✅ **Requirements FIRST** - Spend time understanding the actual problem
2. ✅ **Show wireframes, get approval** - Before writing any code
3. ✅ **Clarify scope explicitly** - What's in, what's out
4. ✅ **Validate assumptions** - Document and confirm with user
5. ✅ **Simple > Complex** - Don't over-engineer

**Applied to Bancassurance:**
- Will create detailed requirements doc first
- Will show wireframes and get explicit approval
- Will clarify every ambiguity upfront
- Will iterate with user at each checkpoint

---

## Skills Security

**Audit completed:** 2026-07-16  
**Tool:** SkillSpector v2.3.13  
**Result:** 118 skills scanned

**Summary:**
- 5 CRITICAL (100/100) - Mostly false positives (documentation/examples)
- 6 HIGH (50-99) - Review before use
- 4 MEDIUM (25-49) - Use with caution
- 103 SAFE (0-24) - Generally safe

**Decision:** Keep all skills, apply runtime security policy instead of removal.

**Key skills for Bancassurance work:**
- stakeholder-requirements-gathering ✅
- ba-zone-user-story-ac-writer ✅
- frontend-design ✅
- canvas-design ✅
- coding-agent ⚠️ (review code first, never --yolo)
- deep-research ⚠️ (validate sources)

---

## Work Philosophy

### Quality Over Speed
- Understand requirements deeply
- Clarify ambiguities upfront
- Get approval before building
- Iterate based on feedback

### Documentation First
- Requirements → Design → Code (never skip steps)
- Keep decision logs
- Update memory with lessons

### Professional Delivery
- Clean code
- Realistic Vietnamese data
- Professional UI
- Full documentation

---

## Current Project: Banca Sales Portal

**Bắt đầu:** 2026-07-20
**Trạng thái:** Prototype Specification v1 — CHỐT, sẵn sàng build
**Source:** ChatGPT conversation analysis (v0) → User chốt spec chi tiết (v1)

### Định vị dự án

**Kiến trúc 3 tầng:**
- Tầng 1: CORE (product, underwriting, claims)
- Tầng 2: DISTRIBUTION (partner config, hierarchy)
- **Tầng 3: SALES PORTAL ← Dự án này**

**Ranh giới rõ ràng:**
- ✅ Sales Portal LÀM: Tư vấn, báo giá, lập HSYCBH, theo dõi, hiệu suất
- ❌ Sales Portal KHÔNG LÀM: Cấu hình kênh, nghiệp vụ lõi, admin operations

### Personas chính
**Seller:** Retail RM, Corporate RM, Telesales  
**Manager:** Team Leader, Branch Manager, Regional Manager

**KHÔNG có trong MVP:**
- Support Seller → delegation mechanism
- Partner/Product Admin → thuộc tầng khác

### Điểm chốt quan trọng
1. Manager dùng CHUNG portal với seller (không tách admin portal)
2. "Hồ sơ chưa nộp" vs "Hồ sơ đã nộp" (không dùng "hoàn thành")
3. Portal KHÔNG quản lý Customer Master
4. Referral tối giản (nếu ngân hàng có CRM)
5. "Gói bảo hiểm & Báo giá" (phù hợp Banca retail)

### Spec v1 — Điểm chốt mới (2026-07-20, bản chính thức)

**Menu BÁN BẢO HIỂM rút gọn về 2 nhóm:**
- Hồ sơ chưa nộp (filter theo bước hành trình)
- Hồ sơ đã nộp (filter theo trạng thái xử lý)
- KHÔNG có menu Báo giá riêng — báo giá là 1 bước trong hành trình

**State model chính thức:**
- `submission_state`: NOT_SUBMITTED / SUBMITTED
- Chưa nộp filter theo `current_stage` (7 bước chuẩn hóa: CUSTOMER_INFO → INSURED_PARTY → RISK_OBJECT → PACKAGE_AND_QUOTE → RISK_DECLARATION → DOCUMENTS → REVIEW_AND_SUBMIT)
- Đã nộp filter theo `application_status` (13 trạng thái lifecycle)
- Cờ cảnh báo (MISSING_INFORMATION, MISSING_DOCUMENT...) là badge, KHÔNG phải status chính

**Prototype scope đã chốt:**
- P0: Retail RM, Corporate RM, Telesales
- P1: Team Leader, Branch Manager, Regional Manager
- Support Seller xử lý bằng case delegation, không phải role riêng
- 10 module HTML entry (login → home → employee-profile → unsubmitted-apps → submitted-apps → application-workspace → policies → policy-detail → team-workspace → help)
- Đã có: source code structure, view model (`salesCaseViewModel`), mock data spec, sprint plan (0-5), acceptance checklist 14 điểm

### Quyết định kiến trúc quan trọng (10:47) — Continuation base

Phát hiện project `sales-service-prototype/prototype/sprint1` ĐÃ CÓ prototype hoàn chỉnh (57 file, validated, `skeleton+functional-mock`) đúng sản phẩm này — module: `auth, seller-workspace, seller-profile, seller-readiness, product-access`.

**User chọn: Hướng A — tiếp tục trên sprint1 cũ**, KHÔNG build mới trong `banca-sales-portal/prototype/`. `banca-sales-portal/PROJECT_OVERVIEW.md` (spec v1) vẫn là **nguồn quyết định nghiệp vụ mới nhất**, nhưng code/prototype tiếp tục ở `sales-service-prototype/prototype/sprint1/`.

PHASE 1 (Audit & Requirement Baseline) đã hoàn tất — tạo 5 file trong `sales-service-prototype/prototype/sprint1/docs/`:
- `product-overview.md`, `persona-and-permission.md`, `module-map.md` (KEEP/PATCH/NEW), `status-model.md`, `assumptions-and-open-questions.md`

Quyết định kiến trúc cần patch ở Phase 3/4: gộp 3 module `seller-profile+seller-readiness+product-access` → 1 module `employee-profile` (chỉ mở từ avatar, bỏ khỏi menu chính). Có 5 open question (OQ-01 đến OQ-05) cần user xác nhận trước khi code.

### Files
- `/projects/banca-sales-portal/PROJECT_OVERVIEW.md` - Prototype Specification v1 (26KB, nguồn quyết định nghiệp vụ)
- `/projects/sales-service-prototype/prototype/sprint1/docs/` - PHASE 1 baseline docs (2026-07-20)
- `/memory/2026-07-20.md` - Log hôm nay

---

## Cách làm việc: skill điều phối `banca-orchestrator` (2026-07-27)

Mọi yêu cầu công việc nên đi qua `/banca-orchestrator "<yêu cầu>"` thay vì làm trực tiếp.

**Luồng:** Intake → Hiểu vấn đề (5 lăng kính) → **CONFIRM GATE (chờ user duyệt kế hoạch)** → BA → Designer → Dev FE → QC → Báo cáo.

- Skill: `~/.codex/skills/banca-orchestrator/` (runtime Codex/OpenClaw)
- Role subagent canonical: `banca-orchestrator/agents/{ba,designer,frontend,qc}.md`; bản Claude Code: `.claude/agents/banca-*.md`
- **Không spawn subagent trước khi user duyệt.** Ngoại lệ duy nhất: câu hỏi thuần túy không tạo thay đổi (T6).
- QC luôn chạy trước khi báo hoàn thành. Tối đa 2 vòng sửa, sau đó dừng và báo user.
- Lý do tồn tại: ép đúng thứ tự **Requirements → Design → Code** — chính là thứ đã sai ở Distribution Platform.
- Chi tiết quyết định thiết kế: `/memory/2026-07-27.md`

---

## Chất lượng UI/UX: ràng buộc thắng khiếu thẩm mỹ (2026-07-27)

**Chẩn đoán gốc:** AIcoworker/Claude không kém thẩm mỹ — thiếu ràng buộc. Không có thang token thì mỗi lần sinh code agent tự nghĩ ra số, tích lũy thành lệch pha. Bằng chứng đo được trên sprint1: 19 cỡ chữ khác nhau (gồm 12.5px/11.5px), 139 mã hex hardcode, 2.078 vi phạm thang.

**Khoảng trống kiến trúc đã lấp:** `enterprise-uiux-skill` cấm mình quyết định CSS (rule #26, #27), `requirement-ba-skill` không sở hữu visual, `portal-prototype-builder` viết code nhưng nhận spec không có số → thẩm mỹ vô chủ. Nay có skill `visual-design-system` sở hữu tầng này.

**Chuỗi làm việc chuẩn:** `BA → Designer (cấu trúc) → Visual (con số) → Dev FE → QC`

**Ba công cụ cưỡng chế** (trong `prototype/sprint1/`):
- `scripts/validate-design-tokens.js` — đọc thang từ chính tokens.css; `--strict` để fail build
- `scripts/fix-design-tokens.js` — codemod nắn giá trị lệch; dry-run mặc định, `--max-delta` giới hạn rủi ro
- `dev/design-reference.html` — render trực tiếp token; mở trang này TRƯỚC khi viết CSS

**Hai nguyên tắc cần nhớ:**
1. Không mô tả thị giác bằng tính từ. "Compact enterprise density" không phải spec — `padding 12px, gap 8px, font-size 13px` mới là.
2. **Prompt thì agent quên, script thì không.** Chuẩn không có validator sẽ bị phá bởi batch patch tiếp theo — đã xảy ra một lần với bản review pattern-drift 2026-07-21.

Chi tiết: `/memory/2026-07-27.md`

---

_This memory grows as you learn. Update after every project._

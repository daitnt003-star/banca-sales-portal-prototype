# Implementation result

Status: IMPLEMENTED_PENDING_QC
Feature: Quote version selector and re-rate notice
Implementer: Claude

## Files changed

- `modules/application-workspace/app-workspace.js`
- `scripts/test-quote-version-ui.js`
- `.ai/handoffs/in-progress/FEATURE-QUOTE-VERSION-RERATE-UI.md`
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-QUOTE-VERSION-RERATE-UI.md`

No file outside the approved allowlist was changed by this implementation.
Pre-existing working-tree changes were preserved.

## Acceptance criteria evidence

1. A quote with one version renders `Phiên bản Vn` as a `badge-version`.
2. A quote with multiple versions renders a native select with
   `aria-label="Chọn phiên bản Bản chào"` and Vietnamese status labels.
3. Selecting an old version only renders a read-only preview. It does not call
   `patchApp`, change `activeQuoteVersionId`, or persist the preview. Reload returns to
   the active version.
4. The inline notice reads both `warnings` and `warningFlags`, handles stale/expired
   quote status, and shows the approved copy about the reason and payment lock.
5. Successful rating clears stale/rerate warning flags. A canonical draft that
   supersedes an approved version remains visible under the approved state rule.
6. The owner with `can_quote` sees `Tính phí lại`; manager/read-only does not receive a
   mutation CTA and continues to see version history.
7. The UI adapter prefers `app.quoteVersions[]`, supports
   `app.quote.versions[]`, and recovers a single version from `app.quote.version`.
8. Canonical re-rate uses `BANCA.quoteVersion.reRate`; payment and policy reference
   regressions remain green.
9. Native select remains keyboard-focusable. Browser smoke confirmed multi-version,
   single-version, legacy preview, reload recovery, owner editable, and manager
   read-only behavior.
10. Design-token result remained at baseline: 1,156 errors / 687 warnings.
11. Git status inspection confirms implementation files stay within the allowlist.

## Validation results

- `node --check modules/application-workspace/app-workspace.js` — PASS.
- `node scripts/test-quote-version-ui.js` — PASS, 29/29.
- `node scripts/test-quote-payment-issue.js` — PASS, 39/39.
- `node scripts/test-payment-gate.js` — PASS, 32/32.
- `node scripts/test-demo-stories.js` — PASS, 18/18.
- `node scripts/validate-manifest.js` — PASS.
- `node scripts/validate-modules.js` — PASS.
- `node scripts/validate-terminology.js` — PASS.
- `node scripts/detect-duplicate-components.js` — PASS.
- `node scripts/test-foundation.js` — PASS, 58/58.
- `node scripts/validate-design-tokens.js` — PASS at baseline
  1,156 errors / 687 warnings.
- `git diff --check` — PASS.

Browser smoke:

- `DRAFT-2026-005`: multi-version select and superseded preview PASS.
- Reload after viewing V1: active V2 restored and preview hidden PASS.
- `DRAFT-2026-007` as `RM-02`: re-rate notice, payment-lock copy and editable CTA PASS.
- `DRAFT-2026-004`: single-version badge and no selector PASS.
- `DRAFT-2026-005` as `TL-01`: manager read-only, selector available, no re-rate
  mutation CTA PASS.
- Desktop/tablet: no horizontal overflow observed.
- Narrow viewport exposed existing page/shell horizontal overflow across multiple
  pre-existing workspace blocks. The new select is capped at `max-width:100%`;
  final QC should compare the same route before/after or against a single-version
  route to confirm no new overflow contribution.

## UI/UX safety check

- Reused sticky `ws-summary`, `badge-version`, `alert2 warn`, native select and
  existing buttons.
- Added no color, typography, spacing, radius, shadow, breakpoint or motion token.
- Status is communicated by Vietnamese text, not color alone.
- Superseded preview is explicitly labelled `Xem lịch sử · chỉ đọc`.
- No drawer, modal, navigation, stepper or information-architecture change.

## Assumptions used

- History selection is view-only and intentionally not persisted.
- Legacy `CURRENT` maps to the active version and is displayed as `Đang soạn`.
- When canonical and legacy arrays coexist, canonical is authoritative.
- The existing submit/approval flow remains responsible for approving a new draft
  version.

## Errors encountered and resolved

- Initial markup added three `BULKY_INLINE_STYLE` warnings. The implementation removed
  unnecessary inline declarations and returned the validator to baseline on the first
  corrective attempt.
- Local browser serving required the approved local-server permission. The server was
  stopped after smoke testing.

## Remaining risks

- The prototype workspace has pre-existing narrow/mobile overflow unrelated to the
  new control. Final QC should verify that the selector's capped width introduces no
  incremental overflow.
- Browser automation confirmed native focus but did not change the native select with
  synthetic arrow keys in the controlled Chrome surface; deterministic
  `selectOption` interaction and preview behavior passed.
- Final product QC and project reflection remain owned by Codex.

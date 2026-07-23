# UI Benchmark Lessons — Sprint 1 Prototype

**Benchmark source:** `chatgpt-html-benchmark-2026-07-19-2151.txt`  
**Reason:** User feedback: ChatGPT produced better-looking HTML for same content; current prototype is too scaffold/technical.

---

## What the better HTML likely did right

1. **Showcase-first, not architecture-first**
   - Business user opens one polished HTML and understands the story.
   - Modular architecture is hidden behind the scenes.

2. **Visual hierarchy**
   - Strong hero/header.
   - KPI cards.
   - Scenario cards.
   - Product/readiness cards.
   - Clear CTA area.

3. **Less technical copy**
   - Avoid terms like manifest, module, mock-store, route handler, validator in the user-facing demo.
   - Technical terms move to handoff/dev docs.

4. **Demo narrative**
   - RM-01 READY happy path.
   - RM-02 CONDITIONAL/BLOCKED contrast.
   - SVC-ERR/PENDING as controlled risk state.
   - Show what user can do next.

5. **Single-file reliability for demo**
   - Avoid broken relative assets or canvas/network restrictions.
   - A single polished HTML is often better for stakeholder demo than many thin module pages.

6. **Enterprise SaaS polish**
   - FPT IS blue palette.
   - Dense but clean layout.
   - Modern cards, gradients, chips, side panel.
   - Realistic Vietnamese copy.

---

## Correction to apply now

Build a new `showcase.html` as the primary stakeholder demo:

- Self-contained CSS/JS in one file.
- Business-facing Vietnamese UI.
- Scenario switcher visible as demo storytelling, not technical test harness.
- Preserve Sprint 1 functional states.
- Link modular prototype/handoff only as secondary/developer path.

---

## Future rule

For insurance/bancassurance prototypes:

> First produce a beautiful single-page business demo that sells the story. Then decompose into modular pages for maintainability.

Do not expose prototype-builder internals as the first user experience.

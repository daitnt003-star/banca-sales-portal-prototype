# Task routing

All change requests first follow `.ai/governance/ai-pm-brain-workflow.md`: Codex intake, smallest context packet, impact gate, decision review, explicit user approval, task contract, builder patch, QC, reflection, and business summary with next actions.

| Request | Owner and skills | Required gates |
|---|---|---|
| Requirement, state, permission, data | Codex: requirement gate | Ready handoff |
| New feature | Codex: requirement + user flow + UX + UI guard; Claude: implement | QC + reflection |
| UI/layout change | Codex: UX + visual + UI guard; Claude: patch | Accessibility + QC |
| Copy change | Codex: UX copy; Claude: patch | Terminology + QC |
| Architecture/shared foundation | Codex: impact decision; Claude: implement | Full regression |
| Bug fix | Codex: root-cause scope; Claude: patch | Reproduction + regression |
| Review only | Codex: prototype QC | Reflection if failure repeats |

No runtime coding begins until the handoff status is `READY_FOR_IMPLEMENTATION`.

# Project Orchestrator operating contract

Use this contract after reading the project governance. Governance and source-of-truth order always take precedence.

## Context control

Build context progressively:

1. current user request and approval state;
2. task or handoff contract;
3. cited decisions and active requirements;
4. relevant module summary, when current and sourced;
5. specific files needed to decide or implement;
6. implementation and validation evidence.

Do not read an entire repository, history, or documentation set by default. Expand context only when the current evidence cannot resolve a material question.

Treat context budgets as soft controls, not fabricated token limits. When context becomes noisy:

1. stop reading;
2. summarize facts, citations, unknowns, and conflicts;
3. discard unrelated material from the next worker packet;
4. continue only when the smaller packet remains sufficient.

Do not persist a generated summary as product truth. A summary must cite its source and be refreshed when those sources change.

## Evidence confidence

Use evidence states instead of percentages:

- `VERIFIED`: directly demonstrated by the active source or deterministic evidence;
- `SUPPORTED`: multiple consistent signals support it, but direct verification is incomplete;
- `ASSUMED`: necessary working assumption stated explicitly;
- `UNKNOWN`: missing evidence can materially change the result;
- `CONFLICTED`: applicable sources disagree.

Do not advance implementation while a material item is `UNKNOWN` or `CONFLICTED`. Return the decision to the responsible owner or user. Do not invent numeric confidence.

## Worker packet

Treat every implementation worker as stateless. Send only:

```yaml
task:
goal:
decision_refs:
source_refs:
files_allowed:
files_prohibited:
acceptance:
validation:
assumptions:
attempt:
```

Do not send unrelated chat history, prior sprints, reports, or documentation. Permit a worker to read beyond the packet only when it identifies the missing evidence and receives an approved scope expansion.

## Selective routing

Run only stages that materially contribute:

- requirement gate for behavior, state, permission, data, validation, or acceptance changes;
- architecture for shared foundations or cross-module contracts;
- UX and UI guard for navigation, layout, interaction, copy, responsive, or accessibility changes;
- implementation for an approved runtime patch;
- self-check and QC for changed behavior;
- reflection for failures, recurrence, or material completed features.

A trivial isolated patch may skip architecture or UX analysis, but it still needs scoped acceptance and proportional validation.

## Ownership and concurrency

Assign one active writer to a module or overlapping file set. A second worker must wait or receive a disjoint allowlist.

Parallelize only independent, bounded work with separate artifacts. Do not delegate merely to reduce elapsed time. The orchestrator remains responsible for integrating evidence and decisions.

## Loop detection and retry

Track a failure fingerprint using:

```yaml
rule:
module:
component:
validator:
cause_hypothesis:
files_changed:
attempt:
result:
```

After QC failure:

1. identify the failed criterion and deterministic evidence;
2. route the correction to the owner of the cause: requirement, architecture, UX, implementation, or validation;
3. issue a corrective handoff containing only the evidenced failure;
4. change one causal variable per attempt.

Allow at most two unsuccessful attempts under the same hypothesis. A third matching fingerprint is `RECURRING_BLOCKER`; stop instead of retrying.

File edit count alone is not a loop. Treat repeated edits as a loop only when evidence, hypothesis, and outcome remain materially unchanged.

## STOP and escalation

Stop and escalate when:

- active requirements or source-of-truth documents conflict;
- a missing business, legal, permission, data, state, architecture, or UX decision can change the outcome;
- acceptance is not verifiable or cannot be satisfied;
- a worker introduces a new material assumption outside its authority;
- the same failure fingerprint reaches `RECURRING_BLOCKER`;
- implementation produces no behaviorally relevant change for the approved acceptance criteria;
- unrelated working-tree changes prevent safe isolation;
- context cannot be reduced to a sufficient evidence packet.

Do not stop merely because implementation is difficult or a file has been edited repeatedly.

## Metrics and status

Record only observed values:

```yaml
stage:
owner:
attempt:
files_changed:
validators:
result:
evidence_status:
loop_status:
```

Record duration or token usage only when the runtime provides measured values. Do not estimate them and present them as facts.

## Completion and commit authority

Do not declare completion while acceptance evidence, QC, required reflection, open risk, or blockers remain.

Do not commit by default. Commit only when the user explicitly requests it, the target changes are isolated, and every required gate passes. A successful commit does not replace QC evidence.

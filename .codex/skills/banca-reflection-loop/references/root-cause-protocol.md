# Root-cause protocol

1. Reproduce or cite deterministic evidence.
2. Identify the change that introduced or exposed the failure.
3. Trace backward through callers, configuration, requirements, and process gates.
4. Separate symptom, proximate defect, enabling condition, and root cause.
5. State a falsifiable hypothesis.
6. Apply the smallest change that tests the hypothesis.
7. Re-run the failed check and relevant regression checks.
8. Record whether evidence confirmed or rejected the hypothesis.

Do not call missing tests a code root cause; treat them as an enabling process gap.

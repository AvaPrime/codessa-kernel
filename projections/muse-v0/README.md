# MUSE v0 — Non-authoritative domain projection

**Authority**: Informative / derived  
**Kernel**: AvaPrime/codessa-kernel 1.0.0  
**Milestone**: M1-intent-compile (0.4.0)

## Separation of concerns

- Ledger OCC protects history integrity.
- JSONL file lock makes OCC atomic across processes.
- StreamLease + fencing is optional writer ownership.
- Intent compiler turns a declarative contract into events. PEG is a fold.

Leases are not part of the MUSE event model. The ledger protocol is frozen at 0.3.0.

## M1 evidence

`IntentContract` → `compile_intent()` → `IntentContractCompiled` + `ExpectationDeclared` → `PEGProjection.fold()`.

Proven locally: valid compile, invalid rejection, determinism, replay, PEG reconstruction, idempotent duplicate fold, compiler version preserved.

## Run tests

```bash
cd projections/muse-v0
pip install -e ".[dev]"
pytest
```

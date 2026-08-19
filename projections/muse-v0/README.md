# MUSE v0 — Non-authoritative domain projection

**Authority**: Informative / derived  
**Kernel**: AvaPrime/codessa-kernel 1.0.0  
**Milestone**: M0-stream-ownership (0.3.0)

## Separation of concerns

- Ledger OCC protects history integrity.
- JSONL file lock makes OCC atomic across processes.
- StreamLease + fencing is optional writer ownership.

Leases are not part of the MUSE event model.

## Evidence

Local pytest: 30 passed.

Lease failure paths: expired holder cannot renew; expired holder cannot release another owner's lease; stale fence rejected; token increases after expiry; same-owner renew keeps token; concurrent acquire has exactly one winner; injected clock.

## Run tests

```bash
cd projections/muse-v0
pip install -e ".[dev]"
pytest
```

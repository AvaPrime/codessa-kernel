# MUSE v0 — Non-authoritative domain projection

**Authority**: Informative / derived  
**Kernel**: AvaPrime/codessa-kernel 1.0.0  
**Status**: Implementation subtree, not Kernel authority

Event-sourced music intelligence kernel: EventEnvelope, PEG models, upcaster chain, in-memory ledger, rebuildable projection.

## Scope

In scope: append-only events, PEG fold, schema upcasting, Ledger protocol.

Out of scope: EventStoreDB, MLIR runtime, OSC/Ableton, Suno, MERIT, MuScriptor, IntentContract compilation.

## Run tests

```bash
cd projections/muse-v0
pip install -e ".[dev]"
pytest
```

## Next milestone (M0)

JSONL ledger adapter behind the existing `Ledger` protocol. Prove substitutability with `InMemoryLedger`.

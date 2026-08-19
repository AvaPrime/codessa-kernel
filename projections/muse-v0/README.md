# MUSE v0 — Non-authoritative domain projection

**Authority**: Informative / derived  
**Kernel**: AvaPrime/codessa-kernel 1.0.0  
**Status**: Implementation subtree, not Kernel authority  
**Milestone**: M0 durable ledger

Event-sourced music intelligence kernel: EventEnvelope, PEG models, upcaster chain, Ledger protocol, InMemoryLedger, JSONLLedger.

## Scope

In scope: append-only events, PEG fold, schema upcasting, Ledger protocol, JSONL persistence.

Out of scope: EventStoreDB, MLIR runtime, OSC/Ableton, Suno, MERIT, MuScriptor, IntentContract compilation.

## M0 evidence

Local pytest: 10 passed.

Gates: append/recovery, deterministic serialization, replay fold, optimistic concurrency, process restart, corrupt/truncated tail rejection, InMemoryLedger ≡ JSONLLedger observable semantics.

The JSONL adapter contains no musical, intent, or renderer semantics.

## Run tests

```bash
cd projections/muse-v0
pip install -e ".[dev]"
pytest
```

# MUSE Kernel v0

Event-sourced music intelligence kernel. This increment is the write/read spine, not a generator.

## Scope (v0)

- `EventEnvelope` — immutable ledger record
- PEG domain models — expectation, event, transition, impact
- `UpcasterPipeline` — N→N+1 schema evolution
- `InMemoryLedger` — append-only, optimistic concurrency
- `JSONLLedger` — durable local adapter behind the same `Ledger` protocol
- `StreamLease` — optional ownership + fencing (not part of the event model)
- `PEGProjection` — rebuildable fold

M0 (durable ledger) is proven locally: append, replay, optimistic concurrency, restart persistence, corrupt-tail rejection, and InMemory/JSONL substitutability.

M0-stream-ownership: OCC, JSONL flock, and StreamLease are separate infrastructure concerns. Leases are optional and not required by PEG.

Out of scope: EventStoreDB, Ableton/OSC, Suno compilation, MERIT/MuScriptor, real MLIR, IntentContract.

## Run tests

```bash
pip install -e ".[dev]"
pytest
```

## Stream convention

`track-{id}` is the aggregate. Projections are disposable. Events are not.

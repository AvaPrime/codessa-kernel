from __future__ import annotations

from muse.events.envelope import EventEnvelope
from muse.ledger.errors import ConcurrencyError


class InMemoryLedger:
    """Single-writer append-only store. Replace later with JSONL or EventStoreDB."""

    def __init__(self) -> None:
        self._streams: dict[str, list[EventEnvelope]] = {}

    def append(self, envelope: EventEnvelope, expected_version: int | None = None) -> int:
        stream = self._streams.setdefault(envelope.stream_id, [])
        if expected_version is not None and expected_version != len(stream):
            raise ConcurrencyError(
                f"{envelope.stream_id}: expected {expected_version}, got {len(stream)}"
            )
        stream.append(envelope)
        return len(stream)

    def read(self, stream_id: str) -> list[EventEnvelope]:
        return list(self._streams.get(stream_id, []))

    def version(self, stream_id: str) -> int:
        return len(self._streams.get(stream_id, []))

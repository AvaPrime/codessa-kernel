from __future__ import annotations

from collections.abc import Callable
from muse.events.envelope import EventEnvelope

Upcaster = Callable[[dict], dict]


class UpcasterPipeline:
    """Chains N → N+1 upcasters. Application code only sees the latest schema."""

    def __init__(self) -> None:
        self._chains: dict[str, list[tuple[int, Upcaster]]] = {}

    def register(self, event_type: str, from_version: int, upcaster: Upcaster) -> None:
        self._chains.setdefault(event_type, []).append((from_version, upcaster))
        self._chains[event_type].sort(key=lambda item: item[0])

    def upcast(self, envelope: EventEnvelope) -> EventEnvelope:
        data = dict(envelope.data)
        version = envelope.schema_version
        for from_version, upcaster in self._chains.get(envelope.event_type, []):
            if version == from_version:
                data = upcaster(data)
                version += 1
        return envelope.model_copy(update={"data": data, "schema_version": version})

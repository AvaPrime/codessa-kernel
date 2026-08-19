from __future__ import annotations

from typing import Protocol
from muse.events.envelope import EventEnvelope


class Ledger(Protocol):
    def append(self, envelope: EventEnvelope, expected_version: int | None = None) -> int:
        """Append an event. Returns the new stream version (event count).

        If expected_version is provided, it must equal the current stream
        version (number of already-committed events). A mismatch raises
        ConcurrencyError and must not write. None disables the check.
        """

    def read(self, stream_id: str) -> list[EventEnvelope]:
        """Return events in append order."""

    def version(self, stream_id: str) -> int:
        """Current stream version (number of events)."""

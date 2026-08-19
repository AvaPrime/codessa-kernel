from __future__ import annotations

import json
import re
from pathlib import Path

from muse.events.envelope import EventEnvelope
from muse.ledger.errors import ConcurrencyError, CorruptLedgerError

_SAFE_STREAM = re.compile(r"[^A-Za-z0-9._-]+")


def serialize_envelope(envelope: EventEnvelope) -> str:
    """Deterministic JSONL line. No domain interpretation."""
    return json.dumps(envelope.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))


class JSONLLedger:
    """Append-only JSONL store. One file per stream. Infrastructure only."""

    def __init__(self, root: str | Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, stream_id: str) -> Path:
        safe = _SAFE_STREAM.sub("_", stream_id)
        if not safe:
            raise ValueError("stream_id is empty after sanitization")
        return self.root / f"{safe}.jsonl"

    def _parse_lines(self, path: Path) -> list[EventEnvelope]:
        if not path.exists():
            return []
        raw = path.read_text(encoding="utf-8")
        if raw == "":
            return []
        if raw.endswith("\n"):
            chunks = raw[:-1].split("\n")
        else:
            chunks = raw.split("\n")
        events: list[EventEnvelope] = []
        for index, chunk in enumerate(chunks):
            if chunk == "":
                raise CorruptLedgerError(f"{path}: empty record at line {index + 1}")
            try:
                payload = json.loads(chunk)
            except json.JSONDecodeError as exc:
                raise CorruptLedgerError(f"{path}: invalid JSON at line {index + 1}") from exc
            try:
                events.append(EventEnvelope.model_validate(payload))
            except Exception as exc:
                raise CorruptLedgerError(f"{path}: invalid envelope at line {index + 1}") from exc
        return events

    def append(self, envelope: EventEnvelope, expected_version: int | None = None) -> int:
        path = self._path(envelope.stream_id)
        current = self._parse_lines(path)
        if expected_version is not None and expected_version != len(current):
            raise ConcurrencyError(
                f"{envelope.stream_id}: expected {expected_version}, got {len(current)}"
            )
        line = serialize_envelope(envelope)
        with path.open("a", encoding="utf-8") as handle:
            handle.write(line)
            handle.write("\n")
            handle.flush()
        return len(current) + 1

    def read(self, stream_id: str) -> list[EventEnvelope]:
        return self._parse_lines(self._path(stream_id))

    def version(self, stream_id: str) -> int:
        return len(self.read(stream_id))

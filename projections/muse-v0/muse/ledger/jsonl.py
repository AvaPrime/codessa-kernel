from __future__ import annotations

import fcntl
import json
import re
from pathlib import Path

from muse.events.envelope import EventEnvelope
from muse.ledger.concurrency import assert_expected_version
from muse.ledger.errors import CorruptLedgerError

_SAFE_STREAM = re.compile(r"[^A-Za-z0-9._-]+")


def serialize_envelope(envelope: EventEnvelope) -> str:
    """Deterministic JSONL line. No domain interpretation."""
    return json.dumps(envelope.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))


def parse_jsonl(raw: str, source: str) -> list[EventEnvelope]:
    if raw == "":
        return []
    if raw.endswith("\n"):
        chunks = raw[:-1].split("\n")
    else:
        chunks = raw.split("\n")
    events: list[EventEnvelope] = []
    for index, chunk in enumerate(chunks):
        if chunk == "":
            raise CorruptLedgerError(f"{source}: empty record at line {index + 1}")
        try:
            payload = json.loads(chunk)
        except json.JSONDecodeError as exc:
            raise CorruptLedgerError(f"{source}: invalid JSON at line {index + 1}") from exc
        try:
            events.append(EventEnvelope.model_validate(payload))
        except Exception as exc:
            raise CorruptLedgerError(f"{source}: invalid envelope at line {index + 1}") from exc
    return events


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

    def _parse_path(self, path: Path) -> list[EventEnvelope]:
        if not path.exists():
            return []
        return parse_jsonl(path.read_text(encoding="utf-8"), str(path))

    def append(self, envelope: EventEnvelope, expected_version: int | None = None) -> int:
        path = self._path(envelope.stream_id)
        path.touch(exist_ok=True)
        line = serialize_envelope(envelope)
        with path.open("a+", encoding="utf-8") as handle:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            handle.seek(0)
            current = parse_jsonl(handle.read(), str(path))
            assert_expected_version(envelope.stream_id, len(current), expected_version)
            handle.seek(0, 2)
            handle.write(line)
            handle.write("\n")
            handle.flush()
        return len(current) + 1

    def read(self, stream_id: str) -> list[EventEnvelope]:
        return self._parse_path(self._path(stream_id))

    def version(self, stream_id: str) -> int:
        return len(self.read(stream_id))

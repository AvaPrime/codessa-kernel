import json
from pathlib import Path

import pytest

from muse.events.envelope import EventEnvelope
from muse.ledger.errors import ConcurrencyError, CorruptLedgerError
from muse.ledger.jsonl import JSONLLedger, serialize_envelope


def _env(event_id: str, stream: str = "track-a") -> EventEnvelope:
    return EventEnvelope(
        event_id=event_id,
        event_type="TestRecorded",
        stream_id=stream,
        recorded_at=1.0,
        data={"n": event_id},
    )


def test_append_serializes_deterministically(tmp_path: Path):
    first = serialize_envelope(_env("e1"))
    second = serialize_envelope(_env("e1"))
    assert first == second
    json.loads(first)


def test_append_and_recover(tmp_path: Path):
    ledger = JSONLLedger(tmp_path)
    ledger.append(_env("e1"))
    ledger.append(_env("e2"))
    recovered = ledger.read("track-a")
    assert [e.event_id for e in recovered] == ["e1", "e2"]
    assert recovered[0].data == {"n": "e1"}


def test_restart_persistence(tmp_path: Path):
    JSONLLedger(tmp_path).append(_env("e1"))
    reopened = JSONLLedger(tmp_path)
    assert [e.event_id for e in reopened.read("track-a")] == ["e1"]
    assert reopened.version("track-a") == 1


def test_optimistic_concurrency_rejects_conflict(tmp_path: Path):
    ledger = JSONLLedger(tmp_path)
    ledger.append(_env("e1"), expected_version=0)
    with pytest.raises(ConcurrencyError):
        ledger.append(_env("e2"), expected_version=0)
    assert [e.event_id for e in ledger.read("track-a")] == ["e1"]


def test_optimistic_concurrency_accepts_matching_version(tmp_path: Path):
    ledger = JSONLLedger(tmp_path)
    assert ledger.append(_env("e1"), expected_version=0) == 1
    assert ledger.append(_env("e2"), expected_version=1) == 2


def test_truncated_tail_is_not_silent_history(tmp_path: Path):
    ledger = JSONLLedger(tmp_path)
    ledger.append(_env("e1"))
    path = tmp_path / "track-a.jsonl"
    path.write_text(path.read_text(encoding="utf-8") + '{"event_id":"e2"', encoding="utf-8")
    with pytest.raises(CorruptLedgerError):
        ledger.read("track-a")


def test_empty_record_is_corrupt(tmp_path: Path):
    path = tmp_path / "track-a.jsonl"
    path.write_text(serialize_envelope(_env("e1")) + "\n\n", encoding="utf-8")
    with pytest.raises(CorruptLedgerError):
        JSONLLedger(tmp_path).read("track-a")

from pathlib import Path

import pytest

from muse.events.envelope import EventEnvelope
from muse.ledger.concurrency import assert_expected_version
from muse.ledger.errors import ConcurrencyError
from muse.ledger.jsonl import JSONLLedger
from muse.ledger.memory import InMemoryLedger


def _env(event_id: str, stream: str = "track-occ") -> EventEnvelope:
    return EventEnvelope(
        event_id=event_id,
        event_type="TestRecorded",
        stream_id=stream,
        recorded_at=1.0,
        data={"n": event_id},
    )


@pytest.fixture(params=["memory", "jsonl"])
def ledger(request, tmp_path: Path):
    if request.param == "memory":
        return InMemoryLedger()
    return JSONLLedger(tmp_path)


def test_assert_expected_version_none_is_disabled():
    assert_expected_version("s", 7, None)


def test_assert_expected_version_mismatch():
    with pytest.raises(ConcurrencyError, match="expected 1, got 2"):
        assert_expected_version("s", 2, 1)


def test_conflict_does_not_write(ledger):
    ledger.append(_env("e1"), expected_version=0)
    with pytest.raises(ConcurrencyError):
        ledger.append(_env("e2"), expected_version=0)
    assert [e.event_id for e in ledger.read("track-occ")] == ["e1"]
    assert ledger.version("track-occ") == 1


def test_matching_version_appends(ledger):
    assert ledger.append(_env("e1"), expected_version=0) == 1
    assert ledger.append(_env("e2"), expected_version=1) == 2
    assert [e.event_id for e in ledger.read("track-occ")] == ["e1", "e2"]


def test_stale_reader_cannot_overwrite(ledger):
    ledger.append(_env("e1"), expected_version=0)
    seen = ledger.version("track-occ")
    ledger.append(_env("e2"), expected_version=seen)
    with pytest.raises(ConcurrencyError):
        ledger.append(_env("lost-update"), expected_version=seen)
    assert [e.event_id for e in ledger.read("track-occ")] == ["e1", "e2"]

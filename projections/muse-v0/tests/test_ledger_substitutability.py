from pathlib import Path

from muse.events.envelope import EventEnvelope
from muse.ledger.jsonl import JSONLLedger
from muse.ledger.memory import InMemoryLedger


def _env(event_id: str, stream: str = "track-x") -> EventEnvelope:
    return EventEnvelope(
        event_id=event_id,
        event_type="TestRecorded",
        schema_version=1,
        stream_id=stream,
        recorded_at=2.5,
        data={"k": event_id},
        caused_by=None,
    )


def test_memory_and_jsonl_are_observably_equivalent(tmp_path: Path):
    memory = InMemoryLedger()
    durable = JSONLLedger(tmp_path)
    commands = [_env("a"), _env("b"), _env("c")]

    for event in commands:
        memory.append(event)
        durable.append(event)

    mem_events = memory.read("track-x")
    jsonl_events = durable.read("track-x")
    assert [e.model_dump(mode="json") for e in mem_events] == [
        e.model_dump(mode="json") for e in jsonl_events
    ]
    assert memory.version("track-x") == durable.version("track-x") == 3

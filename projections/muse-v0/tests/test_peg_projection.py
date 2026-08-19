from muse.events.envelope import EventEnvelope
from muse.expectation.models import ExpectationEventType, ExpectationKind
from muse.expectation.projection import (
    EXPECTATION_CREATED,
    EXPECTATION_EVENT_RECORDED,
    PEGProjection,
)
from muse.ledger.memory import InMemoryLedger


def test_fold_rebuilds_open_expectations():
    ledger = InMemoryLedger()
    track = "track-demo"
    exp_id = "exp-drop"

    ledger.append(
        EventEnvelope(
            event_id="1",
            event_type=EXPECTATION_CREATED,
            stream_id=track,
            recorded_at=0.0,
            data={
                "id": exp_id,
                "kind": ExpectationKind.STRUCTURAL_ARRIVAL.value,
                "description": "drop on bar 32",
                "strength": 0.75,
            },
        )
    )
    ledger.append(
        EventEnvelope(
            event_id="2",
            event_type=EXPECTATION_EVENT_RECORDED,
            stream_id=track,
            recorded_at=0.1,
            data={
                "id": "ev-created",
                "event_type": ExpectationEventType.CREATED.value,
                "expectation_id": exp_id,
                "time": 24.0,
                "strength": 0.75,
            },
        )
    )
    ledger.append(
        EventEnvelope(
            event_id="3",
            event_type=EXPECTATION_EVENT_RECORDED,
            stream_id=track,
            recorded_at=0.2,
            data={
                "id": "ev-resolved",
                "event_type": ExpectationEventType.RESOLVED.value,
                "expectation_id": exp_id,
                "time": 32.0,
                "strength": 0.8,
                "satisfaction": 0.72,
            },
        )
    )

    peg = PEGProjection().fold(track, ledger.read(track))
    assert len(peg.expectations) == 1
    assert len(peg.open_expectations(31.0)) == 1
    assert len(peg.open_expectations(32.0)) == 0

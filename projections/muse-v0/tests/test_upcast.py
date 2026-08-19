from muse.events.envelope import EventEnvelope
from muse.events.upcast import UpcasterPipeline


def test_chain_upcasts_v1_to_v3():
    pipeline = UpcasterPipeline()

    def v1_to_v2(data: dict) -> dict:
        out = dict(data)
        out.setdefault("satisfaction", 0.5)
        return out

    def v2_to_v3(data: dict) -> dict:
        out = dict(data)
        out["caused_by"] = out.pop("caused_by_event", None)
        return out

    pipeline.register("ExpectationEventRecorded", 1, v1_to_v2)
    pipeline.register("ExpectationEventRecorded", 2, v2_to_v3)

    env = EventEnvelope(
        event_id="e1",
        event_type="ExpectationEventRecorded",
        schema_version=1,
        stream_id="track-1",
        recorded_at=1.0,
        data={"expectation_id": "x", "caused_by_event": "src"},
    )
    out = pipeline.upcast(env)
    assert out.schema_version == 3
    assert out.data["satisfaction"] == 0.5
    assert out.data["caused_by"] == "src"
    assert "caused_by_event" not in out.data

from __future__ import annotations

from muse.events.envelope import EventEnvelope
from muse.events.upcast import UpcasterPipeline
from muse.expectation.models import (
    Expectation,
    ExpectationEvent,
    ExpectationTransition,
    PerceptualExpectationGraph,
    PerceptualImpact,
)

EXPECTATION_CREATED = "ExpectationCreated"
EXPECTATION_EVENT_RECORDED = "ExpectationEventRecorded"
TRANSITION_RECORDED = "ExpectationTransitionRecorded"
IMPACT_RECORDED = "PerceptualImpactRecorded"


class PEGProjection:
    """Rebuildable fold over a track stream. Idempotent by reconstruction."""

    def __init__(self, pipeline: UpcasterPipeline | None = None) -> None:
        self.pipeline = pipeline or UpcasterPipeline()

    def fold(self, track_id: str, envelopes: list[EventEnvelope]) -> PerceptualExpectationGraph:
        peg = PerceptualExpectationGraph(track_id=track_id)
        for raw in envelopes:
            env = self.pipeline.upcast(raw)
            self._apply(peg, env)
        return peg

    def _apply(self, peg: PerceptualExpectationGraph, env: EventEnvelope) -> None:
        if env.event_type == EXPECTATION_CREATED:
            peg.expectations.append(Expectation.model_validate(env.data))
        elif env.event_type == EXPECTATION_EVENT_RECORDED:
            peg.events.append(ExpectationEvent.model_validate(env.data))
        elif env.event_type == TRANSITION_RECORDED:
            peg.transitions.append(ExpectationTransition.model_validate(env.data))
        elif env.event_type == IMPACT_RECORDED:
            peg.impacts.append(PerceptualImpact.model_validate(env.data))

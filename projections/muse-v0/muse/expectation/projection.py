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
EXPECTATION_DECLARED = "ExpectationDeclared"
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
        if env.event_type in (EXPECTATION_CREATED, EXPECTATION_DECLARED):
            expectation = Expectation.model_validate(env.data)
            if all(existing.id != expectation.id for existing in peg.expectations):
                peg.expectations.append(expectation)
            if env.event_type == EXPECTATION_DECLARED:
                created = ExpectationEvent.model_validate(
                    {
                        "id": env.event_id,
                        "event_type": env.data.get("event_type", "created"),
                        "expectation_id": expectation.id,
                        "time": env.data.get("time", 0.0),
                        "strength": expectation.strength,
                    }
                )
                if all(existing.id != created.id for existing in peg.events):
                    peg.events.append(created)
        elif env.event_type == EXPECTATION_EVENT_RECORDED:
            event = ExpectationEvent.model_validate(env.data)
            if all(existing.id != event.id for existing in peg.events):
                peg.events.append(event)
        elif env.event_type == TRANSITION_RECORDED:
            transition = ExpectationTransition.model_validate(env.data)
            if all(existing.id != transition.id for existing in peg.transitions):
                peg.transitions.append(transition)
        elif env.event_type == IMPACT_RECORDED:
            impact = PerceptualImpact.model_validate(env.data)
            if all(existing.id != impact.id for existing in peg.impacts):
                peg.impacts.append(impact)

from __future__ import annotations

from enum import Enum
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field, confloat


class ExpectationKind(str, Enum):
    HARMONIC_RESOLUTION = "harmonic_resolution"
    RHYTHMIC_PLACEMENT = "rhythmic_placement"
    MOTIF_CONTINUATION = "motif_continuation"
    TIMBRAL_STABILITY = "timbral_stability"
    EMOTIONAL_ARC = "emotional_arc"
    STRUCTURAL_ARRIVAL = "structural_arrival"
    CUSTOM = "custom"


class ExpectationEventType(str, Enum):
    CREATED = "created"
    REINFORCED = "reinforced"
    VIOLATED = "violated"
    RESOLVED = "resolved"


class TransitionKind(str, Enum):
    CREATES_THEN_VIOLATES = "creates_then_violates"
    REINFORCES = "reinforces"
    DELAYS_RESOLUTION = "delays_resolution"
    RESOLVES = "resolves"
    CUSTOM = "custom"


class Expectation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    kind: ExpectationKind
    description: str = ""
    strength: confloat(ge=0.0, le=1.0) = 0.7
    confidence: confloat(ge=0.0, le=1.0) = 0.8
    source: Literal["analysis", "intent", "inferred", "user"] = "inferred"
    metadata: dict[str, str] = Field(default_factory=dict)


class ExpectationEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: ExpectationEventType
    expectation_id: str
    time: float
    strength: confloat(ge=0.0, le=1.0) = 0.7
    caused_by: str | None = None
    actual: str | None = None
    satisfaction: confloat(ge=0.0, le=1.0) | None = None
    metadata: dict[str, str] = Field(default_factory=dict)


class ExpectationTransition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    from_event_id: str
    to_event_id: str
    causal_strength: confloat(ge=0.0, le=1.0) = 0.8
    timing_delta: float = 0.0
    kind: TransitionKind = TransitionKind.CUSTOM
    metadata: dict[str, str] = Field(default_factory=dict)


class PerceptualImpact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    from_event_id: str
    uncertainty: confloat(ge=0.0, le=1.0) = 0.0
    tension: confloat(ge=0.0, le=1.0) = 0.0
    intimacy: confloat(ge=0.0, le=1.0) = 0.0
    arousal: confloat(ge=0.0, le=1.0) = 0.0
    valence_delta: confloat(ge=-1.0, le=1.0) = 0.0
    metadata: dict[str, str] = Field(default_factory=dict)


class PerceptualExpectationGraph(BaseModel):
    track_id: str
    version: int = 1
    expectations: list[Expectation] = Field(default_factory=list)
    events: list[ExpectationEvent] = Field(default_factory=list)
    transitions: list[ExpectationTransition] = Field(default_factory=list)
    impacts: list[PerceptualImpact] = Field(default_factory=list)

    def open_expectations(self, at_time: float) -> list[Expectation]:
        created = {
            e.expectation_id
            for e in self.events
            if e.event_type == ExpectationEventType.CREATED and e.time <= at_time
        }
        resolved = {
            e.expectation_id
            for e in self.events
            if e.event_type == ExpectationEventType.RESOLVED and e.time <= at_time
        }
        open_ids = created - resolved
        return [exp for exp in self.expectations if exp.id in open_ids]

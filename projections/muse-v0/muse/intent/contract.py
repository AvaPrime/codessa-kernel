from __future__ import annotations

from pydantic import BaseModel, Field, confloat

from muse.expectation.models import ExpectationKind

COMPILER_VERSION = "1.0.0"


class ExpectationSpec(BaseModel):
    """Declarative desired expectation. No execution instructions."""

    kind: ExpectationKind
    description: str
    strength: confloat(ge=0.0, le=1.0) = 0.7
    time: float = 0.0


class IntentContract(BaseModel):
    """Desired musical intent. Not a plan, not a renderer command."""

    contract_id: str
    stream_id: str
    schema_version: int = 1
    compiler_version: str = COMPILER_VERSION
    expectations: list[ExpectationSpec] = Field(min_length=1)

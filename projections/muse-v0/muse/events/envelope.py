from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class EventEnvelope(BaseModel):
    """Immutable ledger envelope. Payloads live in `data`."""

    event_id: str
    event_type: str
    schema_version: int = 1
    stream_id: str
    recorded_at: float
    data: dict[str, Any]
    caused_by: str | None = None
    metadata: dict[str, str] = Field(default_factory=dict)

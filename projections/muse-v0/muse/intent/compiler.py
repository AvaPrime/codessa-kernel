from __future__ import annotations

from muse.events.envelope import EventEnvelope
from muse.expectation.models import ExpectationEventType
from muse.intent.contract import COMPILER_VERSION, IntentContract

INTENT_CONTRACT_COMPILED = "IntentContractCompiled"
EXPECTATION_DECLARED = "ExpectationDeclared"


class CompileError(ValueError):
    """Contract is not compilable by this compiler version."""


def expectation_id(contract_id: str, index: int) -> str:
    return f"{contract_id}:exp:{index}"


def compile_intent(contract: IntentContract) -> list[EventEnvelope]:
    """Deterministic: same contract + this compiler version → same envelopes."""
    if not contract.contract_id.strip() or not contract.stream_id.strip():
        raise CompileError("contract_id and stream_id are required")
    if contract.compiler_version != COMPILER_VERSION:
        raise CompileError(
            f"unsupported compiler_version {contract.compiler_version}; "
            f"this compiler is {COMPILER_VERSION}"
        )
    if not contract.expectations:
        raise CompileError("contract must declare at least one expectation")

    declared_ids = [
        expectation_id(contract.contract_id, index)
        for index in range(len(contract.expectations))
    ]
    envelopes: list[EventEnvelope] = [
        EventEnvelope(
            event_id=f"{contract.contract_id}:compiled:{COMPILER_VERSION}",
            event_type=INTENT_CONTRACT_COMPILED,
            schema_version=1,
            stream_id=contract.stream_id,
            recorded_at=0.0,
            caused_by=None,
            data={
                "contract_id": contract.contract_id,
                "stream_id": contract.stream_id,
                "schema_version": contract.schema_version,
                "compiler_version": COMPILER_VERSION,
                "expectation_ids": declared_ids,
            },
            metadata={"compiler_version": COMPILER_VERSION},
        )
    ]
    for index, spec in enumerate(contract.expectations):
        exp_id = declared_ids[index]
        envelopes.append(
            EventEnvelope(
                event_id=f"{contract.contract_id}:declared:{exp_id}",
                event_type=EXPECTATION_DECLARED,
                schema_version=1,
                stream_id=contract.stream_id,
                recorded_at=0.0,
                caused_by=envelopes[0].event_id,
                data={
                    "id": exp_id,
                    "kind": spec.kind.value,
                    "description": spec.description,
                    "strength": spec.strength,
                    "confidence": 1.0,
                    "source": "intent",
                    "time": spec.time,
                    "event_type": ExpectationEventType.CREATED.value,
                    "expectation_id": exp_id,
                },
                metadata={"compiler_version": COMPILER_VERSION},
            )
        )
    return envelopes

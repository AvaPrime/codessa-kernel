import pytest
from pydantic import ValidationError

from muse.expectation.models import ExpectationKind
from muse.expectation.projection import EXPECTATION_DECLARED, PEGProjection
from muse.intent.compiler import (
    COMPILER_VERSION,
    INTENT_CONTRACT_COMPILED,
    CompileError,
    compile_intent,
)
from muse.intent.contract import ExpectationSpec, IntentContract
from muse.ledger.memory import InMemoryLedger


def _contract(**overrides) -> IntentContract:
    data = {
        "contract_id": "c1",
        "stream_id": "track-m1",
        "compiler_version": COMPILER_VERSION,
        "expectations": [
            ExpectationSpec(
                kind=ExpectationKind.STRUCTURAL_ARRIVAL,
                description="drop on bar 32",
                strength=0.75,
                time=32.0,
            )
        ],
    }
    data.update(overrides)
    return IntentContract.model_validate(data)


def test_valid_contract_compiles():
    envelopes = compile_intent(_contract())
    types = [e.event_type for e in envelopes]
    assert types[0] == INTENT_CONTRACT_COMPILED
    assert types[1] == EXPECTATION_DECLARED
    assert envelopes[0].data["compiler_version"] == COMPILER_VERSION
    assert envelopes[0].data["expectation_ids"] == ["c1:exp:0"]


def test_invalid_contract_rejected():
    with pytest.raises((CompileError, ValidationError)):
        IntentContract(
            contract_id="c1",
            stream_id="track-m1",
            expectations=[],
        )
    with pytest.raises(CompileError):
        compile_intent(_contract(compiler_version="9.9.9"))
    with pytest.raises(CompileError):
        compile_intent(_contract(contract_id="  ", stream_id="track-m1"))


def test_compilation_is_deterministic():
    assert compile_intent(_contract()) == compile_intent(_contract())


def test_compiled_event_is_replayable():
    ledger = InMemoryLedger()
    first = compile_intent(_contract())
    for envelope in first:
        ledger.append(envelope)
    replayed = ledger.read("track-m1")
    assert [e.model_dump(mode="json") for e in replayed] == [
        e.model_dump(mode="json") for e in first
    ]


def test_projection_reconstructs_expectation():
    envelopes = compile_intent(_contract())
    peg = PEGProjection().fold("track-m1", envelopes)
    assert len(peg.expectations) == 1
    assert peg.expectations[0].source == "intent"
    assert peg.expectations[0].kind == ExpectationKind.STRUCTURAL_ARRIVAL
    assert len(peg.open_expectations(32.0)) == 1


def test_duplicate_replay_is_idempotent():
    envelopes = compile_intent(_contract())
    doubled = envelopes + envelopes
    peg = PEGProjection().fold("track-m1", doubled)
    assert len(peg.expectations) == 1
    assert len(peg.events) == 1


def test_compiler_version_is_preserved():
    compiled = compile_intent(_contract())[0]
    assert compiled.data["compiler_version"] == COMPILER_VERSION
    assert compiled.metadata["compiler_version"] == COMPILER_VERSION

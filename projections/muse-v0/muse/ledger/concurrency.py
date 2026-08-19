from muse.ledger.errors import ConcurrencyError


def assert_expected_version(stream_id: str, current: int, expected_version: int | None) -> None:
    """Shared optimistic-concurrency gate. No I/O, no domain semantics."""
    if expected_version is None:
        return
    if expected_version != current:
        raise ConcurrencyError(
            f"{stream_id}: expected {expected_version}, got {current}"
        )

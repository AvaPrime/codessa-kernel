class ConcurrencyError(Exception):
    """Stream version did not match expected_version. No write occurred."""


class CorruptLedgerError(Exception):
    """JSONL tail or record is not valid history. Nothing is silently repaired."""


class LeaseHeldError(Exception):
    """Another owner holds an unexpired lease on the stream."""


class LeaseNotHeldError(Exception):
    """No matching live lease for this owner and fencing token."""


class StaleFenceError(Exception):
    """Fencing token is older than the stream's current token. Write is forbidden."""

class ConcurrencyError(Exception):
    """Stream version did not match expected_version. No write occurred."""


class CorruptLedgerError(Exception):
    """JSONL tail or record is not valid history. Nothing is silently repaired."""

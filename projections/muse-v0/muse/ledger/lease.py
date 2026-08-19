from __future__ import annotations

import threading
from collections.abc import Callable
from typing import Protocol

from pydantic import BaseModel, Field

from muse.ledger.errors import LeaseHeldError, LeaseNotHeldError, StaleFenceError

Clock = Callable[[], float]


class Lease(BaseModel):
    """Exclusive, time-bounded ownership of a stream. Infrastructure only."""

    stream_id: str
    owner_id: str
    fencing_token: int = Field(ge=1)
    expires_at: float


class LeaseStore(Protocol):
    def acquire(self, stream_id: str, owner_id: str, ttl_seconds: float) -> Lease:
        """Take ownership. Increments fencing token. Fails if another live lease exists."""

    def renew(
        self, stream_id: str, owner_id: str, fencing_token: int, ttl_seconds: float
    ) -> Lease:
        """Extend TTL. Token is unchanged. Fails if token/owner do not match a live lease."""

    def release(self, stream_id: str, owner_id: str, fencing_token: int) -> None:
        """Drop a live lease. Idempotent if already expired or absent with same token."""

    def current(self, stream_id: str) -> Lease | None:
        """Return the live lease, or None if absent/expired. Does not mutate."""

    def require_valid(self, stream_id: str, owner_id: str, fencing_token: int) -> Lease:
        """Assert this owner still holds the current fence. Call immediately before append."""


class InMemoryLeaseStore:
    """Process-local lease table. Token sequence survives expiry; lease does not."""

    def __init__(self, clock: Clock | None = None) -> None:
        self._clock: Clock = clock or (lambda: __import__("time").time())
        self._leases: dict[str, Lease] = {}
        self._tokens: dict[str, int] = {}
        self._lock = threading.Lock()

    def _now(self) -> float:
        return self._clock()

    def _live(self, stream_id: str) -> Lease | None:
        lease = self._leases.get(stream_id)
        if lease is None or lease.expires_at <= self._now():
            return None
        return lease

    def acquire(self, stream_id: str, owner_id: str, ttl_seconds: float) -> Lease:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        with self._lock:
            held = self._live(stream_id)
            if held is not None and held.owner_id != owner_id:
                raise LeaseHeldError(
                    f"{stream_id}: held by {held.owner_id} until {held.expires_at}"
                )
            if held is not None and held.owner_id == owner_id:
                return self._renew_locked(stream_id, owner_id, held.fencing_token, ttl_seconds)
            next_token = self._tokens.get(stream_id, 0) + 1
            self._tokens[stream_id] = next_token
            lease = Lease(
                stream_id=stream_id,
                owner_id=owner_id,
                fencing_token=next_token,
                expires_at=self._now() + ttl_seconds,
            )
            self._leases[stream_id] = lease
            return lease

    def renew(
        self, stream_id: str, owner_id: str, fencing_token: int, ttl_seconds: float
    ) -> Lease:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        with self._lock:
            return self._renew_locked(stream_id, owner_id, fencing_token, ttl_seconds)

    def _renew_locked(
        self, stream_id: str, owner_id: str, fencing_token: int, ttl_seconds: float
    ) -> Lease:
        current = self._require_live(stream_id, owner_id, fencing_token)
        renewed = current.model_copy(update={"expires_at": self._now() + ttl_seconds})
        self._leases[stream_id] = renewed
        return renewed

    def release(self, stream_id: str, owner_id: str, fencing_token: int) -> None:
        with self._lock:
            recorded = self._leases.get(stream_id)
            if recorded is None:
                return
            if recorded.fencing_token != fencing_token or recorded.owner_id != owner_id:
                if recorded.expires_at > self._now():
                    raise StaleFenceError(
                        f"{stream_id}: cannot release with token {fencing_token}"
                    )
                return
            del self._leases[stream_id]

    def current(self, stream_id: str) -> Lease | None:
        with self._lock:
            return self._live(stream_id)

    def require_valid(self, stream_id: str, owner_id: str, fencing_token: int) -> Lease:
        with self._lock:
            return self._require_live(stream_id, owner_id, fencing_token)

    def _require_live(self, stream_id: str, owner_id: str, fencing_token: int) -> Lease:
        latest = self._tokens.get(stream_id, 0)
        if fencing_token < latest:
            raise StaleFenceError(
                f"{stream_id}: stale fence {fencing_token}, current {latest}"
            )
        lease = self._live(stream_id)
        if lease is None:
            raise LeaseNotHeldError(f"{stream_id}: no live lease")
        if lease.owner_id != owner_id or lease.fencing_token != fencing_token:
            raise StaleFenceError(
                f"{stream_id}: fence {fencing_token} is not the live token"
            )
        return lease

import threading

import pytest

from muse.ledger.errors import LeaseHeldError, LeaseNotHeldError, StaleFenceError
from muse.ledger.lease import InMemoryLeaseStore


class FakeClock:
    def __init__(self) -> None:
        self.value = 1000.0

    def __call__(self) -> float:
        return self.value

    def advance(self, seconds: float) -> None:
        self.value += seconds


@pytest.fixture
def store():
    clock = FakeClock()
    return InMemoryLeaseStore(clock=clock), clock


def test_acquire_grants_monotonic_token(store):
    leases, _ = store
    first = leases.acquire("track-a", "worker-1", ttl_seconds=10)
    leases.release("track-a", "worker-1", first.fencing_token)
    second = leases.acquire("track-a", "worker-2", ttl_seconds=10)
    assert first.fencing_token == 1
    assert second.fencing_token == 2


def test_second_owner_blocked_while_live(store):
    leases, _ = store
    leases.acquire("track-a", "worker-1", ttl_seconds=10)
    with pytest.raises(LeaseHeldError):
        leases.acquire("track-a", "worker-2", ttl_seconds=10)


def test_same_owner_reacquire_renews_without_new_token(store):
    leases, clock = store
    first = leases.acquire("track-a", "worker-1", ttl_seconds=10)
    clock.advance(3)
    again = leases.acquire("track-a", "worker-1", ttl_seconds=10)
    assert again.fencing_token == first.fencing_token
    assert again.expires_at == clock.value + 10


def test_expired_lease_can_be_taken_with_new_fence(store):
    leases, clock = store
    stale = leases.acquire("track-a", "worker-1", ttl_seconds=5)
    clock.advance(5)
    assert leases.current("track-a") is None
    fresh = leases.acquire("track-a", "worker-2", ttl_seconds=5)
    assert fresh.fencing_token == stale.fencing_token + 1
    with pytest.raises(StaleFenceError):
        leases.require_valid("track-a", "worker-1", stale.fencing_token)


def test_require_valid_before_append(store):
    leases, _ = store
    lease = leases.acquire("track-a", "worker-1", ttl_seconds=10)
    assert leases.require_valid("track-a", "worker-1", lease.fencing_token).owner_id == "worker-1"


def test_require_valid_rejects_expired(store):
    leases, clock = store
    lease = leases.acquire("track-a", "worker-1", ttl_seconds=5)
    clock.advance(5)
    with pytest.raises(LeaseNotHeldError):
        leases.require_valid("track-a", "worker-1", lease.fencing_token)


def test_renew_keeps_token_and_extends_ttl(store):
    leases, clock = store
    lease = leases.acquire("track-a", "worker-1", ttl_seconds=5)
    clock.advance(4)
    renewed = leases.renew("track-a", "worker-1", lease.fencing_token, ttl_seconds=5)
    assert renewed.fencing_token == lease.fencing_token
    clock.advance(5)
    assert leases.current("track-a") is None


def test_stale_release_rejected_while_live(store):
    leases, _ = store
    first = leases.acquire("track-a", "worker-1", ttl_seconds=10)
    leases.release("track-a", "worker-1", first.fencing_token)
    second = leases.acquire("track-a", "worker-2", ttl_seconds=10)
    with pytest.raises(StaleFenceError):
        leases.release("track-a", "worker-1", first.fencing_token)
    assert leases.current("track-a").owner_id == second.owner_id


def test_reject_nonpositive_ttl(store):
    leases, _ = store
    with pytest.raises(ValueError):
        leases.acquire("track-a", "worker-1", ttl_seconds=0)


def test_expired_holder_cannot_renew(store):
    leases, clock = store
    lease = leases.acquire("track-a", "worker-1", ttl_seconds=5)
    clock.advance(5)
    with pytest.raises(LeaseNotHeldError):
        leases.renew("track-a", "worker-1", lease.fencing_token, ttl_seconds=5)


def test_expired_holder_cannot_release_other_owner_lease(store):
    leases, clock = store
    stale = leases.acquire("track-a", "worker-1", ttl_seconds=5)
    clock.advance(5)
    fresh = leases.acquire("track-a", "worker-2", ttl_seconds=5)
    with pytest.raises(StaleFenceError):
        leases.release("track-a", "worker-1", stale.fencing_token)
    assert leases.current("track-a").owner_id == fresh.owner_id


def test_concurrent_acquire_exactly_one_winner():
    leases = InMemoryLeaseStore()
    barrier = threading.Barrier(8)
    winners: list[str] = []
    lock = threading.Lock()

    def attempt(owner: str) -> None:
        barrier.wait()
        try:
            lease = leases.acquire("track-a", owner, ttl_seconds=10)
            with lock:
                winners.append(lease.owner_id)
        except LeaseHeldError:
            return

    threads = [threading.Thread(target=attempt, args=(f"w{i}",)) for i in range(8)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert len(winners) == 1
    assert leases.current("track-a").owner_id == winners[0]

/**
 * Codessa Kernel — Transaction Contract
 *
 * Models the deterministic execution policy.
 * Immutable. Platform-neutral.
 */

import type {
  StateClassification,
  TransactionId,
} from "./types";

/**
 * A single execution attempt.
 *
 * Every action in the Kernel (validation, write, verification, etc.)
 * occurs inside a Transaction. Downstream actions may proceed only
 * when the preceding transaction reaches state "Observed".
 */
export interface Transaction {
  /** Globally unique, opaque identifier. */
  readonly id: TransactionId;

  /** Parent transaction if this is a retry. */
  readonly parent?: TransactionId;

  /** 1-based attempt counter. */
  readonly attempt: number;

  /** Identifier of the action being performed (e.g. "schema-validate"). */
  readonly action: string;

  /** Preconditions that must already be Observed. */
  readonly preconditions: readonly string[];

  /** Explicit success criteria that verification will check. */
  readonly successCriteria: readonly string[];

  /** ISO-8601 timestamp when the transaction started. */
  readonly startedAt: string;

  /** ISO-8601 timestamp when the transaction completed (if finished). */
  readonly completedAt?: string;

  /** Current state classification. */
  readonly state: StateClassification;
}

/** Lightweight reference used inside ValidationResult. */
export interface TransactionRef {
  readonly id: TransactionId;
  readonly parent?: TransactionId;
  readonly attempt: number;
  readonly action: string;
}

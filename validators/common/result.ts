/**
 * Codessa Kernel — Validation Result & Evidence Contracts
 *
 * Canonical output emitted by every validator.
 * Immutable. Platform-neutral.
 */

import type {
  ArtifactRef,
  DiagnosticLocation,
  SchemaRef,
  StatementId,
  ValidationStatus,
} from "./types";
import type { TransactionRef } from "./transaction";

/**
 * A single piece of evidence produced during validation.
 * First-class so that later validators (traceability, confidence)
 * can consume structured evidence without redesign.
 */
export interface Evidence {
  /** Kind of evidence (e.g. "schema-path", "diagnostic", "hash"). */
  readonly kind: string;

  /** Human-readable description. */
  readonly description: string;

  /** Optional artifact this evidence concerns. */
  readonly artifact?: ArtifactRef;

  /** Optional schema that was applied. */
  readonly schema?: SchemaRef;

  /** Optional statement this evidence relates to. */
  readonly statementId?: StatementId;

  /** Optional structural location. */
  readonly location?: DiagnosticLocation;

  /** Arbitrary structured payload (hashes, counts, raw diagnostics). */
  readonly data?: Readonly<Record<string, unknown>>;
}

/**
 * Canonical result contract.
 * Every validator must produce a value conforming to this shape.
 */
export interface ValidationResult {
  /** Identity of the validator that produced this result. */
  readonly validator: {
    readonly id: string;
    readonly version: string;
  };

  /** Reference to the transaction under which this validation ran. */
  readonly transaction: TransactionRef;

  /** Outcome. */
  readonly result: {
    readonly status: ValidationStatus;
    readonly statementId?: StatementId;
    readonly artifact?: ArtifactRef;
    readonly message: string;
  };

  /** Structured evidence collected during validation. */
  readonly evidence: readonly Evidence[];

  /** Optional metrics (execution time, counts, etc.). */
  readonly metrics?: Readonly<Record<string, number>>;

  /** ISO-8601 timestamp when the result was produced. */
  readonly timestamp: string;
}

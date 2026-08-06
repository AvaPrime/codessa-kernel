/**
 * Codessa Kernel — Shared Domain Types
 *
 * Platform-neutral primitives used across the validator framework.
 * No runtime dependencies. No business logic.
 */

/** Outcome of a validation or verification step. */
export type ValidationStatus = "Pass" | "Fail" | "Warning";

/** Implementation status of an enforcement mechanism. */
export type EnforcementStatus = "Planned" | "Executable";

/**
 * State classification for an execution transaction.
 * Aligns with the Kernel execution protocol:
 * NotObserved → action executed → verification → Observed | Failed | PartiallyObserved
 */
export type StateClassification =
  | "NotObserved"
  | "Observed"
  | "Failed"
  | "PartiallyObserved";

/** Stable identifier for a normative statement (e.g. "INV-001", "ARP-POL-003"). */
export type StatementId = string;

/** Reference to a Kernel artifact (path or logical id). */
export type ArtifactRef = string;

/** Opaque, globally unique transaction identifier. */
export type TransactionId = string;

/** Reference to a schema (path or logical id). */
export type SchemaRef = string;

/** Diagnostic location within an artifact (optional structural detail). */
export interface DiagnosticLocation {
  readonly path?: string;
  readonly line?: number;
  readonly column?: number;
  readonly pointer?: string; // JSON Pointer or equivalent
}

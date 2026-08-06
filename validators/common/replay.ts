/**
 * Codessa Kernel — Replay Contracts
 *
 * Immutable, platform-neutral types that enable deterministic replay
 * of validation transactions.
 *
 * No executable logic. No dependency on any concrete validator.
 * Replay is an orchestration concern; validators remain unaware of it.
 */

import type { ArtifactRef, SchemaRef, TransactionId } from "./types";

/**
 * Generic content digest.
 * Algorithm is explicit so future migration (e.g. to stronger hashes)
 * does not require model changes.
 */
export interface Digest {
  readonly algorithm: string; // e.g. "sha256"
  readonly value: string;     // hex or base64 encoding of the digest
}

/**
 * Identifies an artifact by both locator and content.
 * The digest is the source of truth for replay determinism.
 */
export interface ReplayArtifact {
  readonly id?: string;
  readonly path: ArtifactRef;
  readonly digest: Digest;
}

/**
 * Identifies a schema by both locator and content.
 */
export interface ReplaySchema {
  readonly id?: string;
  readonly path: SchemaRef;
  readonly digest: Digest;
}

/**
 * All inputs required to reproduce a validation.
 */
export interface ReplayInput {
  readonly artifact: ReplayArtifact;
  readonly schema: ReplaySchema;
}

/**
 * Canonical description of a validation that can be replayed.
 *
 * Determinism invariant:
 *   Same validator id + version
 *   + same Kernel version
 *   + same artifact digest
 *   + same schema digest
 *   + same inputs
 *   ⇒ same ValidationResult (semantic fields)
 */
export interface ReplayManifest {
  readonly transaction: {
    readonly id: TransactionId;
    readonly parent?: TransactionId;
    readonly attempt: number;
    readonly action: string;
  };

  readonly validator: {
    readonly id: string;
    readonly version: string;
  };

  readonly kernel: {
    readonly version: string;
  };

  readonly inputs: ReplayInput;

  /** ISO-8601 timestamp of original execution (informational only). */
  readonly originalTimestamp?: string;
}

/**
 * Request to perform a deterministic replay of a previous transaction.
 */
export interface ReplayRequest {
  readonly manifest: ReplayManifest;

  /**
   * Whether non-semantic metrics (e.g. wall-clock duration)
   * should be included in the comparison.
   * Default: false (ignored).
   */
  readonly includeNonSemanticMetrics?: boolean;
}

/**
 * Codessa Kernel — Typed Errors
 *
 * Structured errors that become part of execution evidence.
 * Prefer these over unstructured string comparisons or generic Error.
 * Platform-neutral.
 */

/** Base class for all Kernel execution / validation errors. */
export abstract class KernelError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Raised when a required schema cannot be loaded or parsed. */
export class SchemaLoadError extends KernelError {
  readonly code = "SCHEMA_LOAD_ERROR";

  constructor(
    message: string,
    public readonly schemaRef?: string
  ) {
    super(message);
  }
}

/** Raised when an artifact fails structural validation against its schema. */
export class SchemaValidationError extends KernelError {
  readonly code = "SCHEMA_VALIDATION_ERROR";

  constructor(
    message: string,
    public readonly artifactRef?: string,
    public readonly schemaRef?: string
  ) {
    super(message);
  }
}

/** Raised when a referenced artifact cannot be located. */
export class ArtifactNotFoundError extends KernelError {
  readonly code = "ARTIFACT_NOT_FOUND";

  constructor(
    message: string,
    public readonly artifactRef?: string
  ) {
    super(message);
  }
}

/** Raised when an execution-policy rule is violated (preconditions, abort, etc.). */
export class ExecutionPolicyError extends KernelError {
  readonly code = "EXECUTION_POLICY_ERROR";

  constructor(
    message: string,
    public readonly transactionId?: string
  ) {
    super(message);
  }
}

/** Raised when a transaction is attempted after a non-Observed predecessor. */
export class UnverifiedPredecessorError extends ExecutionPolicyError {
  readonly code = "UNVERIFIED_PREDECESSOR";

  constructor(message: string, transactionId?: string) {
    super(message, transactionId);
  }
}

/**
 * Codessa Kernel — Validator Interface
 *
 * The sole contract every concrete validator must implement.
 * Platform-neutral. No implementation.
 */

import type { Transaction } from "./transaction";
import type { ValidationResult } from "./result";

/**
 * Core validator contract.
 *
 * Implementations must be pure with respect to validation:
 * - no mutation of the input artifact
 * - no side effects (disk, network) unless explicitly part of the contract
 * - identical inputs produce identical ValidationResult values
 */
export interface IValidator<TInput = unknown> {
  /** Stable identifier of this validator (e.g. "schema-validator"). */
  readonly id: string;

  /** Semantic version of this validator implementation. */
  readonly version: string;

  /**
   * Execute validation under the given transaction.
   *
   * @param input     The artifact or data to validate
   * @param transaction The execution context (immutable)
   * @returns A complete ValidationResult
   */
  validate(
    input: TInput,
    transaction: Transaction
  ): Promise<ValidationResult> | ValidationResult;
}

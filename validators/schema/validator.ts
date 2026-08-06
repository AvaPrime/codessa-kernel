/**
 * Codessa Kernel — Schema Validator
 *
 * Answers exactly one question:
 *   Does this artifact conform to its declared schema?
 *
 * Pure. Deterministic. No governance interpretation.
 * No ownership of transaction state transitions.
 */

import type { IValidator } from "../common/validator";
import type { Transaction } from "../common/transaction";
import type { ValidationResult, Evidence } from "../common/result";
import type { ArtifactRef, SchemaRef } from "../common/types";
import {
  SchemaLoadError,
  SchemaValidationError,
  ArtifactNotFoundError,
} from "../common/errors";
import type { ContentLoader, LoadedContent } from "./loader";
import { computeDigest } from "./loader";

export interface SchemaValidatorInput {
  readonly artifactRef: ArtifactRef;
  readonly schemaRef: SchemaRef;
}

export const SCHEMA_VALIDATOR_ID = "schema-validator";
export const SCHEMA_VALIDATOR_VERSION = "1.0.0";

/**
 * Pure structural schema validator.
 *
 * The concrete schema language (JSON Schema, YAML Schema, etc.)
 * is injected via a SchemaChecker so the core remains language-agnostic.
 */
export class SchemaValidator implements IValidator<SchemaValidatorInput> {
  readonly id = SCHEMA_VALIDATOR_ID;
  readonly version = SCHEMA_VALIDATOR_VERSION;

  constructor(
    private readonly loader: ContentLoader,
    private readonly checker: SchemaChecker
  ) {}

  validate(
    input: SchemaValidatorInput,
    transaction: Transaction
  ): ValidationResult {
    const timestamp = new Date().toISOString();
    const evidence: Evidence[] = [];

    // ── Load artifact ──────────────────────────────────────────────
    let artifact: LoadedContent;
    try {
      artifact = this.loader.load(input.artifactRef) as LoadedContent;
    } catch (err) {
      // Validator Failure / Infrastructure Failure path
      // Orchestrator will classify the transaction as Failed or PartiallyObserved
      throw new ArtifactNotFoundError(
        `Unable to load artifact: ${input.artifactRef}`,
        input.artifactRef
      );
    }

    evidence.push({
      kind: "artifact-digest",
      description: "Content digest of the validated artifact",
      artifact: input.artifactRef,
      data: {
        algorithm: artifact.digest.algorithm,
        value: artifact.digest.value,
      },
    });

    // ── Load schema ────────────────────────────────────────────────
    let schema: LoadedContent;
    try {
      schema = this.loader.load(input.schemaRef) as LoadedContent;
    } catch (err) {
      throw new SchemaLoadError(
        `Unable to load schema: ${input.schemaRef}`,
        input.schemaRef
      );
    }

    evidence.push({
      kind: "schema-digest",
      description: "Content digest of the applied schema",
      schema: input.schemaRef,
      data: {
        algorithm: schema.digest.algorithm,
        value: schema.digest.value,
      },
    });

    // ── Structural validation ──────────────────────────────────────
    const checkResult = this.checker.check(artifact.text, schema.text);

    evidence.push({
      kind: "validation-outcome",
      description: checkResult.valid
        ? "Artifact conforms to schema"
        : "Artifact does not conform to schema",
      artifact: input.artifactRef,
      schema: input.schemaRef,
      data: {
        valid: checkResult.valid,
        diagnosticCount: checkResult.diagnostics.length,
      },
    });

    // Deterministic ordering of diagnostics
    const sortedDiagnostics = [...checkResult.diagnostics].sort((a, b) =>
      (a.pointer ?? "").localeCompare(b.pointer ?? "") ||
      (a.message ?? "").localeCompare(b.message ?? "")
    );

    for (const d of sortedDiagnostics) {
      evidence.push({
        kind: "diagnostic",
        description: d.message,
        artifact: input.artifactRef,
        schema: input.schemaRef,
        location: d.location,
        data: {
          pointer: d.pointer,
          severity: d.severity ?? "error",
        },
      });
    }

    const status = checkResult.valid ? "Pass" : "Fail";
    const message = checkResult.valid
      ? `Artifact ${input.artifactRef} conforms to schema ${input.schemaRef}`
      : `Artifact ${input.artifactRef} violates schema ${input.schemaRef} (${sortedDiagnostics.length} diagnostic(s))`;

    if (!checkResult.valid) {
      // This is a Validation Failure (not a Validator Failure).
      // Transaction will still be classified Observed by the orchestrator.
      // We still return a complete ValidationResult.
    }

    return {
      validator: {
        id: this.id,
        version: this.version,
      },
      transaction: {
        id: transaction.id,
        parent: transaction.parent,
        attempt: transaction.attempt,
        action: transaction.action,
      },
      result: {
        status,
        artifact: input.artifactRef,
        message,
      },
      evidence,
      metrics: {
        diagnosticCount: sortedDiagnostics.length,
        artifactBytes: artifact.bytes.length,
        schemaBytes: schema.bytes.length,
      },
      timestamp,
    };
  }
}

/**
 * Pluggable schema language checker.
 * Keeps the validator independent of any particular schema dialect.
 */
export interface SchemaChecker {
  check(
    artifactText: string,
    schemaText: string
  ): {
    valid: boolean;
    diagnostics: Array<{
      message: string;
      pointer?: string;
      severity?: "error" | "warning";
      location?: { path?: string; line?: number; column?: number; pointer?: string };
    }>;
  };
}

/**
 * Minimal JSON Schema-like checker for M1 tests.
 * Not a full JSON Schema implementation — sufficient to exercise the contract.
 * Production hosts should inject a real Ajv / JSON Schema validator.
 */
export class MinimalJsonSchemaChecker implements SchemaChecker {
  check(artifactText: string, schemaText: string) {
    const diagnostics: Array<{
      message: string;
      pointer?: string;
      severity?: "error" | "warning";
      location?: { pointer?: string };
    }> = [];

    let artifact: unknown;
    let schema: unknown;

    try {
      artifact = JSON.parse(artifactText);
    } catch {
      diagnostics.push({
        message: "Artifact is not valid JSON",
        severity: "error",
        pointer: "/",
      });
      return { valid: false, diagnostics };
    }

    try {
      schema = JSON.parse(schemaText);
    } catch {
      diagnostics.push({
        message: "Schema is not valid JSON",
        severity: "error",
        pointer: "/",
      });
      return { valid: false, diagnostics };
    }

    // Extremely minimal structural checks for M1 demonstration
    if (typeof schema === "object" && schema !== null && "type" in schema) {
      const expectedType = (schema as { type: string }).type;
      const actualType = Array.isArray(artifact)
        ? "array"
        : artifact === null
          ? "null"
          : typeof artifact;

      if (expectedType !== actualType) {
        diagnostics.push({
          message: `Expected type "${expectedType}", got "${actualType}"`,
          severity: "error",
          pointer: "/",
          location: { pointer: "/" },
        });
      }
    }

    if (
      typeof schema === "object" &&
      schema !== null &&
      "required" in schema &&
      Array.isArray((schema as { required: string[] }).required) &&
      typeof artifact === "object" &&
      artifact !== null
    ) {
      const required = (schema as { required: string[] }).required;
      for (const key of required) {
        if (!(key in (artifact as Record<string, unknown>))) {
          diagnostics.push({
            message: `Missing required property "${key}"`,
            severity: "error",
            pointer: `/${key}`,
            location: { pointer: `/${key}` },
          });
        }
      }
    }

    return {
      valid: diagnostics.length === 0,
      diagnostics,
    };
  }
}

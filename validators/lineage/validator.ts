/**
 * Codessa Kernel — Lineage Validator
 *
 * Answers: Is this projection constitutionally faithful?
 *
 * Deterministic. Pure set operations over statement IDs.
 * No AI. No semantic interpretation. No ambient state.
 */

import type { IValidator } from "../common/validator";
import type { Transaction } from "../common/transaction";
import type { ValidationResult, Evidence } from "../common/result";
import type { NormativeCoverage, LineageDocument, ProjectionMeta } from "./types";

export const LINEAGE_VALIDATOR_ID = "lineage-validator";
export const LINEAGE_VALIDATOR_VERSION = "1.0.0";

export interface LineageValidatorInput {
  /** All statement IDs that exist in the Kernel (from authority files). */
  readonly kernelStatementIds: readonly string[];

  /** Parsed lineage.yaml from the projection package. */
  readonly lineage: LineageDocument;

  /** Parsed projection.yaml from the projection package. */
  readonly projectionMeta: ProjectionMeta;

  /** Optional explicit list of intentionally omitted statement IDs. */
  readonly declaredOmissions?: readonly string[];
}

export class LineageValidator implements IValidator<LineageValidatorInput> {
  readonly id = LINEAGE_VALIDATOR_ID;
  readonly version = LINEAGE_VALIDATOR_VERSION;

  validate(
    input: LineageValidatorInput,
    transaction: Transaction
  ): ValidationResult {
    const timestamp = new Date().toISOString();
    const evidence: Evidence[] = [];
    const diagnostics: string[] = [];

    const kernelSet = new Set(input.kernelStatementIds.map(normalizeId));
    const declaredOmitSet = new Set(
      (input.declaredOmissions ?? []).map(normalizeId)
    );

    // Collect all statement IDs referenced by the projection
    const projectedIds = new Set<string>();
    for (const mapping of input.lineage.mappings) {
      if (mapping.statement_id) {
        projectedIds.add(normalizeId(mapping.statement_id));
      }
      if (mapping.statement_ids) {
        for (const id of mapping.statement_ids) {
          projectedIds.add(normalizeId(id));
        }
      }
    }

    // Set operations
    const invented: string[] = [];
    for (const id of projectedIds) {
      if (!kernelSet.has(id)) {
        invented.push(id);
        diagnostics.push(`Invented statement ID not present in Kernel: ${id}`);
      }
    }

    const omittedUndeclared: string[] = [];
    for (const id of kernelSet) {
      if (!projectedIds.has(id) && !declaredOmitSet.has(id)) {
        omittedUndeclared.push(id);
        diagnostics.push(`Kernel statement omitted without declaration: ${id}`);
      }
    }

    const omittedDeclared: string[] = [];
    for (const id of declaredOmitSet) {
      if (kernelSet.has(id) && !projectedIds.has(id)) {
        omittedDeclared.push(id);
      } else if (!kernelSet.has(id)) {
        diagnostics.push(`Declared omission references unknown Kernel ID: ${id}`);
      }
    }

    const represented = [...projectedIds].filter((id) => kernelSet.has(id)).length;
    const kernelStatements = kernelSet.size;
    const coveragePercent =
      kernelStatements === 0 ? 0 : Math.round((represented / kernelStatements) * 1000) / 10;

    const lineageComplete =
      invented.length === 0 &&
      omittedUndeclared.length === 0 &&
      diagnostics.filter((d) => d.includes("unknown")).length === 0;

    // Non-authoritative check
    if (!input.projectionMeta.projection.non_authoritative) {
      diagnostics.push("Projection does not declare itself non-authoritative");
    }

    const coverage: NormativeCoverage = {
      kernelStatements,
      represented,
      omittedDeclared: omittedDeclared.length,
      omittedUndeclared: omittedUndeclared.length,
      invented: invented.length,
      coveragePercent,
      lineageComplete,
    };

    evidence.push({
      kind: "normative-coverage",
      description: "Normative coverage metrics for the projection",
      data: { ...coverage },
    });

    evidence.push({
      kind: "lineage-set-operations",
      description: "Results of deterministic set difference between Kernel and Projection IDs",
      data: {
        invented,
        omittedUndeclared,
        omittedDeclared,
        projectedCount: projectedIds.size,
        kernelCount: kernelStatements,
      },
    });

    for (const d of diagnostics) {
      evidence.push({
        kind: "diagnostic",
        description: d,
      });
    }

    const status = lineageComplete && input.projectionMeta.projection.non_authoritative
      ? "Pass"
      : "Fail";

    const message = lineageComplete
      ? `Lineage complete. Coverage ${coveragePercent}% (${represented}/${kernelStatements}). Invented: 0. Undeclared omissions: 0.`
      : `Lineage incomplete. Invented: ${invented.length}, Undeclared omissions: ${omittedUndeclared.length}. See diagnostics.`;

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
        message,
        artifact: input.projectionMeta.projection.id,
      },
      evidence,
      metrics: {
        kernelStatements,
        represented,
        invented: invented.length,
        omittedUndeclared: omittedUndeclared.length,
        coveragePercent,
      },
      timestamp,
    };
  }
}

function normalizeId(id: string): string {
  return id.trim().toUpperCase().replace(/_/g, "-");
}

/**
 * Codessa Kernel — Lineage Validator Types
 */

export interface NormativeCoverage {
  readonly kernelStatements: number;
  readonly represented: number;
  readonly omittedDeclared: number;
  readonly omittedUndeclared: number;
  readonly invented: number;
  readonly coveragePercent: number;
  readonly lineageComplete: boolean;
}

export interface LineageMapping {
  readonly projected_element: string;
  readonly source: string;
  readonly statement_id?: string;
  readonly statement_ids?: string[];
  readonly type: string;
  readonly note?: string;
}

export interface LineageDocument {
  readonly projection: string;
  readonly kernel_version: string;
  readonly mappings: LineageMapping[];
}

export interface ProjectionMeta {
  readonly projection: {
    readonly id: string;
    readonly kernel_version: string;
    readonly non_authoritative: boolean;
    readonly source_artifacts?: string[];
  };
}

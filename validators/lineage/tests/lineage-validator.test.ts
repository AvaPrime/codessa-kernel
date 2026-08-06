/**
 * Lineage Validator — deterministic tests
 */

import { LineageValidator } from "../validator";
import type { Transaction } from "../../common/transaction";
import type { LineageDocument, ProjectionMeta } from "../types";

function makeTxn(): Transaction {
  return {
    id: "txn-lineage-test-001",
    attempt: 1,
    action: "lineage-validate",
    preconditions: [],
    successCriteria: ["lineage-complete"],
    startedAt: new Date().toISOString(),
    state: "NotObserved",
  };
}

const KERNEL_IDS = [
  "AXIOM-001", "AXIOM-002", "AXIOM-003", "AXIOM-004", "AXIOM-005",
  "AXIOM-006", "AXIOM-007", "AXIOM-008", "AXIOM-009",
  "INV-001", "INV-002", "INV-003", "INV-004",
  "INV-005", "INV-006", "INV-007", "INV-008",
];

export function testCompleteLineagePasses(): void {
  const lineage: LineageDocument = {
    projection: "grok-skill-v1",
    kernel_version: "1.0.0",
    mappings: [
      { projected_element: "Axioms", source: "CONSTITUTION", statement_ids: [
        "AXIOM-001","AXIOM-002","AXIOM-003","AXIOM-004","AXIOM-005",
        "AXIOM-006","AXIOM-007","AXIOM-008","AXIOM-009"
      ], type: "normative" },
      { projected_element: "Invariants", source: "CORE-INV", statement_ids: [
        "INV-001","INV-002","INV-003","INV-004",
        "INV-005","INV-006","INV-007","INV-008"
      ], type: "normative" },
    ],
  };

  const meta: ProjectionMeta = {
    projection: {
      id: "grok-skill-v1",
      kernel_version: "1.0.0",
      non_authoritative: true,
    },
  };

  const validator = new LineageValidator();
  const result = validator.validate(
    { kernelStatementIds: KERNEL_IDS, lineage, projectionMeta: meta },
    makeTxn()
  );

  if (result.result.status !== "Pass") {
    throw new Error(`Expected Pass, got ${result.result.status}: ${result.result.message}`);
  }
  console.log("✓ Complete lineage → Pass");
}

export function testInventedStatementFails(): void {
  const lineage: LineageDocument = {
    projection: "bad-skill",
    kernel_version: "1.0.0",
    mappings: [
      { projected_element: "Extra rule", source: "nowhere", statement_id: "FAKE-001", type: "normative" },
    ],
  };

  const meta: ProjectionMeta = {
    projection: { id: "bad-skill", kernel_version: "1.0.0", non_authoritative: true },
  };

  const validator = new LineageValidator();
  const result = validator.validate(
    { kernelStatementIds: KERNEL_IDS, lineage, projectionMeta: meta },
    makeTxn()
  );

  if (result.result.status !== "Fail") {
    throw new Error(`Expected Fail for invented statement, got ${result.result.status}`);
  }
  console.log("✓ Invented statement → Fail");
}

export function testUndeclaredOmissionFails(): void {
  const lineage: LineageDocument = {
    projection: "partial-skill",
    kernel_version: "1.0.0",
    mappings: [
      { projected_element: "Only axiom 1", source: "CONSTITUTION", statement_id: "AXIOM-001", type: "normative" },
    ],
  };

  const meta: ProjectionMeta = {
    projection: { id: "partial-skill", kernel_version: "1.0.0", non_authoritative: true },
  };

  const validator = new LineageValidator();
  const result = validator.validate(
    { kernelStatementIds: KERNEL_IDS, lineage, projectionMeta: meta },
    makeTxn()
  );

  if (result.result.status !== "Fail") {
    throw new Error(`Expected Fail for undeclared omissions, got ${result.result.status}`);
  }
  console.log("✓ Undeclared omission → Fail");
}

export function runAll(): void {
  testCompleteLineagePasses();
  testInventedStatementFails();
  testUndeclaredOmissionFails();
  console.log("\nAll Lineage Validator tests passed.");
}

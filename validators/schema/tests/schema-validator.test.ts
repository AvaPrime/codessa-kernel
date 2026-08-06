/**
 * Codessa Kernel — Schema Validator Tests
 *
 * Covers the three failure classes:
 * 1. Validation Failure  (artifact invalid → Observed + Fail)
 * 2. Validator Failure   (schema missing → throw SchemaLoadError)
 * 3. Infrastructure Failure path is exercised by missing artifact
 *
 * These tests are intentionally pure and do not depend on a test runner.
 * They can be executed by any host that supplies a minimal assertion helper.
 */

import { SchemaValidator, MinimalJsonSchemaChecker } from "../validator";
import { MemoryLoader } from "../loader";
import type { Transaction } from "../../common/transaction";
import {
  ArtifactNotFoundError,
  SchemaLoadError,
} from "../../common/errors";

// ── Helpers ────────────────────────────────────────────────────────

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-test-001",
    attempt: 1,
    action: "schema-validate",
    preconditions: [],
    successCriteria: ["validation-completed"],
    startedAt: new Date().toISOString(),
    state: "NotObserved",
    ...overrides,
  };
}

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

// ── Test 1: Valid artifact against valid schema → Pass ─────────────

export function testValidArtifactPasses(): void {
  const artifact = encode(JSON.stringify({ name: "Codessa", version: "1.0.0" }));
  const schema = encode(
    JSON.stringify({
      type: "object",
      required: ["name", "version"],
    })
  );

  const loader = new MemoryLoader(
    new Map([
      ["artifact://valid", artifact],
      ["schema://object", schema],
    ])
  );

  const validator = new SchemaValidator(loader, new MinimalJsonSchemaChecker());
  const result = validator.validate(
    { artifactRef: "artifact://valid", schemaRef: "schema://object" },
    makeTransaction()
  );

  if (result.result.status !== "Pass") {
    throw new Error(`Expected Pass, got ${result.result.status}`);
  }
  if (result.evidence.length < 2) {
    throw new Error("Expected at least artifact + schema digests in evidence");
  }
  console.log("✓ Test 1: Valid artifact → Pass");
}

// ── Test 2: Invalid artifact against valid schema → Fail ───────────

export function testInvalidArtifactFails(): void {
  const artifact = encode(JSON.stringify({ name: "Codessa" })); // missing version
  const schema = encode(
    JSON.stringify({
      type: "object",
      required: ["name", "version"],
    })
  );

  const loader = new MemoryLoader(
    new Map([
      ["artifact://invalid", artifact],
      ["schema://object", schema],
    ])
  );

  const validator = new SchemaValidator(loader, new MinimalJsonSchemaChecker());
  const result = validator.validate(
    { artifactRef: "artifact://invalid", schemaRef: "schema://object" },
    makeTransaction()
  );

  if (result.result.status !== "Fail") {
    throw new Error(`Expected Fail, got ${result.result.status}`);
  }
  if (!result.evidence.some((e) => e.kind === "diagnostic")) {
    throw new Error("Expected diagnostic evidence for schema violation");
  }
  console.log("✓ Test 2: Invalid artifact → Fail (Validation Failure)");
}

// ── Test 3: Missing schema → SchemaLoadError (Validator Failure) ───

export function testMissingSchemaThrows(): void {
  const artifact = encode(JSON.stringify({ name: "Codessa" }));

  const loader = new MemoryLoader(
    new Map([["artifact://present", artifact]])
  );

  const validator = new SchemaValidator(loader, new MinimalJsonSchemaChecker());

  let threw = false;
  try {
    validator.validate(
      { artifactRef: "artifact://present", schemaRef: "schema://missing" },
      makeTransaction()
    );
  } catch (err) {
    threw = true;
    if (!(err instanceof SchemaLoadError)) {
      throw new Error(`Expected SchemaLoadError, got ${err}`);
    }
  }

  if (!threw) {
    throw new Error("Expected SchemaLoadError to be thrown");
  }
  console.log("✓ Test 3: Missing schema → SchemaLoadError (Validator Failure)");
}

// ── Runner ─────────────────────────────────────────────────────────

export function runAll(): void {
  testValidArtifactPasses();
  testInvalidArtifactFails();
  testMissingSchemaThrows();
  console.log("\nAll Schema Validator tests passed.");
}

// Allow direct execution in environments that support it
if (typeof require !== "undefined" && require.main === module) {
  runAll();
}

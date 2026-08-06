# Codessa Kernel

**Authority classification**: Informative  
**Maturity**: M0 (Foundation)

The Codessa Kernel is the single authoritative source for normative engineering knowledge in the Codessa system.

It defines the constitutional principles, operational invariants, governance processes, and execution contracts that all projections must obey.  
Generated projections (Grok skills, Claude projects, CI configurations, MCP servers, etc.) are never authoritative.

## Authority Hierarchy

```
Constitution
    ↓
Core Invariants
    ↓
Governance (Architecture Review Protocol)
    ↓
Execution Contract
    ↓
Technical Specifications (schemas, projection manifest)
    ↓
Projections (non-authoritative)
```

Normative authority flows strictly downward.  
No lower-authority artifact may create, strengthen, or contradict a requirement established by a higher-authority artifact.

## Core Principles (Summary)

- Confidence must never exceed executable evidence.
- There is exactly one authoritative source (this Kernel).
- Generated projections are never authoritative.
- Every normative claim must identify an enforcement mechanism and its status.
- Every normative artifact must remain traceable to its constitutional source.

Full statements live in `CONSTITUTION.md` and `invariants/CORE-INV.yaml`.

## Versioning

All schemas and Kernel artifacts follow Semantic Versioning starting at `1.0.0`.

| Change type                        | Version impact |
|------------------------------------|----------------|
| Editorial, comments, examples      | Patch          |
| Backward-compatible additions      | Minor          |
| Breaking changes                   | Major          |

Projections must declare both `kernel_version` and an explicit `compatible_with` range.

## Statement Identifiers

Every normative statement carries a stable identifier (e.g. `ARP-POL-001`, `EC-CON-003`, `INV-004`).

Identifiers are permanently reserved.  
Deprecated statements are marked `Deprecated` and are never reused.

## Current Maturity (M0)

- Constitutional model: defined
- Core Invariants: defined
- Governance protocol: defined
- Execution contract: defined
- Technical schemas: defined
- Executable enforcement: **Planned** (not yet implemented)

Confidence remains low until validators exist that can automatically reject violations.

## Non-Goals of M0

- No executable validators
- No projection generators
- No CI enforcement
- No multi-target compiler
- No knowledge graph
- No platform-specific logic inside the Kernel

## Next Milestone (M1)

Implement the first executable validators that can automatically reject Kernel artifacts violating Constitutional Axioms or Core Invariants.

That transition marks the point at which the Kernel moves from describing governance to enforcing it.
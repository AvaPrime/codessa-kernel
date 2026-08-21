# Codessa Canonical Knowledge Map

**Document ID:** CKM-001  
**Status:** PROVISIONAL — CANDIDATE FOR CANONIZATION  
**Authority:** Subordinate to `CONSTITUTION.md` and the Core Invariants  
**Purpose:** Establish the classification, authority, implementation status, and promotion rules for Codessa architectural knowledge before AI-assisted implementation.

> **Important:** This document is an authority index, not a replacement for the Kernel Constitution. It does not promote a component to constitutional authority merely by listing it here.

---

## 1. Purpose

Codessa has accumulated architecture, specifications, implementations, experiments, and historical material across multiple repositories and documents. These artifacts do not have equal epistemic or normative authority.

This map establishes a deterministic classification system so that humans and AI implementation agents can distinguish:

- what is authoritative;
- what is specified but not yet implemented;
- what is implemented but still requires contract verification;
- what is experimental;
- what is historical;
- what is deliberately deferred; and
- what is in unresolved conflict.

The primary objective is to prevent historical or exploratory material from silently becoming normative implementation authority.

---

## 2. Governing Authority

The current `codessa-kernel` Constitution is the highest authority represented in this repository.

The intended normative hierarchy is:

```text
Constitution
    ↓
Core Invariants
    ↓
Governance / Change Authority
    ↓
Execution Contract
    ↓
Approved Technical Specifications
    ↓
Verified Implementations
    ↓
Tests / Evidence / Projections
```

Generated projections, external model outputs, research notes, and historical repositories do not acquire authority merely by being present or referenced.

---

## 3. Knowledge Classification

### 3.1 CANONICAL

**Definition:** Normative Codessa truth established by the Kernel Constitution, Core Invariants, or an explicitly approved contract/specification under that authority.

**Grok treatment:** MUST obey.

Canonical material may constrain implementation, define invariants, or establish authoritative interfaces.

### 3.2 IMPLEMENTED

**Definition:** Executable capability exists or has previously been implemented.

**Grok treatment:** Treat as evidence of implementation, not automatically as normative authority.

An implementation becomes accepted kernel behavior only after it is recovered, tested, and verified against its governing contract/invariants.

### 3.3 SPECIFIED

**Definition:** An accepted design or architectural proposal that has not yet been proven as executable kernel behavior.

**Grok treatment:** May inform implementation only when the relevant milestone authorizes it.

### 3.4 EXPERIMENTAL

**Definition:** Research, prototype, exploratory architecture, or unvalidated design.

**Grok treatment:** NEVER treat as normative authority.

### 3.5 HISTORICAL

**Definition:** Superseded architecture, abandoned implementation, previous product framing, obsolete terminology, or prior reasoning retained for provenance.

**Grok treatment:** Context only. Historical material cannot override current canonical authority.

### 3.6 DEFERRED

**Definition:** Deliberately outside the current implementation milestone.

**Grok treatment:** Do not implement unless explicitly promoted/authorized.

### 3.7 CONFLICTED

**Definition:** A normative claim that cannot simultaneously coexist with another claim of equal or higher authority.

**Grok treatment:** Do not resolve by inference. Register the conflict and await an explicit Architecture Decision Record or other authorized resolution.

A conflicted artifact cannot be promoted to CANONICAL without documented resolution.

---

## 4. Promotion / Demotion Rules

```text
EXPERIMENTAL / HISTORICAL / SPECIFIED / CONFLICTED
                         ↓
                  Architecture Review
                         ↓
                 Decision / Evidence
                    ↙           ↘
               REJECTED       PROMOTED
                                  ↓
                              CANONICAL
```

Implementation status does not itself confer authority.

A component may therefore be:

- `CANONICAL + NOT_IMPLEMENTED`
- `SPECIFIED + NOT_IMPLEMENTED`
- `IMPLEMENTED + NOT_CANONICAL`
- `IMPLEMENTED + VERIFIED`
- `CONFLICTED + IMPLEMENTED`

These distinctions must not be collapsed.

---

# 5. Current Codessa Knowledge Map

## 5.1 Constitutional Authority — CANONICAL

| ID | Component | Classification | Status | Authority | Notes |
|---|---|---|---|---|---|
| KERNEL-CONST | Codessa Kernel Constitution | CANONICAL | Existing | Highest | Governs the repository and normative engineering knowledge. |
| KERNEL-INV | Core Invariants | CANONICAL | Existing | Constitutional subordinate | Defines mandatory invariants including lineage, authority leakage prevention, evidence-bounded confidence, platform independence, complexity governance, and traceability. |
| KERNEL-GOV | Kernel Governance Model | CANONICAL | Specified / partially implemented | Constitutional subordinate | Governs admissible change and authority flow. |
| KERNEL-ECR | Execution Contract principle | CANONICAL PRINCIPLE | Specified | Constitutional subordinate | Defines the boundary between governed decision and executable operation. |

**Source basis:** Existing `codessa-kernel` Constitution, README, and Core Invariants. These are the current constitutional root and must be treated as higher authority than component-level historical specifications.

---

## 5.2 Core Architectural Contracts — CANONICAL CANDIDATE / REQUIRES CONTRACT VERIFICATION

These components are architecturally central to the current Codessa design, but should not be treated as constitutional peers until their current specifications are explicitly registered and checked against the Kernel Constitution.

| ID | Component | Classification | Implementation status | Required next action |
|---|---|---|---|---|
| MCGL | Model/Causal Governance Ledger | CANONICAL CANDIDATE | Not yet verified in this map | Register current contract; verify invariants and enforcement boundary. |
| ECL | Epistemic Confidence Layer | CANONICAL CANDIDATE | Historical implementation exists; verification required | Register specification, vector-gate/verification material, and implementation evidence. |
| CEM | Canonical Event Model | CANONICAL CANDIDATE | Specification-level | Register event identity, provenance, replay, and canonicalization requirements. |
| ECR | Execution Contract | CANONICAL CANDIDATE | Schema/specification work exists | Verify against Kernel Constitution and execution boundary. |
| EAB | Epistemic Actuation Bridge | CANONICAL CANDIDATE | Specification-level | Register v1.0 contract and enforcement boundary. |

### Authority rule

These components may become canonical technical contracts, but their authority derives from the Kernel Constitution and approved governance—not from historical usage or implementation age.

---

## 5.3 Evidence / Epistemic Substrate

### ECL — Epistemic Confidence Layer

**Classification:** CANONICAL CANDIDATE  
**Role:** Epistemic evaluation and confidence gating.  
**Boundary:** ECL evaluates epistemic support; it does not independently become execution authority.

Known supporting material includes the ECL specification/implementation work and ECL Vector Gate verification material.

The current project doctrine is consistent with the principle that probabilistic inference must be evaluated before it can participate in authoritative state transition.

**Required verification:**

1. Confirm canonical claim/evidence model.
2. Confirm scoring/calibration semantics.
3. Confirm vector-gate semantics.
4. Confirm failure behavior.
5. Confirm interface with MCGL.
6. Confirm that confidence cannot bypass governance.

---

## 5.4 Authority / State Transition Substrate

### MCGL — Model/Causal Governance Ledger

**Classification:** CANONICAL CANDIDATE  
**Role:** Deterministic governance substrate for state transitions, policy, invariants, and authority decisions.

**Required verification:**

- deterministic state transition rules;
- invariant enforcement;
- authority boundary;
- event linkage;
- replay semantics;
- relationship to ECL and ECR;
- failure as an absorbing state where specified;
- recovery through explicit re-certification where specified.

---

## 5.5 Event / Provenance

### CEM — Canonical Event Model

**Classification:** CANONICAL CANDIDATE  
**Role:** Event/provenance substrate required to reconstruct state and establish what happened.

**Required verification:**

- event identity;
- canonical serialization/encoding;
- provenance lineage;
- ordering/causality semantics;
- replay;
- deterministic equivalence;
- relationship to governance decisions and execution receipts.

---

## 5.6 Execution

### ECR — Execution Contract

**Classification:** CANONICAL CANDIDATE  
**Role:** Explicit contract separating an authorized governance decision from executable operation.

**Required verification:**

- input/output schemas;
- authorization requirements;
- failure semantics;
- adapter boundary;
- deterministic receipt requirements;
- relationship to CEM and EAB.

### EAB — Epistemic Actuation Bridge

**Classification:** CANONICAL CANDIDATE  
**Role:** Carries an authorized decision from the epistemic/governance substrate into an execution environment.

**Authority rule:** EAB has no authority of its own. It may execute only an explicitly authorized execution contract.

**Required verification:**

- no provider authority leakage;
- execution authorization;
- receipt generation;
- failure containment;
- external side-effect boundary;
- replay/audit compatibility.

---

# 6. Extended Architecture — SPECIFIED / REQUIRES VERIFICATION

The following components belong in the broader architecture but should not be pulled into M0 merely because they exist in historical research.

| Component | Classification | Current treatment |
|---|---|---|
| CAM | SPECIFIED | Architecture candidate; contract/implementation status to be verified. |
| RKM | SPECIFIED | Architecture candidate; contract/implementation status to be verified. |
| OKM | SPECIFIED | Architecture candidate; contract/implementation status to be verified. |
| KASF | SPECIFIED | Acquisition/provenance perimeter; must not independently establish canonical Codessa state. |
| GAER | SPECIFIED | Evidence-acquisition primitive; retrieval structures have no epistemic authority. |
| Epistemic Dispute Resolution | SPECIFIED / CONFLICT REVIEW REQUIRED | Existing design proposes deterministic weighted arbitration and auditability enhancements; must be reconciled with kernel authority and semantic-stop policy before canonization. |
| Authority Routing | SPECIFIED | Must remain subordinate to kernel authority. |
| Blast-Radius Classification | SPECIFIED | Governance/execution safety mechanism; not independent authority. |
| Model / Provider Routing | SPECIFIED | External execution/inference substrate; provider outputs have no Codessa authority. |
| EAB Adapters | SPECIFIED | Execution implementations; must obey EAB/ECR contracts. |
| Autonomous Orchestration | SPECIFIED / DEFERRED FOR M0 | Broader system capability; not part of first deterministic kernel proof. |

---

# 7. Previously Implemented / Existing Capability — VERIFY BEFORE PROMOTION

Historical project work indicates implementation or substantial engineering activity in areas including:

- ECL claim/evidence/agreement/temporal/integrity/calibration pipeline;
- ECL Vector Gate and verification harness;
- database validation/testing;
- execution-contract schemas;
- CRGF validator/conformance work;
- memory/RAG infrastructure;
- repository governance tooling.

**Classification:** IMPLEMENTED evidence, not automatically CANONICAL kernel behavior.

### Acceptance rule

```text
Existing implementation
        ↓
Recovered into canonical repository
        ↓
Mapped to governing contract
        ↓
Validated against invariants
        ↓
Conformance tests pass
        ↓
Explicitly accepted
```

Until this sequence is satisfied, existing code must be treated as implementation evidence rather than normative authority.

---

# 8. Repository Governance — CANONICAL CANDIDATE

## CRGF — Codessa Repository Governance Framework

**Classification:** CANONICAL CANDIDATE / GOVERNANCE SUBSTRATE  
**Role:** Deterministic, event-sourced governance protocol for repository evolution.

CRGF is particularly important because the repository itself is intended to be the controlled implementation environment for AI-assisted development.

The target relationship is:

```text
Kernel Constitution
        ↓
CRGF Governance
        ↓
Repository State
        ↓
Authorized Change
        ↓
Validation / Conformance
        ↓
Commit
```

CRGF must not supersede the Kernel Constitution. It operationalizes repository governance under that authority.

---

# 9. Experimental / Research Material

The following areas should remain outside normative kernel authority unless explicitly promoted through the canonicalization process:

- MUSE and creative/audio intelligence;
- advanced autonomous-agent orchestration;
- experimental model routing;
- speculative cognitive substrate capabilities;
- marketplace/economic ecosystem;
- broader application products;
- provider-specific integrations;
- UI/product-layer experiments.

These may be valuable research and future system components. Their classification prevents implementation agents from treating them as kernel law.

---

# 10. Historical Material

Historical repositories and documents may include:

- earlier Codessa architectures;
- superseded agent architectures;
- memory-first architectures;
- previous product visions;
- abandoned implementations;
- obsolete repository structures;
- obsolete terminology;
- previous architectural experiments.

Historical material is retained for provenance and architectural evolution.

> **Historical material is evidence of how Codessa evolved, not authority over how Codessa is currently defined.**

---

# 11. Deferred for M0

The following are explicitly outside the first deterministic kernel proof unless separately authorized:

- full autonomous agents;
- multi-agent coordination;
- marketplace/economic mechanisms;
- production-scale memory;
- broad multimodal cognition;
- broad provider ecosystem;
- user-facing UI;
- optimization work that changes semantics;
- self-modification;
- large-scale deployment;
- autonomous recursive improvement.

M0 should prove the smallest meaningful governed transition before these capabilities are introduced.

---

# 12. M0 Boundary

## M0 — Deterministic Governed Transition

The first implementation target is not “build Codessa.”

It is to prove one complete governed transition:

```text
Input / Intent
      ↓
Claim / State Proposal
      ↓
Evidence
      ↓
ECL Evaluation
      ↓
MCGL Governance Decision
      ↓
Execution Contract
      ↓
Execution Adapter
      ↓
Result
      ↓
Canonical Event / Receipt
      ↓
Replay / Verification
```

The principal invariant to demonstrate is:

> **Equivalent input + equivalent evidence + equivalent contracts + equivalent state = equivalent governed result.**

No external model, provider, adapter, or projection may independently establish authoritative Codessa state.

---

# 13. AI Implementation-Agent Rules

An AI coding agent operating against this repository must:

1. Read `CONSTITUTION.md` before modifying normative artifacts.
2. Read `CANONICAL-KNOWLEDGE-MAP.md` before interpreting project documents.
3. Treat classification as an authority boundary.
4. Never infer canonical status from recency, implementation age, popularity, or model confidence.
5. Never silently reconcile conflicting normative claims.
6. Register unresolved conflicts.
7. Never promote experimental or historical material without explicit authorization.
8. Verify existing implementations against current contracts before treating them as accepted kernel behavior.
9. Preserve provenance for recovered material.
10. Demonstrate architectural understanding before implementing M0.
11. Do not modify implementation code during the initial Architecture Assimilation phase.
12. Treat external model/provider output as non-authoritative unless explicitly transformed and accepted through the kernel contracts.

---

# 14. Current Repository Recovery Targets

The following repositories are candidate evidence sources and must be audited before their material is promoted or merged:

- `AvaPrime/codessa-kernel` — current constitutional seed / canonical target.
- `AvaPrime/codessa-kernel-spec-v1.0` — specification evidence; reconcile against current kernel constitution.
- `AvaPrime/epistemic-kernel` — architectural/implementation evidence; recover and classify.
- `AvaPrime/codessa-os` — broader system evidence; recover and classify.

Repository identity does not determine architectural authority. The current Kernel Constitution determines normative authority.

---

# 15. Open Canonicalization Questions

These questions must remain OPEN until the underlying specifications are explicitly reviewed:

1. What exact version of MCGL is the current canonical contract?
2. What exact version of ECL is the current canonical contract?
3. What exact event model constitutes CEM?
4. What is the canonical ECR schema?
5. What is the canonical EAB contract and adapter boundary?
6. How is CRGF formally subordinated to the Kernel Constitution?
7. What is the exact M0 state machine?
8. Which existing implementations are sufficiently verified for recovery?
9. Which historical specifications conflict with current constitutional authority?
10. Which disputed-state mechanisms are normative versus experimental?

**These questions are not to be answered by inference.** They require specification review and, where necessary, explicit architecture decisions.

---

# 16. Canonicalization State

**Current state:** `PROVISIONAL`

**Next state:** `REVIEWED`

**Promotion condition:** Every normative component listed as a canonical candidate has an identified governing contract, authority path, implementation status, and conflict status.

**Final promotion:** Requires explicit repository governance action under the Kernel Constitution / CRGF process.

---

## 17. Governing Principle

> **The repository is not authoritative because it contains information. It is authoritative only where information has been explicitly admitted into the constitutional authority chain.**

This is the governing epistemic boundary for Codessa's implementation environment and for any AI agent operating within it.

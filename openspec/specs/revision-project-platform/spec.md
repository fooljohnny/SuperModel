# Capability Spec: Revision Project Platform

## Purpose

Provide the shared platform services required for project identity, revision
lifecycles, asset references, and release gating across all MVP engineering
modules.

## Scope

- project and workspace records
- revision creation and promotion
- asset reference binding
- approval and release-state tracking
- cross-module change impact visibility

## Functional requirements

### Requirement: Revision lifecycle management

The system MUST provide revision records that serve as the authoritative context
for import, graph edits, decomposition, verification, and export.

#### Scenario: Create a working revision

- **WHEN** a user starts a new engineering iteration for a product
- **THEN** the system creates a new `DesignRevision`
- **AND** records parent revision lineage, author, and lifecycle state.

### Requirement: Cross-module release gating

The system MUST allow downstream modules to check whether entities are imported,
structured, engineered, verified, or released.

#### Scenario: Block export from an unverified revision

- **WHEN** a tooling export is attempted from a revision with unresolved blocking
  verification results
- **THEN** the system rejects release promotion
- **AND** explains which module outputs remain unresolved.

### Requirement: Asset and artifact references

The system MUST manage stable references to source files, normalized geometry,
verification artifacts, and export packages.

#### Scenario: Resolve a revision artifact

- **WHEN** a user opens a previously generated verification report or tooling
  package
- **THEN** the system resolves the artifact from a stable reference
- **AND** preserves the link to the originating revision and module.

### Requirement: Change impact visibility

The system MUST expose stale, recompute-required, and invalid states generated
by upstream changes.

#### Scenario: Observe downstream impact after an edit

- **WHEN** source geometry or part structure changes in a revision
- **THEN** the system displays impacted downstream modules and entities
- **AND** records the impact state in a revision-safe way.

## Dependencies

- `product-platform`

## Downstream consumers

- `source-geometry-import`
- `assembly-part-graph`
- `part-decomposition`
- `connector-engineering`
- `verification-workbench`
- `runner-tooling-export`

## Non-functional requirements

- Revision state transitions MUST be auditable.
- Artifact references MUST remain stable across asynchronous jobs.
- The platform MUST support collaborative review without weakening deterministic
  engineering release rules.

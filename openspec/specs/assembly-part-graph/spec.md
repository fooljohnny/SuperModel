# Capability Spec: Assembly Part Graph

## Goal

Provide the canonical revisioned graph that links imported source geometry,
assembly hierarchy, manufacturable part definitions, and downstream engineering
artifacts.

## Why this capability exists

The product's core differentiator is not isolated modeling operations, but the
ability to preserve associativity between upstream shape sources, split parts,
connectors, verification results, and tooling outputs. That requires a stable
assembly/part graph as the source of truth.

## Actors

- Structural engineer
- Mechanical/CAD engineer
- Manufacturing engineer
- Automation service

## Core entities

- `DesignRevision`
- `AssemblyNode`
- `PartDefinition`
- `PartInstance`
- `SourceGeometry`
- `ChangeImpactState`

## Functional requirements

### Requirement: Revisioned assembly hierarchy

The system MUST persist a revisioned hierarchy of assemblies, subassemblies, and
part instances for every active design program.

#### Scenario: Create a hierarchy from imported geometry

- **WHEN** a user imports source geometry and groups it into an assembly
  structure
- **THEN** the system creates `AssemblyNode` records with stable IDs
- **AND** associates each node with the active `DesignRevision`.

### Requirement: Manufacturable part definitions

The system MUST represent manufacturable parts separately from visual or source
geometry nodes.

#### Scenario: Track a split part

- **WHEN** a user creates a new split part from one or more source geometry
  regions
- **THEN** the system stores a `PartDefinition`
- **AND** links it to the originating `SourceGeometry` and `AssemblyNode`
- **AND** preserves that association across later revisions.

### Requirement: Stable identifiers for downstream reuse

The system MUST assign stable identifiers to parts and part instances so runner,
verification, and export modules can reference them without ambiguity.

#### Scenario: Reuse a part in downstream outputs

- **WHEN** a runner sheet or tooling package includes a part
- **THEN** the included part reference uses the canonical part ID and revision ID
- **AND** the relationship remains traceable after exports are generated.

### Requirement: Change impact propagation

The system MUST detect when upstream geometry or structure changes invalidate or
stale downstream artifacts.

#### Scenario: Edit an upstream source region

- **WHEN** a source geometry region referenced by a part changes
- **THEN** the system marks dependent `PartDefinition`, `ConnectorInstance`,
  `VerificationResult`, `RunnerSheet`, and `ToolingExportPackage` nodes as
  recompute-required, stale, or invalid
- **AND** exposes that impact state to the user before release.

### Requirement: Variant-aware structure

The system SHOULD support product variants and optional subassemblies without
forking the entire project graph.

#### Scenario: Create a variant-specific armor part

- **WHEN** a user creates a variant with an alternate part for a subassembly
- **THEN** the graph stores variant-scoped assembly and part relationships
- **AND** preserves shared references for unchanged nodes.

## Non-functional requirements

- Graph operations MUST support thousands of parts without losing interactive
  usability.
- Graph mutations MUST be audit-loggable and deterministic.
- Downstream modules MUST be able to consume graph snapshots without re-reading
  raw source files.

## Dependencies

- `source-geometry-import`
- `product-platform`

## Downstream consumers

- `part-decomposition`
- `connector-engineering`
- `verification-workbench`
- `runner-tooling-export`

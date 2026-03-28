# Capability Spec: Part Decomposition

## Purpose

Provide deterministic tools for converting imported source geometry into
manufacturable parts while preserving upstream traceability and supporting
downstream connector, verification, and runner workflows.

## Scope

- part split definition
- split-line and split-surface authoring
- shelling and wall-thickness controls
- color-separation and pre-paint segmentation markers
- associativity between source geometry and derived parts

## Requirements

### Requirement: Create manufacturable parts from source geometry

The system MUST allow a user to derive manufacturable part definitions from one
or more source geometry regions.

#### Scenario: Split a torso into outer armor and inner frame

- **WHEN** a structural engineer selects source geometry regions and defines
  split boundaries
- **THEN** the system creates distinct derived parts for the selected regions
- **AND** records the split definition, boundary references, and derivation
  provenance
- **AND** binds the derived parts back to the current design revision.

### Requirement: Support manual and assisted split authoring

The system MUST support both manual split authoring and assisted split proposals
without hiding the final deterministic split definition.

#### Scenario: Accept an assisted split proposal with edits

- **WHEN** the system proposes a candidate split boundary
- **AND** the user modifies that proposal before acceptance
- **THEN** the accepted split definition stores the final user-approved
  boundaries
- **AND** the persisted split artifact remains deterministic and reviewable.

### Requirement: Maintain upstream associativity

Derived parts MUST remain associated with the source geometry and split logic
that created them.

#### Scenario: Source geometry changes after parts were split

- **WHEN** the upstream source geometry changes in a way that affects a split
  region
- **THEN** the impacted derived parts are marked stale or invalid
- **AND** downstream connectors, verification results, and runner assignments are
  marked for recomputation or review.

### Requirement: Support shelling and wall-thickness controls

The system MUST support explicit shelling and wall-thickness settings on derived
parts.

#### Scenario: Define shell thickness for a large armor piece

- **WHEN** a user sets shelling behavior and target wall thickness for a part
- **THEN** the part definition stores those parameters in a revisioned form
- **AND** downstream manufacturability and tooling workflows can consume them.

### Requirement: Support color-separation markers

The system SHOULD support color-separation and pre-paint markers that influence
part decomposition decisions.

#### Scenario: Separate a face component for pre-painted assembly

- **WHEN** the user marks a geometry region as requiring color separation or
  pre-paint treatment
- **THEN** the system allows that marker to guide split decisions
- **AND** records the marker in the part decomposition data model.

## Inputs

- normalized source geometry
- active design revision
- user-authored split boundaries
- optional assisted split proposals
- material and finish intent

## Outputs

- part definitions
- split definitions
- shelling and wall-thickness parameters
- associativity links to source geometry
- decomposition warnings or review flags

## Dependencies

- `source-geometry-import`
- `assembly-part-graph`
- `revision-project-platform`

## Non-functional requirements

- split operations MUST be replayable from persisted definitions
- part derivation provenance MUST be auditable
- recomputation impact MUST be traceable to specific upstream changes

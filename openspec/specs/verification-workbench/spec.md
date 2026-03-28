# Capability Spec: Verification Workbench

## Purpose

Provide deterministic engineering validation for split parts, connectors, joints,
and runner-ready assemblies before tooling handoff.

## Scope

- Interference detection
- Tolerance review and override
- Motion-range simulation
- Assembly-path validation for critical joins
- Traceable validation reports bound to design revisions

## Functional requirements

### Requirement: Interference analysis

The system MUST detect clashes between parts, connectors, and motion envelopes
within a selected design revision.

#### Scenario: Check a decomposed arm assembly

- **WHEN** a user runs interference analysis on a subassembly
- **THEN** the system evaluates part geometry, connector geometry, and configured
  transforms
- **AND** records each clash with location, severity, and impacted entities.

### Requirement: Tolerance review

The system MUST evaluate connector and joint clearances against material-aware
tolerance profiles and allow controlled manual override.

#### Scenario: Review a peg-and-socket fit

- **WHEN** a connector instance is evaluated with a selected material profile
- **THEN** the system reports whether the nominal fit is loose, acceptable, or
  over-constrained
- **AND** stores both the computed result and any approved manual adjustment.

### Requirement: Motion validation

The system MUST simulate configured motion constraints and report blocked ranges,
over-travel, and collision intervals.

#### Scenario: Validate a hinged shoulder

- **WHEN** a user evaluates a hinge joint with a requested rotation range
- **THEN** the system computes reachable motion states
- **AND** flags collisions, insufficient clearances, and invalid connector
  behavior.

### Requirement: Assembly-path checks

The system SHOULD validate insertion and assembly order constraints for critical
connectors where access direction materially affects manufacturability or user
assembly success.

#### Scenario: Validate snap-fit insertion direction

- **WHEN** a connector is marked as assembly-critical
- **THEN** the system evaluates whether an insertion path remains available
- **AND** reports blocked access or excessive deformation requirements.

### Requirement: Revision-bound verification artifacts

The system MUST store verification outcomes as revision-bound artifacts with
traceable assumptions.

#### Scenario: Compare verification across revisions

- **WHEN** a new design revision modifies parts or connectors
- **THEN** prior verification results become stale or invalid according to
  dependency rules
- **AND** the user can compare old and new validation outcomes.

## Non-functional requirements

- Verification results MUST be reproducible from a given revision snapshot.
- Long-running validation jobs SHOULD support async execution and status
  reporting.
- Critical validation failures MUST block tooling export promotion.

## Dependencies

- `revision-project-platform`
- `assembly-part-graph`
- `part-decomposition`
- `connector-engineering`

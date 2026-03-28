## ADDED Requirements

### Requirement: Deterministic engineering verification workspace

The system MUST provide a verification workspace that evaluates part, connector,
and joint states against deterministic engineering checks before runner release
or tooling export.

#### Scenario: Run verification on an edited revision

- **WHEN** a user modifies part geometry, connector placements, or joint
  constraints
- **THEN** the system recomputes impacted interference, tolerance, and motion
  checks
- **AND** each result is linked to the revision and target entities that produced
  it.

### Requirement: Release blocking by verification status

The system MUST prevent runner export and tooling package release when blocking
verification findings remain unresolved or explicitly waived.

#### Scenario: Attempt export with blocking interference

- **WHEN** a user attempts to export tooling data for a revision with unresolved
  blocker-severity interference results
- **THEN** the export is rejected
- **AND** the system identifies the blocking checks and the entities involved.

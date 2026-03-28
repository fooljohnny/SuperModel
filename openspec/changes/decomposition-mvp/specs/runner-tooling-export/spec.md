## ADDED Requirements

### Requirement: Release-critical runner and tooling export workflow

The decomposition-first MVP MUST support runner preparation and release-ready
tooling exports as first-class outcomes of approved structural revisions.

#### Scenario: Produce release package for tooling handoff

- **WHEN** a manufacturing engineer selects an approved structural revision
- **THEN** the system allows grouping parts into runner sheets and tooling export
  packages
- **AND** the generated package contains revision identifiers, included parts,
  export-format metadata, and engineering annotations suitable for CNC or mold
  review workflows.

### Requirement: Manufacturing output prioritization

The MVP MUST treat the following outputs as release-critical deliverables:

- part structural design data
- runner sheet data
- CNC and mold-processing packages

#### Scenario: Evaluate MVP completeness for a pilot customer

- **WHEN** the team assesses whether a workflow is complete for the first
  commercial pilot
- **THEN** success is measured against structural and tooling handoff outcomes
- **AND** consumer-facing instruction automation is not required to consider the
  MVP usable.

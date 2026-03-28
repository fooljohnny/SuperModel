# Capability Spec: Runner Tooling Export

## Goal

Turn approved part structures into runner-oriented manufacturing groupings and
release-ready export packages for tooling and CNC workflows.

## Scope

- Group parts into runner sheets or board plans
- Capture gate strategy and runner topology metadata
- Associate manufacturing annotations with parts and runner groupings
- Produce export packages for downstream tooling and CNC review

## Functional requirements

### Requirement: Runner sheet definition

The system MUST allow the user to create runner sheets from approved part
definitions and manufacturing constraints.

#### Scenario: Create a runner sheet candidate

- **WHEN** the user selects manufacturable parts and runner constraints
- **THEN** the system creates a runner sheet candidate with assigned parts,
  sheet identity, and scoring metadata
- **AND** the candidate remains traceable to the design revision and part
  definitions it includes.

### Requirement: Gate and grouping guidance

The system SHOULD provide gate and grouping guidance to support later detailed
runner engineering.

#### Scenario: Request guidance for a new runner sheet

- **WHEN** a runner sheet is first created
- **THEN** the system suggests gate strategy, part grouping, and balance
  indicators
- **AND** the user can override the guidance before release.

### Requirement: Manufacturing package export

The system MUST export manufacturing packages for runner/tooling workflows.

#### Scenario: Export a tooling package

- **WHEN** the user approves a runner sheet and selects an export profile
- **THEN** the system generates a tooling export package with referenced parts,
  runner metadata, export format, and release status
- **AND** the resulting artifact is versioned against the source design
  revision.

### Requirement: Export package integrity

The system MUST reject export attempts when source entities are stale or blocked
by unresolved verification issues.

#### Scenario: Prevent invalid manufacturing release

- **WHEN** a runner sheet contains parts with blocking verification failures or
  stale upstream dependencies
- **THEN** the system prevents release-state export
- **AND** explains which entities must be resolved first.

## Data requirements

- `RunnerSheet`
- `PartDefinition`
- `ToolingExportPackage`
- `VerificationResult`
- export profile metadata

## Dependencies

- `assembly-part-graph`
- `part-decomposition`
- `verification-workbench`

## Out of scope for MVP

- full automatic runner geometry synthesis for all mold classes
- direct CAM toolpath generation
- end-to-end mold base design

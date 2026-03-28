# Capability Spec: Connector Engineering

## Purpose

Provide reusable engineering knowledge and placement workflows for pegs, sockets,
snap-fits, ribs, and reinforcement features used in assembly-model products.

## Scope

- Connector template libraries
- Connector placement and attachment logic
- Semi-automatic connector suggestions
- Material-aware fit presets
- Manual locking and override workflows

## Requirements

### Requirement: Connector template library

The system MUST provide reusable connector templates with geometry intent,
material assumptions, and fit behavior.

#### Scenario: Select a standard peg template

- **WHEN** a structural engineer inserts a peg connector
- **THEN** the system offers standard template families with default dimensions,
  fit classes, and supported material constraints
- **AND** the chosen template becomes traceable on every placed connector
  instance.

### Requirement: Connector placement between parts

The system MUST support placing connectors between derived parts and binding
those placements to revisioned part geometry.

#### Scenario: Place a connector across split parts

- **WHEN** a user selects two compatible part faces or placement references
- **THEN** the system creates a connector instance bound to both parts
- **AND** the connector stores position, orientation, and dimensional overrides.

### Requirement: Semi-automatic connector suggestions

The system SHOULD suggest connector placements based on split topology, part
size, load assumptions, and assembly intent.

#### Scenario: Suggest connectors after part splitting

- **WHEN** a user requests connector suggestions for a newly split region
- **THEN** the system proposes one or more connector placements
- **AND** each suggestion includes rationale such as retention strength,
  manufacturability, and assembly accessibility.

### Requirement: Material-aware fit presets

The system MUST apply fit presets that consider material family and expected
assembly behavior.

#### Scenario: Change material profile

- **WHEN** a connector family is evaluated under a different material profile
- **THEN** the system recalculates recommended clearances and fit settings
- **AND** flags connectors whose existing geometry is no longer within policy.

### Requirement: Manual locking and override

The system MUST allow engineers to lock connector geometry or override suggested
dimensions when business or engineering constraints require it.

#### Scenario: Preserve a manually tuned connector

- **WHEN** a user marks a connector instance as locked
- **THEN** downstream automatic regeneration preserves that connector unless the
  underlying geometry becomes invalid
- **AND** the system records the reason for the lock or override.

## Data expectations

- Inputs:
  - `PartDefinition`
  - `SplitDefinition`
  - `MaterialProfile`
  - `ToleranceProfile`
- Outputs:
  - `ConnectorTemplate`
  - `ConnectorInstance`
  - manufacturability annotations

## Dependencies

- `assembly-part-graph`
- `part-decomposition`
- `revision-project-platform`

## Non-functional requirements

- Placement operations MUST support deterministic replay across revisions.
- Suggested connectors SHOULD explain why they were chosen.
- Connector libraries MUST be extensible by company-specific standards.

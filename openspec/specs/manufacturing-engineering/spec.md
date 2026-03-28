# Capability: Manufacturing Engineering

## Goal

Support assembly-model manufacturing preparation from runner planning through
trial-shot validation, tolerance iteration, and manufacturability optimization.

## Stakeholders

- Mold and tooling engineers
- DFM and process engineers
- Product managers balancing quality and cost

## Requirements

### Requirement: Deep CAE integration

The system SHALL support integration with professional mold-flow and tooling
simulation workflows, and MUST preserve traceable inputs, outputs, and solver
assumptions for each engineering revision.

#### Scenario: Submit a mold-flow verification job

- **WHEN** an engineer approves a runner candidate and material profile
- **THEN** the system packages geometry, gates, process assumptions, and material
  metadata for an external or embedded CAE solver
- **AND** records the simulation request and returned findings against the active
  manufacturing revision.

### Requirement: Runner and sprue planning

The system SHALL allow the user to group parts into runner assemblies with
configurable gates, balancing heuristics, and board-count constraints.

#### Scenario: Generate initial runner proposal

- **WHEN** a user selects a set of parts and manufacturing constraints
- **THEN** the system proposes one or more runner layouts
- **AND** each proposal records estimated fill balance, waste ratio, and mold
  complexity indicators.

### Requirement: Tolerance and interference verification

The system SHALL support tolerance inspection, interference analysis, and manual
plus automated fit adjustments for joints and connectors.

#### Scenario: Review an articulation joint

- **WHEN** a designer evaluates a rotating or sliding joint
- **THEN** the system simulates the motion envelope
- **AND** flags collisions, over-constrained zones, and tolerance risks.

### Requirement: Material-aware manufacturability checks

The system SHALL model material-specific properties including shrinkage, wall
thickness sensitivity, and pre-paint or coating allowances.

#### Scenario: Compare hard and soft plastic assumptions

- **WHEN** the same connector design is evaluated with ABS and TPU profiles
- **THEN** the system reports different manufacturability and shrinkage outcomes
- **AND** retains traceable assumptions behind each result.

### Requirement: Export for downstream tooling

The system SHALL export manufacturing outputs for CNC, mold review, and 3D print
verification workflows using industry-compatible formats.

#### Scenario: Export runner and tooling data

- **WHEN** the user approves a runner design
- **THEN** the system generates export packages for tooling workflows
- **AND** includes geometry, metadata, version, and manufacturing annotations.

### Requirement: First-release output priority

The first release SHALL prioritize manufacturing outputs for structural part
engineering, runner assemblies, and CNC or mold-processing handoff ahead of
consumer-facing instruction artifacts.

#### Scenario: Promote a release candidate for factory handoff

- **WHEN** a project reaches first-release readiness
- **THEN** the system produces exportable part-structure data, runner data, and
  CNC or mold-processing data as the required deliverables
- **AND** treats instruction or presentation outputs as optional secondary
  artifacts.

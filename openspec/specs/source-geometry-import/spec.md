# Capability Spec: Source Geometry Import

## Purpose

Provide deterministic import, normalization, and revision binding for upstream
geometry originating from sculpting and CAD ecosystems.

## Why this exists

The first product slice depends on treating imported geometry as the upstream
truth. ZBrush-led sculpt data is the first interoperability priority, followed
by SolidWorks and Siemens NX. The system must ingest those sources without
breaking traceability into downstream part decomposition and tooling workflows.

## Requirements

### Requirement: Revision-bound geometry import

The system MUST import external geometry into a `DesignRevision` and create one
or more `SourceGeometry` records with stable identity and provenance metadata.

#### Scenario: Import ZBrush-origin source geometry

- **WHEN** a user imports geometry exported from ZBrush
- **THEN** the system records the source system as `zbrush`
- **AND** creates normalized geometry artifacts usable by decomposition and
  viewport subsystems
- **AND** stores source file references, units, topology fingerprint, and import
  diagnostics.

#### Scenario: Import CAD geometry with provenance

- **WHEN** a user imports geometry originating from SolidWorks or Siemens NX
- **THEN** the system records the declared source system and file origin
- **AND** preserves import-time assumptions such as units, axis conversion, and
  tolerance settings
- **AND** binds those assumptions to the revision audit trail.

### Requirement: Adapter-priority execution order

The platform MUST implement and maintain import adapters in the approved
priority order unless a documented change supersedes it:
ZBrush, SolidWorks, Siemens NX, Blender, Maya, STEP, Parasolid, IGES, FBX,
glTF.

#### Scenario: Choose next adapter

- **WHEN** the team plans the next supported import adapter
- **THEN** the default choice follows the approved interoperability order
- **AND** any deviation is documented in an OpenSpec change or ADR.

### Requirement: Internal geometry normalization

The system MUST normalize imported geometry into internal representations that
support mesh, B-rep, or hybrid downstream workflows without discarding
provenance.

#### Scenario: Normalize mixed geometry inputs

- **WHEN** a project contains both sculpt meshes and CAD-derived solids
- **THEN** the system stores a normalized geometry descriptor for each import
- **AND** makes the geometry addressable by the assembly-part graph
- **AND** retains the original source-system metadata and artifact links.

### Requirement: Import diagnostics and gating

The system MUST report import diagnostics and prevent invalid geometry from
entering release-critical downstream flows without review.

#### Scenario: Import produces recoverable issues

- **WHEN** imported geometry contains non-fatal issues such as unit ambiguity or
  open surfaces
- **THEN** the system marks the import with warnings
- **AND** records suggested remediation steps
- **AND** allows the user to continue with explicit acknowledgement.

#### Scenario: Import produces blocking issues

- **WHEN** imported geometry cannot be normalized into a usable internal form
- **THEN** the system marks the import as failed
- **AND** prevents decomposition, connector placement, and tooling export from
  using that geometry until the issue is resolved.

## Inputs

- source geometry files and companion metadata
- import profile options
- revision context

## Outputs

- `SourceGeometry`
- normalized geometry artifacts
- import diagnostics
- provenance metadata

## Dependencies

- product platform revision model
- storage for raw and normalized artifacts
- assembly-part graph capability

## Non-functional requirements

- Import operations MUST be replayable for audit and debugging.
- Large geometry imports SHOULD stream progress and diagnostics.
- Import normalization MUST preserve enough fidelity for downstream structural
  engineering decisions.

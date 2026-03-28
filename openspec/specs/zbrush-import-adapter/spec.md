# Capability Spec: ZBrush Import Adapter

## Purpose

Define the contract for importing ZBrush-led sculpt data into the SuperModel
revision pipeline as the first-priority interoperability path.

## Scope

- accepted ZBrush-origin package forms
- subtool and naming normalization
- coordinate and unit mapping
- import diagnostics and artifact creation
- mapping from sculpt structures into `SourceGeometry` and assembly graph inputs

## Requirements

### Requirement: ZBrush import package declaration

The system MUST accept a declared import package for ZBrush-origin geometry with
explicit metadata describing export assumptions.

#### Scenario: Submit a ZBrush package

- **WHEN** a user uploads one or more files exported from a ZBrush-led workflow
- **THEN** the import request records source-system `zbrush`
- **AND** binds the request to an import profile containing unit assumptions,
  coordinate orientation, and naming rules.

### Requirement: Subtool normalization

The system MUST normalize ZBrush subtools into deterministic source geometry and
hierarchy records.

#### Scenario: Import a multi-subtool character

- **WHEN** the source package contains multiple subtools
- **THEN** each subtool becomes one or more normalized `SourceGeometry` entities
- **AND** the system records original subtool names, normalized labels, and
  parent-child hierarchy where available.

### Requirement: Mesh-origin diagnostics

The system MUST report diagnostics specific to sculpt-origin mesh workflows.

#### Scenario: Detect non-manifold or open surfaces

- **WHEN** a ZBrush-origin mesh contains topology conditions that may block
  structural decomposition
- **THEN** the system records diagnostics with severity, affected geometry
  references, and suggested remediation
- **AND** marks the import as warning or failed according to severity policy.

### Requirement: Revision-safe import artifacts

The system MUST preserve raw ZBrush source artifacts and normalized artifacts as
stable revision-bound references.

#### Scenario: Reopen a prior ZBrush import

- **WHEN** a user inspects an existing revision
- **THEN** the system resolves both the raw uploaded artifact and the normalized
  import artifact set
- **AND** exposes the normalization profile used during import.

## Accepted contract concepts

- `ZBrushImportRequest`
- `ZBrushImportProfile`
- `SubtoolMapping`
- `ImportDiagnostic`
- `NormalizedGeometryArtifact`

## Dependencies

- `revision-project-platform`
- `data-contracts`
- `source-geometry-import`

## Non-functional requirements

- Import results MUST be deterministic for identical source artifacts and import
  profiles.
- The adapter SHOULD support asynchronous execution with progressive diagnostics.
- The adapter MUST preserve enough naming and hierarchy information to support
  later assembly-part graph authoring.

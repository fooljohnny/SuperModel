## ADDED Requirements

### Requirement: Tooling export package manifest

The first implementation of manufacturing release MUST emit a structured tooling
export manifest that captures revision identity, included entities, export
profile, and release gating evidence.

#### Scenario: Emit a release-ready manifest

- **WHEN** a tooling package is generated for CNC or mold-review handoff
- **THEN** the package includes a manifest with the source `revision_id`,
  `runner_sheet_id`, included part IDs, export profile, artifact references, and
  verification summary
- **AND** the manifest is machine-readable by downstream tooling workflows.

### Requirement: Block release export on unresolved engineering state

Tooling export MUST reject release-state packages when required verification or
revision gates are unresolved.

#### Scenario: Prevent an incomplete CNC package

- **WHEN** a package contains stale parts or blocking verification failures
- **THEN** the export remains in a blocked or failed state
- **AND** the manifest records the blocking entities and reasons.

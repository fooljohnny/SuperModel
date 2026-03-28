## ADDED Requirements

### Requirement: Canonical cross-runtime entity contracts

The platform MUST define canonical entity contracts for the MVP domain objects so
desktop clients, Rust core libraries, backend services, and export pipelines use
compatible field names, identifiers, and revision semantics.

#### Scenario: Serialize a part definition across runtimes

- **WHEN** a `PartDefinition` is created in the authoring workflow
- **THEN** the serialized representation preserves canonical IDs, revision
  binding, geometry references, and structural parameters
- **AND** the same representation is consumable by UI, validation, and export
  modules without ad hoc field translation.

### Requirement: Revision-bound entity ownership

All mutable MVP entities MUST explicitly bind to a `DesignRevision` or be marked
as reusable library data.

#### Scenario: Persist an export package

- **WHEN** a `ToolingExportPackage` is stored
- **THEN** the entity records the source revision and referenced entities
- **AND** downstream consumers can determine whether the package is current,
  stale, or invalid.

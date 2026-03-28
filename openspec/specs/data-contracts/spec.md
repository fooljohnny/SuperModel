# Capability Spec: Data Contracts

## Purpose

Define the canonical cross-runtime contracts for revision, geometry, assembly,
parts, connectors, verification, runner sheets, and tooling export so desktop,
services, storage, and import/export adapters all operate on the same
engineering model.

## Scope

- canonical entity schemas
- identity and provenance rules
- artifact reference structure
- change impact metadata
- cross-runtime serialization boundaries

## Requirements

### Requirement: Canonical revision-bound entity schemas

The platform MUST define canonical schemas for the MVP entities used across
desktop, services, storage, and exports.

The initial schema set MUST include:

- `Product`
- `DesignRevision`
- `SourceGeometry`
- `AssemblyNode`
- `PartDefinition`
- `SplitDefinition`
- `ConnectorTemplate`
- `ConnectorInstance`
- `JointDefinition`
- `MaterialProfile`
- `ToleranceProfile`
- `VerificationResult`
- `RunnerSheet`
- `ToolingExportPackage`

#### Scenario: Serialize a part definition for multiple consumers

- **WHEN** a part definition is saved, displayed in the desktop UI, and included
  in a downstream export
- **THEN** each consumer reads the same canonical identifiers and field meanings
- **AND** no consumer invents a separate incompatible part schema.

### Requirement: Stable identifiers and artifact references

The platform MUST use stable IDs and artifact references so derived objects and
async jobs remain traceable across revisions.

#### Scenario: Resolve an export package artifact

- **WHEN** a tooling export package is retrieved after asynchronous generation
- **THEN** the system resolves it using canonical IDs and artifact references
- **AND** the package can be traced back to the originating revision and included
  entities.

### Requirement: Explicit impact-state metadata

The platform MUST represent whether entities are valid, stale,
recompute-required, blocked, or released.

#### Scenario: Mark downstream objects stale

- **WHEN** upstream source geometry changes
- **THEN** dependent parts, connectors, verification results, and export packages
  receive updated impact-state metadata
- **AND** downstream services consume those states without re-deriving them from
  scratch.

### Requirement: Cross-runtime serialization compatibility

The platform MUST define serialization rules that can be represented in Rust,
TypeScript, persistence storage, and job payloads without ambiguity.

#### Scenario: Send a verification job request

- **WHEN** a verification job is submitted from the desktop client to a service
- **THEN** the request payload uses canonical field names, identifiers, enum
  values, and artifact references
- **AND** the receiving runtime can validate it without custom translation logic
  per client.

## Non-functional requirements

- Canonical schemas MUST be versionable.
- Contract changes MUST be auditable through OpenSpec and revision history.
- Contracts SHOULD support additive evolution without forcing immediate rewrite
  of all downstream consumers.

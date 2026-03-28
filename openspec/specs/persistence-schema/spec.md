# Capability Spec: Persistence Schema

## Purpose

Define the first PostgreSQL persistence model for the decomposition-first MVP so
contracts, revision lifecycle rules, jobs, and engineering entities can be
stored in a deterministic and auditable way.

## Scope

- PostgreSQL metadata schema
- revision-scoped engineering entity storage
- artifact registry tables
- job and audit tables
- relational integrity boundaries

## Requirements

### Requirement: Revision-scoped engineering rows

The persistence layer MUST support storing multiple versions of the same logical
engineering entity across different revisions.

#### Scenario: Persist the same part across two revisions

- **WHEN** a part with logical ID `part_A1` exists in revision `R1`
- **AND** that part is copied or updated in revision `R2`
- **THEN** the database stores distinct row versions for each revision
- **AND** both rows remain queryable without mutating the original revision
  snapshot.

### Requirement: Artifact registry separation

The persistence layer MUST store artifact metadata in PostgreSQL while large
binary payloads remain in object storage.

#### Scenario: Resolve a normalized geometry artifact

- **WHEN** a source geometry import completes
- **THEN** the database stores artifact metadata and stable references
- **AND** the geometry payload itself remains outside the relational database.

### Requirement: Relational integrity for release-critical references

The persistence layer MUST enforce foreign-key integrity for revision, part,
connector, verification, runner, and export relationships that influence release
gating.

#### Scenario: Prevent an export package from referencing a missing runner sheet

- **WHEN** a tooling export package attempts to reference a runner sheet row that
  does not exist for the export revision
- **THEN** the database rejects the relationship write
- **AND** the service can surface a deterministic error.

### Requirement: Auditability of mutation and lifecycle changes

The persistence layer MUST support append-only audit events for revision
promotion, import jobs, engineering edits, waivers, and export generation.

#### Scenario: Inspect the history of a released export

- **WHEN** an engineer reviews a released tooling package
- **THEN** the system can retrieve the revision lineage, relevant entity changes,
  and export-generation events from persisted audit records.

## Dependencies

- `data-contracts`
- `revision-project-platform`
- `tooling-export-contract`

## Non-functional requirements

- The schema SHOULD keep common revision reads straightforward.
- Release-critical relationships MUST be queryable without reconstructing the
  entire graph from events alone.
- The first schema MAY use JSONB for bounded flexible payloads, but core entity
  identity and references MUST remain relational.

## ADDED Requirements

### Requirement: Revision-scoped persistence schema

The platform MUST provide a PostgreSQL-oriented persistence schema that stores
revision-bound engineering rows, artifact references, jobs, and audit events.

#### Scenario: Persist multiple versions of the same logical part

- **WHEN** the same logical `part_id` appears in two different design revisions
- **THEN** the database stores separate row versions for each revision
- **AND** the schema preserves the stable logical ID without mutating earlier
  released data in place.

### Requirement: Artifact registry and release traceability

The persistence layer MUST store artifact metadata separately from object storage
payloads and make release packages traceable to revision-scoped entities.

#### Scenario: Resolve a released tooling package

- **WHEN** a tooling export package is loaded from persistence
- **THEN** the system resolves artifact metadata, included entities, and revision
  references from the database
- **AND** the package remains auditable without reading unrelated working data.

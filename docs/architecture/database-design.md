# Database Design for the MVP

## 1. Purpose

Translate the approved contracts, revision state machine, and API surface into a
database design suitable for the first PostgreSQL-backed implementation.

This design is intentionally optimized for:

- revision-bound engineering entities
- deterministic release and audit flows
- append-oriented change tracking
- artifact-heavy workflows where large binary payloads live outside the database

It is not intended to be the final enterprise-scale storage design. It is the
first persistence model that makes the MVP implementation practical.

## 2. Database principles

1. PostgreSQL stores metadata, graph relationships, lifecycle state, and
   release/audit records.
2. Binary geometry, previews, reports, and export bundles live in object storage.
3. Most engineering entities are stored as revision-bound rows instead of being
   mutated in place across revisions.
4. Stable logical IDs identify an engineering object family; row-level IDs track
   database records.
5. JSONB is allowed for bounded flexible payloads such as assumptions,
   dimensions, and diagnostics, but core relationships remain relational.
6. Release-critical integrity should be checkable with SQL and service-layer
   validation together.

## 3. Storage layers

### 3.1 Metadata layer

Stores:

- projects
- revisions
- lifecycle state
- approvals
- audit events
- job metadata

### 3.2 Engineering entity layer

Stores:

- source geometries
- assembly nodes
- part definitions
- split definitions
- connector templates and instances
- joint definitions
- verification results
- runner sheets
- tooling export packages

### 3.3 Artifact registry layer

Stores references to object storage artifacts:

- uploaded source files
- normalized geometry
- previews
- verification reports
- export packages
- manifests

### 3.4 Event and job layer

Stores:

- import jobs
- verification jobs
- tooling export jobs
- lifecycle events
- stale/invalid propagation events

## 4. Revision-bound persistence strategy

## 4.1 Stable logical IDs vs physical keys

Each engineering object should have:

- a logical ID used across revisions, APIs, and exports
- a database row ID for storage internals

For the MVP SQL draft, revision-scoped tables should use:

- `*_id TEXT NOT NULL` for stable public/logical identifiers
- `revision_id TEXT NOT NULL` as part of the physical primary key

Recommended MVP pattern:

- `PRIMARY KEY(entity_id, revision_id)`
- `UNIQUE(revision_id, code_or_name)` where a human-readable code must remain
  unique inside one revision

Example:

- `part_definitions.part_id` -> stable logical engineering ID
- `part_definitions.revision_id` -> snapshot scope
- `PRIMARY KEY(part_id, revision_id)` -> physical storage identity

This keeps revision semantics explicit in the first schema draft. A later
optimization may introduce surrogate row IDs if query-planning or storage volume
requires it.

## 4.2 Why revision-bound rows

The MVP must support:

- comparing revisions
- stale/invalid propagation
- release reproducibility
- export package traceability

Therefore the database should prefer:

- insert new rows per revision snapshot
- avoid in-place overwrites of engineering objects once persisted to a revision

This supports deterministic reads such as:

- "show all part definitions for revision R"
- "compare connector placements between revisions R1 and R2"
- "rebuild tooling export manifest for revision R"

## 4.3 Inheritance model across revisions

Not every entity must be physically copied when a child revision is created.
Instead:

- child revision starts by referencing parent revision lineage
- entities are copied forward lazily when edited or recomputed
- read logic resolves "current effective entity set" for a revision

For the first MVP implementation, a simpler option is acceptable:

- materialize edited entities in each revision
- copy-forward only the entities needed for active editing

## 5. Recommended schema groupings

### Core platform tables

- `projects`
- `design_revisions`
- `artifacts`
- `artifact_links`
- `audit_events`

### Import and graph tables

- `source_geometries`
- `source_geometry_diagnostics`
- `import_jobs`
- `import_job_outputs`
- `assembly_nodes`

### Engineering tables

- `part_definitions`
- `part_geometry_regions`
- `split_definitions`
- `split_definition_boundaries`
- `connector_templates`
- `connector_instances`
- `joint_definitions`

### Validation and export tables

- `verification_jobs`
- `verification_results`
- `verification_result_artifacts`
- `runner_sheets`
- `runner_sheet_parts`
- `tooling_export_jobs`
- `tooling_export_packages`
- `tooling_export_entities`

### Reference/configuration tables

- `material_profiles`
- `tolerance_profiles`
- `export_profiles`

## 6. Main relationship chains

The first MVP should preserve these chains relationally:

1. `projects -> design_revisions`
2. `design_revisions -> source_geometries -> source_geometry_diagnostics`
3. `design_revisions -> assembly_nodes`
4. `design_revisions -> part_definitions -> part_geometry_regions`
5. `design_revisions -> split_definitions -> split_source_geometries`
6. `design_revisions -> connector_instances -> joint_definitions`
7. `design_revisions -> verification_results`
8. `design_revisions -> runner_sheets -> runner_sheet_parts`
9. `design_revisions -> tooling_export_packages -> tooling_export_entities`
10. `artifacts` linked to revisions, imports, verification, and export outputs

For revision-scoped child references, foreign keys should include both the
logical entity ID and `revision_id` so same-revision consistency is enforced in
the database wherever practical.

## 7. Relational vs JSONB guidance

Use relational columns for:

- foreign keys
- identity
- lifecycle states
- top-level names and codes
- release-critical fields

Use JSONB for:

- transform payloads
- dimension overrides
- wall-thickness constraint maps
- verification assumptions
- import diagnostics metadata
- export manifest payloads

Avoid storing the full engineering graph as one JSONB document in the MVP.

## 8. Multi-tenant / workspace assumptions

The current product direction implies:

- professional desktop software
- optional SaaS collaboration

So the first schema should be project-scoped, not fully enterprise-tenant scoped.
However, it should leave room for:

- `workspace_id`
- `organization_id`

For the MVP, these can remain nullable or omitted until collaboration/account
requirements become concrete.

## 9. Read patterns the schema must support

1. Load a revision summary and gating status.
2. Load source geometries and diagnostics for a revision.
3. Load the assembly graph for a revision.
4. Load all parts and their geometry region mappings for a revision.
5. Load connectors and joints for a revision.
6. Load verification results by revision and target.
7. Load runner sheets and export packages for a revision.
8. Query stale/invalid entities quickly for release blocking.

## 10. Write patterns the schema must support

1. Create revision.
2. Register source geometry + artifact link.
3. Persist import diagnostics.
4. Create assembly nodes.
5. Create split definitions and derived parts.
6. Create connector instances and locks.
7. Record verification results and artifacts.
8. Create runner sheets and tooling export packages.
9. Emit audit and job events.

## 11. Integrity strategy

### Database-enforced

- primary keys
- foreign keys
- unique constraints on logical IDs within revision scope
- enum/value checks
- not-null on required release-critical fields

### Service-enforced

- lifecycle transitions
- cross-entity release gating
- stale propagation
- version copy-forward behavior
- revision promotion rules

## 12. Recommendation for first implementation

Start with a normalized PostgreSQL schema plus a small number of JSONB fields.

Specifically:

- relational tables for core entities and joins
- JSONB for transforms, assumptions, and flexible maps
- object storage for all binary artifacts
- audit/event table for mutation history

This gives enough structure for reliable engineering workflows without forcing
premature over-modeling of every geometric detail.

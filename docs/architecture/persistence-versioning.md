# Persistence and Versioning Strategy

## 1. Purpose

Define how SuperModel persists revision-bound engineering data without losing
traceability, reproducibility, or release integrity.

## 2. Core strategy

The MVP should use a **revision-scoped immutable-record strategy**:

1. A logical engineering entity has a stable ID.
2. Each revision stores a separate row version for that entity.
3. New revisions copy forward or derive new versions rather than mutating released
   rows in place.
4. Released artifacts always reference a frozen revision snapshot.

This avoids retroactively changing data that earlier exports or verification
artifacts depended on.

## 3. Logical entity vs row version

### Logical entity

A logical entity is the stable thing users think about:

- a part
- a connector
- a runner sheet
- a source geometry import

### Row version

A row version is the revision-bound representation of that logical entity at a
particular engineering state.

Recommended MVP database shape:

- optional surrogate `id BIGSERIAL` for relational storage internals
- `entity_id`: stable across revisions when logical identity is preserved
- `revision_id`: identifies the snapshot
- `version_no`: optional integer for debugging and internal sequencing

Recommended uniqueness pattern:

```text
UNIQUE(entity_id, revision_id)
```

Recommended physical-key pattern for revision-scoped tables in the first schema:

```text
PRIMARY KEY (surrogate_id) + UNIQUE(entity_id, revision_id)
```

This is the pattern used in the SQL draft because it keeps foreign keys simple
while still preserving revision-bound identity.

## 4. Copy-forward behavior

When a new revision is created:

- unchanged entities MAY be copied forward as structurally identical rows with a
  new `revision_id`
- or represented as inherited references in a future optimization layer

For the MVP, **copy-forward is simpler and preferred** because:

- queries remain easy
- release manifests can resolve everything from one revision
- change impact can be computed without cross-revision joins everywhere

This implies the physical schema for revision-scoped engineering tables should
allow multiple rows with the same logical entity ID across different revisions.

## 5. Mutation rules

### Allowed

- creating a new row version in the active revision
- updating a row that belongs only to the current working revision before that
  revision is released
- changing impact or approval metadata inside the working revision

### Not allowed

- mutating a row that belongs to a released revision snapshot
- reassigning an entity to a different project
- changing the revision referenced by a generated artifact after release

## 6. Artifact persistence rules

Artifacts are append-only records.

Each artifact should record:

- storage URI
- checksum
- media type
- generator module
- owning project/revision
- creation actor/job

Artifacts should never be overwritten in place after publication. A replacement
artifact gets a new `artifact_id`.

## 7. Event and audit strategy

The MVP should keep a simple append-only audit log for:

- revision creation
- revision promotion
- import start/completion/failure
- part creation and split definition changes
- connector lock or override
- verification completion and waiver
- tooling export generation and release

Audit rows should contain:

- event ID
- project ID
- revision ID
- actor
- entity type
- entity ID
- event type
- payload JSON
- occurred_at

## 8. Release integrity model

Release integrity depends on two invariants:

1. a released export package references only rows from one revision snapshot
2. that revision snapshot is not later mutated in place

This means:

- release packages can be regenerated deterministically
- audit and manufacturing handoff remain defensible

## 9. Recommended indexing strategy

Minimum indexes:

- `(project_id, created_at)` on revisions
- `(revision_id)` on all revision-scoped entity tables
- `(entity_id, revision_id)` unique on revision-scoped entity tables
- `(parent_node_id)` on assembly hierarchy
- `(primary_part_id, secondary_part_id)` on connectors
- `(target_type, target_id, revision_id)` on verification results
- `(runner_sheet_id, revision_id)` on export/join tables

## 10. Future optimization path

When data volume becomes large, the system may evolve toward:

- delta-based revision storage
- materialized graph snapshots
- partitioning by project or time
- object-store-first large geometry metadata with DB pointers

These optimizations should not change the canonical revision semantics.

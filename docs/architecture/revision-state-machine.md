# Revision State Machine

## 1. Purpose

Define the lifecycle rules for `DesignRevision` and for revision-bound engineering
artifacts so every module shares the same progression model.

## 2. Core revision states

The MVP should use the following top-level revision states:

1. `draft`
2. `imported`
3. `structured`
4. `engineered`
5. `verified`
6. `released`
7. `stale`
8. `invalid`

These states describe the best-known engineering readiness of the current
revision snapshot.

## 3. State meanings

### `draft`

- revision record exists
- no imported geometry is required yet
- safe for setup metadata and planning

### `imported`

- at least one `SourceGeometry` import has succeeded
- import diagnostics have been acknowledged
- raw source and normalized geometry artifacts are bound to the revision

### `structured`

- assembly graph has been persisted
- relevant assembly nodes and part candidates exist
- source geometry to assembly relationships are stable enough for engineering work

### `engineered`

- manufacturable part definitions exist
- split definitions are recorded
- connectors and/or joints are present where required
- the revision is ready for deterministic engineering checks

### `verified`

- required verification checks have passed or been explicitly waived
- stale or invalid downstream objects have been resolved
- the revision is eligible for release packaging

### `released`

- at least one release-grade downstream package has been produced
- release metadata is frozen for the exported snapshot

### `stale`

- the revision contains artifacts derived from upstream data that has changed
- recomputation or review is required before promotion

### `invalid`

- the revision contains blocking structural, import, or verification failures
- release is not allowed

## 4. Allowed transitions

### Happy path

```text
draft -> imported -> structured -> engineered -> verified -> released
```

### Recovery / regression paths

```text
imported -> invalid
structured -> stale
engineered -> stale
engineered -> invalid
verified -> stale
verified -> invalid
released -> stale
released -> invalid
stale -> structured
stale -> engineered
stale -> verified
invalid -> draft
invalid -> imported
invalid -> structured
invalid -> engineered
```

## 5. Transition triggers

### `draft -> imported`

Triggered when:

- one or more `SourceGeometry` records complete import successfully
- import warnings, if any, are acknowledged or accepted under policy

### `imported -> structured`

Triggered when:

- assembly nodes are persisted
- required source geometry links are assigned to the graph

### `structured -> engineered`

Triggered when:

- required `PartDefinition` and `SplitDefinition` records exist
- required connector and joint engineering data exists for the current workflow

### `engineered -> verified`

Triggered when:

- required verification checks have status `passed` or `waived`
- there are no blocking verification records
- all release-critical entities are not `stale`

### `verified -> released`

Triggered when:

- a release-eligible `ToolingExportPackage` is created
- release manifest references the verified revision snapshot

### Any active state -> `stale`

Triggered when:

- upstream source geometry changes
- assembly graph changes invalidate derived parts
- part definitions change after connector or verification outputs were computed
- connector or joint changes invalidate prior verification

### Any active state -> `invalid`

Triggered when:

- import failure blocks required geometry
- decomposition produces unusable or missing required parts
- blocking verification failures exist
- release invariants are violated

## 6. Entity-level status model

Top-level revision state is derived from entity states. Each revision-bound entity
should support:

- `ready`
- `stale`
- `invalid`
- `blocked`

Examples:

- `SourceGeometry.import_status`
- `PartDefinition.lifecycle_state`
- `ConnectorInstance.approval_state`
- `VerificationResult.status`
- `ToolingExportPackage.release_state`

## 7. Release gating rules

Release MUST be blocked when any of the following are true:

- required source geometry imports failed
- required part definitions are missing or stale
- required connectors or joints are invalid
- required verification results are failed or stale
- release manifest references mismatched revision IDs

Release MAY proceed with waivers only when:

- a rule allows manual waiver
- the waiver is attributed to a user
- the waiver reason is stored in the audit log

## 8. Change impact propagation

The platform should compute impact in this general form:

1. upstream entity changes
2. dependent entities are discovered through graph references
3. each dependency is classified as:
   - `auto-recompute`
   - `review-required`
   - `blocking-invalid`
4. entity-level states update
5. revision-level state is recalculated

## 9. Minimal implementation recommendation

The first code implementation should include:

- revision state enum
- entity-level lifecycle enum
- transition validator
- release-gating validator
- impact propagation service
- audit event emission for every transition

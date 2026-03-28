# MVP Implementation Plan

## 1. Purpose

Translate the approved MVP modules, contracts, and state model into an execution
sequence suitable for implementation planning.

## 2. Guiding principle

Implementation should follow the shortest path that produces a revision-bound
engineering loop:

1. create a revision
2. import source geometry
3. persist assembly structure
4. split parts
5. place connectors
6. run verification
7. generate tooling export packages

## 3. Milestone plan

### Milestone 0: Contract foundation

Deliverables:

- canonical data contracts
- revision state machine
- API surface draft
- adapter contracts for ZBrush import and tooling export

Exit criteria:

- all core entities have canonical fields
- revision transitions and release gating are documented
- import/export requests and manifests are defined

### Milestone 1: Revision and project platform

Deliverables:

- `Project` and `DesignRevision` persistence
- revision lifecycle service
- artifact reference registry
- transition validator

Exit criteria:

- a project can create and list revisions
- revision state can be promoted or blocked with explicit reasons
- artifacts can be registered against a revision

### Milestone 2: Source geometry import

Deliverables:

- source geometry registration API
- import job model
- ZBrush import adapter MVP
- import diagnostics persistence

Exit criteria:

- a revision can register a ZBrush-origin source import
- the import job produces `SourceGeometry` and diagnostics
- failed imports block downstream decomposition

### Milestone 3: Assembly and part graph

Deliverables:

- assembly graph persistence
- graph snapshot API
- source geometry to assembly linking
- impact-state propagation baseline

Exit criteria:

- imported geometry can be represented as assembly nodes
- graph snapshots can be retrieved without reading source files directly
- upstream edits can mark downstream graph nodes stale

### Milestone 4: Part decomposition

Deliverables:

- split definition model
- manual split-definition API
- derived `PartDefinition` creation
- shelling and paint-separation metadata persistence

Exit criteria:

- a user can create split definitions for imported geometry
- parts remain associated with source geometry regions
- decomposition outputs are revision-safe and replayable

### Milestone 5: Connector engineering

Deliverables:

- connector template library schema
- connector placement API
- lock/override workflow
- material and tolerance profile binding

Exit criteria:

- connector templates can be listed and selected
- connector instances can be placed between parts
- locked connectors survive recomputation unless invalidated

### Milestone 6: Verification workbench

Deliverables:

- verification job orchestration
- interference checks
- tolerance review result model
- kinematic validation result model

Exit criteria:

- the system can run verification jobs for selected targets
- verification results persist with assumptions and artifact refs
- blocking verification failures prevent release promotion

### Milestone 7: Runner and tooling export

Deliverables:

- runner sheet persistence
- tooling export job API
- tooling export manifest generator
- release gating validator for export packages

Exit criteria:

- approved parts can be assigned to runner sheets
- draft and release-mode export jobs are supported
- release exports are blocked for stale or invalid entities

## 4. Parallel work recommendations

These tracks can partially overlap after Milestone 1:

- desktop shell UX for revision and graph inspection
- backend persistence and API implementation
- import/export job infrastructure
- Rust domain type generation from contracts

These tracks should not outrun the contract layer:

- advanced UI editing workflows
- AI-assisted split or connector generation
- deep CAE service orchestration

## 5. First code-generation targets

After Milestone 0, generate or hand-write shared types for:

- Rust domain contracts
- TypeScript DTOs
- JSON schema or equivalent validation layer
- persistence model stubs

## 6. Immediate next implementation tasks

1. define machine-readable schema format for contract objects
2. create Rust and TypeScript shared contract packages
3. implement revision lifecycle API and storage
4. implement source geometry registration and import job resources
5. implement the first ZBrush adapter stub

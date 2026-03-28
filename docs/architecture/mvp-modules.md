# MVP Modules: Structural Decomposition Workbench

## 1. Goal

Translate the decomposition-first product strategy into implementable subsystems
with clear ownership, interfaces, and delivery order.

## 2. MVP subsystem map

The first executable MVP is divided into six core modules plus one shared
platform layer.

### Shared platform layer

1. **Revision and Project Platform**
   - project metadata
   - revision lifecycle
   - asset references
   - permissions and collaboration hooks

### Core workflow modules

2. **Source Geometry Import**
   - import geometry from ZBrush-led and CAD-led sources
   - normalize units, hierarchy, and metadata
   - generate canonical source geometry records

3. **Assembly and Part Graph**
   - persist the assembly hierarchy
   - manage part instances and references
   - maintain association between imported geometry and derived parts

4. **Part Decomposition**
   - define split boundaries
   - derive manufacturable part definitions
   - track shelling, draft, and paint-separation intent

5. **Connector Engineering**
   - provide connector templates
   - place connector instances
   - bind fits, tolerances, and material-aware rules

6. **Verification Workbench**
   - run deterministic checks for interference, tolerance, and motion
   - record validation artifacts against revisions
   - gate downstream exports

7. **Runner and Tooling Export**
   - group parts into runner-oriented manufacturing sets
   - prepare runner layouts and gate annotations
   - generate CNC and mold-processing handoff packages

## 3. Dependency order

Implementation should follow this order:

1. Revision and project platform
2. Source Geometry Import
3. Assembly and Part Graph
4. Part Decomposition
5. Connector Engineering
6. Verification Workbench
7. Runner and Tooling Export

Rationale:

- import is the upstream truth
- the assembly and part graph is the core persistence backbone
- decomposition creates the primary manufacturable entities
- connector engineering depends on stable part references
- verification depends on parts, joints, and connectors
- runner/tooling export depends on approved and verifiable part states

## 4. Runtime ownership

### Desktop client

Owns:

- authoring UI
- interactive viewport
- local editing sessions
- revision comparison UX

### Rust geometry/domain core

Owns:

- canonical domain model
- split and association logic
- connector placement rules
- deterministic verification calculations
- export graph preparation

### Python / service layer

Owns:

- CAE job orchestration
- optimization pipelines
- future AI-assisted decomposition or connector proposals
- heavy asynchronous manufacturability integrations

### Collaboration backend

Owns:

- project records
- revision metadata
- asset references
- async job status
- review and approval history

## 5. Inter-module contracts

### 5.1 Source Geometry Import -> Assembly and Part Graph

Produces:

- `SourceGeometry`
- import hierarchy
- unit system and transform data
- topology fingerprints

Consumes:

- project context
- revision context
- adapter settings

### 5.2 Assembly and Part Graph -> Part Decomposition

Produces:

- assembly nodes
- geometry references
- instance transforms
- part graph persistence

Consumes:

- imported source geometry
- revision state

### 5.3 Part Decomposition -> Connector Engineering

Produces:

- `PartDefinition`
- `SplitDefinition`
- structural surfaces and placement zones
- wall-thickness and draft annotations

Consumes:

- assembly graph
- geometry references
- material assumptions

### 5.4 Connector Engineering -> Verification Workbench

Produces:

- `ConnectorInstance`
- `JointDefinition`
- tolerance assumptions
- fit overrides

Consumes:

- part definitions
- material profiles
- connector templates

### 5.5 Verification Workbench -> Runner and Tooling Export

Produces:

- verification results
- blocked vs releasable entities
- motion and interference artifacts

Consumes:

- parts
- connectors
- joints
- runner candidates

## 6. Data release checkpoints

Each module should publish revision-safe outputs.

### Checkpoint A: imported

- source files attached
- units normalized
- import warnings recorded

### Checkpoint B: structured

- assembly graph persisted
- part candidates identified

### Checkpoint C: engineered

- split parts approved
- connectors and joints defined

### Checkpoint D: verified

- interference checks passed or explicitly waived
- tolerance and motion results attached

### Checkpoint E: released

- runner grouping frozen
- tooling export package generated

## 7. Suggested implementation milestones

### Milestone 1

- revision platform
- source import for one priority format path
- assembly graph persistence

### Milestone 2

- manual part decomposition
- part graph association
- basic part visualization and editing

### Milestone 3

- connector template library
- connector placement
- tolerance profile assignment

### Milestone 4

- interference and motion checks
- verification report persistence

### Milestone 5

- runner grouping
- tooling package manifest
- CNC/mold export metadata bundle

## 8. Immediate next specs

The following detailed specs should be treated as the first executable set:

1. `revision-project-platform`
2. `source-geometry-import`
3. `assembly-part-graph`
4. `part-decomposition`
5. `connector-engineering`
6. `verification-workbench`
7. `runner-tooling-export`

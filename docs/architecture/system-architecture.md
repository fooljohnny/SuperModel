# System Architecture

## 1. Goals

SuperModel is an industrial-grade assembly model design platform for the full
lifecycle of plastic model kit development, from concept-ready geometry to
runner output, moldability verification, manufacturing feedback, and assembly
instruction generation.

This first product strategy is now explicitly optimized for:

- structural decomposition and part-splitting workflows as the first priority
- a professional desktop product for studios and advanced creators, paired with
  SaaS-style collaboration and review capabilities
- deep CAE/manufacturing integration rather than heuristic-only simulation
- first-release outputs focused on part-structure data, runner-sheet data, and
  CNC or mold-processing handoff packages

The architecture must support:

- heavy desktop authoring workflows with local acceleration
- cloud-assisted collaboration and compute-intensive optimization
- traceable, spec-driven evolution under OpenSpec/SDD
- incremental adoption of AI without making the deterministic engineering core
  opaque or untestable

## 2. System context

### 2.1 Primary actors

- industrial designer
- structural engineer
- CAD engineer
- mold engineer
- production planner
- instruction/packaging engineer
- reviewer/approver
- automation and AI agent services

### 2.2 Deployment forms

- Windows desktop application
- Linux desktop application
- macOS desktop application
- WebApp for collaboration, review, simulation job management, and lightweight
  editing

## 3. Architecture style

The recommended style is a hybrid of:

- local-first desktop authoring
- service-oriented compute backplane
- shared domain model and event-driven workflow orchestration

This separates three concerns:

1. **Interactive authoring**
   - low-latency editing of geometry, assemblies, constraints, and runner layout
2. **Deterministic engineering services**
   - CAD import/export, interference checking, tolerance calculations, topology
     transforms, BOM derivation
3. **Expensive asynchronous pipelines**
   - AI mesh generation, mold-flow simulation, optimization, batch exports,
     documentation rendering

## 4. Recommended stack selection

## 4.1 Client layer

### Desktop

- **Shell**: Tauri 2
- **UI**: React + TypeScript
- **State**: Zustand or Redux Toolkit for UI/application state, plus event-sourced
  domain snapshots for design history
- **3D rendering**:
  - primary path: WebGPU-based renderer through wgpu-compatible Rust backend
  - fallback path: Three.js/WebGL for rapid UI iteration and browser parity

Why:

- one codebase across Windows/Linux/macOS
- Rust integration is natural for geometry and performance-sensitive modules
- smaller deployment footprint than Electron
- aligns with a desktop-first professional product strategy for advanced
  creators and model studios

### WebApp

- **Framework**: Next.js
- **Responsibilities**:
  - project and asset management
  - review/markup
  - job queue monitoring
  - browser preview and guided assembly playback
  - limited editing tasks that do not require full desktop performance

## 4.2 Domain/geometry core

- **Language**: Rust
- **Responsibility**:
  - canonical product model
  - assembly graph
  - connector library execution
  - tolerance and fit rules
  - interference and kinematics checks
  - runner placement primitives and scoring hooks
  - change propagation engine for associated design

Why Rust:

- good performance and memory safety
- easy embedding in desktop applications
- strong interoperability with WebAssembly for future browser reuse

## 4.3 CAD and geometry interoperability

- **Preferred geometry foundation**: OpenCascade ecosystem
- **Import/edit priority order**:
  1. ZBrush-origin sculpt data
  2. SolidWorks
  3. Siemens NX
  4. Blender
  5. Maya
  6. STEP
  7. Parasolid
  8. IGES
  9. FBX
  10. glTF
- **Interchange targets**:
  - STEP
  - IGES
  - Parasolid when licensed/available through adapters
  - STL / 3MF / OBJ for meshes and printing workflows
  - DXF / SVG / PDF for downstream documentation and 2D deliverables

Adapter strategy:

- build a stable internal geometry abstraction
- keep vendor/tool-specific conversion logic at the edges
- treat SolidWorks/NX data as imported authoritative references when native
  editing is not fully reproducible in the first phase
- keep sculpt-origin mesh fidelity high enough that ZBrush-led concept work can
  remain the upstream source for decomposition and structural engineering

## 4.4 AI / CAE / optimization services

- **Language**: Python
- **Responsibilities**:
  - AI-assisted 3D generation pipelines
  - recommendation models for part splitting and connector placement
  - mold-flow and shrinkage surrogate models
  - multi-objective optimization
  - instruction generation assistance

Why Python:

- strongest ecosystem for ML/optimization/CAE orchestration
- easier integration with scientific computing and model serving stacks

Deployment stance:

- public cloud is acceptable for AI and orchestration workloads
- the architecture should still preserve a deployable boundary for future
  private-cloud or on-premise offerings
- deterministic engineering validation must remain reproducible independent of
  where AI inference is hosted

## 4.5 Backend services

- **API**: Rust or TypeScript gateway; start simple with a TypeScript API layer if
  UI-heavy product needs dominate, or Rust if compute orchestration and binary
  portability dominate. For this product, a small **TypeScript/Next.js backend**
  is acceptable early, while the domain core remains in Rust.
- **Workflow engine**: Temporal or a queue/event-driven orchestrator
- **Database**: PostgreSQL
- **Asset storage**: S3-compatible object storage
- **Search/indexing**: PostgreSQL FTS first, external engine later if needed

## 5. Core bounded contexts

## 5.1 Design Authoring

Owns:

- concept assets
- editable geometry references
- sculpt/model workbench
- assembly hierarchy

## 5.2 Structural Decomposition

Owns:

- part segmentation
- split lines
- shelling
- color separation
- pre-paint segmentation
- decomposition policies and manufacturable split recommendations

## 5.3 Connector Engineering

Owns:

- connector templates
- pin/socket/rib/snap-fit standards
- auto-connector synthesis
- stress and usability constraints

## 5.4 Material and Tolerance Engineering

Owns:

- material libraries
- shrinkage and wall thickness rules
- fit classes and tolerance tables
- manual overrides and approvals

## 5.5 Motion and Verification

Owns:

- joint limits
- kinematics solver
- interference checks
- assembly path validation

## 5.6 Runner and Mold Engineering

Owns:

- runner plate generation
- gate placement
- cavity grouping
- draft analysis
- parting line support
- output for printing/CNC/mold workflows
- deep CAE adapter orchestration for mold-flow, shrinkage, and manufacturability
  validation

## 5.7 Documentation and Manufacturing Output

Owns:

- assembly instructions
- BOM
- decal/waterslide references
- packaging data exports

## 5.8 Collaboration and Governance

Owns:

- projects
- revisions
- approvals
- comments/markup
- audit trail

## 6. Canonical domain model

The internal model should revolve around a few stable entities:

- `Product`
- `Variant`
- `Assembly`
- `Part`
- `Connector`
- `Joint`
- `MaterialProfile`
- `ToleranceProfile`
- `RunnerSheet`
- `Gate`
- `ToolingConstraint`
- `InstructionSequence`
- `ManufacturingRevision`

For the first executable slice, the most important entities are:

- `MasterModel`
- `SplitPlan`
- `Part`
- `Connector`
- `Joint`
- `MaterialProfile`
- `RunnerSheet`
- `ManufacturingPackage`

Supporting principles:

- use stable IDs across derivative artifacts
- link every generated artifact to upstream provenance
- keep editable intent separate from generated geometry when possible

## 7. Data flow

### 7.1 Authoring flow

1. import or create source geometry
2. define assembly hierarchy and motion structure
3. run part decomposition
4. assign materials, finishes, and connector policies
5. generate candidate connectors and review them
6. run interference/tolerance checks
7. generate runner sheets
8. simulate moldability and optimize
9. generate outputs for tooling, printing, docs, and BOM

### 7.2 Change propagation flow

1. user edits source geometry or design rule
2. event recorded as a domain change
3. dependency graph identifies downstream impacted entities
4. derived artifacts become stale or auto-recomputed
5. user reviews diffs before promoting to approved revision

## 8. Multi-platform strategy

### Shared

- domain core in Rust
- UI design system and API contracts shared via TypeScript packages
- file/document schemas versioned independently

### Desktop-first concerns

- offline-capable editing
- local GPU/CPU acceleration
- local cache of heavy artifacts and previews

### Web-first concerns

- zero-install reviews
- collaboration and approvals
- compute job submission and monitoring

## 9. Non-functional requirements

- deterministic export pipelines for regulated manufacturing handoff
- auditable revision history
- high-performance interaction on large assemblies
- extensible plugin model for CAD and analysis adapters
- resilience to partial recomputation failures
- security for commercial IP and proprietary geometry

## 10. Suggested repository strategy

Use a monorepo with clear language boundaries:

- `apps/desktop` for the Tauri desktop shell
- `apps/web` for the Next.js web application
- `crates/geometry-kernel` for Rust domain and geometry libraries
- `python/optimization` for AI and optimization packages
- `services/design-orchestrator` for service workflows and APIs
- `openspec/` for source-of-truth specification work

## 11. Key risks and mitigation

### Risk: attempting to replace full SolidWorks/NX authoring immediately

Mitigation:

- phase import/interoperability first
- focus native authoring on model-kit-specific workflows where the product can
  create differentiated value

### Risk: AI-generated geometry is hard to trust in manufacturing

Mitigation:

- keep AI suggestions assistive
- require deterministic validation and approval gates

### Risk: runner and mold optimization becomes too broad

Mitigation:

- define progressive solver scopes:
  1. layout scoring
  2. manufacturability heuristics
  3. coupled simulation/optimization loops

## 12. Initial recommendation

The best first product slice is:

1. sculpt/CAD import with ZBrush-led concept handoff support
2. structural decomposition and part graph management
3. connector library + semi-automatic connector generation
4. interference/tolerance/kinematics workbench
5. runner-sheet generation and manufacturing package export
6. CAE adapter orchestration for manufacturability review

This produces immediate engineering value while building the data backbone needed
for later AI modeling, deeper mold-flow optimization, and documentation
automation.

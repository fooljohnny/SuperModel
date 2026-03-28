# SuperModel Brainstorming

## Product thesis

SuperModel should become an industrial design operating system for plastic
assembly kits. It must connect concept design, 3D authoring, engineering
refinement, manufacturability analysis, runner planning, mold feedback, and
manufacturing output generation inside one traceable platform.

The core business value is not "another DCC" and not "another CAD". The value
comes from compressing the handoff chain between art, engineering, mold,
production, and product planning, with the first commercial wedge centered on
part decomposition and structural engineering.

## Confirmed product strategy

- **First priority workflow**: part decomposition and structural design
- **Commercial model**: professional desktop software plus SaaS collaboration
- **Manual modeling goal**: production-grade sculpting close to ZBrush-class
  workflows
- **AI deployment**: public-cloud deployment is acceptable
- **Simulation target**: deep CAE integration rather than heuristic-only checks
- **V1 outputs to prioritize**:
  - structural part design data
  - runner/plate data
  - CNC / tooling-ready manufacturing packages

## Confirmed interoperability priority

1. ZBrush
2. SolidWorks
3. Siemens NX
4. Blender
5. Maya
6. STEP
7. Parasolid
8. IGES
9. FBX
10. glTF

## Primary optimization targets

1. Reduce total iteration loops between concept, part split, CAD, and mold
   tuning.
2. Reduce dependence on scattered toolchains and manual file transfer.
3. Reuse proven connectors, pegs, holes, ribs, and tolerance patterns.
4. Shorten trial-shot correction cycles by front-loading simulation and
   manufacturability checks.
5. Improve runner layout quality and instruction generation consistency.
6. Preserve engineering traceability so one change can propagate through all
   related assets.

## User segments

### 1. Industrial model product architect

- Defines product line strategy, target part count, difficulty, articulation,
  and cost envelope.
- Needs scenario planning, BOM summaries, and manufacturability dashboards.

### 2. Character / styling designer

- Creates shape language, silhouette, proportions, and visual details.
- Needs production-grade sculpt workflows, references, and AI-assisted concept
  to 3D generation.

### 3. Structural engineer

- Splits parts, designs joints, pegs, holes, ribs, clearances, and movement
  ranges.
- Needs parametric constraints, reusable templates, and simulation-backed
  validation.

### 4. Mold / process engineer

- Evaluates draft, parting lines, shrinkage, wall thickness, and runner layout.
- Needs manufacturability insight early, not only after CAD freeze.

### 5. Documentation / packaging operator

- Produces assembly manuals, decals, labeling, and packaging data.
- Needs automatic step extraction and exploded-view generation.

### 6. Operations / factory coordinator

- Tracks mold revisions, trial-shot issues, and production readiness.
- Needs change lineage and issue feedback into the design graph.

### 7. Professional studio and SaaS collaboration operator

- Buys the desktop tool for authors while relying on browser workflows for
  review, approvals, and cross-team coordination.
- Needs a hybrid licensing and delivery model instead of a browser-only product.

## Product capability map

### A. Design creation

- Manual 3D modeling for toy-grade forms and surface edits
- Sketch-to-3D and image/text-to-3D AI generation
- Reference alignment and orthographic setup

### B. Engineering decomposition

- Automated part splitting suggestions
- Part hierarchy and dependency graph
- Color-separation and pre-paint strategy support

### C. Connection and structure system

- Standard connector library
- Auto-generated pegs, sockets, snap fits, and reinforcement ribs
- Constraint-driven movement and joint design

### D. Material and tolerance intelligence

- Material profiles by process and compound
- Shrinkage-aware dimensioning
- Tolerance templates by connector type and articulation class

### E. Manufacturability and CAE

- Draft analysis
- Wall thickness checks
- Interference detection
- Motion simulation
- Mold-flow integration and recommendation engine

### F. Runner and mold planning

- Runner layout generation
- Gate and sprue suggestions
- Plate grouping by assembly sequence and manufacturing constraints
- Waste, balance, and pressure optimization

### G. Documentation and delivery

- Automatic assembly step extraction
- BOM and part-label generation
- CNC, 3D print, and factory export formats
- Tooling package generation for CNC and mold review

### H. Platform intelligence

- Associative model graph
- Rule engine
- Optimization engine
- Collaboration, review, and approval workflows

## Key differentiators

1. Associative graph between prototype model, split parts, connectors, runner,
   manual steps, and manufacturing data.
2. Domain-specific automation for plastic assembly kits rather than generic CAD
   workflows.
3. Closed-loop feedback from T0/T1 issues back into design rules and reusable
   templates.
4. Multi-objective optimization across cost, difficulty, aesthetics, and
   manufacturability.

## Hard problems to solve

1. Balancing freeform creative modeling with production-grade parametric
   precision.
2. Maintaining robust model associativity after topology-changing operations.
3. Combining geometric kernels, CAE, and AI generation without unstable user
   experiences.
4. Supporting desktop-grade interaction while exposing web collaboration.
5. Building trusted automation where engineers can override every suggestion.

## Recommended product phases

### Phase 0 - Foundations

- Domain model
- File interoperability
- Geometry kernel abstraction
- Associative graph
- Rule engine
- Connector library v1

### Phase 1 - Engineering workbench

- Assembly structure editor
- Part split tools
- Manual connector authoring
- Tolerance editing
- Interference and motion validation
- Export of structural part datasets for downstream CAD and tooling

### Phase 2 - Manufacturing intelligence

- Moldability analysis integration
- Runner layout planning
- Shrinkage and wall-thickness recommendations
- Trial-shot issue capture and feedback loop
- CNC / tooling package generation

### Phase 3 - AI acceleration

- AI 3D generation
- Auto part split proposals
- Auto connector proposals
- Optimization solver orchestration

### Phase 4 - Documentation and collaboration

- Auto manuals
- Web review
- Approval workflows
- Packaging and release bundles

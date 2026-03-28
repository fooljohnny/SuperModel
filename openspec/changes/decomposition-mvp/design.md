## Why this change exists

The initial repository bootstrap documented a broad product direction. The user
has now clarified the first delivery priorities:

- first-priority workflow: structural decomposition and engineering refinement
- customer posture: professional desktop software plus SaaS collaboration
- interoperability priority: ZBrush first, then SolidWorks and Siemens NX
- manual modeling target: production-grade sculpting near ZBrush-class workflows
- AI deployment: public cloud is acceptable
- simulation target: deep CAE integration
- first-release outputs: part structural data, runner data, CNC/tooling packages

These choices materially narrow the MVP and should become explicit design
constraints for future specs and implementation.

## Design direction

### 1. Product shape

The product should be designed as a desktop-first engineering workbench with:

- strong local authoring for part decomposition and structural detailing
- optional SaaS collaboration for review, sync, and compute-intensive jobs
- clear separation between deterministic engineering operations and cloud-backed
  AI or CAE orchestration

### 2. First executable value loop

The first complete workflow should be:

1. import sculpt/CAD source geometry
2. define split parts and part hierarchy
3. place or generate connector features
4. run interference, tolerance, and motion verification
5. group parts into runner-oriented manufacturing sets
6. export revisioned structural and tooling packages

### 3. Modeling strategy

The product should not attempt full DCC parity in the first release. Instead it
should provide:

- production-grade sculpt-assisted editing for model-specific shaping
- strong downstream association into structural and manufacturing data
- external DCC/CAD round-tripping where the native tools remain stronger

### 4. Simulation strategy

Deep CAE integration is a target requirement, but the architecture should allow
progressive onboarding:

- deterministic local checks for interference, motion, and tolerance
- service-orchestrated professional mold-flow and manufacturability jobs
- traceable result artifacts tied to revision IDs

### 5. Output strategy

The release-critical outputs are:

- split-part structural design data
- runner/board data
- CNC and mold-processing handoff packages

Instruction generation remains important, but it should not be the gating
criterion for the first commercial MVP.

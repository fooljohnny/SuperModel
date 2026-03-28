# Product Requirements Planning

## 1. Product vision

Build an industrial-grade design platform for plastic assembly kits and related
manufactured toy/model products. The platform should compress iteration loops
from concept to mold-ready engineering data while preserving expert control.

## 2. Target users

### Primary users

- Concept and character designers
- Part decomposition and assembly engineers
- Mechanical/CAD engineers
- Mold and injection engineering teams
- Manufacturing process planners
- Packaging and instruction designers

### Secondary users

- Project managers
- Supply-chain and factory partners
- External reviewers and licensors
- Hobbyist prosumer creators using a reduced workflow

## 3. Product outcomes

- Reduce manual repetitive CAD setup for connector and tolerance design
- Reduce failed trial-shot loops through simulation and rule checking
- Increase reuse of standard joints, sockets, ribs, and material presets
- Improve runner layout efficiency and assembly-step alignment
- Turn tribal manufacturing knowledge into reusable digital rules
- Support cross-platform authoring and web collaboration

## 4. Requirement layers

### L0: Platform requirements

- Windows, Linux, macOS desktop support
- Browser-based review and collaboration
- Local-first authoring with optional cloud sync
- Import/export with industrial CAD and mesh formats
- Traceable revision history for parts, runners, materials, and instructions

### L1: Design workbench requirements

- Manual 3D sculpting and hard-surface editing
- Parametric part decomposition
- Standard connector and reinforcement library
- Automatic connector recommendation and placement
- Associative design graph for upstream-downstream propagation
- Kinematics and interference simulation

### L2: Manufacturing engineering requirements

- Runner layout planning and balancing
- Material, wall thickness, and shrinkage parameter management
- Moldability checks: draft, undercut, parting line, ejector feasibility
- Tolerance analysis and adjustment
- Mold flow and sink/warpage risk estimation
- Mold-trial issue feedback loop into geometry rules

### L3: Output and downstream requirements

- Export part files, runner files, and manufacturing packages
- Generate assembly instructions with exploded steps and BOM
- Support 3D printing and CNC-oriented output
- Generate collaboration views for approvals and vendor handoff

### L4: AI and optimization requirements

- AI-assisted concept-to-3D generation
- Automatic part split proposals
- Multi-objective optimization for cost, detail, assembly difficulty, and
  moldability
- Rule-based + learned recommendation engine for joints and tolerances

## 5. Non-functional requirements

- Deterministic geometry versioning for manufacturable outputs
- Extensible plugin architecture for CAD, solver, and exporter adapters
- GPU acceleration where useful, but no hard dependency on cloud rendering
- Auditability for automatically generated engineering decisions
- Fine-grained permissions for enterprise collaboration

## 6. Recommended phased delivery

### Phase A: Foundation

- Product data model
- Import/export pipeline
- Desktop shell and web review shell
- Standard parts library framework
- Spec-driven documentation and change management

### Phase B: Engineering MVP

- Parametric part decomposition
- Connector library and auto-placement
- Tolerance/interference analysis
- Basic runner layout generation
- Instruction generation MVP

### Phase C: Industrial optimization

- Moldability and draft analysis
- Material-aware shrink compensation
- Mold-flow adapter integration
- Runner balance and waste optimization

### Phase D: AI acceleration

- AI geometry generation assistance
- Learned decomposition recommendations
- Auto-optimization loops with explainable trade-offs

## 7. Open questions

- Which CAD systems are highest priority for round-trip fidelity?
- Is manual sculpting expected to be production-grade or concept-grade only?
- Should cloud collaboration be mandatory or optional for enterprise installs?
- What level of simulation accuracy is acceptable in-app versus external CAE?
- Which manufacturing outputs must be generated natively in V1?

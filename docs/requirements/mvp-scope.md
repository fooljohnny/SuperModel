# MVP Scope: Structural Decomposition First

## Positioning

The first commercial product should primarily serve:

- professional desktop users at model studios and advanced creators
- SaaS-supported collaboration for review, asset sync, and compute-heavy jobs

This is not a browser-first CAD replacement. It is a desktop-first industrial
assembly-model engineering workbench with cloud-assisted collaboration.

## Chosen first-priority outcome

The first priority is **part decomposition and structural engineering**.

That means the MVP should optimize for:

1. importing concept or reference geometry
2. splitting the model into manufacturable parts
3. defining joints, pegs, sockets, ribs, and reinforcement structures
4. validating tolerance, interference, and motion
5. generating runner-ready grouped outputs
6. exporting manufacturing packages for CNC and tooling workflows

## What is in MVP

### 1. Geometry ingress

- Import ZBrush-derived meshes and subtools
- Import SolidWorks and NX exports through adapter flows
- Import Blender/Maya support for supporting geometry workflows
- Normalize all imported content into an internal product graph

### 2. Structural decomposition workbench

- Part split lines and split-surface definition
- Shelling and wall-thickness controls
- Color separation and pre-paint segmentation markers
- Derived-part graph with upstream/downstream associativity

### 3. Connector engineering

- Standard peg, socket, snap-fit, rib, and reinforcement templates
- Connector placement guides and semi-automatic proposals
- Material-aware fit presets by connector family
- Manual override and locking of auto-generated features

### 4. Verification workbench

- Tolerance editing
- Interference checks
- Motion range simulation
- Assembly path verification for critical joints

### 5. Runner and tooling preparation

- Part grouping for runner sheets
- Gate placement suggestions
- Manufacturing annotations for tooling review
- Export packages for runner geometry and tooling handoff

### 6. Manufacturing outputs

- part structural design data
- runner sheet data
- CNC / mold-processing packages

## What is explicitly out of MVP

- full all-purpose DCC parity with Maya or Blender
- full native replacement for SolidWorks or Siemens NX
- consumer-facing instruction generation as a top-level launch criterion
- generalized PLM/ERP integration
- full autonomous AI design loops without expert approval

## Why this slice is right

This slice directly attacks the most expensive pain in the target workflow:

- manual part splitting
- repetitive structural detail design
- tolerance and interference iteration
- tooling handoff friction
- runner preparation rework

It also creates the correct data backbone for later:

- deep mold-flow integration
- AI-generated structure proposals
- automated instruction generation
- broader enterprise collaboration

## MVP success criteria

1. A designer can import source geometry and produce a structured split-part
   assembly graph.
2. A structural engineer can define or reuse connector standards and push them
   onto split parts.
3. A manufacturing engineer can evaluate interference, tolerance, and selected
   motion constraints before tooling handoff.
4. The system can export versioned structural and runner data suitable for CNC
   and mold-review workflows.
5. The product can demonstrate a materially shorter iteration loop than the
   baseline multi-tool workflow.

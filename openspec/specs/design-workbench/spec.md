# Capability: Design Workbench

## Intent

Provide the primary authoring environment for industrial assembly model design,
with the first release centered on structural decomposition, connector
engineering, tolerance refinement, and revision-safe linked editing.

## Problem Statement

The current industry workflow is fragmented across sculpting, CAD, CAE, and
document tooling. Designers spend excessive time translating intent between
tools, rebuilding connectors, and manually propagating revisions through part
trees and runner configurations.

## Users

- Structural designers
- Mechanical/CAD engineers
- Prototype validation engineers
- Senior hobby/prosumer designers using a professional desktop workflow

## Functional Scope

1. Import source geometry from sculpting and CAD ecosystems with priority order:
   ZBrush, SolidWorks, Siemens NX, Blender, Maya, STEP, Parasolid, IGES, FBX,
   glTF
2. Support production-grade sculpt-assisted editing for toy/model surfaces, then
   bind structural features and manufacturable references onto that geometry
3. Split assemblies into manufacturable parts
4. Create and reuse connectors, sockets, ribs, and fasteners
5. Manage linked edits between source model, split parts, and connectors
6. Perform manual tolerance adjustment with visual feedback
7. Support kinematic constraints and motion-range review
8. Emit revisioned part-structure outputs consumable by runner, tooling, and
   downstream CAD/CAM workflows

## Domain Concepts

- Master Model
- Derived Part
- Connector Template
- Connector Instance
- Tolerance Rule
- Motion Constraint
- Design Variant
- Material Profile

## MVP priorities

- Structural decomposition is the first release priority
- Manual sculpting should be production-grade enough to support direct toy/model
  shaping, but does not need to replace every DCC workflow in the first release
- AI suggestions may use public-cloud infrastructure as long as enterprise users
  can control when geometry leaves the local workstation or private environment

## Non-Functional Needs

- Interactive viewport performance on large assemblies
- Deterministic history and undo/redo
- Geometry operations that are auditable and replayable
- Import/export stability across CAD versions

## Risks

- Geometry-kernel complexity
- Interoperability with proprietary CAD ecosystems
- High UX complexity from combining sculpting and CAD semantics

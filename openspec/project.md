# SuperModel project context

## Mission

SuperModel is an industrial-grade assembly model design platform for plastic
model kits and adjacent manufacturing workflows. The system must reduce design
cycle time, lower mold rework costs, and improve consistency from concept to
runner layout, trial-shot feedback, and assembly instruction output.

## Product principles

1. Desktop-first authoring for heavy geometry and engineering workflows.
2. Web-first collaboration for review, approvals, traceability, and asset
   sharing.
3. Spec-driven development: domain behavior is documented before code.
4. Native support for both creative design and DFM/CAE/manufacturing analysis.
5. Every edit should preserve associativity between concept, parts, connectors,
   runners, and assembly instructions.

## Initial platform choices

- Monorepo with explicit domain boundaries.
- Rust for performance-critical geometry, constraint solving, and domain logic.
- TypeScript for desktop and web user experience.
- Python for AI pipelines, optimization, simulation orchestration, and
  experimentation.
- PostgreSQL as the system-of-record for metadata, versions, BOM, and process
  history.
- Object storage for geometry artifacts, renders, simulation results, and
  generated documents.

## Domain capabilities

- Product platform and identity
- 3D modeling and sculpting workbench
- CAD interoperability and associative part design
- Connector library and auto-connector synthesis
- Tolerance, interference, and kinematics validation
- Runner layout and injection manufacturing engineering
- Material, shrinkage, and pre-paint parameter management
- Instruction generation and packaging deliverables
- Optimization and AI-assisted modeling

## Constraints

- Must support Windows, Linux, macOS, and WebApp delivery.
- Must interoperate with mature CAD systems and industrial exchange formats.
- Must preserve auditability for high-cost mold and manufacturing decisions.
- Must allow incremental rollout: collaboration and planning can ship before the
  full geometry kernel matures.

## Repository map

- `apps/desktop`: desktop client shell and future local service integration.
- `apps/web`: web review and collaboration application.
- `crates/geometry-kernel`: Rust core for scene graph, constraints, parts, and
  manufacturability calculations.
- `python/optimization`: AI and optimization workspace.
- `services/design-orchestrator`: orchestration APIs and job management.
- `docs/architecture`: architecture and ADR documents.
- `docs/requirements`: planning, roadmap, and domain analysis.
- `openspec/specs`: current approved capability specs.
- `openspec/changes`: proposed spec and implementation changes.

## Working model

1. Update or add a spec in `openspec/specs`.
2. If behavior changes, create a change proposal in `openspec/changes`.
3. Land minimal code and tests aligned with the approved spec.
4. Keep architecture docs updated when decisions materially change.

# SuperModel

SuperModel is a greenfield, spec-driven repository for an industrial-grade
assembly model design platform targeting Windows, Linux, macOS, and WebApp
delivery.

## Product direction

The product is intended to shorten the end-to-end design cycle for
Bandai-like plastic assembly kits and adjacent industrial toy/model products.
The target workflow spans:

1. Character and concept design
2. Structural decomposition and part splitting
3. Detailed CAD refinement with connectors, holes, ribs, and tolerances
4. Interference, kinematics, and assembly verification
5. Runner layout and gating planning
6. Mold preparation, trial-shot feedback, and mold tuning
7. Production support, instructions, decals, and packaging data

## Repository goals

- Use OpenSpec-style Spec-Driven Development (SDD)
- Establish a modular architecture before large-scale implementation
- Support both creative modeling and manufacturing engineering workflows
- Keep desktop authoring strong while enabling web collaboration and review

## Initial architecture snapshot

- Desktop clients: Tauri 2 shell with a shared React UI layer
- Web client: Next.js review and collaboration application
- Core engineering runtime: Rust domain and geometry services
- CAD interoperability: OpenCascade-based adapter strategy
- AI, optimization, and CAE pipelines: Python services
- Shared metadata and collaboration backend: PostgreSQL + object storage

## Repository layout

```text
apps/
  desktop/                  Desktop application shell placeholder
  web/                      Web application shell placeholder
crates/
  geometry-kernel/          Planned Rust geometry and assembly core
docs/
  architecture/             System architecture and decision records
  requirements/             Roadmap, scope, and planning documents
openspec/
  AGENTS.md                 Agent instructions for repo contributors
  project.md                Global context and architecture principles
  specs/                    Current source-of-truth capability specs
  changes/                  Proposed and active spec/code changes
python/
  optimization/             Planned optimization and AI service workspace
services/
  design-orchestrator/      Planned application and workflow services
```

## How to work in this repo

1. Read `openspec/project.md`
2. Review the relevant capability spec in `openspec/specs/`
3. Create or update a change proposal in `openspec/changes/`
4. Implement code only after the spec delta is clear
5. Keep architecture, domain model, and code changes aligned

## Current status

This repository currently contains the initial product architecture,
requirements planning, and workspace scaffold only. No production application
code has been implemented yet.

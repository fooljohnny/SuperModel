## Why this change exists

The repository starts with no engineering structure, no specification source of
truth, and no agreed architecture for a cross-platform industrial design system.
This bootstrap change establishes the baseline project shape required to
continue using Spec-Driven Development.

## Scope

This change introduces:

- OpenSpec repository conventions
- Initial capability specifications
- Product and architecture documentation
- Monorepo layout placeholders for desktop, web, Rust, and Python workloads

This change intentionally does not implement production business logic.

## Architectural decisions

### 1. Monorepo structure

The system should evolve as a monorepo so geometry, UI, AI pipelines, and
collaboration services can share versioned schemas and integration tests.

### 2. Runtime split

- Rust: high-performance geometry, assembly graph, validation, exporters
- TypeScript: desktop/web UI and orchestration-facing APIs
- Python: optimization, AI generation, CAE and scientific pipelines

### 3. Desktop-first authoring, web-first collaboration

Heavy authoring workflows such as large assembly editing, local CAD import, and
interactive simulation should remain desktop-first. Review, collaboration,
planning, and async generation flows should be accessible in the browser.

### 4. Capability-driven specifications

The source of truth should be organized by capability rather than by technical
layer. That matches the intended SDD workflow and makes downstream changes
easier to evaluate.

## Risks and mitigations

### Risk: scope explosion

The requested product spans DCC, CAD, CAE, PLM-lite, CAM interfaces, and AI.
Mitigation: phase the product around a narrow MVP centered on imported CAD,
part splitting, connector design, runner planning, and instruction output.

### Risk: geometry kernel complexity

Building a full 3D kernel from scratch would be high risk. Mitigation: design
around adapter boundaries so mature geometry/CAD libraries can be integrated.

### Risk: desktop-web feature parity pressure

A strict parity goal too early would slow progress. Mitigation: define desktop
as the primary authoring client and web as a review/collaboration client until
core flows stabilize.

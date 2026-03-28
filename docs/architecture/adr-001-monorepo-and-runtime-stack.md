# ADR-001: Monorepo and runtime stack

## Status

Accepted

## Context

SuperModel must support:

- Native desktop authoring for Windows, Linux, and macOS
- Browser-based collaboration and review
- Geometry-heavy local and remote compute workloads
- AI-assisted pipelines and optimization workloads
- Industrial data interchange with CAD and manufacturing systems

No existing repository constraints are present, so the initial stack should
optimize for domain separation, performance, and long-term maintainability.

## Decision

Adopt a polyglot monorepo with the following primary technologies:

- Desktop shell: Tauri 2
- Desktop and web UI: TypeScript + React
- Web application: Next.js App Router
- Core domain and geometry services: Rust
- Optimization and AI pipelines: Python
- Data and collaboration backend: PostgreSQL and object storage

## Rationale

### Why Tauri instead of Electron

- Smaller distribution footprint
- Stronger fit with Rust-native compute and file integration
- Better alignment with performance-sensitive desktop workflows

### Why Rust for geometry and engineering services

- Predictable performance
- Safer concurrency for long-running compute tasks
- Good FFI interoperability with C/C++ CAD and geometry toolchains
- Shared use across desktop and service contexts

### Why Python for AI and optimization

- Strong ecosystem for ML, scientific computing, and optimization
- Easier integration with training/inference pipelines
- Better access to CAE, meshing, and algorithm research tooling

### Why a monorepo

- Shared domain model and schema versioning
- Easier end-to-end traceability for spec-driven changes
- Centralized CI, docs, and release management

## Consequences

### Positive

- Clear separation between UI, geometry kernel, and optimization pipelines
- Strong desktop story without sacrificing web delivery
- Good fit for industrial and AI workloads

### Negative

- Requires careful interface contracts across Rust, TypeScript, and Python
- Build and CI orchestration becomes more complex
- Geometry kernel and CAD adapters remain technically challenging

## Follow-up

- Define interface boundaries between desktop shell and engineering runtime
- Select a concrete CAD interoperability strategy in a later ADR
- Define eventing and job orchestration contracts

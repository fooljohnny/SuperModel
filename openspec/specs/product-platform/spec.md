# Capability Spec: Product Platform

## Goal

Provide the foundational platform for a multi-application industrial model
design system that runs as desktop and web software while sharing core domain
models, workflows, and specifications.

## Actors

- Product designer
- Mechanical/CAD engineer
- Mold and manufacturing engineer
- Instruction/documentation engineer
- Reviewer/project manager
- AI-assisted design operator

## Functional requirements

1. The platform SHALL support Windows, Linux, macOS, and WebApp delivery.
2. The platform SHALL maintain a shared product graph across concept, part,
   connector, runner, and manufacturing artifacts.
3. The platform SHALL support both offline-capable desktop authoring and
   server-backed collaboration.
4. The platform SHALL maintain revisioned design states and change history.
5. The platform SHALL support import/export adapters for mainstream CAD and
   neutral industrial geometry formats.
6. The platform SHALL expose orchestration APIs for optimization, AI modeling,
   simulation, and documentation generation.

## Non-functional requirements

- Large assemblies with thousands of parts SHALL remain navigable.
- Domain calculations SHALL be deterministic and auditable.
- Cross-platform packaging SHALL be automated.
- The architecture SHALL permit replacing geometry, AI, and CAE adapters.

## Constraints

- The system is greenfield and must tolerate phased capability delivery.
- The desktop authoring workflow is the primary production workflow.
- Web delivery prioritizes collaboration, review, light editing, and approvals
  before full in-browser heavy CAD parity.

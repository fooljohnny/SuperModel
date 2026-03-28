# Capability Spec: Assembly Knowledge and Documentation

## Purpose

Provide reusable assembly intelligence so the platform can generate build
steps, search guidance, part grouping, and customer-facing documentation from
engineering data.

## Scope

- Step graph generation for assembly instructions
- Part dependency graph and build-order reasoning
- Runner-to-step mapping and search path minimization
- Decal, paint, and marking plan definition
- Packaging and kit-configuration metadata

## Functional requirements

### Instruction graph

- The system MUST generate an ordered assembly graph from the product BOM, part
  hierarchy, connector relationships, and motion constraints.
- The instruction graph MUST support optional sub-assemblies, alternate part
  variants, and mirrored steps.
- The system SHOULD detect steps that are likely confusing due to hidden
  connectors, similar parts, or direction-sensitive insertions.

### Runner-aware assembly planning

- The system MUST preserve runner origin metadata for each part instance.
- The system SHOULD optimize runner grouping to reduce cross-runner searching
  during user assembly.
- The system MUST support designer overrides when runner-efficiency conflicts
  with molding or packaging constraints.

### Documentation outputs

- The platform MUST export structured instruction data that can drive PDF,
  print, web, and interactive 3D instruction experiences.
- The platform SHOULD generate exploded views, callouts, warnings, paint guides,
  and decal placements.
- The system MUST support localization-ready documentation content.

### Knowledge reuse

- The platform SHOULD accumulate reusable patterns for common joints,
  transformation mechanisms, and recurring sub-assemblies.
- The system SHOULD allow teams to define company standards for part labels,
  runner naming, warning icons, and packaging conventions.

## Non-functional requirements

- Documentation generation SHOULD be incremental after localized design edits.
- Outputs MUST be traceable to source design revisions and released kit
  configurations.

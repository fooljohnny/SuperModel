# Data Contracts for MVP Engineering Flow

## 1. Purpose

Define the canonical data contracts that all MVP modules share so desktop UI,
Rust domain services, backend persistence, and import/export adapters use the
same semantics.

This document is not a database schema and not a wire-format standard. It is
the canonical contract layer that later JSON schemas, Rust structs, TypeScript
types, and SQL models should conform to.

## 2. Contract design principles

1. Every engineering object is bound to a `project_id` and `revision_id`.
2. Stable IDs identify logical entities across jobs and exports.
3. Mutable working state is separated from released artifacts.
4. Artifacts are referenced by URIs and metadata, not embedded inline.
5. Change impact must be visible on every downstream object.
6. Every automatically generated result must record its assumptions.

## 3. Shared scalar types

### 3.1 Identifiers

- `project_id`: stable ID for a product program
- `revision_id`: stable ID for a revision snapshot
- `entity_id`: stable ID for a logical engineering entity
- `artifact_id`: stable ID for a persisted file or generated artifact

Recommended shape:

- ULID or UUIDv7 for persistence-friendly ordering

### 3.2 Timestamps

- ISO 8601 UTC string for API transport
- native time types inside implementation languages

### 3.3 State enums

#### `revision_state`

- `draft`
- `imported`
- `structured`
- `engineered`
- `verified`
- `released`
- `stale`
- `invalid`
- `archived`

#### `impact_state`

- `clean`
- `recompute_required`
- `stale`
- `invalid`
- `waived`

#### `approval_state`

- `working`
- `review_required`
- `approved`
- `rejected`

### 3.4 Artifact reference

```text
ArtifactRef {
  artifact_id: string
  uri: string
  media_type: string
  file_name: string
  byte_size: integer
  checksum: string
  created_at: datetime
  created_by: string
}
```

## 4. Core contract objects

### 4.1 DesignRevision

```text
DesignRevision {
  revision_id: string
  project_id: string
  parent_revision_id: string | null
  revision_label: string
  state: revision_state
  approval_state: approval_state
  created_at: datetime
  created_by: string
  summary: string
  baseline_artifact_refs: ArtifactRef[]
  impact_summary: ImpactSummary
}
```

### 4.2 ImpactSummary

```text
ImpactSummary {
  stale_entities: integer
  invalid_entities: integer
  recompute_required_entities: integer
  blocked_release: boolean
}
```

### 4.3 SourceGeometry

```text
SourceGeometry {
  geometry_id: string
  revision_id: string
  source_system: SourceSystem
  source_file: ArtifactRef
  normalized_geometry: ArtifactRef | null
  import_profile_id: string | null
  geometry_kind: GeometryKind
  unit_system: UnitSystem
  coordinate_system: CoordinateSystem
  topology_fingerprint: string
  import_status: ImportStatus
  diagnostics: ImportDiagnostic[]
  root_node_refs: string[]
}
```

#### `SourceSystem`

- `zbrush`
- `solidworks`
- `nx`
- `blender`
- `maya`
- `step`
- `parasolid`
- `iges`
- `fbx`
- `gltf`
- `unknown`

#### `GeometryKind`

- `mesh`
- `brep`
- `hybrid`

#### `ImportStatus`

- `pending`
- `running`
- `completed`
- `completed_with_warnings`
- `failed`

### 4.4 ImportDiagnostic

```text
ImportDiagnostic {
  code: string
  severity: "info" | "warning" | "error"
  message: string
  path_hint: string | null
  remediation_hint: string | null
}
```

### 4.5 AssemblyNode

```text
AssemblyNode {
  assembly_node_id: string
  revision_id: string
  parent_node_id: string | null
  source_geometry_id: string | null
  name: string
  node_type: "assembly" | "subassembly" | "part_instance"
  transform: Transform3
  motion_group_id: string | null
  variant_scope: string | null
  suppressed: boolean
  impact_state: impact_state
}
```

### 4.6 Transform3

```text
Transform3 {
  translation: [number, number, number]
  rotation_quaternion: [number, number, number, number]
  scale: [number, number, number]
}
```

### 4.7 PartDefinition

```text
PartDefinition {
  part_id: string
  revision_id: string
  assembly_node_id: string | null
  part_code: string
  display_name: string
  part_family: string
  geometry_reference: GeometryRegionRef[]
  color_zone: string | null
  surface_finish: string | null
  shell_thickness_mm: number | null
  draft_requirement_deg: number | null
  material_profile_id: string | null
  split_strategy: "manual" | "assisted" | "rule"
  is_structural: boolean
  approval_state: approval_state
  impact_state: impact_state
}
```

### 4.8 GeometryRegionRef

```text
GeometryRegionRef {
  source_geometry_id: string
  region_selector: string
  topology_fingerprint: string
}
```

### 4.9 SplitDefinition

```text
SplitDefinition {
  split_id: string
  revision_id: string
  output_part_id: string
  source_geometry_ids: string[]
  split_method: "manual_curve" | "surface_cut" | "assisted" | "rule"
  split_boundary_refs: string[]
  preserve_features: string[]
  generated_by: "manual" | "assisted" | "rule"
  confidence_score: number | null
  color_separation_markers: string[]
  pre_paint_markers: string[]
}
```

### 4.10 ConnectorTemplate

```text
ConnectorTemplate {
  connector_template_id: string
  template_type: "peg" | "socket" | "snap_fit" | "rib" | "joint_core"
  material_class: string
  fit_class: string
  default_dimensions: Record<string, number>
  wall_thickness_constraints: Record<string, number>
  allowed_motion_types: string[]
  usage_guidelines: string
  organization_scope: "global" | "workspace" | "project"
}
```

### 4.11 ConnectorInstance

```text
ConnectorInstance {
  connector_id: string
  revision_id: string
  connector_template_id: string
  primary_part_id: string
  secondary_part_id: string | null
  placement_frame: Transform3
  dimension_overrides: Record<string, number>
  tolerance_profile_id: string | null
  expected_assembly_force_n: number | null
  orientation_key: string | null
  lock_state: "unlocked" | "locked"
  lock_reason: string | null
  approval_state: approval_state
  impact_state: impact_state
}
```

### 4.12 JointDefinition

```text
JointDefinition {
  joint_id: string
  revision_id: string
  joint_type: "hinge" | "ball" | "slider" | "fixed"
  part_a_id: string
  part_b_id: string
  connector_ids: string[]
  range_limits: Record<string, number>
  clearance_profile_id: string | null
  assembly_critical: boolean
}
```

### 4.13 MaterialProfile

```text
MaterialProfile {
  material_profile_id: string
  name: string
  material_family: string
  hardness_class: string | null
  shrinkage_rate: number
  wall_thickness_range_mm: {
    min: number
    max: number
  }
  paint_allowance_mm: number | null
  surface_risk_notes: string[]
}
```

### 4.14 ToleranceProfile

```text
ToleranceProfile {
  tolerance_profile_id: string
  name: string
  connector_type: string
  material_profile_id: string
  nominal_clearance_mm: number
  press_fit_delta_mm: number
  sliding_fit_delta_mm: number
  rotation_fit_delta_mm: number
  manual_override_allowed: boolean
}
```

### 4.15 VerificationResult

```text
VerificationResult {
  verification_id: string
  revision_id: string
  target_type: "part" | "connector" | "joint" | "runner_sheet"
  target_id: string
  verification_kind: "interference" | "kinematic" | "draft" | "wall_thickness" | "tolerance"
  status: "pass" | "warning" | "fail"
  severity: "info" | "minor" | "major" | "blocking"
  summary: string
  assumptions: Record<string, string | number | boolean>
  artifacts: ArtifactRef[]
  computed_from_revision_id: string
  impact_state: impact_state
  waived_by: string | null
  waiver_reason: string | null
}
```

### 4.16 RunnerSheet

```text
RunnerSheet {
  runner_sheet_id: string
  revision_id: string
  sheet_code: string
  assigned_part_ids: string[]
  gate_strategy: string | null
  runner_topology: string | null
  waste_ratio_estimate: number | null
  fill_balance_score: number | null
  tooling_complexity_score: number | null
  approval_state: approval_state
  impact_state: impact_state
}
```

### 4.17 ToolingExportPackage

```text
ToolingExportPackage {
  tooling_export_id: string
  revision_id: string
  package_type: "cnc" | "mold_review" | "3d_print_check"
  export_profile_id: string
  included_entity_refs: EntityRef[]
  artifact_manifest: ArtifactRef[]
  release_state: "draft" | "generated" | "released" | "superseded"
  generated_at: datetime | null
  generated_by: string | null
}
```

### 4.18 EntityRef

```text
EntityRef {
  entity_type: string
  entity_id: string
  revision_id: string
}
```

## 5. Cross-object integrity rules

1. A `PartDefinition` MUST not reference a `SourceGeometry` from another revision.
2. A `ConnectorInstance` MUST not bind parts from different revisions.
3. A `VerificationResult` MUST declare its assumptions and source revision.
4. A `ToolingExportPackage` MUST not be released if any included entity is in
   `stale` or `invalid` state.
5. Every artifact-producing object MUST use `ArtifactRef`.

## 6. API transport recommendations

- Use JSON for early API contracts and internal service boundaries.
- Use explicit enum strings instead of numeric enum values.
- Always return `revision_id` and `impact_state` on engineering entities.
- Prefer append-only audit events for release-affecting changes.

## 7. Mapping guidance

### Rust

- model enums explicitly
- avoid untyped maps except for assumptions and dimension overrides
- use strongly typed newtypes for IDs where possible

### TypeScript

- mirror enum strings exactly
- generate DTO types from machine-readable schema later
- keep UI-only view state outside these contracts

### Persistence

- store released artifact metadata separately from working object state
- version logical engineering entities by revision rather than in-place mutation

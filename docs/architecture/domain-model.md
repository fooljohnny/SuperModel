# Domain Model Draft

## 1. Domain intent

The first product slice is centered on structural decomposition and downstream
engineering continuity. The domain model therefore prioritizes:

- imported source geometry as the upstream truth
- derived part definitions that remain associated with source geometry
- reusable connector standards
- manufacturability and tolerance data attached to parts and joints
- runner sheets and tooling outputs derived from approved part states

## 2. Core aggregate candidates

### 2.1 Product

Represents the commercial design program.

Fields:

- `product_id`
- `name`
- `market_segment`
- `target_difficulty`
- `target_part_count`
- `target_runner_count`
- `target_cost_band`
- `status`

### 2.2 DesignRevision

Represents a revisioned design state that binds source geometry, part structure,
engineering rules, and downstream outputs.

Fields:

- `revision_id`
- `product_id`
- `parent_revision_id`
- `revision_label`
- `author`
- `created_at`
- `approval_state`
- `upstream_geometry_refs[]`
- `change_summary`

### 2.3 SourceGeometry

Represents imported or native geometric source data.

Fields:

- `geometry_id`
- `revision_id`
- `source_system` (`zbrush`, `solidworks`, `nx`, `blender`, `maya`, `step`, ...)
- `source_file_uri`
- `geometry_kind` (`mesh`, `brep`, `hybrid`)
- `unit_system`
- `topology_fingerprint`
- `import_status`

### 2.4 AssemblyNode

Represents a hierarchical node in the product assembly graph.

Fields:

- `assembly_node_id`
- `revision_id`
- `parent_node_id`
- `name`
- `node_type` (`assembly`, `subassembly`, `part-instance`)
- `transform`
- `motion_group_id`
- `suppressed`

### 2.5 PartDefinition

Represents a manufacturable part derived from one or more source geometry
regions.

Fields:

- `part_id`
- `revision_id`
- `part_code`
- `display_name`
- `color_zone`
- `surface_finish`
- `part_family`
- `geometry_reference`
- `shell_thickness`
- `draft_requirement`
- `split_strategy`
- `is_structural`

### 2.6 SplitDefinition

Represents the logic that derives a part from source geometry.

Fields:

- `split_id`
- `part_id`
- `source_geometry_id`
- `split_method`
- `split_boundary_refs[]`
- `preserve_features[]`
- `generated_by` (`manual`, `assisted`, `rule`)
- `confidence_score`

### 2.7 ConnectorTemplate

Represents a reusable engineering template for pegs, sockets, snap fits, ribs,
and reinforcement features.

Fields:

- `connector_template_id`
- `template_type`
- `material_class`
- `fit_class`
- `default_dimensions`
- `wall_thickness_constraints`
- `allowed_motion_types[]`
- `usage_guidelines`

### 2.8 ConnectorInstance

Represents a placed connector linked to one or more parts.

Fields:

- `connector_id`
- `revision_id`
- `connector_template_id`
- `primary_part_id`
- `secondary_part_id`
- `placement_frame`
- `dimension_overrides`
- `expected_assembly_force`
- `orientation_key`
- `approval_state`

### 2.9 JointDefinition

Represents a motion-bearing relationship between parts.

Fields:

- `joint_id`
- `revision_id`
- `joint_type` (`hinge`, `ball`, `slider`, `fixed`)
- `part_a_id`
- `part_b_id`
- `range_limits`
- `clearance_profile_id`
- `kinematic_priority`

### 2.10 MaterialProfile

Represents material and process assumptions used in structural and tooling
decisions.

Fields:

- `material_profile_id`
- `name`
- `material_family` (`ps`, `abs`, `pp`, `tpu`, `pvc`, `alloy`, ...)
- `hardness_class`
- `shrinkage_rate`
- `wall_thickness_range`
- `paint_allowance`
- `surface_risk_notes`

### 2.11 ToleranceProfile

Represents fit and clearance assumptions for connectors and moving joints.

Fields:

- `tolerance_profile_id`
- `name`
- `connector_type`
- `material_profile_id`
- `nominal_clearance`
- `press_fit_delta`
- `sliding_fit_delta`
- `rotation_fit_delta`
- `manual_override_allowed`

### 2.12 VerificationResult

Represents deterministic engineering checks.

Fields:

- `verification_id`
- `revision_id`
- `target_type`
- `target_id`
- `verification_kind` (`interference`, `kinematic`, `draft`, `wall-thickness`, `tolerance`)
- `status`
- `severity`
- `summary`
- `artifacts[]`
- `computed_from_revision_id`

### 2.13 RunnerSheet

Represents a board/runner assembly used for injection tooling and downstream
output.

Fields:

- `runner_sheet_id`
- `revision_id`
- `sheet_code`
- `assigned_parts[]`
- `gate_strategy`
- `runner_topology`
- `waste_ratio_estimate`
- `fill_balance_score`
- `tooling_complexity_score`

### 2.14 ToolingExportPackage

Represents release-ready output for CNC, mold review, and manufacturing handoff.

Fields:

- `tooling_export_id`
- `revision_id`
- `package_type` (`cnc`, `mold-review`, `3d-print-check`)
- `included_entities[]`
- `export_format`
- `artifact_uri`
- `release_state`

## 3. Relationships

- A `Product` has many `DesignRevision`.
- A `DesignRevision` references many `SourceGeometry`, `AssemblyNode`,
  `PartDefinition`, `ConnectorInstance`, `JointDefinition`, `VerificationResult`,
  `RunnerSheet`, and `ToolingExportPackage`.
- A `PartDefinition` is derived by one or more `SplitDefinition`.
- A `ConnectorInstance` is created from one `ConnectorTemplate`.
- A `JointDefinition` links two `PartDefinition`.
- `MaterialProfile` and `ToleranceProfile` influence `ConnectorInstance`,
  `JointDefinition`, and `VerificationResult`.
- A `RunnerSheet` groups many `PartDefinition`.

## 4. Derived graph principles

The system should maintain an associative graph:

- `SourceGeometry -> SplitDefinition -> PartDefinition -> ConnectorInstance`
- `PartDefinition -> JointDefinition -> VerificationResult`
- `PartDefinition -> RunnerSheet -> ToolingExportPackage`

When an upstream node changes, downstream nodes become either:

- auto-recomputable
- stale and requiring review
- invalid and blocked from release

## 5. First implementation recommendation

The first executable domain slice should implement these entities first:

1. `SourceGeometry`
2. `DesignRevision`
3. `AssemblyNode`
4. `PartDefinition`
5. `SplitDefinition`
6. `ConnectorTemplate`
7. `ConnectorInstance`
8. `VerificationResult`
9. `RunnerSheet`
10. `ToolingExportPackage`

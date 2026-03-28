# Adapter Contracts

## 1. Purpose

Define the stable contract boundaries between the SuperModel core domain and
external import/export adapters, starting with ZBrush-led ingestion and
CNC/tooling-oriented export packaging.

## 2. Adapter design principles

1. Adapters convert between external formats and internal domain contracts.
2. Adapters do not own canonical business entities such as `PartDefinition` or
   `RunnerSheet`.
3. Every adapter execution is revision-bound and audit-loggable.
4. Adapters may produce warnings, but only validated core contracts may progress
   into release-critical workflows.
5. External file specifics stay at the adapter edge; internal modules consume
   normalized contracts.

## 3. ZBrush import adapter contract

### 3.1 Goal

Convert ZBrush-origin sculpt data into normalized source geometry records and
import hierarchy descriptors that the assembly/part graph can consume.

### 3.2 Input contract

```yaml
ZBrushImportRequest:
  request_id: string
  project_id: string
  revision_id: string
  source_uri: string
  declared_source_system: zbrush
  options:
    unit_hint: mm | cm | inch | unknown
    axis_hint: z-up | y-up | unknown
    preserve_subtool_names: boolean
    merge_visible_subtools: boolean
    import_polygroups_as_regions: boolean
    generate_decimated_preview: boolean
```

### 3.3 Output contract

```yaml
ZBrushImportResult:
  request_id: string
  revision_id: string
  status: succeeded | warning | failed
  source_geometry:
    - geometry_id: string
      geometry_kind: mesh
      source_system: zbrush
      topology_fingerprint: string
      source_file_uri: string
      normalized_artifact_uri: string
      preview_artifact_uri: string|null
      unit_system: string
      axis_system: string
      subtool_path: [string]
      region_keys: [string]
  import_hierarchy:
    - node_key: string
      parent_node_key: string|null
      display_name: string
      geometry_ids: [string]
  diagnostics:
    - severity: info | warning | blocking
      code: string
      message: string
      entity_ref: string|null
      remediation: string|null
```

### 3.4 Behavioral rules

- Each imported ZBrush subtool MUST map to one or more normalized source
  geometry records.
- Polygroup-derived regions SHOULD be preserved as candidate split guidance when
  available.
- The adapter MUST not directly create `PartDefinition`; that remains core-domain
  work after import.
- Failed normalization MUST prevent the corresponding geometry from entering
  decomposition workflows.

## 4. Generic CAD import adapter contract

### 4.1 Goal

Create a reusable import contract for SolidWorks, Siemens NX, and later CAD
sources while allowing per-adapter implementation detail.

### 4.2 Common request

```yaml
CadImportRequest:
  request_id: string
  project_id: string
  revision_id: string
  source_uri: string
  declared_source_system: solidworks | nx | blender | maya | step | parasolid | iges | fbx | gltf
  options:
    unit_hint: string|null
    axis_hint: string|null
    heal_geometry: boolean
    tessellation_profile: coarse | balanced | precise
```

### 4.3 Common result

```yaml
CadImportResult:
  request_id: string
  revision_id: string
  status: succeeded | warning | failed
  source_geometry: [SourceGeometryContract]
  import_hierarchy: [ImportedNodeContract]
  diagnostics: [DiagnosticContract]
```

## 5. Tooling export adapter contract

### 5.1 Goal

Generate release-ready packages for CNC review, mold review, and downstream
manufacturing handoff without letting export implementations redefine business
release rules.

### 5.2 Input contract

```yaml
ToolingExportRequest:
  request_id: string
  project_id: string
  revision_id: string
  export_profile:
    profile_id: string
    package_type: cnc | mold-review | 3d-print-check
    target_format: step | parasolid | iges | stl | 3mf | zip-manifest
    include_runner_geometry: boolean
    include_part_geometry: boolean
    include_verification_summary: boolean
    include_material_metadata: boolean
  entity_selection:
    runner_sheet_ids: [string]
    part_ids: [string]
  release_mode: draft | release
```

### 5.3 Output contract

```yaml
ToolingExportResult:
  request_id: string
  revision_id: string
  status: succeeded | warning | failed
  tooling_export_package:
    tooling_export_id: string
    package_type: string
    export_format: string
    artifact_uri: string
    manifest_uri: string
    included_entities:
      parts: [string]
      runner_sheets: [string]
      verification_results: [string]
  diagnostics:
    - severity: info | warning | blocking
      code: string
      message: string
      entity_ref: string|null
      remediation: string|null
```

### 5.4 Export manifest contract

Every release-ready package should include a manifest comparable to:

```yaml
ToolingExportManifest:
  schema_version: "0.1"
  tooling_export_id: string
  project_id: string
  revision_id: string
  revision_state: verified | released
  package_type: cnc | mold-review | 3d-print-check
  export_format: string
  generated_at: timestamp
  source_entities:
    parts:
      - part_id: string
        part_code: string
        geometry_artifact_uri: string
        material_profile_id: string|null
        verification_status: pass | warning | fail | waived
    runner_sheets:
      - runner_sheet_id: string
        sheet_code: string
        assigned_parts: [string]
        gate_strategy: string|null
  verification_summary:
    blocking_failures: integer
    warning_count: integer
    waived_checks: integer
```

### 5.5 Behavioral rules

- Release-mode export MUST fail if the revision or selected entities are not in
  an exportable state.
- Draft-mode export MAY succeed with warnings if the package is clearly labeled
  as non-release.
- Export packages MUST preserve traceable references to part IDs, runner sheet
  IDs, and the source revision.

## 6. Adapter error model

Shared diagnostic severities:

- `info`
- `warning`
- `blocking`

Shared failure classes:

- source file unreadable
- unsupported source feature
- unit or axis ambiguity
- normalization failure
- missing required revision state
- stale upstream dependencies
- unresolved blocking verification
- artifact generation failure

## 7. Next implementation recommendation

Implement adapter contracts in this order:

1. ZBrush import adapter
2. generic import job protocol
3. tooling export manifest generator
4. CNC/mold-review export profiles
5. SolidWorks import adapter
6. Siemens NX import adapter

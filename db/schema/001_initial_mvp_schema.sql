-- Initial PostgreSQL schema draft for the SuperModel MVP.
-- This schema follows the revision-bound persistence strategy described in
-- docs/architecture/database-design.md and
-- docs/architecture/persistence-versioning.md.

create extension if not exists "pgcrypto";

do $$
begin
    if not exists (select 1 from pg_type where typname = 'revision_state') then
        create type revision_state as enum (
            'draft',
            'imported',
            'structured',
            'engineered',
            'verified',
            'released',
            'stale',
            'invalid',
            'archived'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'approval_state') then
        create type approval_state as enum (
            'working',
            'review_required',
            'approved',
            'rejected'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'impact_state') then
        create type impact_state as enum (
            'clean',
            'recompute_required',
            'stale',
            'invalid',
            'waived'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'import_status') then
        create type import_status as enum (
            'pending',
            'running',
            'completed',
            'completed_with_warnings',
            'failed'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'source_system') then
        create type source_system as enum (
            'zbrush',
            'solidworks',
            'nx',
            'blender',
            'maya',
            'step',
            'parasolid',
            'iges',
            'fbx',
            'gltf',
            'unknown'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'geometry_kind') then
        create type geometry_kind as enum (
            'mesh',
            'brep',
            'hybrid'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'node_type') then
        create type node_type as enum (
            'assembly',
            'subassembly',
            'part_instance'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'split_strategy') then
        create type split_strategy as enum (
            'manual',
            'assisted',
            'rule'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'split_method') then
        create type split_method as enum (
            'manual_curve',
            'surface_cut',
            'assisted',
            'rule'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'generated_by_type') then
        create type generated_by_type as enum (
            'manual',
            'assisted',
            'rule'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'connector_template_type') then
        create type connector_template_type as enum (
            'peg',
            'socket',
            'snap_fit',
            'rib',
            'joint_core'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'organization_scope') then
        create type organization_scope as enum (
            'global',
            'workspace',
            'project'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'lock_state') then
        create type lock_state as enum (
            'unlocked',
            'locked'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'joint_type') then
        create type joint_type as enum (
            'hinge',
            'ball',
            'slider',
            'fixed'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'verification_target_type') then
        create type verification_target_type as enum (
            'part',
            'connector',
            'joint',
            'runner_sheet'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'verification_kind') then
        create type verification_kind as enum (
            'interference',
            'kinematic',
            'draft',
            'wall_thickness',
            'tolerance'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'verification_status') then
        create type verification_status as enum (
            'pass',
            'warning',
            'fail'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'verification_severity') then
        create type verification_severity as enum (
            'info',
            'minor',
            'major',
            'blocking'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'tooling_package_type') then
        create type tooling_package_type as enum (
            'cnc',
            'mold_review',
            '3d_print_check'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'tooling_release_state') then
        create type tooling_release_state as enum (
            'draft',
            'generated',
            'released',
            'superseded'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'job_status') then
        create type job_status as enum (
            'pending',
            'running',
            'completed',
            'failed',
            'cancelled'
        );
    end if;
end $$;

create table if not exists projects (
    project_id text primary key,
    name text not null,
    market_segment text not null,
    target_difficulty text,
    target_part_count integer,
    target_runner_count integer,
    target_cost_band text,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    created_by text not null
);

create table if not exists design_revisions (
    revision_id text primary key,
    project_id text not null references projects(project_id) on delete cascade,
    parent_revision_id text references design_revisions(revision_id),
    revision_label text not null,
    state revision_state not null default 'draft',
    approval_state approval_state not null default 'working',
    summary text not null default '',
    stale_entities integer not null default 0,
    invalid_entities integer not null default 0,
    recompute_required_entities integer not null default 0,
    blocked_release boolean not null default false,
    created_at timestamptz not null default now(),
    created_by text not null,
    updated_at timestamptz not null default now()
);

create unique index if not exists design_revisions_project_label_uidx
    on design_revisions(project_id, revision_label);

create table if not exists revision_state_transitions (
    transition_id uuid primary key default gen_random_uuid(),
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    from_state revision_state,
    to_state revision_state not null,
    changed_at timestamptz not null default now(),
    changed_by text not null,
    reason text
);

create table if not exists artifacts (
    artifact_id text primary key,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text references design_revisions(revision_id) on delete cascade,
    uri text not null,
    media_type text not null,
    file_name text not null,
    byte_size bigint,
    checksum text,
    created_at timestamptz not null default now(),
    created_by text not null,
    metadata jsonb not null default '{}'::jsonb
);

create index if not exists artifacts_revision_idx
    on artifacts(revision_id);

create table if not exists revision_artifacts (
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    artifact_id text not null references artifacts(artifact_id) on delete cascade,
    artifact_role text not null,
    primary key (revision_id, artifact_id, artifact_role)
);

create table if not exists source_geometries (
    id bigserial primary key,
    geometry_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    source_system source_system not null,
    source_artifact_id text not null references artifacts(artifact_id),
    normalized_artifact_id text references artifacts(artifact_id),
    import_profile_id text,
    geometry_kind geometry_kind not null,
    unit_system text not null,
    coordinate_system jsonb not null default '{}'::jsonb,
    topology_fingerprint text not null,
    import_status import_status not null default 'pending',
    impact_state impact_state not null default 'clean',
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (geometry_id, revision_id)
);

create index if not exists source_geometries_revision_idx
    on source_geometries(revision_id);

create table if not exists import_diagnostics (
    diagnostic_id uuid primary key default gen_random_uuid(),
    geometry_id text not null,
    revision_id text not null,
    code text not null,
    severity text not null,
    message text not null,
    path_hint text,
    remediation_hint text,
    created_at timestamptz not null default now(),
    foreign key (geometry_id, revision_id) references source_geometries(geometry_id, revision_id) on delete cascade
);

create table if not exists import_jobs (
    job_id text primary key,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    geometry_id text not null,
    adapter_name text not null,
    declared_source_format text,
    request_payload jsonb not null default '{}'::jsonb,
    status job_status not null default 'pending',
    progress numeric(5,2),
    started_at timestamptz,
    completed_at timestamptz,
    error_code text,
    error_message text,
    foreign key (geometry_id, revision_id) references source_geometries(geometry_id, revision_id) on delete cascade
);

create table if not exists assembly_nodes (
    id bigserial primary key,
    assembly_node_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    parent_node_id text,
    source_geometry_id text,
    name text not null,
    node_type node_type not null,
    translation jsonb not null default '[0,0,0]'::jsonb,
    rotation_quaternion jsonb not null default '[0,0,0,1]'::jsonb,
    scale jsonb not null default '[1,1,1]'::jsonb,
    motion_group_id text,
    variant_scope text,
    suppressed boolean not null default false,
    impact_state impact_state not null default 'clean',
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (assembly_node_id, revision_id),
    foreign key (parent_node_id, revision_id) references assembly_nodes(assembly_node_id, revision_id),
    foreign key (source_geometry_id, revision_id) references source_geometries(geometry_id, revision_id)
);

create index if not exists assembly_nodes_revision_idx
    on assembly_nodes(revision_id);

create table if not exists material_profiles (
    material_profile_id text primary key,
    project_id text references projects(project_id) on delete cascade,
    name text not null,
    material_family text not null,
    hardness_class text,
    shrinkage_rate numeric(10,6) not null,
    wall_thickness_min_mm numeric(10,4),
    wall_thickness_max_mm numeric(10,4),
    paint_allowance_mm numeric(10,4),
    surface_risk_notes jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    created_by text not null
);

create table if not exists tolerance_profiles (
    tolerance_profile_id text primary key,
    project_id text references projects(project_id) on delete cascade,
    name text not null,
    connector_type text not null,
    material_profile_id text not null references material_profiles(material_profile_id),
    nominal_clearance_mm numeric(10,4) not null,
    press_fit_delta_mm numeric(10,4) not null,
    sliding_fit_delta_mm numeric(10,4) not null,
    rotation_fit_delta_mm numeric(10,4) not null,
    manual_override_allowed boolean not null default false,
    created_at timestamptz not null default now(),
    created_by text not null
);

create table if not exists part_definitions (
    id bigserial primary key,
    part_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    assembly_node_id text,
    part_code text not null,
    display_name text not null,
    part_family text not null,
    color_zone text,
    surface_finish text,
    shell_thickness_mm numeric(10,4),
    draft_requirement_deg numeric(10,4),
    material_profile_id text references material_profiles(material_profile_id),
    split_strategy split_strategy not null,
    is_structural boolean not null default true,
    approval_state approval_state not null default 'working',
    impact_state impact_state not null default 'clean',
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (part_id, revision_id),
    unique (revision_id, part_code),
    foreign key (assembly_node_id, revision_id) references assembly_nodes(assembly_node_id, revision_id)
);

create index if not exists part_definitions_revision_idx
    on part_definitions(revision_id);

create table if not exists part_geometry_regions (
    region_ref_id uuid primary key default gen_random_uuid(),
    part_id text not null,
    part_revision_id text not null,
    source_geometry_id text not null,
    source_revision_id text not null,
    region_selector text not null,
    topology_fingerprint text not null,
    foreign key (part_id, part_revision_id) references part_definitions(part_id, revision_id) on delete cascade,
    foreign key (source_geometry_id, source_revision_id) references source_geometries(geometry_id, revision_id)
);

create table if not exists split_definitions (
    id bigserial primary key,
    split_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    output_part_id text not null,
    split_method split_method not null,
    generated_by generated_by_type not null,
    confidence_score numeric(10,4),
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (split_id, revision_id),
    foreign key (output_part_id, revision_id) references part_definitions(part_id, revision_id) on delete cascade
);

create table if not exists split_source_geometries (
    split_id text not null,
    revision_id text not null,
    source_geometry_id text not null,
    primary key (split_id, revision_id, source_geometry_id),
    foreign key (split_id, revision_id) references split_definitions(split_id, revision_id) on delete cascade,
    foreign key (source_geometry_id, revision_id) references source_geometries(geometry_id, revision_id)
);

create table if not exists split_boundary_refs (
    split_boundary_ref_id uuid primary key default gen_random_uuid(),
    split_id text not null,
    revision_id text not null,
    boundary_ref text not null,
    boundary_order integer not null default 0,
    foreign key (split_id, revision_id) references split_definitions(split_id, revision_id) on delete cascade
);

create table if not exists split_feature_refs (
    split_feature_ref_id uuid primary key default gen_random_uuid(),
    split_id text not null,
    revision_id text not null,
    feature_ref text not null,
    feature_role text not null,
    foreign key (split_id, revision_id) references split_definitions(split_id, revision_id) on delete cascade
);

create table if not exists connector_templates (
    connector_template_id text primary key,
    project_id text references projects(project_id) on delete cascade,
    template_type connector_template_type not null,
    material_class text not null,
    fit_class text not null,
    default_dimensions jsonb not null default '{}'::jsonb,
    wall_thickness_constraints jsonb not null default '{}'::jsonb,
    allowed_motion_types jsonb not null default '[]'::jsonb,
    usage_guidelines text not null default '',
    organization_scope organization_scope not null default 'project',
    created_at timestamptz not null default now(),
    created_by text not null
);

create table if not exists connector_instances (
    id bigserial primary key,
    connector_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    connector_template_id text not null references connector_templates(connector_template_id),
    primary_part_id text not null,
    secondary_part_id text,
    placement_translation jsonb not null default '[0,0,0]'::jsonb,
    placement_rotation_quaternion jsonb not null default '[0,0,0,1]'::jsonb,
    placement_scale jsonb not null default '[1,1,1]'::jsonb,
    dimension_overrides jsonb not null default '{}'::jsonb,
    tolerance_profile_id text references tolerance_profiles(tolerance_profile_id),
    expected_assembly_force_n numeric(10,4),
    orientation_key text,
    lock_state lock_state not null default 'unlocked',
    lock_reason text,
    approval_state approval_state not null default 'working',
    impact_state impact_state not null default 'clean',
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (connector_id, revision_id),
    foreign key (primary_part_id, revision_id) references part_definitions(part_id, revision_id),
    foreign key (secondary_part_id, revision_id) references part_definitions(part_id, revision_id)
);

create index if not exists connector_instances_revision_idx
    on connector_instances(revision_id);

create table if not exists joint_definitions (
    id bigserial primary key,
    joint_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    joint_type joint_type not null,
    part_a_id text not null,
    part_b_id text not null,
    range_limits jsonb not null default '{}'::jsonb,
    clearance_profile_id text references tolerance_profiles(tolerance_profile_id),
    assembly_critical boolean not null default false,
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (joint_id, revision_id),
    foreign key (part_a_id, revision_id) references part_definitions(part_id, revision_id),
    foreign key (part_b_id, revision_id) references part_definitions(part_id, revision_id)
);

create table if not exists joint_connectors (
    joint_id text not null,
    revision_id text not null,
    connector_id text not null,
    primary key (joint_id, revision_id, connector_id),
    foreign key (joint_id, revision_id) references joint_definitions(joint_id, revision_id) on delete cascade,
    foreign key (connector_id, revision_id) references connector_instances(connector_id, revision_id) on delete cascade
);

create table if not exists verification_jobs (
    job_id text primary key,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    request_payload jsonb not null default '{}'::jsonb,
    status job_status not null default 'pending',
    progress numeric(5,2),
    started_at timestamptz,
    completed_at timestamptz,
    error_code text,
    error_message text
);

create table if not exists verification_results (
    id bigserial primary key,
    verification_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    verification_job_id text references verification_jobs(job_id) on delete set null,
    target_type verification_target_type not null,
    target_id text not null,
    verification_kind verification_kind not null,
    status verification_status not null,
    severity verification_severity not null,
    summary text not null,
    assumptions jsonb not null default '{}'::jsonb,
    computed_from_revision_id text not null references design_revisions(revision_id),
    impact_state impact_state not null default 'clean',
    waived_by text,
    waiver_reason text,
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (verification_id, revision_id)
);

create index if not exists verification_results_revision_idx
    on verification_results(revision_id);

create table if not exists verification_result_artifacts (
    verification_id text not null,
    revision_id text not null,
    artifact_id text not null references artifacts(artifact_id) on delete cascade,
    primary key (verification_id, revision_id, artifact_id),
    foreign key (verification_id, revision_id) references verification_results(verification_id, revision_id) on delete cascade
);

create table if not exists runner_sheets (
    id bigserial primary key,
    runner_sheet_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    sheet_code text not null,
    gate_strategy text,
    runner_topology text,
    waste_ratio_estimate numeric(10,6),
    fill_balance_score numeric(10,6),
    tooling_complexity_score numeric(10,6),
    approval_state approval_state not null default 'working',
    impact_state impact_state not null default 'clean',
    created_at timestamptz not null default now(),
    created_by text not null,
    unique (runner_sheet_id, revision_id),
    unique (revision_id, sheet_code)
);

create table if not exists runner_sheet_parts (
    runner_sheet_id text not null,
    revision_id text not null,
    part_id text not null,
    assignment_order integer not null default 0,
    primary key (runner_sheet_id, revision_id, part_id),
    foreign key (runner_sheet_id, revision_id) references runner_sheets(runner_sheet_id, revision_id) on delete cascade,
    foreign key (part_id, revision_id) references part_definitions(part_id, revision_id) on delete cascade
);

create table if not exists tooling_export_jobs (
    job_id text primary key,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    request_payload jsonb not null default '{}'::jsonb,
    status job_status not null default 'pending',
    progress numeric(5,2),
    started_at timestamptz,
    completed_at timestamptz,
    error_code text,
    error_message text
);

create table if not exists tooling_export_packages (
    id bigserial primary key,
    tooling_export_id text not null,
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    tooling_export_job_id text references tooling_export_jobs(job_id) on delete set null,
    package_type tooling_package_type not null,
    export_profile_id text not null,
    release_state tooling_release_state not null default 'draft',
    generated_at timestamptz,
    generated_by text,
    created_at timestamptz not null default now(),
    unique (tooling_export_id, revision_id)
);

create table if not exists tooling_export_entities (
    tooling_export_id text not null,
    export_revision_id text not null,
    entity_type text not null,
    entity_id text not null,
    revision_id text not null references design_revisions(revision_id) on delete cascade,
    primary key (tooling_export_id, export_revision_id, entity_type, entity_id, revision_id),
    foreign key (tooling_export_id, export_revision_id) references tooling_export_packages(tooling_export_id, revision_id) on delete cascade
);

create table if not exists tooling_export_artifacts (
    tooling_export_id text not null,
    revision_id text not null,
    artifact_id text not null references artifacts(artifact_id) on delete cascade,
    artifact_role text not null default 'package',
    primary key (tooling_export_id, revision_id, artifact_id, artifact_role),
    foreign key (tooling_export_id, revision_id) references tooling_export_packages(tooling_export_id, revision_id) on delete cascade
);

create table if not exists audit_events (
    event_id uuid primary key default gen_random_uuid(),
    project_id text not null references projects(project_id) on delete cascade,
    revision_id text references design_revisions(revision_id) on delete cascade,
    entity_type text not null,
    entity_id text not null,
    event_type text not null,
    actor_id text not null,
    event_payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists audit_events_revision_idx
    on audit_events(revision_id, created_at desc);

-- 001_mvp_core.sql
-- Core tables for the design-orchestrator MVP vertical slice:
-- projects, design_revisions, source_geometries, import_diagnostics, import_jobs.
--
-- This is a focused subset of the full schema (db/schema/001_initial_mvp_schema.sql)
-- covering only what the running orchestrator chain actually uses today.

create extension if not exists "pgcrypto";

-- ─── enums ──────────────────────────────────────────────────────────────────

do $$
begin
    if not exists (select 1 from pg_type where typname = 'revision_state') then
        create type revision_state as enum (
            'draft','imported','structured','engineered',
            'verified','released','stale','invalid','archived'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'approval_state') then
        create type approval_state as enum (
            'working','review_required','approved','rejected'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'impact_state') then
        create type impact_state as enum (
            'clean','recompute_required','stale','invalid','waived'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'import_status') then
        create type import_status as enum (
            'pending','running','completed','completed_with_warnings','failed'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'source_system') then
        create type source_system as enum (
            'zbrush','solidworks','nx','blender','maya',
            'step','parasolid','iges','fbx','gltf','unknown'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'job_status') then
        create type job_status as enum (
            'pending','running','completed','failed','cancelled'
        );
    end if;
end $$;

-- ─── tables ─────────────────────────────────────────────────────────────────

create table if not exists projects (
    project_id   text primary key,
    name         text not null,
    market_segment text not null,
    target_difficulty text,
    target_part_count integer,
    status       text not null default 'active',
    created_at   timestamptz not null default now(),
    created_by   text not null
);

create table if not exists design_revisions (
    revision_id       text primary key,
    project_id        text not null references projects(project_id) on delete cascade,
    parent_revision_id text references design_revisions(revision_id),
    revision_label    text not null,
    state             revision_state not null default 'draft',
    approval_state    approval_state not null default 'working',
    summary           text not null default '',
    stale_entities    integer not null default 0,
    invalid_entities  integer not null default 0,
    recompute_required_entities integer not null default 0,
    blocked_release   boolean not null default false,
    created_at        timestamptz not null default now(),
    created_by        text not null,
    updated_at        timestamptz not null default now()
);

create unique index if not exists design_revisions_project_label_uidx
    on design_revisions(project_id, revision_label);

create table if not exists source_geometries (
    source_geometry_id text primary key,
    project_id   text not null references projects(project_id) on delete cascade,
    revision_id  text not null references design_revisions(revision_id) on delete cascade,
    source_system source_system not null,
    declared_file_format text not null,
    source_filename text not null,
    unit_system  text not null,
    import_status import_status not null default 'pending',
    impact_state impact_state not null default 'clean',
    created_at   timestamptz not null default now(),
    created_by   text not null
);

create index if not exists source_geometries_revision_idx
    on source_geometries(revision_id);

create table if not exists import_diagnostics (
    diagnostic_id uuid primary key default gen_random_uuid(),
    source_geometry_id text not null references source_geometries(source_geometry_id) on delete cascade,
    code       text not null,
    severity   text not null,
    message    text not null,
    path_hint  text,
    remediation_hint text,
    created_at timestamptz not null default now()
);

create index if not exists import_diagnostics_geometry_idx
    on import_diagnostics(source_geometry_id);

create table if not exists import_jobs (
    job_id       text primary key,
    project_id   text not null references projects(project_id) on delete cascade,
    revision_id  text not null references design_revisions(revision_id) on delete cascade,
    source_geometry_id text not null references source_geometries(source_geometry_id) on delete cascade,
    adapter_name text not null,
    status       job_status not null default 'pending',
    progress     numeric(5,2) not null default 0,
    started_at   timestamptz,
    completed_at timestamptz,
    error_code   text,
    error_message text,
    created_at   timestamptz not null default now(),
    requested_by text not null
);

create index if not exists import_jobs_revision_idx
    on import_jobs(revision_id);

create index if not exists import_jobs_geometry_idx
    on import_jobs(source_geometry_id);

-- ─── schema_migrations bookkeeping ──────────────────────────────────────────

create table if not exists schema_migrations (
    version  text primary key,
    name     text not null,
    applied_at timestamptz not null default now()
);

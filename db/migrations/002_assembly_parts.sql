-- 002_assembly_parts.sql
-- Assembly graph and part definition tables for Milestone 3.

do $$
begin
    if not exists (select 1 from pg_type where typname = 'node_type') then
        create type node_type as enum (
            'assembly', 'subassembly', 'part_instance'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'split_strategy') then
        create type split_strategy as enum (
            'manual', 'assisted', 'rule'
        );
    end if;
end $$;

create table if not exists assembly_nodes (
    assembly_node_id text not null,
    project_id   text not null references projects(project_id) on delete cascade,
    revision_id  text not null references design_revisions(revision_id) on delete cascade,
    parent_node_id text,
    source_geometry_id text,
    name         text not null,
    node_type    node_type not null,
    translation  jsonb not null default '[0,0,0]'::jsonb,
    rotation_quaternion jsonb not null default '[0,0,0,1]'::jsonb,
    scale        jsonb not null default '[1,1,1]'::jsonb,
    suppressed   boolean not null default false,
    impact_state impact_state not null default 'clean',
    created_at   timestamptz not null default now(),
    created_by   text not null,
    primary key (assembly_node_id, revision_id)
);

create index if not exists assembly_nodes_revision_idx
    on assembly_nodes(revision_id);

create table if not exists part_definitions (
    part_id      text not null,
    project_id   text not null references projects(project_id) on delete cascade,
    revision_id  text not null references design_revisions(revision_id) on delete cascade,
    assembly_node_id text,
    part_code    text not null,
    display_name text not null,
    part_family  text not null,
    color_zone   text,
    surface_finish text,
    shell_thickness_mm numeric(10,4),
    draft_requirement_deg numeric(10,4),
    split_strategy split_strategy not null,
    is_structural boolean not null default true,
    approval_state approval_state not null default 'working',
    impact_state impact_state not null default 'clean',
    created_at   timestamptz not null default now(),
    created_by   text not null,
    primary key (part_id, revision_id),
    unique (revision_id, part_code)
);

create index if not exists part_definitions_revision_idx
    on part_definitions(revision_id);

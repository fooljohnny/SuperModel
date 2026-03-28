//! Shared domain contracts for the first MVP vertical slice.

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RevisionState {
    Draft,
    Imported,
    Structured,
    Engineered,
    Verified,
    Released,
    Stale,
    Invalid,
    Archived,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ImportStatus {
    Pending,
    Running,
    Completed,
    CompletedWithWarnings,
    Failed,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SourceSystem {
    ZBrush,
    SolidWorks,
    Nx,
    Blender,
    Maya,
    Step,
    Parasolid,
    Iges,
    Fbx,
    Gltf,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Project {
    pub project_id: String,
    pub name: String,
    pub market_segment: String,
    pub status: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DesignRevision {
    pub revision_id: String,
    pub project_id: String,
    pub parent_revision_id: Option<String>,
    pub revision_label: String,
    pub state: RevisionState,
    pub summary: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceGeometry {
    pub geometry_id: String,
    pub revision_id: String,
    pub source_system: SourceSystem,
    pub source_filename: String,
    pub import_status: ImportStatus,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImportJob {
    pub job_id: String,
    pub revision_id: String,
    pub geometry_id: String,
    pub adapter_name: String,
}

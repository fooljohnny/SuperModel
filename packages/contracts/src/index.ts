export type RevisionState =
  | "draft"
  | "imported"
  | "structured"
  | "engineered"
  | "verified"
  | "released"
  | "stale"
  | "invalid"
  | "archived";

export type ApprovalState =
  | "working"
  | "review_required"
  | "approved"
  | "rejected";

export type ImpactState =
  | "clean"
  | "recompute_required"
  | "stale"
  | "invalid"
  | "waived";

export type ImportStatus =
  | "pending"
  | "running"
  | "completed"
  | "completed_with_warnings"
  | "failed";

export type SourceSystem =
  | "zbrush"
  | "solidworks"
  | "nx"
  | "blender"
  | "maya"
  | "step"
  | "parasolid"
  | "iges"
  | "fbx"
  | "gltf"
  | "unknown";

export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type ProjectStatus = "active";

export interface ImpactSummary {
  staleEntities: number;
  invalidEntities: number;
  recomputeRequiredEntities: number;
  blockedRelease: boolean;
}

export interface Project {
  projectId: string;
  name: string;
  marketSegment: string;
  targetDifficulty?: string;
  targetPartCount?: number;
  status: ProjectStatus;
  createdAt: string;
  createdBy: string;
}

export interface DesignRevision {
  revisionId: string;
  projectId: string;
  parentRevisionId: string | null;
  revisionLabel: string;
  state: RevisionState;
  approvalState: ApprovalState;
  summary: string;
  createdAt: string;
  createdBy: string;
  impactSummary: ImpactSummary;
}

export type RevisionSummary = DesignRevision;

export interface ImportDiagnostic {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  pathHint?: string | null;
  remediationHint?: string | null;
}

export interface SourceGeometry {
  sourceGeometryId: string;
  projectId: string;
  revisionId: string;
  sourceSystem: SourceSystem;
  declaredFileFormat: string;
  sourceFilename: string;
  unitSystem: string;
  importStatus: ImportStatus;
  impactState: ImpactState;
  diagnostics: ImportDiagnostic[];
  createdAt: string;
  createdBy: string;
}

export interface ImportJob {
  jobId: string;
  projectId: string;
  revisionId: string;
  sourceGeometryId: string;
  adapterName: string;
  status: JobStatus;
  progress: number;
  diagnostics: ImportDiagnostic[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  requestedBy: string;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface RevisionDetail {
  revision: DesignRevision;
  project: Project;
  sourceGeometries: SourceGeometry[];
  importJobs: ImportJob[];
}

export interface CreateProjectRequest {
  name: string;
  marketSegment: string;
  targetDifficulty?: string;
  targetPartCount?: number;
  createdBy?: string;
}

export interface CreateRevisionRequest {
  revisionLabel: string;
  createdBy: string;
  summary?: string;
  parentRevisionId?: string | null;
}

export interface RegisterSourceGeometryRequest {
  sourceSystem: SourceSystem;
  declaredFileFormat: string;
  sourceFilename: string;
  unitSystem: string;
  createdBy?: string;
}

export interface StartImportJobRequest {
  adapterName?: string;
  requestedBy?: string;
}

export interface CompleteImportJobRequest {
  status: ImportStatus;
  progress?: number;
  diagnostics?: ImportDiagnostic[];
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

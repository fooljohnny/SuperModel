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

export type NodeType = "assembly" | "subassembly" | "part_instance";

export type SplitStrategy = "manual" | "assisted" | "rule";

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

export interface AssemblyNode {
  assemblyNodeId: string;
  projectId: string;
  revisionId: string;
  parentNodeId: string | null;
  sourceGeometryId: string | null;
  name: string;
  nodeType: NodeType;
  transform: {
    translation: [number, number, number];
    rotation: [number, number, number, number];
    scale: [number, number, number];
  };
  suppressed: boolean;
  impactState: ImpactState;
  createdAt: string;
  createdBy: string;
}

export interface PartDefinition {
  partId: string;
  projectId: string;
  revisionId: string;
  assemblyNodeId: string | null;
  partCode: string;
  displayName: string;
  partFamily: string;
  colorZone: string | null;
  surfaceFinish: string | null;
  shellThicknessMm: number | null;
  draftRequirementDeg: number | null;
  splitStrategy: SplitStrategy;
  isStructural: boolean;
  approvalState: ApprovalState;
  impactState: ImpactState;
  createdAt: string;
  createdBy: string;
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

export interface CreateAssemblyNodeRequest {
  name: string;
  parentNodeId?: string | null;
  sourceGeometryId?: string | null;
  nodeType: NodeType;
  transform?: {
    translation?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
  };
  suppressed?: boolean;
  createdBy?: string;
}

export interface CreatePartDefinitionRequest {
  partCode: string;
  displayName: string;
  partFamily: string;
  assemblyNodeId?: string | null;
  colorZone?: string | null;
  surfaceFinish?: string | null;
  shellThicknessMm?: number | null;
  draftRequirementDeg?: number | null;
  splitStrategy: SplitStrategy;
  isStructural?: boolean;
  createdBy?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ─── domain helpers ─────────────────────────────────────────────────────────

export function emptyImpactSummary(): ImpactSummary {
  return {
    staleEntities: 0,
    invalidEntities: 0,
    recomputeRequiredEntities: 0,
    blockedRelease: false,
  };
}

export function deriveRevisionState(sourceGeometries: SourceGeometry[]): RevisionState {
  if (sourceGeometries.some((g) => g.importStatus === "failed")) {
    return "invalid";
  }
  if (
    sourceGeometries.some(
      (g) => g.importStatus === "completed" || g.importStatus === "completed_with_warnings",
    )
  ) {
    return "imported";
  }
  return "draft";
}

export function mapJobStatusToImportStatus(
  status: JobStatus,
  diagnostics?: ImportDiagnostic[],
): ImportStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "running":
      return "running";
    case "completed":
      return diagnostics?.some((d) => d.severity === "warning")
        ? "completed_with_warnings"
        : "completed";
    case "failed":
    case "cancelled":
      return "failed";
    default:
      return "pending";
  }
}

export function buildDefaultImportDiagnostics(
  sourceSystem: SourceSystem,
): ImportDiagnostic[] {
  switch (sourceSystem) {
    case "zbrush":
      return [
        {
          code: "ZB_IMPORT_COMPLETED",
          severity: "info",
          message: "ZBrush-origin geometry normalized into a placeholder internal mesh artifact.",
          pathHint: null,
          remediationHint: null,
        },
        {
          code: "ZB_UNIT_ASSUMED_MM",
          severity: "warning",
          message: "No explicit ZBrush unit metadata detected; defaulting to millimeters.",
          pathHint: null,
          remediationHint: "Confirm import scale before downstream decomposition.",
        },
      ];
    default:
      return [
        {
          code: "IMPORT_COMPLETED",
          severity: "info",
          message: "Source geometry registered and placeholder import normalization completed.",
          pathHint: null,
          remediationHint: null,
        },
      ];
  }
}

// ─── revision state machine ─────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: ReadonlyMap<RevisionState, readonly RevisionState[]> = new Map<
  RevisionState,
  RevisionState[]
>([
  // happy path
  ["draft", ["imported"]],
  ["imported", ["structured", "invalid"]],
  ["structured", ["engineered", "stale"]],
  ["engineered", ["verified", "stale", "invalid"]],
  ["verified", ["released", "stale", "invalid"]],
  ["released", ["stale", "invalid"]],

  // recovery
  ["stale", ["structured", "engineered", "verified"]],
  ["invalid", ["draft", "imported", "structured", "engineered"]],

  // archived is terminal
  ["archived", []],
]);

export function getAllowedTransitions(from: RevisionState): readonly RevisionState[] {
  return ALLOWED_TRANSITIONS.get(from) ?? [];
}

export interface TransitionValidationResult {
  valid: boolean;
  from: RevisionState;
  to: RevisionState;
  allowed: readonly RevisionState[];
}

export function validateStateTransition(
  from: RevisionState,
  to: RevisionState,
): TransitionValidationResult {
  const allowed = getAllowedTransitions(from);
  return {
    valid: allowed.includes(to),
    from,
    to,
    allowed,
  };
}

// ─── store-layer input types ────────────────────────────────────────────────
// These extend the wire Request types with fields the server resolves
// (IDs, foreign keys) before passing to the persistence layer.

export type CreateProjectInput = CreateProjectRequest & {
  createdBy: string;
};

export type CreateRevisionInput = CreateRevisionRequest & {
  projectId: string;
  createdBy: string;
};

export type RegisterSourceGeometryInput = RegisterSourceGeometryRequest & {
  sourceGeometryId: string;
  revisionId: string;
  createdBy: string;
};

export type StartImportJobInput = StartImportJobRequest & {
  sourceGeometryId: string;
  adapterName: string;
  requestedBy: string;
};

export type CreateAssemblyNodeInput = CreateAssemblyNodeRequest & {
  assemblyNodeId: string;
  projectId: string;
  revisionId: string;
  createdBy: string;
};

export type CreatePartDefinitionInput = CreatePartDefinitionRequest & {
  partId: string;
  projectId: string;
  revisionId: string;
  createdBy: string;
};

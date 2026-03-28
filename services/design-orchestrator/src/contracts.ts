export type {
  ErrorResponse,
  DesignRevision,
  ImportDiagnostic,
  ImportJob,
  ImpactSummary,
  ImportStatus,
  JobStatus,
  Project,
  RevisionState,
  SourceGeometry,
  SourceSystem,
} from "@supermodel/contracts";

import type {
  DesignRevision,
  ErrorResponse,
  ImpactSummary,
  ImportDiagnostic,
  ImportJob,
  RevisionState,
  Project,
  SourceGeometry,
  ImportStatus,
} from "@supermodel/contracts";

export type CreateProjectInput = {
  name: string;
  marketSegment: string;
  targetDifficulty?: string;
  targetPartCount?: number;
  createdBy: string;
};

export type CreateRevisionInput = {
  projectId: string;
  revisionLabel: string;
  summary?: string;
  createdBy: string;
  parentRevisionId?: string | null;
};

export type RegisterSourceGeometryInput = {
  sourceGeometryId: string;
  revisionId: string;
  sourceSystem: SourceGeometry["sourceSystem"];
  declaredFileFormat: string;
  sourceFilename: string;
  unitSystem: SourceGeometry["unitSystem"];
  createdBy: string;
};

export type StartImportJobInput = {
  sourceGeometryId: string;
  adapterName: string;
  requestedBy: string;
};

export type RevisionDetail = {
  revision: DesignRevision;
  project: Project;
  sourceGeometries: SourceGeometry[];
  importJobs: ImportJob[];
};

export function emptyImpactSummary(): ImpactSummary {
  return {
    staleEntities: 0,
    invalidEntities: 0,
    recomputeRequiredEntities: 0,
    blockedRelease: false,
  };
}

export function deriveRevisionState(sourceGeometries: SourceGeometry[]): RevisionState {
  if (sourceGeometries.some((geometry) => geometry.importStatus === "failed")) {
    return "invalid";
  }

  if (
    sourceGeometries.some(
      (geometry) =>
        geometry.importStatus === "completed" ||
        geometry.importStatus === "completed_with_warnings",
    )
  ) {
    return "imported";
  }

  return "draft";
}

export function mapJobStatusToImportStatus(status: ImportJob["status"]): ImportStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "running":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
      return "failed";
    default:
      return "pending";
  }
}

export function buildDefaultImportDiagnostics(
  sourceSystem: SourceGeometry["sourceSystem"],
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

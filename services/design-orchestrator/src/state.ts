import type {
  CreateProjectInput,
  CreateRevisionInput,
  DesignRevision,
  ImportDiagnostic,
  ImportJob,
  ImportStatus,
  JobStatus,
  Project,
  RegisterSourceGeometryInput,
  RevisionState,
  SourceGeometry,
  SourceSystem,
  StartImportJobInput,
} from "./contracts.js";
import { deriveRevisionState, emptyImpactSummary } from "./contracts.js";

type RevisionRecord = DesignRevision & {
  importJobIds: string[];
  sourceGeometryIds: string[];
};

function now(): string {
  return new Date().toISOString();
}

export class StateStore {
  private readonly projects = new Map<string, Project>();
  private readonly revisions = new Map<string, RevisionRecord>();
  private readonly sourceGeometries = new Map<string, SourceGeometry>();
  private readonly importJobs = new Map<string, ImportJob>();

  createProject(input: CreateProjectInput): Project {
    const project: Project = {
      projectId: `proj_${Date.now()}`,
      name: input.name,
      marketSegment: input.marketSegment,
      targetDifficulty: input.targetDifficulty,
      targetPartCount: input.targetPartCount,
      status: "active",
      createdAt: now(),
      createdBy: input.createdBy,
    };
    this.projects.set(project.projectId, project);
    return project;
  }

  listProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  createRevision(request: CreateRevisionInput): DesignRevision {
    const project = this.projects.get(request.projectId);
    if (!project) {
      throw new Error(`Project not found: ${request.projectId}`);
    }

    if (request.parentRevisionId && !this.revisions.has(request.parentRevisionId)) {
      throw new Error(`Parent revision not found: ${request.parentRevisionId}`);
    }

    const revision: RevisionRecord = {
      revisionId: `rev_${Date.now()}`,
      projectId: request.projectId,
      parentRevisionId: request.parentRevisionId ?? null,
      revisionLabel: request.revisionLabel,
      state: "draft",
      approvalState: "working",
      summary: request.summary ?? "",
      createdAt: now(),
      createdBy: request.createdBy,
      impactSummary: emptyImpactSummary(),
      importJobIds: [],
      sourceGeometryIds: [],
    };

    this.revisions.set(revision.revisionId, revision);
    return this.toRevision(revision);
  }

  listRevisions(projectId: string): DesignRevision[] {
    return Array.from(this.revisions.values())
      .filter((revision) => revision.projectId === projectId)
      .map((revision) => this.toRevision(revision));
  }

  getRevision(revisionId: string): DesignRevision | undefined {
    const revision = this.revisions.get(revisionId);
    return revision ? this.toRevision(revision) : undefined;
  }

  updateRevisionState(revisionId: string, nextState: RevisionState): DesignRevision | undefined {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return undefined;
    }

    revision.state = nextState;
    return this.toRevision(revision);
  }

  promoteRevision(revisionId: string, nextState: RevisionState): DesignRevision | undefined {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return undefined;
    }

    revision.state = nextState;
    return this.toRevision(revision);
  }

  registerSourceGeometry(request: RegisterSourceGeometryInput): SourceGeometry {
    const revision = this.revisions.get(request.revisionId);
    if (!revision) {
      throw new Error(`Revision not found: ${request.revisionId}`);
    }

    const sourceGeometry: SourceGeometry = {
      sourceGeometryId: request.sourceGeometryId,
      projectId: revision.projectId,
      revisionId: request.revisionId,
      sourceSystem: request.sourceSystem,
      declaredFileFormat: request.declaredFileFormat,
      sourceFilename: request.sourceFilename,
      unitSystem: request.unitSystem,
      importStatus: "pending",
      impactState: "clean",
      diagnostics: [],
      createdAt: now(),
      createdBy: request.createdBy,
    };

    this.sourceGeometries.set(sourceGeometry.sourceGeometryId, sourceGeometry);
    revision.sourceGeometryIds.push(sourceGeometry.sourceGeometryId);
    return sourceGeometry;
  }

  listRevisionSourceGeometries(revisionId: string): SourceGeometry[] {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return [];
    }

    return revision.sourceGeometryIds
      .map((geometryId) => this.sourceGeometries.get(geometryId))
      .filter((geometry): geometry is SourceGeometry => Boolean(geometry));
  }

  getSourceGeometry(sourceGeometryId: string): SourceGeometry | undefined {
    return this.sourceGeometries.get(sourceGeometryId);
  }

  startImportJob(
    request: StartImportJobInput & {
      jobId: string;
      projectId: string;
      revisionId: string;
    },
  ): ImportJob | undefined {
    const revision = this.revisions.get(request.revisionId);
    const geometry = this.sourceGeometries.get(request.sourceGeometryId);

    if (!revision || !geometry) {
      return undefined;
    }

    const importJob: ImportJob = {
      jobId: request.jobId,
      projectId: request.projectId,
      revisionId: request.revisionId,
      sourceGeometryId: request.sourceGeometryId,
      adapterName: request.adapterName ?? "zbrush-import-adapter",
      status: "pending",
      progress: 0,
      startedAt: now(),
      completedAt: null,
      errorCode: null,
      errorMessage: null,
      diagnostics: [],
      createdAt: now(),
      requestedBy: request.requestedBy,
    };

    this.importJobs.set(importJob.jobId, importJob);
    revision.importJobIds.push(importJob.jobId);
    geometry.importStatus = "running";
    return importJob;
  }

  completeImportJob(
    importJobId: string,
    update: {
      status: JobStatus;
      progressPercent: number;
    },
  ): (ImportJob & { importStatus: ImportStatus }) | undefined {
    const job = this.importJobs.get(importJobId);
    if (!job) {
      return undefined;
    }

    const diagnostics = buildDefaultImportDiagnostics(
      this.sourceGeometries.get(job.sourceGeometryId)?.sourceSystem ?? "unknown",
    );

    job.status = update.status;
    job.progress = update.progressPercent;
    job.diagnostics = diagnostics;
    job.errorCode = update.status === "failed" ? "IMPORT_FAILED" : null;
    job.errorMessage =
      update.status === "failed" ? "Placeholder import job reported failure." : null;
    job.completedAt =
      update.status === "completed" || update.status === "failed" ? now() : null;

    const geometry = this.sourceGeometries.get(job.sourceGeometryId);
    let importStatus: ImportStatus = "pending";
    if (geometry) {
      importStatus = this.mapJobStatusToImportStatus(update.status, diagnostics);
      geometry.importStatus = importStatus;
      geometry.diagnostics = diagnostics;
    }

    const revision = this.revisions.get(job.revisionId);
    if (revision) {
      revision.state = deriveRevisionState(
        this.listRevisionSourceGeometries(revision.revisionId),
      );
    }

    return {
      ...job,
      importStatus,
    };
  }

  getImportJob(jobId: string): ImportJob | undefined {
    return this.importJobs.get(jobId);
  }

  listRevisionImportJobs(revisionId: string): ImportJob[] {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return [];
    }

    return revision.importJobIds
      .map((jobId) => this.importJobs.get(jobId))
      .filter((job): job is ImportJob => Boolean(job));
  }

  getRevisionDetail(revisionId: string): {
    revision: DesignRevision;
    project: Project;
    sourceGeometries: SourceGeometry[];
    importJobs: ImportJob[];
  } | undefined {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return undefined;
    }

    const project = this.projects.get(revision.projectId);
    if (!project) {
      return undefined;
    }

    return {
      revision: this.toRevision(revision),
      project,
      sourceGeometries: this.listRevisionSourceGeometries(revisionId),
      importJobs: this.listRevisionImportJobs(revisionId),
    };
  }

  getSystemSnapshot(): {
    projects: Project[];
    revisions: DesignRevision[];
    sourceGeometries: SourceGeometry[];
    importJobs: ImportJob[];
  } {
    return {
      projects: this.listProjects(),
      revisions: Array.from(this.revisions.values()).map((revision) => this.toRevision(revision)),
      sourceGeometries: Array.from(this.sourceGeometries.values()),
      importJobs: Array.from(this.importJobs.values()),
    };
  }

  private toRevision(revision: RevisionRecord): DesignRevision {
    const { importJobIds: _importJobIds, sourceGeometryIds: _sourceGeometryIds, ...rest } =
      revision;
    return { ...rest };
  }

  private mapJobStatusToImportStatus(
    status: JobStatus,
    diagnostics: ImportDiagnostic[],
  ): ImportStatus {
    switch (status) {
      case "pending":
        return "pending";
      case "running":
        return "running";
      case "completed":
        return diagnostics.some((diagnostic) => diagnostic.severity === "warning")
          ? "completed_with_warnings"
          : "completed";
      case "failed":
      case "cancelled":
        return "failed";
      default:
        return "pending";
    }
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

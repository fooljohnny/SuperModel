import type {
  AssemblyNode,
  CreateAssemblyNodeInput,
  CreatePartDefinitionInput,
  CreateProjectInput,
  CreateRevisionInput,
  DesignRevision,
  ImportDiagnostic,
  ImportJob,
  ImportStatus,
  JobStatus,
  PartDefinition,
  Project,
  RegisterSourceGeometryInput,
  RevisionDetail,
  RevisionState,
  SourceGeometry,
  StartImportJobInput,
} from "./contracts.js";
import { buildDefaultImportDiagnostics, deriveRevisionState, emptyImpactSummary, mapJobStatusToImportStatus, validateStateTransition } from "./contracts.js";
import { InvalidTransitionError } from "./repository.js";
import type { CompleteImportJobResult, IStateStore } from "./repository.js";

type RevisionRecord = DesignRevision & {
  importJobIds: string[];
  sourceGeometryIds: string[];
};

function now(): string {
  return new Date().toISOString();
}

export class StateStore implements IStateStore {
  private readonly projects = new Map<string, Project>();
  private readonly revisions = new Map<string, RevisionRecord>();
  private readonly sourceGeometries = new Map<string, SourceGeometry>();
  private readonly importJobs = new Map<string, ImportJob>();
  private readonly assemblyNodes = new Map<string, AssemblyNode>();
  private readonly partDefinitions = new Map<string, PartDefinition>();

  async createProject(input: CreateProjectInput): Promise<Project> {
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

  async listProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createRevision(request: CreateRevisionInput): Promise<DesignRevision> {
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

  async listRevisions(projectId: string): Promise<DesignRevision[]> {
    return Array.from(this.revisions.values())
      .filter((revision) => revision.projectId === projectId)
      .map((revision) => this.toRevision(revision));
  }

  async getRevision(revisionId: string): Promise<DesignRevision | undefined> {
    const revision = this.revisions.get(revisionId);
    return revision ? this.toRevision(revision) : undefined;
  }

  async updateRevisionState(revisionId: string, nextState: RevisionState): Promise<DesignRevision | undefined> {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return undefined;
    }

    revision.state = nextState;
    return this.toRevision(revision);
  }

  async promoteRevision(revisionId: string, nextState: RevisionState): Promise<DesignRevision | undefined> {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return undefined;
    }

    const validation = validateStateTransition(revision.state, nextState);
    if (!validation.valid) {
      throw new InvalidTransitionError(validation);
    }

    revision.state = nextState;
    return this.toRevision(revision);
  }

  async registerSourceGeometry(request: RegisterSourceGeometryInput): Promise<SourceGeometry> {
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

  async listRevisionSourceGeometries(revisionId: string): Promise<SourceGeometry[]> {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return [];
    }

    return revision.sourceGeometryIds
      .map((geometryId) => this.sourceGeometries.get(geometryId))
      .filter((geometry): geometry is SourceGeometry => Boolean(geometry));
  }

  async getSourceGeometry(sourceGeometryId: string): Promise<SourceGeometry | undefined> {
    return this.sourceGeometries.get(sourceGeometryId);
  }

  async startImportJob(
    request: StartImportJobInput & {
      jobId: string;
      projectId: string;
      revisionId: string;
    },
  ): Promise<ImportJob | undefined> {
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

  async completeImportJob(
    importJobId: string,
    update: {
      status: JobStatus;
      progressPercent: number;
    },
  ): Promise<CompleteImportJobResult | undefined> {
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
      importStatus = mapJobStatusToImportStatus(update.status, diagnostics);
      geometry.importStatus = importStatus;
      geometry.diagnostics = diagnostics;
    }

    const revision = this.revisions.get(job.revisionId);
    if (revision) {
      const geometries = await this.listRevisionSourceGeometries(revision.revisionId);
      revision.state = deriveRevisionState(geometries);
    }

    return {
      ...job,
      importStatus,
    };
  }

  async getImportJob(jobId: string): Promise<ImportJob | undefined> {
    return this.importJobs.get(jobId);
  }

  async listRevisionImportJobs(revisionId: string): Promise<ImportJob[]> {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      return [];
    }

    return revision.importJobIds
      .map((jobId) => this.importJobs.get(jobId))
      .filter((job): job is ImportJob => Boolean(job));
  }

  // ── assembly nodes ─────────────────────────────────────────────────────

  async createAssemblyNode(input: CreateAssemblyNodeInput): Promise<AssemblyNode> {
    const revision = this.revisions.get(input.revisionId);
    if (!revision) {
      throw new Error(`Revision not found: ${input.revisionId}`);
    }

    if (input.parentNodeId) {
      const parentKey = `${input.parentNodeId}:${input.revisionId}`;
      if (!this.assemblyNodes.has(parentKey)) {
        throw new Error(`Parent assembly node not found: ${input.parentNodeId}`);
      }
    }

    const node: AssemblyNode = {
      assemblyNodeId: input.assemblyNodeId,
      projectId: input.projectId,
      revisionId: input.revisionId,
      parentNodeId: input.parentNodeId ?? null,
      sourceGeometryId: input.sourceGeometryId ?? null,
      name: input.name,
      nodeType: input.nodeType,
      transform: {
        translation: input.transform?.translation ?? [0, 0, 0],
        rotation: input.transform?.rotation ?? [0, 0, 0, 1],
        scale: input.transform?.scale ?? [1, 1, 1],
      },
      suppressed: input.suppressed ?? false,
      impactState: "clean",
      createdAt: now(),
      createdBy: input.createdBy,
    };

    this.assemblyNodes.set(`${node.assemblyNodeId}:${node.revisionId}`, node);
    return node;
  }

  async listAssemblyNodes(revisionId: string): Promise<AssemblyNode[]> {
    return Array.from(this.assemblyNodes.values())
      .filter((n) => n.revisionId === revisionId);
  }

  async getAssemblyNode(revisionId: string, assemblyNodeId: string): Promise<AssemblyNode | undefined> {
    return this.assemblyNodes.get(`${assemblyNodeId}:${revisionId}`);
  }

  // ── part definitions ──────────────────────────────────────────────────

  async createPartDefinition(input: CreatePartDefinitionInput): Promise<PartDefinition> {
    const revision = this.revisions.get(input.revisionId);
    if (!revision) {
      throw new Error(`Revision not found: ${input.revisionId}`);
    }

    const part: PartDefinition = {
      partId: input.partId,
      projectId: input.projectId,
      revisionId: input.revisionId,
      assemblyNodeId: input.assemblyNodeId ?? null,
      partCode: input.partCode,
      displayName: input.displayName,
      partFamily: input.partFamily,
      colorZone: input.colorZone ?? null,
      surfaceFinish: input.surfaceFinish ?? null,
      shellThicknessMm: input.shellThicknessMm ?? null,
      draftRequirementDeg: input.draftRequirementDeg ?? null,
      splitStrategy: input.splitStrategy,
      isStructural: input.isStructural ?? true,
      approvalState: "working",
      impactState: "clean",
      createdAt: now(),
      createdBy: input.createdBy,
    };

    this.partDefinitions.set(`${part.partId}:${part.revisionId}`, part);
    return part;
  }

  async listPartDefinitions(revisionId: string): Promise<PartDefinition[]> {
    return Array.from(this.partDefinitions.values())
      .filter((p) => p.revisionId === revisionId);
  }

  async getPartDefinition(revisionId: string, partId: string): Promise<PartDefinition | undefined> {
    return this.partDefinitions.get(`${partId}:${revisionId}`);
  }

  // ── composite queries ─────────────────────────────────────────────────

  async getRevisionDetail(revisionId: string): Promise<RevisionDetail | undefined> {
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
      sourceGeometries: await this.listRevisionSourceGeometries(revisionId),
      importJobs: await this.listRevisionImportJobs(revisionId),
    };
  }

  async getSystemSnapshot(): Promise<{
    projects: Project[];
    revisions: DesignRevision[];
    sourceGeometries: SourceGeometry[];
    importJobs: ImportJob[];
  }> {
    return {
      projects: await this.listProjects(),
      revisions: Array.from(this.revisions.values()).map((revision) => this.toRevision(revision)),
      sourceGeometries: Array.from(this.sourceGeometries.values()),
      importJobs: Array.from(this.importJobs.values()),
    };
  }

  async close(): Promise<void> {
    // No-op for in-memory store
  }

  private toRevision(revision: RevisionRecord): DesignRevision {
    const { importJobIds: _importJobIds, sourceGeometryIds: _sourceGeometryIds, ...rest } =
      revision;
    return { ...rest };
  }

}

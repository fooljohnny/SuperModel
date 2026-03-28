import type pg from "pg";

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
  StartImportJobInput,
} from "./contracts.js";
import { buildDefaultImportDiagnostics, deriveRevisionState, emptyImpactSummary } from "./contracts.js";
import type { CompleteImportJobResult, IStateStore } from "./repository.js";
import { closePool } from "./db.js";

function rowToProject(row: Record<string, unknown>): Project {
  return {
    projectId: row.project_id as string,
    name: row.name as string,
    marketSegment: row.market_segment as string,
    targetDifficulty: (row.target_difficulty as string) ?? undefined,
    targetPartCount: row.target_part_count != null ? Number(row.target_part_count) : undefined,
    status: "active",
    createdAt: (row.created_at as Date).toISOString(),
    createdBy: row.created_by as string,
  };
}

function rowToRevision(row: Record<string, unknown>): DesignRevision {
  return {
    revisionId: row.revision_id as string,
    projectId: row.project_id as string,
    parentRevisionId: (row.parent_revision_id as string) ?? null,
    revisionLabel: row.revision_label as string,
    state: row.state as RevisionState,
    approvalState: row.approval_state as DesignRevision["approvalState"],
    summary: row.summary as string,
    createdAt: (row.created_at as Date).toISOString(),
    createdBy: row.created_by as string,
    impactSummary: {
      staleEntities: Number(row.stale_entities ?? 0),
      invalidEntities: Number(row.invalid_entities ?? 0),
      recomputeRequiredEntities: Number(row.recompute_required_entities ?? 0),
      blockedRelease: Boolean(row.blocked_release),
    },
  };
}

function rowToSourceGeometry(row: Record<string, unknown>, diagnostics: ImportDiagnostic[]): SourceGeometry {
  return {
    sourceGeometryId: row.source_geometry_id as string,
    projectId: row.project_id as string,
    revisionId: row.revision_id as string,
    sourceSystem: row.source_system as SourceGeometry["sourceSystem"],
    declaredFileFormat: row.declared_file_format as string,
    sourceFilename: row.source_filename as string,
    unitSystem: row.unit_system as string,
    importStatus: row.import_status as ImportStatus,
    impactState: row.impact_state as SourceGeometry["impactState"],
    diagnostics,
    createdAt: (row.created_at as Date).toISOString(),
    createdBy: row.created_by as string,
  };
}

function rowToImportJob(row: Record<string, unknown>, diagnostics: ImportDiagnostic[]): ImportJob {
  return {
    jobId: row.job_id as string,
    projectId: row.project_id as string,
    revisionId: row.revision_id as string,
    sourceGeometryId: row.source_geometry_id as string,
    adapterName: row.adapter_name as string,
    status: row.status as JobStatus,
    progress: Number(row.progress ?? 0),
    diagnostics,
    createdAt: (row.created_at as Date).toISOString(),
    startedAt: row.started_at ? (row.started_at as Date).toISOString() : null,
    completedAt: row.completed_at ? (row.completed_at as Date).toISOString() : null,
    requestedBy: row.requested_by as string,
    errorCode: (row.error_code as string) ?? null,
    errorMessage: (row.error_message as string) ?? null,
  };
}

async function loadDiagnostics(client: pg.PoolClient | pg.Pool, sourceGeometryId: string): Promise<ImportDiagnostic[]> {
  const { rows } = await client.query(
    `select code, severity, message, path_hint, remediation_hint
     from import_diagnostics
     where source_geometry_id = $1
     order by created_at`,
    [sourceGeometryId],
  );
  return rows.map((r) => ({
    code: r.code as string,
    severity: r.severity as ImportDiagnostic["severity"],
    message: r.message as string,
    pathHint: (r.path_hint as string) ?? null,
    remediationHint: (r.remediation_hint as string) ?? null,
  }));
}

async function loadJobDiagnostics(client: pg.PoolClient | pg.Pool, sourceGeometryId: string): Promise<ImportDiagnostic[]> {
  return loadDiagnostics(client, sourceGeometryId);
}

async function saveDiagnostics(
  client: pg.PoolClient,
  sourceGeometryId: string,
  diagnostics: ImportDiagnostic[],
): Promise<void> {
  await client.query(`delete from import_diagnostics where source_geometry_id = $1`, [sourceGeometryId]);
  for (const d of diagnostics) {
    await client.query(
      `insert into import_diagnostics (source_geometry_id, code, severity, message, path_hint, remediation_hint)
       values ($1, $2, $3, $4, $5, $6)`,
      [sourceGeometryId, d.code, d.severity, d.message, d.pathHint ?? null, d.remediationHint ?? null],
    );
  }
}

function mapJobStatusToImportStatus(status: JobStatus, diagnostics: ImportDiagnostic[]): ImportStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "running":
      return "running";
    case "completed":
      return diagnostics.some((d) => d.severity === "warning") ? "completed_with_warnings" : "completed";
    case "failed":
    case "cancelled":
      return "failed";
    default:
      return "pending";
  }
}

export class PgStateStore implements IStateStore {
  constructor(private readonly pool: pg.Pool) {}

  async createProject(input: CreateProjectInput): Promise<Project> {
    const projectId = `proj_${Date.now()}`;
    const { rows } = await this.pool.query(
      `insert into projects (project_id, name, market_segment, target_difficulty, target_part_count, status, created_by)
       values ($1, $2, $3, $4, $5, 'active', $6)
       returning *`,
      [projectId, input.name, input.marketSegment, input.targetDifficulty ?? null, input.targetPartCount ?? null, input.createdBy],
    );
    return rowToProject(rows[0]);
  }

  async listProjects(): Promise<Project[]> {
    const { rows } = await this.pool.query(`select * from projects order by created_at`);
    return rows.map(rowToProject);
  }

  async createRevision(request: CreateRevisionInput): Promise<DesignRevision> {
    const projectResult = await this.pool.query(`select project_id from projects where project_id = $1`, [request.projectId]);
    if (projectResult.rowCount === 0) {
      throw new Error(`Project not found: ${request.projectId}`);
    }

    if (request.parentRevisionId) {
      const parentResult = await this.pool.query(`select revision_id from design_revisions where revision_id = $1`, [request.parentRevisionId]);
      if (parentResult.rowCount === 0) {
        throw new Error(`Parent revision not found: ${request.parentRevisionId}`);
      }
    }

    const revisionId = `rev_${Date.now()}`;
    const { rows } = await this.pool.query(
      `insert into design_revisions (revision_id, project_id, parent_revision_id, revision_label, state, approval_state, summary, created_by)
       values ($1, $2, $3, $4, 'draft', 'working', $5, $6)
       returning *`,
      [revisionId, request.projectId, request.parentRevisionId ?? null, request.revisionLabel, request.summary ?? "", request.createdBy],
    );
    return rowToRevision(rows[0]);
  }

  async listRevisions(projectId: string): Promise<DesignRevision[]> {
    const { rows } = await this.pool.query(
      `select * from design_revisions where project_id = $1 order by created_at`,
      [projectId],
    );
    return rows.map(rowToRevision);
  }

  async getRevision(revisionId: string): Promise<DesignRevision | undefined> {
    const { rows } = await this.pool.query(
      `select * from design_revisions where revision_id = $1`,
      [revisionId],
    );
    return rows.length > 0 ? rowToRevision(rows[0]) : undefined;
  }

  async updateRevisionState(revisionId: string, nextState: RevisionState): Promise<DesignRevision | undefined> {
    const { rows, rowCount } = await this.pool.query(
      `update design_revisions set state = $2, updated_at = now() where revision_id = $1 returning *`,
      [revisionId, nextState],
    );
    return rowCount && rowCount > 0 ? rowToRevision(rows[0]) : undefined;
  }

  async promoteRevision(revisionId: string, nextState: RevisionState): Promise<DesignRevision | undefined> {
    return this.updateRevisionState(revisionId, nextState);
  }

  async registerSourceGeometry(request: RegisterSourceGeometryInput): Promise<SourceGeometry> {
    const revisionResult = await this.pool.query(
      `select project_id from design_revisions where revision_id = $1`,
      [request.revisionId],
    );
    if (revisionResult.rowCount === 0) {
      throw new Error(`Revision not found: ${request.revisionId}`);
    }
    const projectId = revisionResult.rows[0].project_id as string;

    const { rows } = await this.pool.query(
      `insert into source_geometries
         (source_geometry_id, project_id, revision_id, source_system, declared_file_format, source_filename, unit_system, import_status, impact_state, created_by)
       values ($1, $2, $3, $4, $5, $6, $7, 'pending', 'clean', $8)
       returning *`,
      [request.sourceGeometryId, projectId, request.revisionId, request.sourceSystem, request.declaredFileFormat, request.sourceFilename, request.unitSystem, request.createdBy],
    );
    return rowToSourceGeometry(rows[0], []);
  }

  async listRevisionSourceGeometries(revisionId: string): Promise<SourceGeometry[]> {
    const { rows } = await this.pool.query(
      `select * from source_geometries where revision_id = $1 order by created_at`,
      [revisionId],
    );
    const result: SourceGeometry[] = [];
    for (const row of rows) {
      const diagnostics = await loadDiagnostics(this.pool, row.source_geometry_id as string);
      result.push(rowToSourceGeometry(row, diagnostics));
    }
    return result;
  }

  async getSourceGeometry(sourceGeometryId: string): Promise<SourceGeometry | undefined> {
    const { rows } = await this.pool.query(
      `select * from source_geometries where source_geometry_id = $1`,
      [sourceGeometryId],
    );
    if (rows.length === 0) return undefined;
    const diagnostics = await loadDiagnostics(this.pool, sourceGeometryId);
    return rowToSourceGeometry(rows[0], diagnostics);
  }

  async startImportJob(
    request: StartImportJobInput & { jobId: string; projectId: string; revisionId: string },
  ): Promise<ImportJob | undefined> {
    const geometryResult = await this.pool.query(
      `select * from source_geometries where source_geometry_id = $1`,
      [request.sourceGeometryId],
    );
    if (geometryResult.rowCount === 0) return undefined;

    const revisionResult = await this.pool.query(
      `select * from design_revisions where revision_id = $1`,
      [request.revisionId],
    );
    if (!revisionResult.rowCount || revisionResult.rowCount === 0) return undefined;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `insert into import_jobs
           (job_id, project_id, revision_id, source_geometry_id, adapter_name, status, progress, started_at, requested_by)
         values ($1, $2, $3, $4, $5, 'pending', 0, now(), $6)
         returning *`,
        [request.jobId, request.projectId, request.revisionId, request.sourceGeometryId, request.adapterName ?? "zbrush-import-adapter", request.requestedBy],
      );

      await client.query(
        `update source_geometries set import_status = 'running' where source_geometry_id = $1`,
        [request.sourceGeometryId],
      );

      await client.query("COMMIT");
      return rowToImportJob(rows[0], []);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async completeImportJob(
    importJobId: string,
    update: { status: JobStatus; progressPercent: number },
  ): Promise<CompleteImportJobResult | undefined> {
    const jobResult = await this.pool.query(`select * from import_jobs where job_id = $1`, [importJobId]);
    if (!jobResult.rowCount || jobResult.rowCount === 0) return undefined;

    const jobRow = jobResult.rows[0];
    const sourceGeometryId = jobRow.source_geometry_id as string;
    const revisionId = jobRow.revision_id as string;

    const geometryResult = await this.pool.query(
      `select source_system from source_geometries where source_geometry_id = $1`,
      [sourceGeometryId],
    );
    const sourceSystem = (geometryResult.rows[0]?.source_system as string) ?? "unknown";
    const diagnostics = buildDefaultImportDiagnostics(sourceSystem as SourceGeometry["sourceSystem"]);
    const importStatus = mapJobStatusToImportStatus(update.status, diagnostics);

    const completedAt =
      update.status === "completed" || update.status === "failed" ? new Date().toISOString() : null;
    const errorCode = update.status === "failed" ? "IMPORT_FAILED" : null;
    const errorMessage = update.status === "failed" ? "Placeholder import job reported failure." : null;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: updatedJobRows } = await client.query(
        `update import_jobs
         set status = $2, progress = $3, completed_at = $4, error_code = $5, error_message = $6
         where job_id = $1
         returning *`,
        [importJobId, update.status, update.progressPercent, completedAt, errorCode, errorMessage],
      );

      await saveDiagnostics(client, sourceGeometryId, diagnostics);

      await client.query(
        `update source_geometries set import_status = $2 where source_geometry_id = $1`,
        [sourceGeometryId, importStatus],
      );

      const geometries = await this.loadRevisionGeometries(client, revisionId);
      const derivedState = deriveRevisionState(geometries);
      await client.query(
        `update design_revisions set state = $2, updated_at = now() where revision_id = $1`,
        [revisionId, derivedState],
      );

      await client.query("COMMIT");

      const jobDiagnostics = await loadJobDiagnostics(this.pool, sourceGeometryId);
      return {
        ...rowToImportJob(updatedJobRows[0], jobDiagnostics),
        importStatus,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getImportJob(jobId: string): Promise<ImportJob | undefined> {
    const { rows } = await this.pool.query(`select * from import_jobs where job_id = $1`, [jobId]);
    if (rows.length === 0) return undefined;
    const diag = await loadJobDiagnostics(this.pool, rows[0].source_geometry_id as string);
    return rowToImportJob(rows[0], diag);
  }

  async listRevisionImportJobs(revisionId: string): Promise<ImportJob[]> {
    const { rows } = await this.pool.query(
      `select * from import_jobs where revision_id = $1 order by created_at`,
      [revisionId],
    );
    const result: ImportJob[] = [];
    for (const row of rows) {
      const diag = await loadJobDiagnostics(this.pool, row.source_geometry_id as string);
      result.push(rowToImportJob(row, diag));
    }
    return result;
  }

  async getRevisionDetail(revisionId: string): Promise<{
    revision: DesignRevision;
    project: Project;
    sourceGeometries: SourceGeometry[];
    importJobs: ImportJob[];
  } | undefined> {
    const revision = await this.getRevision(revisionId);
    if (!revision) return undefined;

    const { rows: projectRows } = await this.pool.query(
      `select * from projects where project_id = $1`,
      [revision.projectId],
    );
    if (projectRows.length === 0) return undefined;

    return {
      revision,
      project: rowToProject(projectRows[0]),
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
    const projects = await this.listProjects();
    const { rows: revisionRows } = await this.pool.query(`select * from design_revisions order by created_at`);
    const revisions = revisionRows.map(rowToRevision);

    const { rows: geometryRows } = await this.pool.query(`select * from source_geometries order by created_at`);
    const sourceGeometries: SourceGeometry[] = [];
    for (const row of geometryRows) {
      const diag = await loadDiagnostics(this.pool, row.source_geometry_id as string);
      sourceGeometries.push(rowToSourceGeometry(row, diag));
    }

    const { rows: jobRows } = await this.pool.query(`select * from import_jobs order by created_at`);
    const importJobs: ImportJob[] = [];
    for (const row of jobRows) {
      const diag = await loadJobDiagnostics(this.pool, row.source_geometry_id as string);
      importJobs.push(rowToImportJob(row, diag));
    }

    return { projects, revisions, sourceGeometries, importJobs };
  }

  async close(): Promise<void> {
    await closePool();
  }

  private async loadRevisionGeometries(client: pg.PoolClient, revisionId: string): Promise<SourceGeometry[]> {
    const { rows } = await client.query(
      `select * from source_geometries where revision_id = $1 order by created_at`,
      [revisionId],
    );
    const result: SourceGeometry[] = [];
    for (const row of rows) {
      const diagnostics = await loadDiagnostics(client, row.source_geometry_id as string);
      result.push(rowToSourceGeometry(row, diagnostics));
    }
    return result;
  }
}

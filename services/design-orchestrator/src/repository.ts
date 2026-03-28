import type {
  CreateProjectInput,
  CreateRevisionInput,
  DesignRevision,
  ImportJob,
  ImportStatus,
  JobStatus,
  Project,
  RegisterSourceGeometryInput,
  RevisionState,
  SourceGeometry,
  StartImportJobInput,
} from "./contracts.js";

export type CompleteImportJobResult = ImportJob & { importStatus: ImportStatus };

export interface IStateStore {
  createProject(input: CreateProjectInput): Promise<Project>;
  listProjects(): Promise<Project[]>;

  createRevision(input: CreateRevisionInput): Promise<DesignRevision>;
  listRevisions(projectId: string): Promise<DesignRevision[]>;
  getRevision(revisionId: string): Promise<DesignRevision | undefined>;
  updateRevisionState(
    revisionId: string,
    nextState: RevisionState,
  ): Promise<DesignRevision | undefined>;
  promoteRevision(
    revisionId: string,
    nextState: RevisionState,
  ): Promise<DesignRevision | undefined>;

  registerSourceGeometry(input: RegisterSourceGeometryInput): Promise<SourceGeometry>;
  listRevisionSourceGeometries(revisionId: string): Promise<SourceGeometry[]>;
  getSourceGeometry(sourceGeometryId: string): Promise<SourceGeometry | undefined>;

  startImportJob(
    request: StartImportJobInput & {
      jobId: string;
      projectId: string;
      revisionId: string;
    },
  ): Promise<ImportJob | undefined>;
  completeImportJob(
    importJobId: string,
    update: { status: JobStatus; progressPercent: number },
  ): Promise<CompleteImportJobResult | undefined>;
  getImportJob(jobId: string): Promise<ImportJob | undefined>;
  listRevisionImportJobs(revisionId: string): Promise<ImportJob[]>;

  getRevisionDetail(revisionId: string): Promise<
    | {
        revision: DesignRevision;
        project: Project;
        sourceGeometries: SourceGeometry[];
        importJobs: ImportJob[];
      }
    | undefined
  >;

  getSystemSnapshot(): Promise<{
    projects: Project[];
    revisions: DesignRevision[];
    sourceGeometries: SourceGeometry[];
    importJobs: ImportJob[];
  }>;

  close(): Promise<void>;
}

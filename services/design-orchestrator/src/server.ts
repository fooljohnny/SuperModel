import { createServer, IncomingMessage, ServerResponse } from "node:http";

import type {
  CreateProjectInput,
  CreateRevisionInput,
  ErrorResponse,
  ImportJob,
  ImportStatus,
  JobStatus,
  Project,
  RegisterSourceGeometryInput,
  RevisionState,
  SourceGeometry,
} from "./contracts.js";
import { StateStore } from "./state.js";

const store = new StateStore();

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
  params: Record<string, string>,
) => void | Promise<void>;

type Route = {
  method: string;
  path: RegExp;
  handler: Handler;
};

function json(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function error(
  res: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  const payload: ErrorResponse = {
    error: {
      code,
      message,
      details,
    },
  };
  json(res, statusCode, payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw.trim()) {
    return undefined;
  }

  return JSON.parse(raw);
}

function requireObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Expected JSON object body");
  }

  return body as Record<string, unknown>;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing or invalid '${key}'`);
  }

  return value.trim();
}

function optionalString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid '${key}'`);
  }

  return value;
}

function optionalNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid '${key}'`);
  }

  return value;
}

function deriveRevisionStateForImport(status: ImportStatus): RevisionState | null {
  if (status === "completed" || status === "completed_with_warnings") {
    return "imported";
  }

  if (status === "failed") {
    return "invalid";
  }

  return null;
}

const routes: Route[] = [
  {
    method: "GET",
    path: /^\/api\/projects$/,
    handler: (_req, res) => {
      json(res, 200, { projects: store.listProjects() });
    },
  },
  {
    method: "POST",
    path: /^\/api\/projects$/,
    handler: (_req, res, body) => {
      const data = requireObject(body);
      const request: CreateProjectInput = {
        name: requireString(data, "name"),
        marketSegment: requireString(data, "marketSegment"),
        targetDifficulty: optionalString(data, "targetDifficulty"),
        targetPartCount: optionalNumber(data, "targetPartCount"),
        createdBy: optionalString(data, "createdBy") ?? "system",
      };
      const project = store.createProject(request);

      json(res, 201, project satisfies Project);
    },
  },
  {
    method: "POST",
    path: /^\/api\/projects\/([^/]+)\/revisions$/,
    handler: (_req, res, body, params) => {
      const data = requireObject(body);
      const request: CreateRevisionInput = {
        projectId: params.projectId,
        parentRevisionId: optionalString(data, "parentRevisionId"),
        revisionLabel: requireString(data, "revisionLabel"),
        createdBy: optionalString(data, "createdBy") ?? "system",
        summary: optionalString(data, "summary") ?? "",
      };
      const revision = store.createRevision(request);

      json(res, 201, revision);
    },
  },
  {
    method: "GET",
    path: /^\/api\/projects\/([^/]+)\/revisions$/,
    handler: (_req, res, _body, params) => {
      json(res, 200, { revisions: store.listRevisions(params.projectId) });
    },
  },
  {
    method: "GET",
    path: /^\/api\/revisions\/([^/]+)$/,
    handler: (_req, res, _body, params) => {
      const revision = store.getRevision(params.revisionId);
      if (!revision) {
        error(res, 404, "REVISION_NOT_FOUND", "Revision not found.");
        return;
      }

      json(res, 200, revision);
    },
  },
  {
    method: "POST",
    path: /^\/api\/revisions\/([^/]+)\/promote$/,
    handler: (_req, res, body, params) => {
      const data = requireObject(body);
      const nextState = requireString(data, "nextState") as RevisionState;

      const revision = store.promoteRevision(params.revisionId, nextState);
      if (!revision) {
        error(res, 404, "REVISION_NOT_FOUND", "Revision not found.");
        return;
      }

      json(res, 200, revision);
    },
  },
  {
    method: "POST",
    path: /^\/api\/revisions\/([^/]+)\/source-geometries$/,
    handler: (_req, res, body, params) => {
      const revision = store.getRevision(params.revisionId);
      if (!revision) {
        error(res, 404, "REVISION_NOT_FOUND", "Revision not found.");
        return;
      }

      const data = requireObject(body);
      const request: RegisterSourceGeometryInput = {
        sourceGeometryId: `geom_${Date.now()}`,
        revisionId: params.revisionId,
        sourceSystem: requireString(data, "sourceSystem") as SourceGeometry["sourceSystem"],
        declaredFileFormat: requireString(data, "declaredFileFormat"),
        sourceFilename: requireString(data, "sourceFilename"),
        unitSystem: requireString(data, "unitSystem"),
        createdBy: optionalString(data, "createdBy") ?? "system",
      };
      const sourceGeometry = store.registerSourceGeometry(request);

      json(res, 201, sourceGeometry);
    },
  },
  {
    method: "POST",
    path: /^\/api\/source-geometries\/([^/]+)\/import$/,
    handler: (_req, res, body, params) => {
      const data = requireObject(body);
      const geometry = store.getSourceGeometry(params.sourceGeometryId);
      if (!geometry) {
        error(
          res,
          404,
          "SOURCE_GEOMETRY_NOT_FOUND",
          "Source geometry not found for import job creation.",
        );
        return;
      }

      const importJob = store.startImportJob({
        jobId: `ijob_${Date.now()}`,
        projectId: geometry.projectId,
        revisionId: geometry.revisionId,
        sourceGeometryId: params.sourceGeometryId,
        adapterName: optionalString(data, "adapterName") ?? "zbrush-import-adapter",
        requestedBy: optionalString(data, "requestedBy") ?? "system",
      });

      if (!importJob) {
        error(
          res,
          404,
          "SOURCE_GEOMETRY_NOT_FOUND",
          "Source geometry not found for import job creation.",
        );
        return;
      }

      json(res, 201, importJob);
    },
  },
  {
    method: "POST",
    path: /^\/api\/import-jobs\/([^/]+)\/complete$/,
    handler: (_req, res, body, params) => {
      const data = requireObject(body);
      const status = requireString(data, "status") as JobStatus;
      const importJob = store.completeImportJob(params.jobId, {
        status,
        progressPercent:
          optionalNumber(data, "progressPercent") ?? (status === "running" ? 50 : 100),
      });

      if (!importJob) {
        error(res, 404, "IMPORT_JOB_NOT_FOUND", "Import job not found.");
        return;
      }

      const nextRevisionState = deriveRevisionStateForImport(importJob.importStatus);
      if (nextRevisionState) {
        store.updateRevisionState(importJob.revisionId, nextRevisionState);
      }

      json(res, 200, importJob);
    },
  },
  {
    method: "GET",
    path: /^\/api\/import-jobs\/([^/]+)$/,
    handler: (_req, res, _body, params) => {
      const job = store.getImportJob(params.jobId);
      if (!job) {
        error(res, 404, "IMPORT_JOB_NOT_FOUND", "Import job not found.");
        return;
      }

      json(res, 200, job);
    },
  },
  {
    method: "GET",
    path: /^\/api\/revisions\/([^/]+)\/status$/,
    handler: (_req, res, _body, params) => {
      const revision = store.getRevision(params.revisionId);
      if (!revision) {
        error(res, 404, "REVISION_NOT_FOUND", "Revision not found.");
        return;
      }

      json(res, 200, {
        revision,
        sourceGeometries: store.listRevisionSourceGeometries(params.revisionId),
        importJobs: store.listRevisionImportJobs(params.revisionId),
      });
    },
  },
  {
    method: "GET",
    path: /^\/api\/debug\/snapshot$/,
    handler: (_req, res) => {
      json(res, 200, store.getSystemSnapshot());
    },
  },
];

function extractParams(match: RegExpExecArray | null): Record<string, string> {
  if (!match) {
    return {};
  }

  const params: Record<string, string> = {};
  const values = match.slice(1);

  if (values[0]) params.projectId = values[0];
  if (values[1]) params.revisionId = values[1];
  if (values.length === 1 && match.input.includes("/revisions/")) {
    params.revisionId = values[0];
  }
  if (values.length === 1 && match.input.includes("/source-geometries/")) {
    params.sourceGeometryId = values[0];
  }
  if (values.length === 1 && match.input.includes("/import-jobs/")) {
    params.jobId = values[0];
  }

  return params;
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      error(res, 400, "BAD_REQUEST", "Request is missing URL or method.");
      return;
    }

    const route = routes.find(
      (candidate) =>
        candidate.method === req.method &&
        candidate.path.test(new URL(req.url ?? "/", "http://localhost").pathname),
    );

    if (!route) {
      error(res, 404, "NOT_FOUND", "Route not found.");
      return;
    }

    const pathname = new URL(req.url, "http://localhost").pathname;
    const match = route.path.exec(pathname);
    const params = extractParams(match);
    const body = await readBody(req);
    await route.handler(req, res, body, params);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    error(res, 400, "BAD_REQUEST", message);
  }
});

const port = Number(process.env.PORT ?? 4010);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SuperModel design-orchestrator listening on http://localhost:${port}`);
});
